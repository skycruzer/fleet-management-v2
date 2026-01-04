#!/usr/bin/env node

/**
 * Test Renewal Plan Generation
 * Author: Maurice Rondeau
 * Date: November 9, 2025
 *
 * This script tests the renewal planning generation workflow:
 * 1. Checks for expiring certifications
 * 2. Calls the generation API
 * 3. Verifies plans were created
 * 4. Shows summary statistics
 */

import fs from 'fs'

// Read environment variables
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

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY || SUPABASE_KEY

console.log('\n🧪 Testing Renewal Plan Generation')
console.log('═══════════════════════════════════════════════════════════\n')

async function testGeneration() {
  try {
    // Step 1: Check for expiring certifications
    console.log('1️⃣  Checking for expiring certifications...')

    const today = new Date()
    const endDate = new Date(today)
    endDate.setMonth(endDate.getMonth() + 12)

    const certsResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/pilot_checks?select=*,pilots(first_name,last_name),check_types(check_code,category)&expiry_date=gte.${today.toISOString().split('T')[0]}&expiry_date=lte.${endDate.toISOString().split('T')[0]}&order=expiry_date`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
      }
    )

    if (!certsResponse.ok) {
      throw new Error('Failed to fetch certifications')
    }

    const certs = await certsResponse.json()
    console.log(`   ✅ Found ${certs.length} certifications expiring in next 12 months\n`)

    if (certs.length === 0) {
      console.log('   ⚠️  No expiring certifications found. Cannot generate renewal plans.')
      console.log('      This is expected if all certifications are valid for >12 months.\n')
      return
    }

    // Show sample of expiring certs
    console.log('   📋 Sample expiring certifications:')
    certs.slice(0, 5).forEach((cert) => {
      const pilot = cert.pilots
      const checkType = cert.check_types
      console.log(
        `      • ${pilot?.first_name} ${pilot?.last_name} - ${checkType?.check_code} (${checkType?.category}) - Expires: ${cert.expiry_date}`
      )
    })
    console.log('')

    // Step 2: Count existing renewal plans (before generation)
    console.log('2️⃣  Checking existing renewal plans...')
    const beforeResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/certification_renewal_plans?select=count`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          Prefer: 'count=exact',
        },
      }
    )

    const beforeCount = beforeResponse.headers.get('content-range')?.split('/')[1] || '0'
    console.log(`   📊 Existing plans: ${beforeCount}\n`)

    // Step 3: Call generation service function directly
    console.log('3️⃣  Generating renewal plans (this may take 10-30 seconds)...')
    console.log('   ⏳ Processing certifications and calculating optimal assignments...\n')

    // Import the service function directly
    const { generateRenewalPlan } =
      await import('./lib/services/certification-renewal-planning-service.ts')

    const startTime = Date.now()

    try {
      const plans = await generateRenewalPlan({
        monthsAhead: 12,
        categories: ['Flight Checks', 'Simulator Checks', 'Ground Courses Refresher'],
      })

      const duration = ((Date.now() - startTime) / 1000).toFixed(2)
      console.log(`   ✅ Generation completed in ${duration}s`)
      console.log(`   📝 Created ${plans.length} renewal plans\n`)

      // Step 4: Verify plans were saved
      console.log('4️⃣  Verifying plans were saved to database...')
      const afterResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/certification_renewal_plans?select=count`,
        {
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
            Prefer: 'count=exact',
          },
        }
      )

      const afterCount = afterResponse.headers.get('content-range')?.split('/')[1] || '0'
      console.log(`   ✅ Total plans in database: ${afterCount}\n`)

      // Step 5: Get summary by roster period
      console.log('5️⃣  Fetching distribution across roster periods...')
      const summaryResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/certification_renewal_plans?select=planned_roster_period,check_types(category)&order=planned_roster_period`,
        {
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
          },
        }
      )

      const allPlans = await summaryResponse.json()

      // Group by roster period
      const byPeriod = {}
      allPlans.forEach((plan) => {
        const period = plan.planned_roster_period
        if (!byPeriod[period]) {
          byPeriod[period] = { total: 0, categories: {} }
        }
        byPeriod[period].total++

        const category = plan.check_types?.category || 'Unknown'
        byPeriod[period].categories[category] = (byPeriod[period].categories[category] || 0) + 1
      })

      console.log('   📊 Distribution by roster period:\n')
      const periods = Object.keys(byPeriod).sort()
      periods.forEach((period) => {
        const data = byPeriod[period]
        const categories = Object.entries(data.categories)
          .map(([cat, count]) => `${cat}=${count}`)
          .join(', ')
        console.log(`      ${period}: ${data.total} renewals (${categories})`)
      })
      console.log('')

      // Step 6: Calculate utilization
      console.log('6️⃣  Calculating capacity utilization...')
      const capacityResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/roster_period_capacity?select=*&order=period_start_date`,
        {
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
          },
        }
      )

      const capacities = await capacityResponse.json()

      let totalCapacity = 0
      let totalUsed = 0

      capacities.forEach((cap) => {
        const period = cap.roster_period
        const used = byPeriod[period]?.total || 0
        const capacity =
          (cap.flight_capacity || 0) + (cap.simulator_capacity || 0) + (cap.ground_capacity || 0)
        totalCapacity += capacity
        totalUsed += used
      })

      const utilization = totalCapacity > 0 ? ((totalUsed / totalCapacity) * 100).toFixed(1) : 0
      console.log(`   📈 Overall utilization: ${utilization}% (${totalUsed}/${totalCapacity})\n`)

      // Success summary
      console.log('═══════════════════════════════════════════════════════════')
      console.log('✅ Generation Test Complete!')
      console.log('═══════════════════════════════════════════════════════════\n')
      console.log('📝 Summary:\n')
      console.log(`   • Certifications found: ${certs.length}`)
      console.log(`   • Renewal plans created: ${plans.length}`)
      console.log(`   • Total plans in database: ${afterCount}`)
      console.log(`   • Roster periods with renewals: ${periods.length}`)
      console.log(`   • Overall utilization: ${utilization}%\n`)
      console.log('🎉 Next Steps:\n')
      console.log('   1. Start dev server: npm run dev')
      console.log('   2. Navigate to: /dashboard/renewal-planning')
      console.log('   3. Select year 2026 from dropdown')
      console.log('   4. You should now see populated data (not 0%)\n')
      console.log('═══════════════════════════════════════════════════════════\n')
    } catch (genError) {
      console.error('   ❌ Generation failed:', genError.message)
      console.error('\n   Error details:', genError)
      throw genError
    }
  } catch (error) {
    console.error('\n═══════════════════════════════════════════════════════════')
    console.error('❌ Test Failed')
    console.error('═══════════════════════════════════════════════════════════')
    console.error('Error:', error.message)
    if (error.stack) {
      console.error('\nStack trace:')
      console.error(error.stack)
    }
    console.error('═══════════════════════════════════════════════════════════\n')
    process.exit(1)
  }
}

testGeneration()
