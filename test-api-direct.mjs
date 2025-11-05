/**
 * Direct API Test - Bypass browser, use service account
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://wgdmgvonqysflwdiiols.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndnZG1ndm9ucXlzZmx3ZGlpb2xzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1ODIzMjAsImV4cCI6MjA3MTE1ODMyMH0.MJrbK8qtJLJXz_mSHF9Le_DebGCXfZ4eXFd7h5JCKyk'

console.log('🧪 Testing Report API Directly\n')

async function testAPI() {
  try {
    // 1. Authenticate
    console.log('🔐 Authenticating...')
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'skycruzer@icloud.com',
      password: 'mron2393',
    })

    if (authError) {
      console.error('❌ Auth failed:', authError.message)
      return
    }

    console.log('✅ Authenticated\n')

    // 2. Call active-roster report API
    console.log('📊 Calling /api/reports/fleet/active-roster...')

    const response = await fetch('http://localhost:3001/api/reports/fleet/active-roster', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authData.session.access_token}`,
      },
      body: JSON.stringify({
        format: 'csv',
        parameters: {}
      })
    })

    console.log('Status:', response.status)
    console.log('Status Text:', response.statusText)
    console.log('Content-Type:', response.headers.get('content-type'))

    if (response.ok) {
      const text = await response.text()
      console.log('\n✅ SUCCESS!')
      console.log('First 500 chars:\n', text.substring(0, 500))
    } else {
      const errorBody = await response.text()
      console.log('\n❌ FAILED')
      console.log('Error body:', errorBody)
    }

  } catch (error) {
    console.error('❌ Test error:', error.message)
  }
}

testAPI()
