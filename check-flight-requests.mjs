#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkFlightRequests() {
  console.log('\n🔍 Checking Flight Requests Database\n')
  console.log('=' .repeat(60))

  try {
    // Get all flight requests
    const { data, error } = await supabase
      .from('flight_requests')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('\n❌ Query Error:', error.message)
      return
    }

    console.log(`\n✅ Total Flight Requests: ${data.length}`)

    if (data.length === 0) {
      console.log('\n⚠️  No flight requests found in database')
      return
    }

    // Distribution by request type
    const typeDistribution = {}
    data.forEach(record => {
      typeDistribution[record.request_type] = (typeDistribution[record.request_type] || 0) + 1
    })

    console.log('\n📋 Distribution by Request Type:')
    Object.entries(typeDistribution)
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([type, count]) => {
        console.log(`  ${type}: ${count} records`)
      })

    // Distribution by status
    const statusDistribution = {}
    data.forEach(record => {
      statusDistribution[record.status] = (statusDistribution[record.status] || 0) + 1
    })

    console.log('\n📊 Distribution by Status:')
    Object.entries(statusDistribution)
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([status, count]) => {
        console.log(`  ${status}: ${count} records`)
      })

    // Distribution by roster period
    const rosterDistribution = {}
    data.forEach(record => {
      if (record.roster_period) {
        rosterDistribution[record.roster_period] = (rosterDistribution[record.roster_period] || 0) + 1
      }
    })

    console.log('\n📅 Distribution by Roster Period:')
    Object.entries(rosterDistribution)
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([period, count]) => {
        console.log(`  ${period}: ${count} records`)
      })

    // Distribution by rank
    const rankDistribution = {}
    data.forEach(record => {
      rankDistribution[record.rank] = (rankDistribution[record.rank] || 0) + 1
    })

    console.log('\n🎖️  Distribution by Rank:')
    Object.entries(rankDistribution)
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([rank, count]) => {
        console.log(`  ${rank}: ${count} records`)
      })

    // Sample records
    console.log('\n📋 Sample Records (first 5):')
    data.slice(0, 5).forEach((record, index) => {
      console.log(`\n  ${index + 1}. ID: ${record.id}`)
      console.log(`     Pilot: ${record.employee_number} (${record.rank})`)
      console.log(`     Type: ${record.request_type}`)
      console.log(`     Status: ${record.status}`)
      console.log(`     Roster Period: ${record.roster_period || 'N/A'}`)
      console.log(`     Flight Date: ${record.flight_date}`)
      console.log(`     Created: ${new Date(record.created_at).toLocaleDateString()}`)
    })

    console.log('\n' + '='.repeat(60))

  } catch (err) {
    console.error('\n❌ Error:', err.message)
  }
}

checkFlightRequests()
