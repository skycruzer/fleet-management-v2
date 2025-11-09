#!/usr/bin/env node

/**
 * Test Roster Period Rollover Logic
 * Verify RP13/YYYY correctly rolls to RP01/(YYYY+1)
 */

console.log('\n🧪 Testing Roster Period Rollover Logic\n');
console.log('═══════════════════════════════════════════════════════════\n');

// Test cases
const testCases = [
  { date: '2025-11-07', expected: 'RP10/2025' },
  { date: '2025-11-08', expected: 'RP11/2025' },
  { date: '2025-12-05', expected: 'RP11/2025' },
  { date: '2025-12-06', expected: 'RP12/2025' },
  { date: '2026-01-02', expected: 'RP12/2025' },
  { date: '2026-01-03', expected: 'RP13/2025' },
  { date: '2026-01-30', expected: 'RP13/2025' },
  { date: '2026-01-31', expected: 'RP01/2026' }, // ROLLOVER!
  { date: '2026-02-27', expected: 'RP01/2026' },
  { date: '2026-02-28', expected: 'RP02/2026' },
];

console.log('Test Cases:\n');

// Known anchor - CORRECTED to match database
const anchorDate = new Date('2025-10-11');
const anchorNumber = 10;  // Changed from 12 to 10
const anchorYear = 2025;
const ROSTER_DURATION = 28;
const PERIODS_PER_YEAR = 13;

function getRosterPeriod(dateStr) {
  const targetDate = new Date(dateStr);

  // Calculate days since known roster start
  const daysSinceKnown = Math.floor((targetDate - anchorDate) / (1000 * 60 * 60 * 24));

  // Calculate how many complete periods have passed
  const periodsPassed = Math.floor(daysSinceKnown / ROSTER_DURATION);

  // Calculate roster number
  let rosterNumber = anchorNumber + periodsPassed;
  let year = anchorYear;

  // Handle year rollover
  while (rosterNumber > PERIODS_PER_YEAR) {
    rosterNumber -= PERIODS_PER_YEAR;
    year += 1;
  }

  // Handle past dates
  while (rosterNumber <= 0) {
    rosterNumber += PERIODS_PER_YEAR;
    year -= 1;
  }

  return `RP${String(rosterNumber).padStart(2, '0')}/${year}`;
}

let passed = 0;
let failed = 0;

testCases.forEach(({ date, expected }) => {
  const result = getRosterPeriod(date);
  const match = result === expected;

  if (match) {
    console.log(`✅ ${date} → ${result}`);
    passed++;
  } else {
    console.log(`❌ ${date} → ${result} (expected ${expected})`);
    failed++;
  }
});

console.log('\n═══════════════════════════════════════════════════════════');
console.log(`Test Results: ${passed} passed, ${failed} failed`);
console.log('═══════════════════════════════════════════════════════════\n');

if (failed === 0) {
  console.log('✅ All tests passed! Rollover logic is correct.\n');
  console.log('Key Confirmation:');
  console.log('  • RP13/2025 ends on 2026-01-30');
  console.log('  • RP01/2026 starts on 2026-01-31');
  console.log('  • Rollover from RP13 → RP01 working correctly\n');
} else {
  console.log('❌ Some tests failed. Rollover logic needs review.\n');
}
