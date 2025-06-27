import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email y contraseña son requeridos' },
        { status: 400 }
      );
    }

    // Intentar con Supabase primero
    if (supabase) {
      try {
        // Buscar usuario en company_users
        const { data: userData, error: userError } = await supabase
          .from('company_users')
          .select('*, companies(*)')
          .eq('email', email)
          .eq('is_active', true)
          .single();

        if (userError || !userData) {
          throw new Error('Usuario no encontrado');
        }

        // Verificar contraseña
        const passwordMatch = await bcrypt.compare(password, userData.password);
        if (!passwordMatch) {
          throw new Error('Contraseña incorrecta');
        }

        // Crear sesión
        const sessionData = {
          userId: email,
          companyId: userData.company_id,
          companyName: userData.companies.name,
          languages: userData.companies.languages || ['es'],
          defaultLanguage: userData.companies.languages?.[0] || 'es'
        };

        // Crear response con cookies
        const response = NextResponse.json({ 
          success: true,
          user: {
            email: userData.email,
            company: userData.companies.name
          }
        });

        // Set cookies httpOnly
        response.cookies.set('coggni-session', JSON.stringify(sessionData), {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 60 * 60 * 24 * 7 // 7 días
        });

        response.cookies.set('coggni-last-activity', Date.now().toString(), {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict'
        });

        return response;

      } catch (supabaseError) {
        console.error('Supabase login error:', supabaseError);
        // Continuar con fallback
      }
    }

    // Fallback para desarrollo
    const DEMO_CREDENTIALS = {
      'dental@dentallink.com': { 
        password: 'demo123', 
        companyId: 'dental-link',
        companyName: 'Dental Link'
      },
      'admin@laperla.es': { 
        password: 'demo123', 
        companyId: 'la-perla',
        companyName: 'La Perla'
      },
      'test@testcompany.com': { 
        password: 'demo123', 
        companyId: 'test-company',
        companyName: 'Test Company'
      }
    };

    const demoUser = DEMO_CREDENTIALS[email];
    if (demoUser && demoUser.password === password) {
      const sessionData = {
        userId: email,
        companyId: demoUser.companyId,
        companyName: demoUser.companyName,
        languages: ['es'],
        defaultLanguage: 'es'
      };

      const response = NextResponse.json({ 
        success: true,
        user: {
          email: email,
          company: demoUser.companyName
        }
      });

      // Set cookies
      response.cookies.set('coggni-session', JSON.stringify(sessionData), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 7
      });

      response.cookies.set('coggni-last-activity', Date.now().toString(), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });

      return response;
    }

    // Si llegamos aquí, credenciales inválidas
    return NextResponse.json(
      { success: false, error: 'Usuario o contraseña incorrectos' },
      { status: 401 }
    );

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Error en el servidor' },
      { status: 500 }
    );
  }
}