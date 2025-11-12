import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const envContent = readFileSync('.env.local', 'utf8')
const envVars = {}
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=')
  if (key && valueParts.length) {
    envVars[key.trim()] = valueParts.join('=').trim()
  }
})

const supabase = createClient(
  envVars.NEXT_PUBLIC_SUPABASE_URL,
  envVars.SUPABASE_SERVICE_ROLE_KEY
)

async function checkPeriodCodes() {
  console.log('Checking roster period codes...\n')

  const { data: periods } = await supabase
    .from('roster_periods')
    .select('code')
    .order('code')

  console.log('All roster period codes:')
  periods.forEach(p => console.log(`  - ${p.code}`))

  console.log('\nChecking pilot_requests roster_period values:')
  const { data: requests } = await supabase
    .from('pilot_requests')
    .select('roster_period')

  const uniquePeriods = [...new Set(requests.map(r => r.roster_period))].sort()
  uniquePeriods.forEach(p => console.log(`  - ${p}`))
}

checkPeriodCodes().catch(console.error)
