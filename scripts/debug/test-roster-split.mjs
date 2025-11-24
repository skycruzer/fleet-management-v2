import {
  dateToRosterPeriod,
  getRosterPeriodsInRange,
  splitRequestByRosterPeriod,
  rosterPeriodToDateRange
} from './lib/utils/roster-periods.ts'

console.log('=== Roster Period Splitting Test ===\n')

// Test 1: Single period request
console.log('Test 1: Single period request (within RP1/2026)')
const singlePeriodRequest = {
  id: '1',
  start_date: '2026-01-10',
  end_date: '2026-01-15',
  employee_number: 'TEST001',
  request_type: 'ANNUAL'
}

const singleResult = splitRequestByRosterPeriod(singlePeriodRequest)
console.log(`Input: ${singlePeriodRequest.start_date} to ${singlePeriodRequest.end_date}`)
console.log(`Output: ${singleResult.length} entries`)
singleResult.forEach((entry, idx) => {
  console.log(`  ${idx + 1}. ${entry.roster_period_code}: ${entry.period_start_date} to ${entry.period_end_date}`)
})

console.log('\nTest 2: Multi-period request (spans RP1/2026 and RP2/2026)')
const multiPeriodRequest = {
  id: '2',
  start_date: '2026-01-24',  // RP1/2026
  end_date: '2026-02-15',    // RP2/2026
  employee_number: 'TEST002',
  request_type: 'ANNUAL'
}

const multiResult = splitRequestByRosterPeriod(multiPeriodRequest)
console.log(`Input: ${multiPeriodRequest.start_date} to ${multiPeriodRequest.end_date}`)
console.log(`Output: ${multiResult.length} entries`)
multiResult.forEach((entry, idx) => {
  const startDate = new Date(entry.period_start_date)
  const endDate = new Date(entry.period_end_date)
  const days = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1
  console.log(`  ${idx + 1}. ${entry.roster_period_code}: ${entry.period_start_date} to ${entry.period_end_date} (${days} days)`)

  // Show the roster period boundaries
  const rpRange = rosterPeriodToDateRange(entry.roster_period_code)
  if (rpRange) {
    console.log(`     Roster Period Range: ${rpRange.startDate} to ${rpRange.endDate}`)
  }
})

console.log('\nTest 3: Determine roster periods for dates')
const testDates = [
  '2026-01-10',  // Should be RP1/2026
  '2026-02-07',  // Should be RP2/2026
  '2025-10-11',  // Should be RP12/2025 (anchor date)
]

testDates.forEach(date => {
  const rp = dateToRosterPeriod(date)
  console.log(`${date} -> ${rp}`)
})

console.log('\nTest 4: Get all roster periods in a date range')
const rangeStart = '2026-01-24'
const rangeEnd = '2026-02-15'
const periods = getRosterPeriodsInRange(rangeStart, rangeEnd)
console.log(`Date range ${rangeStart} to ${rangeEnd} spans: ${periods.join(', ')}`)
