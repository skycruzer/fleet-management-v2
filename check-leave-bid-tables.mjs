import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const envContent = readFileSync('.env.local', 'utf8')
const lines = envContent.split('\n')

let supabaseUrl, supabaseServiceKey
for (const line of lines) {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
    supabaseUrl = line.split('=')[1].trim()
  }
  if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) {
    supabaseServiceKey = line.split('=')[1].trim()
  }
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

console.log('🔍 Checking leave bid related tables...\n')

const tablesToCheck = ['leave_bids', 'leave_bid_options']

for (const table of tablesToCheck) {
  try {
    const { error } = await supabase.from(table).select('*', { count: 'exact', head: true })
    
    if (!error) {
      console.log(`✅ ${table} - EXISTS`)
    } else if (error.code === '42P01') {
      console.log(`❌ ${table} - DOES NOT EXIST`)
    } else if (error.code === 'PGRST301') {
      console.log(`✅ ${table} - EXISTS (RLS enabled, no access)`)
    } else {
      console.log(`⚠️  ${table} - ${error.message}`)
    }
  } catch (err) {
    console.log(`❌ ${table} - ERROR: ${err.message}`)
  }
}
