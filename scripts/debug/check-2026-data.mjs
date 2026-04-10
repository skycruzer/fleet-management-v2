import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkData() {
  console.log('\n=== Checking 2026 Data ===\n')

  // Check roster periods
  const { data: periods, error: periodsError } = await supabase
    .from('roster_period_capacity')
    .select('roster_period, period_start_date, period_end_date')
    .gte('period_start_date', '2026-02-01')
    .lte('period_start_date', '2026-11-30')
    .order('period_start_date')

  if (periodsError) {
    console.error('Error fetching periods:', periodsError)
    return
  }

  const periodCount = periods ? periods.length : 0
  console.log(`Found ${periodCount} roster periods for 2026:`)
  if (periods) {
    periods.forEach((p) => {
      console.log(`  - ${p.roster_period}: ${p.period_start_date} to ${p.period_end_date}`)
    })
  }

  if (!periods || periods.length === 0) {
    console.log('\n❌ No roster periods found for 2026')
    return
  }

  // Check renewal plans
  const rosterPeriods = periods.map((p) => p.roster_period)

  const { data: renewals, error: renewalsError } = await supabase
    .from('certification_renewal_plans')
    .select('id, status, planned_roster_period')
    .in('planned_roster_period', rosterPeriods)

  if (renewalsError) {
    console.error('\nError fetching renewals:', renewalsError)
    return
  }

  const renewalCount = renewals ? renewals.length : 0
  console.log(`\nFound ${renewalCount} renewal plans for 2026 periods`)

  if (renewals && renewals.length > 0) {
    const byStatus = renewals.reduce((acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1
      return acc
    }, {})

    console.log('\nRenewal plans by status:')
    Object.entries(byStatus).forEach(([status, count]) => {
      console.log(`  - ${status}: ${count}`)
    })
  } else {
    console.log('\n❌ No renewal plans found for 2026')
    console.log(
      '\nSuggestion: Generate renewal plans for 2026 using the /api/renewal-planning/generate endpoint'
    )
  }
}

checkData().catch(console.error)
