/**
 * Seed Sample RDO/SDO Requests
 *
 * Creates sample RDO and SDO requests for existing pilots in the unified system
 *
 * @author Maurice Rondeau
 * @date November 12, 2025
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

// Read .env.local manually
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

async function seedSampleRDOSDO() {
  console.log('=' .repeat(70))
  console.log('🌱 Seeding Sample RDO/SDO Requests')
  console.log('=' .repeat(70))

  // Fetch pilots
  const { data: pilots, error: pilotsError } = await supabase
    .from('pilots')
    .select('id, first_name, last_name, employee_id, role')
    .limit(10)

  if (pilotsError || !pilots || pilots.length === 0) {
    console.error('❌ Error fetching pilots:', pilotsError?.message || 'No pilots found')
    return
  }

  console.log(`\n✅ Found ${pilots.length} pilots`)

  // Fetch all roster periods
  const { data: rosterPeriods } = await supabase
    .from('roster_periods')
    .select('code, start_date, end_date, publish_date, request_deadline_date')

  const periodMap = new Map(rosterPeriods?.map(p => [p.code, p]) || [])

  console.log(`✅ Found ${rosterPeriods?.length || 0} roster periods\n`)

  const sampleRequests = [
    // RDO Requests (Rostered Day Off)
    {
      request_type: 'RDO',
      start_date: '2026-01-15',
      end_date: '2026-01-15',
      roster_period: 'RP02/2026',
      reason: 'Personal appointment'
    },
    {
      request_type: 'RDO',
      start_date: '2026-02-10',
      end_date: '2026-02-10',
      roster_period: 'RP03/2026',
      reason: 'Family commitment'
    },
    {
      request_type: 'RDO',
      start_date: '2026-03-20',
      end_date: '2026-03-20',
      roster_period: 'RP05/2026',
      reason: 'Medical appointment'
    },
    // SDO Requests (Scheduled Day Off)
    {
      request_type: 'SDO',
      start_date: '2026-01-22',
      end_date: '2026-01-22',
      roster_period: 'RP02/2026',
      reason: 'Pre-scheduled personal day'
    },
    {
      request_type: 'SDO',
      start_date: '2026-02-18',
      end_date: '2026-02-18',
      roster_period: 'RP03/2026',
      reason: 'Scheduled time off'
    },
    {
      request_type: 'SDO',
      start_date: '2026-04-05',
      end_date: '2026-04-05',
      roster_period: 'RP06/2026',
      reason: 'Personal commitments'
    },
    // Mix with ANNUAL for variety
    {
      request_type: 'ANNUAL',
      start_date: '2026-05-10',
      end_date: '2026-05-17',
      roster_period: 'RP08/2026',
      reason: 'Annual leave - family vacation'
    }
  ]

  let insertedCount = 0
  let failedCount = 0

  for (let i = 0; i < sampleRequests.length && i < pilots.length; i++) {
    const pilot = pilots[i]
    const template = sampleRequests[i]
    const period = periodMap.get(template.roster_period)

    if (!period) {
      console.log(`   ⚠️  Skipping ${template.request_type} - roster period ${template.roster_period} not found`)
      failedCount++
      continue
    }

    const request = {
      pilot_id: pilot.id,
      employee_number: pilot.employee_id,
      rank: pilot.role,
      name: `${pilot.first_name} ${pilot.last_name}`,
      request_category: 'LEAVE',
      request_type: template.request_type,
      submission_channel: 'PILOT_PORTAL',
      start_date: template.start_date,
      end_date: template.end_date,
      roster_period: template.roster_period,
      roster_period_start_date: period.start_date,
      roster_publish_date: period.publish_date,
      roster_deadline_date: period.request_deadline_date,
      workflow_status: 'SUBMITTED',
      days_count: 1,
      is_late_request: false,
      reason: template.reason,
      notes: `Sample ${template.request_type} request for testing`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { error: insertError } = await supabase
      .from('pilot_requests')
      .insert(request)

    if (insertError) {
      console.log(`   ❌ Failed to insert ${template.request_type} for ${pilot.first_name} ${pilot.last_name}:`, insertError.message)
      failedCount++
    } else {
      console.log(`   ✅ Inserted ${template.request_type} for ${pilot.first_name} ${pilot.last_name} (${template.roster_period})`)
      insertedCount++
    }
  }

  // Verify insertion
  console.log('\n🔍 Verifying inserted requests...\n')

  const { data: allRequests, count: totalCount } = await supabase
    .from('pilot_requests')
    .select('*', { count: 'exact' })

  const { data: rdoSdoRequests } = await supabase
    .from('pilot_requests')
    .select('*')
    .or('request_type.eq.RDO,request_type.eq.SDO')

  console.log(`   Total requests in pilot_requests: ${totalCount}`)
  console.log(`   RDO/SDO requests: ${rdoSdoRequests?.length || 0}`)

  // Breakdown by type
  const typeCounts = (allRequests || []).reduce((acc, r) => {
    acc[r.request_type] = (acc[r.request_type] || 0) + 1
    return acc
  }, {})

  console.log('   By type:')
  Object.entries(typeCounts).forEach(([type, count]) => {
    console.log(`      ${type}: ${count}`)
  })

  console.log('\n' + '='.repeat(70))
  console.log('📊 Seeding Summary')
  console.log('='.repeat(70))
  console.log(`\n   ✅ Successfully inserted: ${insertedCount}`)
  console.log(`   ❌ Failed: ${failedCount}`)
  console.log(`   📍 RDO/SDO count: ${rdoSdoRequests?.length || 0}`)
  console.log('\n' + '='.repeat(70))
  console.log('✅ Seeding Complete!')
  console.log('='.repeat(70))
  console.log('\n💡 Next Steps:')
  console.log('   1. View requests: http://localhost:3000/dashboard/requests')
  console.log('   2. Filter by RDO/SDO request types')
  console.log('   3. Test approval workflow\n')
}

seedSampleRDOSDO().catch(console.error)
