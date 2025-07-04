// scripts/migrate-to-supabase-auth.js
// IMPORTANTE: Ejecutar con Node.js, no en el browser

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { randomBytes } from 'crypto';

// Cargar variables de entorno
dotenv.config({ path: '.env.local' });

// Cliente con Service Role (necesario para crear usuarios)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Cliente normal para queries
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Generar password temporal seguro
function generateSecurePassword() {
  return randomBytes(16).toString('base64');
}

// Función principal de migración
async function migrateUsers() {
  console.log('🚀 Iniciando migración de usuarios a Supabase Auth...\n');
  
  try {
    // 1. Obtener todos los usuarios pendientes
    const { data: users, error: fetchError } = await supabase
      .from('company_users')
      .select('*')
      .eq('migration_status', 'pending')
      .eq('is_active', true);

    if (fetchError) {
      console.error('❌ Error al obtener usuarios:', fetchError);
      return;
    }

    console.log(`📊 Usuarios a migrar: ${users.length}\n`);
    
    const results = {
      success: 0,
      failed: 0,
      errors: []
    };

    // 2. Procesar cada usuario
    for (const user of users) {
      console.log(`\n👤 Procesando: ${user.email} (${user.company_id})`);
      
      try {
        // 2.1 Generar password temporal
        const tempPassword = generateSecurePassword();
        
        // 2.2 Crear usuario en Supabase Auth
        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: user.email,
          password: tempPassword,
          email_confirm: true, // Marcar email como confirmado
          user_metadata: {
            company_id: user.company_id,
            role: user.role || 'user',
            migrated_at: new Date().toISOString()
          }
        });

        if (authError) {
          throw authError;
        }

        console.log(`✅ Usuario creado en Auth: ${authUser.user.id}`);

        // 2.3 Actualizar company_users con auth_id
        const { error: updateError } = await supabase
          .from('company_users')
          .update({
            auth_id: authUser.user.id,
            migration_status: 'completed',
            needs_password_reset: true,
            password: null // IMPORTANTE: Limpiar password en texto plano
          })
          .eq('id', user.id);

        if (updateError) {
          throw updateError;
        }

        // 2.4 Log exitoso
        await supabase
          .from('auth_migration_logs')
          .insert({
            email: user.email,
            company_id: user.company_id,
            status: 'success',
            old_password_hash: user.password // Guardar por si acaso
          });

        // 2.5 Enviar email de reset (opcional - comentado por ahora)
        /*
        const { error: resetError } = await supabaseAdmin.auth.resetPasswordForEmail(
          user.email,
          {
            redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
          }
        );
        
        if (resetError) {
          console.warn(`⚠️ No se pudo enviar email de reset:`, resetError);
        }
        */

        results.success++;
        console.log(`✅ Migración completa para ${user.email}`);

      } catch (error) {
        console.error(`❌ Error migrando ${user.email}:`, error.message);
        
        // Log de error
        await supabase
          .from('auth_migration_logs')
          .insert({
            email: user.email,
            company_id: user.company_id,
            status: 'failed',
            error_message: error.message
          });

        results.failed++;
        results.errors.push({ email: user.email, error: error.message });
      }
    }

    // 3. Resumen final
    console.log('\n📊 RESUMEN DE MIGRACIÓN:');
    console.log(`✅ Exitosos: ${results.success}`);
    console.log(`❌ Fallidos: ${results.failed}`);
    
    if (results.errors.length > 0) {
      console.log('\n❌ Errores detallados:');
      results.errors.forEach(e => {
        console.log(`  - ${e.email}: ${e.error}`);
      });
    }

    // 4. Verificación final
    const { data: pendingUsers } = await supabase
      .from('company_users')
      .select('count')
      .eq('migration_status', 'pending');

    console.log(`\n📋 Usuarios pendientes: ${pendingUsers[0].count}`);

  } catch (error) {
    console.error('\n❌ Error crítico en migración:', error);
  }
}

// Función para rollback (en caso de emergencia)
async function rollbackUser(email) {
  console.log(`🔄 Rollback para usuario: ${email}`);
  
  try {
    // 1. Obtener datos del log
    const { data: logData } = await supabase
      .from('auth_migration_logs')
      .select('*')
      .eq('email', email)
      .single();

    if (!logData) {
      console.error('No se encontró log de migración');
      return;
    }

    // 2. Obtener auth_id
    const { data: userData } = await supabase
      .from('company_users')
      .select('auth_id')
      .eq('email', email)
      .single();

    // 3. Eliminar de Supabase Auth
    if (userData?.auth_id) {
      await supabaseAdmin.auth.admin.deleteUser(userData.auth_id);
    }

    // 4. Restaurar password
    await supabase
      .from('company_users')
      .update({
        password: logData.old_password_hash,
        auth_id: null,
        migration_status: 'pending',
        needs_password_reset: false
      })
      .eq('email', email);

    console.log('✅ Rollback completado');
  } catch (error) {
    console.error('❌ Error en rollback:', error);
  }
}

// Verificar configuración antes de empezar
async function checkConfig() {
  console.log('🔍 Verificando configuración...\n');
  
  const checks = {
    supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    serviceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
  };

  console.log('URLs configuradas:', checks.supabaseUrl ? '✅' : '❌');
  console.log('Anon Key:', checks.anonKey ? '✅' : '❌');
  console.log('Service Key:', checks.serviceKey ? '✅' : '❌');

  if (!checks.supabaseUrl || !checks.anonKey || !checks.serviceKey) {
    console.error('\n❌ Faltan variables de entorno. Verifica .env.local');
    process.exit(1);
  }

  // Test de conexión
  const { data, error } = await supabase.from('companies').select('count');
  if (error) {
    console.error('\n❌ Error de conexión:', error);
    process.exit(1);
  }

  console.log('\n✅ Configuración correcta\n');
}

// Ejecutar
async function main() {
  const command = process.argv[2];
  
  if (command === 'rollback') {
    const email = process.argv[3];
    if (!email) {
      console.error('Uso: node migrate-to-supabase-auth.js rollback <email>');
      process.exit(1);
    }
    await rollbackUser(email);
  } else {
    await checkConfig();
    await migrateUsers();
  }
}

main().catch(console.error);