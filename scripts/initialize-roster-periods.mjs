#!/usr/bin/env node

/**
 * Initialize Roster Periods in Database
 * Author: Maurice Rondeau
 * Date: November 11, 2025
 *
 * Populates the roster_periods table with calculated dates for current year + 2 years ahead
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Constants from roster-period-service.ts
const ANCHOR_ROSTER_PERIOD = 12
const ANCHOR_YEAR = 2025
const ANCHOR_START_DATE = new Date('2025-10-11')
const ROSTER_PERIOD_DAYS = 28
const ROSTER_PUBLISH_DAYS_BEFORE = 10
const REQUEST_DEADLINE_DAYS_BEFORE_PUBLISH = 21

function calculateRosterStartDate(periodNumber, year) {
  const periodDiff = (year - ANCHOR_YEAR) * 13 + (periodNumber - ANCHOR_ROSTER_PERIOD)
  const daysDiff = periodDiff * ROSTER_PERIOD_DAYS

  const startDate = new Date(ANCHOR_START_DATE)
  startDate.setDate(startDate.getDate() + daysDiff)

  return startDate
}

function calculateRosterPeriodDates(periodNumber, year) {
  const startDate = calculateRosterStartDate(periodNumber, year)

  const endDate = new Date(startDate)
  endDate.setDate(endDate.getDate() + ROSTER_PERIOD_DAYS - 1)

  const publishDate = new Date(startDate)
  publishDate.setDate(publishDate.getDate() - ROSTER_PUBLISH_DAYS_BEFORE)

  const deadlineDate = new Date(publishDate)
  deadlineDate.setDate(deadlineDate.getDate() - REQUEST_DEADLINE_DAYS_BEFORE_PUBLISH)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  let status = 'OPEN'
  if (today > startDate) {
    status = 'ARCHIVED'
  } else if (today > publishDate) {
    status = 'PUBLISHED'
  } else if (today > deadlineDate) {
    status = 'LOCKED'
  }

  const code = `RP${String(periodNumber).padStart(2, '0')}/${year}`

  return {
    code,
    period_number: periodNumber,
    year,
    start_date: startDate.toISOString().split('T')[0],
    end_date: endDate.toISOString().split('T')[0],
    publish_date: publishDate.toISOString().split('T')[0],
    request_deadline_date: deadlineDate.toISOString().split('T')[0],
    status,
  }
}

async function initializeRosterPeriods() {
  console.log('\n🚀 Initializing Roster Periods\n')
  console.log('='.repeat(60))

  const currentYear = new Date().getFullYear()
  const years = [currentYear, currentYear + 1, currentYear + 2]

  let totalCreated = 0
  let totalUpdated = 0

  for (const year of years) {
    console.log(`\n📅 Processing year ${year}...`)

    for (let periodNumber = 1; periodNumber <= 13; periodNumber++) {
      const periodData = calculateRosterPeriodDates(periodNumber, year)

      try {
        const { data, error } = await supabase
          .from('roster_periods')
          .upsert(periodData, {
            onConflict: 'code',
            ignoreDuplicates: false,
          })
          .select()

        if (error) {
          console.error(`   ❌ Failed to create ${periodData.code}:`, error.message)
          continue
        }

        console.log(
          `   ✅ ${periodData.code}: ${periodData.start_date} to ${periodData.end_date} (${periodData.status})`
        )

        // Check if it was an insert or update
        if (data && data.length > 0) {
          totalCreated++
        } else {
          totalUpdated++
        }
      } catch (err) {
        console.error(`   ❌ Error processing ${periodData.code}:`, err.message)
      }
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log(`\n✅ Initialization complete!`)
  console.log(`   Total roster periods: ${totalCreated + totalUpdated}`)
  console.log(`   Years covered: ${years.join(', ')}`)
  console.log(`\n💡 Next steps:`)
  console.log(`   1. Verify data in Supabase Dashboard`)
  console.log(`   2. Test roster period queries in your app`)
  console.log(`   3. Enable deadline notifications`)
}

// Run initialization
initializeRosterPeriods()
  .then(() => {
    console.log('\n✅ Script completed successfully\n')
    process.exit(0)
  })
  .catch((err) => {
    console.error('\n❌ Script failed:', err)
    process.exit(1)
  })
