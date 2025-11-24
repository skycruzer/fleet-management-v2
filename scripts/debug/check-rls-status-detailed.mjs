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

console.log('🔍 Checking detailed status for problematic tables...\n')

// Check all tables mentioned in the scripts
const tablesToCheck = [
  'leave_bids',
  'leave_bid_options', 
  'disciplinary_matters',
  'disciplinary_actions'
]

for (const table of tablesToCheck) {
  try {
    const { data, error } = await supabase.from(table).select('*', { count: 'exact', head: true })
    
    if (!error) {
      console.log(`✅ ${table}`)
      console.log(`   - Table exists`)
      console.log(`   - Accessible via REST API`)
    } else {
      const status = error.code === '42P01' ? 'DOES NOT EXIST' : 
                     error.code === 'PGRST301' ? 'EXISTS (RLS blocking)' :
                     error.code
      console.log(`⚠️  ${table}`)
      console.log(`   - Status: ${status}`)
      console.log(`   - Error: ${error.message}`)
    }
  } catch (err) {
    console.log(`❌ ${table}`)
    console.log(`   - Error: ${err.message}`)
  }
  console.log('')
}
