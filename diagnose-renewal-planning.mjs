/**
 * Diagnostic Script: Renewal Planning Data Check
 *
 * Checks if there are certifications available for renewal planning
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

// Load environment variables from .env.local
const envContent = readFileSync('.env.local', 'utf-8')
const envLines = envContent.split('\n')
const env = {}
envLines.forEach(line => {
  const [key, ...valueParts] = line.split('=')
  if (key && valueParts.length > 0) {
    env[key.trim()] = valueParts.join('=').trim()
  }
})

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function diagnoseRenewalPlanning() {
  console.log('\n📊 RENEWAL PLANNING DIAGNOSTIC REPORT\n')
  console.log('=' .repeat(60))

  // Check 1: Total certifications in database
  const { data: allCerts, error: allError } = await supabase
    .from('pilot_checks')
    .select('id, check_type_id, expiry_date, check_types(category)')

  if (allError) {
    console.error('❌ Error fetching certifications:', allError)
    return
  }

  console.log(`\n✅ Total Certifications: ${allCerts?.length || 0}`)

  // Check 2: Certifications by category
  const categoryCount = {}
  allCerts?.forEach(cert => {
    const category = cert.check_types?.category || 'Unknown'
    categoryCount[category] = (categoryCount[category] || 0) + 1
  })

  console.log('\n📋 Certifications by Category:')
  Object.entries(categoryCount).forEach(([category, count]) => {
    console.log(`   - ${category}: ${count}`)
  })

  // Check 3: Future certifications (not expired)
  const today = new Date()
  const { data: futureCerts } = await supabase
    .from('pilot_checks')
    .select('id, expiry_date, check_types(category)')
    .gte('expiry_date', today.toISOString().split('T')[0])

  console.log(`\n📅 Future Certifications (not expired): ${futureCerts?.length || 0}`)

  // Check 4: Certifications expiring in next 12 months
  const endDate = new Date(today)
  endDate.setMonth(endDate.getMonth() + 12)

  const { data: next12Months } = await supabase
    .from('pilot_checks')
    .select('id, expiry_date, check_types(category, check_code)')
    .gte('expiry_date', today.toISOString().split('T')[0])
    .lte('expiry_date', endDate.toISOString().split('T')[0])

  console.log(`\n⏰ Certifications expiring in next 12 months: ${next12Months?.length || 0}`)

  // Check 5: Certifications in renewal categories
  const renewalCategories = ['Flight Checks', 'Simulator Checks', 'Ground Courses Refresher']
  const { data: renewalCerts } = await supabase
    .from('pilot_checks')
    .select('id, expiry_date, check_types(category, check_code)')
    .gte('expiry_date', today.toISOString().split('T')[0])
    .lte('expiry_date', endDate.toISOString().split('T')[0])

  const filteredRenewalCerts = renewalCerts?.filter(cert =>
    renewalCategories.includes(cert.check_types?.category || '')
  ) || []

  console.log(`\n🎯 Certifications in renewal categories (next 12 months): ${filteredRenewalCerts.length}`)

  if (filteredRenewalCerts.length > 0) {
    console.log('\n📌 Sample of renewal-eligible certifications:')
    filteredRenewalCerts.slice(0, 10).forEach((cert, idx) => {
      console.log(`   ${idx + 1}. ${cert.check_types?.check_code} (${cert.check_types?.category}) - Expires: ${cert.expiry_date}`)
    })
  }

  // Check 6: Existing renewal plans
  const { data: existingPlans } = await supabase
    .from('certification_renewal_plans')
    .select('id')

  console.log(`\n📝 Existing Renewal Plans: ${existingPlans?.length || 0}`)

  // Check 7: Roster period capacity
  const { data: capacity } = await supabase
    .from('roster_period_capacity')
    .select('roster_period, period_start_date, flight_checks_capacity, simulator_checks_capacity')
    .order('period_start_date')

  console.log(`\n📊 Roster Period Capacity Records: ${capacity?.length || 0}`)

  if (capacity && capacity.length > 0) {
    console.log('\n📅 Sample Roster Periods:')
    capacity.slice(0, 5).forEach(cap => {
      const date = new Date(cap.period_start_date)
      const month = date.toLocaleString('default', { month: 'long' })
      console.log(`   - ${cap.roster_period} (${month} ${date.getFullYear()}) - Flight: ${cap.flight_checks_capacity}, Sim: ${cap.simulator_checks_capacity}`)
    })
  }

  // Check 8: December/January filtering impact
  console.log('\n⚠️  DECEMBER/JANUARY EXCLUSION IMPACT:')
  console.log('   Renewal planning automatically excludes Dec/Jan periods')
  console.log('   This is intentional to avoid holiday months')

  const decJanPeriods = capacity?.filter(cap => {
    const date = new Date(cap.period_start_date)
    const month = date.getMonth()
    return month === 0 || month === 11 // January (0) or December (11)
  }) || []

  console.log(`   - Dec/Jan periods excluded: ${decJanPeriods.length}`)
  console.log(`   - Available periods: ${(capacity?.length || 0) - decJanPeriods.length}`)

  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('\n📊 SUMMARY:')
  console.log(`   - Total certifications: ${allCerts?.length || 0}`)
  console.log(`   - Future certifications: ${futureCerts?.length || 0}`)
  console.log(`   - Renewal-eligible (12 months): ${filteredRenewalCerts.length}`)
  console.log(`   - Existing plans: ${existingPlans?.length || 0}`)
  console.log(`   - Available roster periods: ${(capacity?.length || 0) - decJanPeriods.length}/${capacity?.length || 0}`)

  if (filteredRenewalCerts.length === 0) {
    console.log('\n⚠️  WARNING: No renewal-eligible certifications found!')
    console.log('   Possible reasons:')
    console.log('   1. All certifications already expired')
    console.log('   2. No certifications in renewal categories (Flight/Sim/Ground Refresher)')
    console.log('   3. All certifications expire beyond 12-month horizon')
  } else {
    console.log('\n✅ Renewal planning should work - eligible certifications found')
  }

  console.log('\n')
}

diagnoseRenewalPlanning()
