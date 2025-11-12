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

async function fixPeriodCodes() {
  console.log('Fixing roster period codes...\n')

  // Update RP3/2026 to RP03/2026
  const { data, error } = await supabase
    .from('pilot_requests')
    .update({ roster_period: 'RP03/2026' })
    .eq('roster_period', 'RP3/2026')
    .select()

  if (error) {
    console.error('Error:', error.message)
    return
  }

  console.log(`Updated ${data.length} records from RP3/2026 to RP03/2026`)

  // Verify
  const { count } = await supabase
    .from('pilot_requests')
    .select('*', { count: 'exact', head: true })
    .eq('roster_period', 'RP03/2026')

  console.log(`Verified: ${count} records now have RP03/2026`)
}

fixPeriodCodes().catch(console.error)
