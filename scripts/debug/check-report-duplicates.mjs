/**
 * Check for duplicate records in reports
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

// Read .env.local file manually
const envContent = readFileSync('.env.local', 'utf-8')
const envVars = {}
envContent.split('\n').forEach((line) => {
  const match = line.match(/^([^=]+)=(.*)$/)
  if (match) {
    envVars[match[1].trim()] = match[2].trim()
  }
})

const supabase = createClient(
  envVars.NEXT_PUBLIC_SUPABASE_URL,
  envVars.SUPABASE_SERVICE_ROLE_KEY || envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function checkFlightRequests() {
  console.log('\n🔍 Checking Flight Requests (pilot_requests table)...\n')

  const { data, error } = await supabase
    .from('pilot_requests')
    .select('*')
    .eq('request_category', 'FLIGHT')
    .order('start_date', { ascending: false })

  if (error) {
    console.error('❌ Error:', error.message)
    return
  }

  console.log(`✅ Found ${data.length} flight request records`)
  console.log('\nSample record structure:')
  if (data[0]) {
    console.log(JSON.stringify(data[0], null, 2))
  }

  // Check for duplicates by ID
  const ids = data.map((r) => r.id)
  const uniqueIds = new Set(ids)
  if (ids.length !== uniqueIds.size) {
    console.log(
      `\n⚠️  DUPLICATES FOUND: ${ids.length} records but only ${uniqueIds.size} unique IDs`
    )
  } else {
    console.log(`\n✅ No ID duplicates found`)
  }

  // Check for duplicate combinations of pilot + date
  const combinations = data.map(
    (r) => `${r.pilot_id || r.employee_number}-${r.start_date}-${r.end_date}`
  )
  const uniqueCombinations = new Set(combinations)
  if (combinations.length !== uniqueCombinations.size) {
    console.log(
      `\n⚠️  DUPLICATE PILOT+DATE COMBINATIONS: ${combinations.length} records but only ${uniqueCombinations.size} unique combinations`
    )

    // Find the duplicates
    const countMap = {}
    combinations.forEach((combo) => {
      countMap[combo] = (countMap[combo] || 0) + 1
    })
    const dupes = Object.entries(countMap).filter(([_, count]) => count > 1)
    console.log('Duplicates:')
    dupes.forEach(([combo, count]) => {
      console.log(`  - ${combo}: ${count} times`)
    })
  } else {
    console.log(`\n✅ No pilot+date duplicates found`)
  }
}

async function checkLeaveRequests() {
  console.log('\n\n🔍 Checking Leave Requests (leave_requests table)...\n')

  const { data, error } = await supabase
    .from('leave_requests')
    .select(
      `
      *,
      pilot:pilots!leave_requests_pilot_id_fkey(
        first_name,
        last_name,
        role,
        employee_id
      )
    `
    )
    .order('start_date', { ascending: false })

  if (error) {
    console.error('❌ Error:', error.message)
    return
  }

  console.log(`✅ Found ${data.length} leave request records`)
  console.log('\nSample record structure:')
  if (data[0]) {
    console.log(JSON.stringify(data[0], null, 2))
  }

  // Check for duplicates by ID
  const ids = data.map((r) => r.id)
  const uniqueIds = new Set(ids)
  if (ids.length !== uniqueIds.size) {
    console.log(
      `\n⚠️  DUPLICATES FOUND: ${ids.length} records but only ${uniqueIds.size} unique IDs`
    )
  } else {
    console.log(`\n✅ No ID duplicates found`)
  }

  // Check for duplicate combinations of pilot + date
  const combinations = data.map((r) => `${r.pilot_id}-${r.start_date}-${r.end_date}`)
  const uniqueCombinations = new Set(combinations)
  if (combinations.length !== uniqueCombinations.size) {
    console.log(
      `\n⚠️  DUPLICATE PILOT+DATE COMBINATIONS: ${combinations.length} records but only ${uniqueCombinations.size} unique combinations`
    )

    // Find the duplicates
    const countMap = {}
    combinations.forEach((combo) => {
      countMap[combo] = (countMap[combo] || 0) + 1
    })
    const dupes = Object.entries(countMap).filter(([_, count]) => count > 1)
    console.log('Duplicates:')
    dupes.forEach(([combo, count]) => {
      console.log(`  - ${combo}: ${count} times`)
    })
  } else {
    console.log(`\n✅ No pilot+date duplicates found`)
  }
}

// Run checks
checkFlightRequests().then(() => checkLeaveRequests())
