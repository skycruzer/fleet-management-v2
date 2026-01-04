/**
 * Check deadline widget logic and counts
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

// Read .env.local
const envContent = readFileSync('.env.local', 'utf8')
const envVars = {}
envContent.split('\n').forEach((line) => {
  const [key, ...valueParts] = line.split('=')
  if (key && valueParts.length) {
    envVars[key.trim()] = valueParts.join('=').trim()
  }
})

const supabase = createClient(envVars.NEXT_PUBLIC_SUPABASE_URL, envVars.SUPABASE_SERVICE_ROLE_KEY)

async function checkWidgetLogic() {
  console.log('🔍 Checking deadline widget logic...\n')

  // Get all pilot_requests grouped by roster period
  const { data: requests } = await supabase
    .from('pilot_requests')
    .select('roster_period, workflow_status')

  if (!requests) {
    console.log('❌ No requests found')
    return
  }

  // Group by roster period
  const byPeriod = {}
  requests.forEach((req) => {
    if (!byPeriod[req.roster_period]) {
      byPeriod[req.roster_period] = {
        SUBMITTED: 0,
        IN_REVIEW: 0,
        APPROVED: 0,
        DENIED: 0,
        DRAFT: 0,
        WITHDRAWN: 0,
      }
    }
    byPeriod[req.roster_period][req.workflow_status] =
      (byPeriod[req.roster_period][req.workflow_status] || 0) + 1
  })

  // Sort by period
  const sortedPeriods = Object.entries(byPeriod).sort((a, b) => a[0].localeCompare(b[0]))

  console.log('📊 Breakdown by Roster Period:\n')
  sortedPeriods.forEach(([period, stats]) => {
    // Calculate widget counts
    const pendingCount = (stats.SUBMITTED || 0) + (stats.IN_REVIEW || 0)
    const submittedCount = stats.SUBMITTED || 0
    const approvedCount = stats.APPROVED || 0
    const deniedCount = stats.DENIED || 0

    console.log(`${period}:`)
    console.log(`  📋 Raw counts:`)
    console.log(`     - SUBMITTED: ${stats.SUBMITTED || 0}`)
    console.log(`     - IN_REVIEW: ${stats.IN_REVIEW || 0}`)
    console.log(`     - APPROVED: ${stats.APPROVED || 0}`)
    console.log(`     - DENIED: ${stats.DENIED || 0}`)
    console.log(`  📊 Widget display:`)
    console.log(`     - Pending (yellow): ${pendingCount}`)
    console.log(`     - Submitted (blue): ${submittedCount}`)
    console.log(`     - Approved (green): ${approvedCount}`)
    console.log('')
  })
}

checkWidgetLogic().catch(console.error)
