import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

// Read environment variables
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

console.log('🔍 Checking which tables exist...\n')

const tablesToCheck = [
  'an_users',
  'pilots', 
  'pilot_users',
  'leave_requests',
  'flight_requests',
  'notifications',
  'audit_logs',
  'disciplinary_actions',
  'disciplinary_matters',
  'pilot_checks',
  'tasks',
  'leave_bids',
  'leave_bid_options',
  'check_types',
  'contract_types'
]

const existingTables = []
const missingTables = []

for (const table of tablesToCheck) {
  try {
    const { error } = await supabase.from(table).select('id', { count: 'exact', head: true })
    
    if (!error || error.code === 'PGRST301') {
      existingTables.push(table)
      console.log(`✅ ${table} - EXISTS`)
    } else if (error.code === '42P01') {
      missingTables.push(table)
      console.log(`❌ ${table} - NOT FOUND`)
    } else {
      existingTables.push(table)
      console.log(`⚠️  ${table} - EXISTS (different error: ${error.message})`)
    }
  } catch (err) {
    missingTables.push(table)
    console.log(`❌ ${table} - ERROR: ${err.message}`)
  }
}

console.log(`\n📊 Summary:`)
console.log(`   Existing tables: ${existingTables.length}`)
console.log(`   Missing tables: ${missingTables.length}`)

console.log(`\n✅ Tables that exist:`)
existingTables.forEach(t => console.log(`   - ${t}`))

if (missingTables.length > 0) {
  console.log(`\n❌ Tables that do NOT exist:`)
  missingTables.forEach(t => console.log(`   - ${t}`))
}
