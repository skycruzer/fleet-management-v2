import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const envContent = fs.readFileSync('.env.local', 'utf8')
const env = {}
envContent.split('\n').forEach((line) => {
  const trimmedLine = line.trim()
  if (trimmedLine && !trimmedLine.startsWith('#')) {
    const [key, ...valueParts] = trimmedLine.split('=')
    if (key && valueParts.length > 0) {
      env[key.trim()] = valueParts
        .join('=')
        .trim()
        .replace(/^["']|["']$/g, '')
    }
  }
})

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

async function checkData() {
  console.log('=== Checking Renewal Planning Data ===\n')

  // Check assignments
  console.log('1. Checking renewal_planning_assignments for 2026...')
  const {
    data: assignments,
    error: assignError,
    count: assignCount,
  } = await supabase
    .from('renewal_planning_assignments')
    .select('*', { count: 'exact' })
    .eq('planning_year', 2026)

  if (assignError) {
    console.log('❌ Error:', assignError.message)
  } else {
    console.log(`✅ Total 2026 assignments: ${assignCount}`)
    if (assignments && assignments.length > 0) {
      console.log('Sample:', JSON.stringify(assignments.slice(0, 2), null, 2))
    }
  }

  // Check capacity
  console.log('\n2. Checking roster_period_capacity for 2026...')
  const {
    data: capacity,
    error: capacityError,
    count: capacityCount,
  } = await supabase
    .from('roster_period_capacity')
    .select('*', { count: 'exact' })
    .like('roster_period', '%2026%')

  if (capacityError) {
    console.log('❌ Error:', capacityError.message)
  } else {
    console.log(`✅ Total 2026 capacity records: ${capacityCount}`)
    if (capacity && capacity.length > 0) {
      console.log('Sample:', JSON.stringify(capacity.slice(0, 2), null, 2))
    }
  }

  // Check check types
  console.log('\n3. Checking check_types...')
  const { data: checkTypes, error: checkError } = await supabase
    .from('check_types')
    .select('*')
    .limit(5)

  if (checkError) {
    console.log('❌ Error:', checkError.message)
  } else {
    console.log(`✅ Total check types: ${checkTypes?.length}`)
    console.log('Sample:', JSON.stringify(checkTypes, null, 2))
  }

  // Check pilots
  console.log('\n4. Checking pilots...')
  const {
    data: pilots,
    error: pilotError,
    count: pilotCount,
  } = await supabase
    .from('pilots')
    .select('id, first_name, last_name, role', { count: 'exact' })
    .limit(5)

  if (pilotError) {
    console.log('❌ Error:', pilotError.message)
  } else {
    console.log(`✅ Total pilots: ${pilotCount}`)
    console.log('Sample:', JSON.stringify(pilots, null, 2))
  }

  // Check expiring certifications
  console.log('\n5. Checking expiring certifications for 2026...')
  const { data: expiring, error: expiringError } = await supabase
    .from('expiring_checks')
    .select('*')
    .gte('date_of_expiry', '2026-01-01')
    .lte('date_of_expiry', '2026-12-31')
    .limit(5)

  if (expiringError) {
    console.log('❌ Error:', expiringError.message)
  } else {
    console.log(`✅ Expiring checks in 2026: ${expiring?.length}`)
    if (expiring && expiring.length > 0) {
      console.log('Sample:', JSON.stringify(expiring.slice(0, 2), null, 2))
    }
  }
}

checkData().catch(console.error)
