import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const envFile = readFileSync('.env.local', 'utf-8')
const env = {}
envFile.split('\n').forEach(line => {
  const parts = line.split('=')
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join('=').trim()
  }
})

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

console.log('🔍 Checking Pilot Role Values\n')

// Get all leave requests with pilot details (avoiding 'rank' SQL reserved word)
const { data: requests, error } = await supabase
  .from('leave_requests')
  .select(`
    id,
    roster_period,
    pilot:pilots!leave_requests_pilot_id_fkey (
      id,
      first_name,
      last_name,
      role
    )
  `)
  .limit(50)

if (error) {
  console.error('❌ Error:', error.message)
  process.exit(1)
}

console.log(`📊 Found ${requests.length} leave requests with pilot data\n`)

// Collect unique role values
const roleValues = new Set()

requests.forEach(req => {
  if (req.pilot?.role) roleValues.add(req.pilot.role)
})

console.log('🎖️  Unique ROLE values in pilots table:')
Array.from(roleValues).forEach(role => {
  const count = requests.filter(r => r.pilot?.role === role).length
  console.log(`  "${role}": ${count} requests`)
})

// Sample records
console.log('\n📋 Sample Records:\n')
requests.slice(0, 5).forEach(r => {
  const idStr = String(r.id)
  console.log(`  ID: ${idStr.substring(0, 8)}`)
  console.log(`  Pilot: ${r.pilot?.first_name} ${r.pilot?.last_name}`)
  console.log(`  Role: "${r.pilot?.role}"`)
  console.log(`  Roster Period: ${r.roster_period}`)
  console.log('')
})

process.exit(0)
