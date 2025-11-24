/**
 * Direct API Test for Reports
 * Tests the reports API endpoint directly with authentication
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://wgdmgvonqysflwdiiols.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndnZG1ndm9ucXlzZmx3ZGlpb2xzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjY2OTM5NzEsImV4cCI6MjA0MjI2OTk3MX0.4Rw3PmsCGGf_GdJO7JUfCxbXrFvN8mCRNd2SfEYPJXE'

console.log('🔐 Testing Reports API...\n')

async function testReportAPI() {
  try {
    // 1. Authenticate
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'skycruzer@icloud.com',
      password: 'mron2393',
    })

    if (authError) {
      console.error('❌ Auth failed:', authError.message)
      return
    }

    console.log('✅ Authenticated as:', authData.user.email)
    const accessToken = authData.session.access_token

    // 2. Test report API with cookie-based auth approach
    console.log('\n🧪 Testing report generation...\n')

    const response = await fetch('http://localhost:3000/api/reports/certifications/all', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `sb-access-token=${accessToken}; sb-refresh-token=${authData.session.refresh_token}`
      },
      body: JSON.stringify({
        format: 'csv',
        parameters: {}
      })
    })

    console.log('Response status:', response.status)
    console.log('Response headers:', Object.fromEntries(response.headers.entries()))

    if (response.ok) {
      const contentType = response.headers.get('content-type')
      if (contentType?.includes('application/json')) {
        const json = await response.json()
        console.log('✅ Success (JSON):', json)
      } else {
        const text = await response.text()
        console.log('✅ Success (File):', text.substring(0, 200) + '...')
      }
    } else {
      const errorText = await response.text()
      console.log('❌ Error response:', errorText)
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

testReportAPI()
