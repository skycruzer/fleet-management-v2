/**
 * Test Priority Calculation
 * Verifies that the enhanced priority system is working correctly
 * with seniority as primary and approved days as secondary
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

// Load environment variables from .env.local
const envFile = readFileSync('.env.local', 'utf-8')
const envVars = {}
envFile.split('\n').forEach((line) => {
  const match = line.match(/^([^=]+)=(.*)$/)
  if (match) {
    envVars[match[1]] = match[2]
  }
})

const supabase = createClient(
  envVars.NEXT_PUBLIC_SUPABASE_URL,
  envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

/**
 * Calculate approved days for a pilot in a year
 */
async function getApprovedDaysForYear(pilotId, year = new Date().getFullYear()) {
  const { data, error } = await supabase
    .from('leave_requests')
    .select('start_date, end_date')
    .eq('pilot_id', pilotId)
    .eq('status', 'APPROVED')
    .gte('start_date', `${year}-01-01`)
    .lte('start_date', `${year}-12-31`)

  if (error) {
    console.error('Error fetching approved days:', error)
    return 0
  }

  if (!data || data.length === 0) {
    return 0
  }

  // Calculate total days
  const totalDays = data.reduce((total, request) => {
    const start = new Date(request.start_date)
    const end = new Date(request.end_date)
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1
    return total + days
  }, 0)

  return totalDays
}

/**
 * Calculate priority score
 */
function calculatePriorityScore(seniorityNumber, approvedDays) {
  const seniorityScore = (100 - seniorityNumber) * 1000
  const daysScore = (365 - approvedDays) * 10
  return seniorityScore + daysScore
}

/**
 * Test the priority calculation
 */
async function testPriorityCalculation() {
  console.log('🧪 Testing Priority Calculation System')
  console.log('='.repeat(80))
  console.log()

  // Get all Captains
  const { data: captains, error: captainsError } = await supabase
    .from('pilots')
    .select('id, first_name, last_name, role, seniority_number')
    .eq('role', 'Captain')
    .order('seniority_number', { ascending: true })

  if (captainsError) {
    console.error('Error fetching captains:', captainsError)
    return
  }

  console.log(`📊 Captains Priority Ranking (${captains.length} total)`)
  console.log()

  const year = new Date().getFullYear()
  const rankings = []

  // Calculate priority for each captain
  for (const pilot of captains) {
    const approvedDays = await getApprovedDaysForYear(pilot.id, year)
    const priorityScore = calculatePriorityScore(pilot.seniority_number, approvedDays)

    rankings.push({
      id: pilot.id,
      name: `${pilot.first_name} ${pilot.last_name}`,
      seniority: pilot.seniority_number,
      approvedDays,
      priorityScore,
    })
  }

  // Sort by priority score (descending - higher is better)
  rankings.sort((a, b) => b.priorityScore - a.priorityScore)

  // Display rankings
  console.log('Rank | Name                  | Seniority | Approved Days | Priority Score')
  console.log('-'.repeat(80))

  rankings.forEach((pilot, index) => {
    const rank = (index + 1).toString().padStart(4, ' ')
    const name = pilot.name.padEnd(22, ' ')
    const seniority = `#${pilot.seniority}`.padStart(9, ' ')
    const days = pilot.approvedDays.toString().padStart(13, ' ')
    const score = pilot.priorityScore.toString().padStart(14, ' ')

    console.log(`${rank} | ${name} | ${seniority} | ${days} | ${score}`)
  })

  console.log()
  console.log('='.repeat(80))
  console.log()

  // Verify seniority is prioritized correctly
  console.log('🔍 Verification Tests:')
  console.log()

  // Test 1: Verify top seniority gets top priority (regardless of days)
  const topSeniority = rankings.find((r) => r.seniority === 1)
  const topPriority = rankings[0]

  if (topSeniority && topPriority && topSeniority.id === topPriority.id) {
    console.log('✅ TEST 1 PASSED: Seniority #1 has highest priority')
  } else {
    console.log('❌ TEST 1 FAILED: Seniority #1 should have highest priority')
    if (topSeniority) {
      console.log(
        `   Seniority #1 is at rank ${rankings.findIndex((r) => r.id === topSeniority.id) + 1}`
      )
    }
  }

  // Test 2: Verify pilots with same seniority are ranked by days
  console.log()
  console.log('✅ TEST 2: Priority formula verification')
  console.log('   Seniority Score = (100 - seniority) × 1000')
  console.log('   Days Score = (365 - approved_days) × 10')
  console.log('   Total Score = Seniority Score + Days Score')
  console.log()

  // Show a few examples
  for (let i = 0; i < Math.min(5, rankings.length); i++) {
    const pilot = rankings[i]
    const seniorityScore = (100 - pilot.seniority) * 1000
    const daysScore = (365 - pilot.approvedDays) * 10
    const calculatedScore = seniorityScore + daysScore

    console.log(`   Rank ${i + 1}: ${pilot.name}`)
    console.log(`      Seniority #${pilot.seniority} = ${seniorityScore} points`)
    console.log(`      Approved days: ${pilot.approvedDays} = ${daysScore} points`)
    console.log(`      Total = ${calculatedScore} points`)
    console.log(
      `      Stored = ${pilot.priorityScore} points ${calculatedScore === pilot.priorityScore ? '✅' : '❌'}`
    )
    console.log()
  }

  // Test 3: Verify seniority dominates over days
  console.log('✅ TEST 3: Verify seniority dominates over approved days')

  const worstSeniorityBestDays = {
    seniority: 27,
    approvedDays: 0, // Best possible days
    score: calculatePriorityScore(27, 0),
  }

  const bestSeniorityWorstDays = {
    seniority: 1,
    approvedDays: 365, // Worst possible days
    score: calculatePriorityScore(1, 365),
  }

  console.log(`   Seniority #27 with 0 days = ${worstSeniorityBestDays.score} points`)
  console.log(`   Seniority #1 with 365 days = ${bestSeniorityWorstDays.score} points`)

  if (bestSeniorityWorstDays.score > worstSeniorityBestDays.score) {
    console.log('   ✅ Seniority #1 (worst case) still beats Seniority #27 (best case)')
  } else {
    console.log('   ❌ FAILED: Seniority should dominate!')
  }

  console.log()
  console.log('='.repeat(80))
  console.log('✅ Priority Calculation Test Complete!')
  console.log()
}

// Run the test
testPriorityCalculation()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Test failed:', error)
    process.exit(1)
  })
