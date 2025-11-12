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

console.log('🔍 Checking Roster Period Distribution\n')

// Get all unique roster periods
const { data: all } = await supabase
  .from('leave_requests')
  .select('roster_period')

const rosterPeriods = {}
all.forEach(r => {
  const rp = r.roster_period || 'NULL'
  rosterPeriods[rp] = (rosterPeriods[rp] || 0) + 1
})

console.log('📊 Roster Periods in Database:\n')
Object.entries(rosterPeriods)
  .sort((a, b) => {
    if (a[0] === 'NULL') return 1
    if (b[0] === 'NULL') return -1
    return a[0].localeCompare(b[0])
  })
  .forEach(([rp, count]) => {
    console.log(`  ${rp}: ${count} records`)
  })

// Test query with RP13/2025
console.log('\n🧪 Test Query: roster_period IN (\'RP13/2025\')\n')
const { data: test, error } = await supabase
  .from('leave_requests')
  .select('id, roster_period, start_date, request_type, status')
  .in('roster_period', ['RP13/2025'])

if (error) {
  console.error('❌ Error:', error.message)
} else {
  console.log(`✅ Result: ${test.length} records`)
  if (test.length > 0) {
    console.log('\nSample:')
    test.slice(0, 3).forEach(r => {
      console.log(`  ${r.roster_period} | ${r.request_type} | ${r.status} | ${r.start_date}`)
    })
  }
}

process.exit(0)
