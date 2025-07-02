'use client'

import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function TestLogin() {
  const [result, setResult] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  
  const testLogin = async () => {
    setResult({ status: 'Testing...', timestamp: new Date().toISOString() })
    
    try {
      // Test 1: Verificar cliente
      if (!supabase) {
        setResult({ error: 'Supabase client is null' })
        return
      }
      
      // Test 2: Query directa a company_users
      console.log('Querying company_users...')
      const { data: userData, error: userError } = await supabase
        .from('company_users')
        .select('*')
        .eq('email', email)
        .single()
      
      if (userError) {
        setResult({ 
          step: 'User query',
          error: userError.message,
          code: userError.code,
          details: userError
        })
        return
      }
      
      // Test 3: Verificar password
      const passwordMatch = userData?.password === password
      
      // Test 4: Query company
      if (userData && passwordMatch) {
        const { data: companyData, error: companyError } = await supabase
          .from('companies')
          .select('*')
          .eq('id', userData.company_id)
          .single()
        
        if (companyError) {
          setResult({
            step: 'Company query',
            error: companyError.message,
            details: companyError
          })
          return
        }
        
        setResult({
          success: true,
          user: userData.email,
          company: companyData?.name,
          timestamp: new Date().toISOString()
        })
      } else {
        setResult({
          success: false,
          reason: passwordMatch ? 'User not found' : 'Password mismatch'
        })
      }
      
    } catch (err) {
      setResult({
        step: 'Exception',
        error: err.message,
        stack: err.stack,
        type: err.constructor.name
      })
    }
  }
  
  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-2xl mb-4">Test Login</h1>
      
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full p-2 border rounded mb-2"
      />
      
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full p-2 border rounded mb-4"
      />
      
      <button
        onClick={testLogin}
        className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
      >
        Test Login
      </button>
      
      {result && (
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <pre className="text-xs overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}