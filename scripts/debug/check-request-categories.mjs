/**
 * Diagnostic Script: Check Request Categories
 *
 * Audits all pilot_requests to show current category distribution.
 *
 * @author Maurice Rondeau
 * @date November 12, 2025
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

// Read .env.local
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

async function checkRequestCategories() {
  console.log('=' .repeat(70))
  console.log('🔍 Diagnostic: Request Category Distribution')
  console.log('=' .repeat(70))

  try {
    // Fetch all pilot_requests
    console.log('\n📥 Fetching all pilot_requests...')
    const { data: allRequests, error: fetchError } = await supabase
      .from('pilot_requests')
      .select('*')

    if (fetchError) {
      console.log(`   ❌ Error fetching requests: ${fetchError.message}`)
      return
    }

    console.log(`   ✅ Found ${allRequests?.length || 0} total requests\n`)

    if (!allRequests || allRequests.length === 0) {
      console.log('   ℹ️  No pilot_requests found in database')
      return
    }

    // Overall category breakdown
    console.log('📊 Overall Category Breakdown:')
    const byCategory = {}
    allRequests.forEach(req => {
      byCategory[req.request_category] = (byCategory[req.request_category] || 0) + 1
    })
    Object.entries(byCategory).forEach(([cat, count]) => {
      const pct = ((count / allRequests.length) * 100).toFixed(1)
      console.log(`   ${cat}: ${count} (${pct}%)`)
    })

    // Request type breakdown within each category
    console.log('\n📊 Request Type Breakdown by Category:\n')

    // LEAVE category
    const leaveRequests = allRequests.filter(r => r.request_category === 'LEAVE')
    if (leaveRequests.length > 0) {
      console.log(`   LEAVE Category (${leaveRequests.length} requests):`)
      const leaveTypes = {}
      leaveRequests.forEach(req => {
        leaveTypes[req.request_type] = (leaveTypes[req.request_type] || 0) + 1
      })
      Object.entries(leaveTypes).sort((a, b) => b[1] - a[1]).forEach(([type, count]) => {
        console.log(`      ${type}: ${count}`)
      })
    }

    // FLIGHT category
    const flightRequests = allRequests.filter(r => r.request_category === 'FLIGHT')
    if (flightRequests.length > 0) {
      console.log(`\n   FLIGHT Category (${flightRequests.length} requests):`)
      const flightTypes = {}
      flightRequests.forEach(req => {
        flightTypes[req.request_type] = (flightTypes[req.request_type] || 0) + 1
      })
      Object.entries(flightTypes).sort((a, b) => b[1] - a[1]).forEach(([type, count]) => {
        console.log(`      ${type}: ${count}`)
      })
    } else {
      console.log('\n   FLIGHT Category: No requests found')
    }

    // LEAVE_BID category
    const bidRequests = allRequests.filter(r => r.request_category === 'LEAVE_BID')
    if (bidRequests.length > 0) {
      console.log(`\n   LEAVE_BID Category (${bidRequests.length} requests):`)
      const bidTypes = {}
      bidRequests.forEach(req => {
        bidTypes[req.request_type] = (bidTypes[req.request_type] || 0) + 1
      })
      Object.entries(bidTypes).sort((a, b) => b[1] - a[1]).forEach(([type, count]) => {
        console.log(`      ${type}: ${count}`)
      })
    }

    // RDO and SDO specific analysis
    console.log('\n🔍 RDO and SDO Analysis:')
    const rdoRequests = allRequests.filter(r => r.request_type === 'RDO')
    const sdoRequests = allRequests.filter(r => r.request_type === 'SDO')

    console.log(`\n   RDO Requests (${rdoRequests.length} total):`)
    if (rdoRequests.length > 0) {
      const rdoCategories = {}
      rdoRequests.forEach(req => {
        rdoCategories[req.request_category] = (rdoCategories[req.request_category] || 0) + 1
      })
      Object.entries(rdoCategories).forEach(([cat, count]) => {
        console.log(`      Category: ${cat} - ${count} requests`)
      })
    } else {
      console.log('      No RDO requests found')
    }

    console.log(`\n   SDO Requests (${sdoRequests.length} total):`)
    if (sdoRequests.length > 0) {
      const sdoCategories = {}
      sdoRequests.forEach(req => {
        sdoCategories[req.request_category] = (sdoCategories[req.request_category] || 0) + 1
      })
      Object.entries(sdoCategories).forEach(([cat, count]) => {
        console.log(`      Category: ${cat} - ${count} requests`)
      })
    } else {
      console.log('      No SDO requests found')
    }

    // Workflow status breakdown
    console.log('\n📊 Workflow Status Breakdown:')
    const byStatus = {}
    allRequests.forEach(req => {
      byStatus[req.workflow_status] = (byStatus[req.workflow_status] || 0) + 1
    })
    Object.entries(byStatus).sort((a, b) => b[1] - a[1]).forEach(([status, count]) => {
      const pct = ((count / allRequests.length) * 100).toFixed(1)
      console.log(`   ${status}: ${count} (${pct}%)`)
    })

    // Roster period distribution
    console.log('\n📊 Roster Period Distribution (Top 10):')
    const byPeriod = {}
    allRequests.forEach(req => {
      byPeriod[req.roster_period] = (byPeriod[req.roster_period] || 0) + 1
    })
    Object.entries(byPeriod)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .forEach(([period, count]) => {
        console.log(`   ${period}: ${count} requests`)
      })

    // Summary
    console.log('\n' + '='.repeat(70))
    console.log('📊 Summary')
    console.log('='.repeat(70))
    console.log(`\n   Total Requests: ${allRequests.length}`)
    console.log(`   LEAVE Category: ${leaveRequests.length}`)
    console.log(`   FLIGHT Category: ${flightRequests.length}`)
    console.log(`   LEAVE_BID Category: ${bidRequests.length}`)
    console.log(`\n   RDO Requests: ${rdoRequests.length}`)
    console.log(`   SDO Requests: ${sdoRequests.length}`)

    if (rdoRequests.length > 0 || sdoRequests.length > 0) {
      const rdoInLeave = rdoRequests.filter(r => r.request_category === 'LEAVE').length
      const sdoInLeave = sdoRequests.filter(r => r.request_category === 'LEAVE').length
      const rdoInFlight = rdoRequests.filter(r => r.request_category === 'FLIGHT').length
      const sdoInFlight = sdoRequests.filter(r => r.request_category === 'FLIGHT').length

      console.log('\n   📌 Current Categorization:')
      console.log(`      RDO in LEAVE: ${rdoInLeave}`)
      console.log(`      RDO in FLIGHT: ${rdoInFlight}`)
      console.log(`      SDO in LEAVE: ${sdoInLeave}`)
      console.log(`      SDO in FLIGHT: ${sdoInFlight}`)

      if (rdoInLeave > 0 || sdoInLeave > 0) {
        console.log('\n   ⚠️  ACTION REQUIRED: RDO/SDO need to be moved to FLIGHT category')
      } else {
        console.log('\n   ✅ RDO/SDO are correctly in FLIGHT category')
      }
    }

    console.log('\n' + '='.repeat(70))

  } catch (error) {
    console.error('\n❌ Diagnostic failed:', error)
    console.error(error.stack)
  }
}

checkRequestCategories().catch(console.error)
