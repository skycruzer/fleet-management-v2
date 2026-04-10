/**
 * Check for requests that span multiple roster periods
 *
 * A request with start_date in RP01/2026 and end_date in RP02/2026
 * should appear in BOTH periods for the widget.
 *
 * @author Maurice Rondeau
 * @date November 12, 2025
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

// Roster period dates (from roster_periods table)
const ROSTER_PERIODS = {
  'RP01/2026': { start: '2026-01-03', end: '2026-01-30' },
  'RP02/2026': { start: '2026-01-31', end: '2026-02-27' },
  'RP03/2026': { start: '2026-02-28', end: '2026-03-27' },
}

function dateInPeriod(date, period) {
  const d = new Date(date)
  const start = new Date(period.start)
  const end = new Date(period.end)
  return d >= start && d <= end
}

function requestSpansPeriod(request, periodCode) {
  const period = ROSTER_PERIODS[periodCode]
  if (!period) return false

  const reqStart = new Date(request.start_date)
  const reqEnd = new Date(request.end_date)
  const periodStart = new Date(period.start)
  const periodEnd = new Date(period.end)

  // Request spans period if:
  // 1. Request starts before period ends AND
  // 2. Request ends after period starts
  return reqStart <= periodEnd && reqEnd >= periodStart
}

async function checkMultiPeriodRequests() {
  console.log('='.repeat(70))
  console.log('🔍 Check Multi-Period Requests for RP02/2026')
  console.log('='.repeat(70))

  try {
    // Get all requests
    const { data: allRequests, error } = await supabase
      .from('pilot_requests')
      .select('*')
      .order('start_date')

    if (error) {
      console.log(`❌ Error: ${error.message}`)
      return
    }

    console.log(`\n📥 Total requests: ${allRequests.length}\n`)

    // Check which requests span RP02/2026
    console.log('🔍 Checking requests that span RP02/2026:')
    console.log('   (RP02/2026: 2026-01-31 to 2026-02-27)\n')

    const spansRP02 = allRequests.filter((req) => requestSpansPeriod(req, 'RP02/2026'))

    if (spansRP02.length === 0) {
      console.log('   ⚠️  NO requests span RP02/2026')
      console.log('   💡 Widget correctly shows zeros\n')
    } else {
      console.log(`   ✅ Found ${spansRP02.length} requests that span RP02/2026:\n`)

      spansRP02.forEach((req) => {
        console.log(`   📝 ${req.name}`)
        console.log(`      Type: ${req.request_type} (${req.request_category})`)
        console.log(`      Dates: ${req.start_date} to ${req.end_date}`)
        console.log(`      Stored Period: ${req.roster_period}`)
        console.log(`      Status: ${req.workflow_status}`)
        console.log('')
      })
    }

    // Check requests stored as RP01/2026 that might extend into RP02/2026
    console.log('🔍 Checking RP01/2026 requests that extend into RP02/2026:\n')

    const rp01Requests = allRequests.filter((req) => req.roster_period === 'RP01/2026')
    const rp01SpansRP02 = rp01Requests.filter((req) => {
      const endDate = new Date(req.end_date)
      const rp02Start = new Date('2026-01-31')
      return endDate >= rp02Start
    })

    if (rp01SpansRP02.length > 0) {
      console.log(
        `   ⚠️  Found ${rp01SpansRP02.length} RP01/2026 requests that extend into RP02/2026:\n`
      )

      rp01SpansRP02.forEach((req) => {
        console.log(`   📝 ${req.name}`)
        console.log(`      Type: ${req.request_type} (${req.request_category})`)
        console.log(`      Dates: ${req.start_date} to ${req.end_date}`)
        console.log(`      Status: ${req.workflow_status}`)
        console.log(`      💡 This request SHOULD appear in RP02/2026 widget!`)
        console.log('')
      })
    } else {
      console.log('   ✅ No RP01/2026 requests extend into RP02/2026\n')
    }

    // Summary
    console.log('='.repeat(70))
    console.log('📊 Summary')
    console.log('='.repeat(70))
    console.log(`\n   Total requests in system: ${allRequests.length}`)
    console.log(`   Requests stored as RP01/2026: ${rp01Requests.length}`)
    console.log(`   Requests that span RP02/2026: ${spansRP02.length}`)
    console.log(`   RP01 requests extending into RP02: ${rp01SpansRP02.length}`)

    if (rp01SpansRP02.length > 0) {
      console.log('\n   ⚠️  ISSUE IDENTIFIED:')
      console.log(
        `      Widget shows RP02/2026 = 0, but ${rp01SpansRP02.length} requests span that period`
      )
      console.log('      REASON: Widget queries by roster_period field only')
      console.log('      FIX NEEDED: Widget should check start_date/end_date ranges')
    } else if (spansRP02.length === 0) {
      console.log('\n   ✅ NO ISSUE: RP02/2026 legitimately has no requests')
    }

    console.log('\n' + '='.repeat(70))
  } catch (error) {
    console.error('\n❌ Error:', error)
    console.error(error.stack)
  }
}

checkMultiPeriodRequests().catch(console.error)
