#!/usr/bin/env node

/**
 * Test Roster Period Rollover Logic
 * Verify RP13/YYYY correctly rolls to RP01/(YYYY+1)
 *
 * CORRECT LOGIC:
 * - RP13/2025: Nov 8 - Dec 5, 2025
 * - RP01/2026: Dec 6, 2025 - Jan 2, 2026
 */

console.log('\n🧪 Testing Roster Period Rollover Logic\n');
console.log('═══════════════════════════════════════════════════════════\n');

// Test cases
const testCases = [
  { date: '2025-10-11', expected: 'RP12/2025' },  // -28 days from anchor
  { date: '2025-11-07', expected: 'RP12/2025' },  // Last day of RP12
  { date: '2025-11-08', expected: 'RP13/2025' },  // ANCHOR - First day of RP13
  { date: '2025-11-15', expected: 'RP13/2025' },  // Middle of RP13
  { date: '2025-12-05', expected: 'RP13/2025' },  // Last day of RP13
  { date: '2025-12-06', expected: 'RP01/2026' },  // ROLLOVER! First day of RP01/2026
  { date: '2025-12-15', expected: 'RP01/2026' },  // Middle of RP01/2026
  { date: '2026-01-02', expected: 'RP01/2026' },  // Last day of RP01/2026
  { date: '2026-01-03', expected: 'RP02/2026' },  // First day of RP02/2026
  { date: '2026-01-30', expected: 'RP02/2026' },  // Last day of RP02/2026
];

console.log('Test Cases:\n');

// CORRECTED ANCHOR: RP13/2025 starts on 2025-11-08
const anchorDate = new Date('2025-11-08');
const anchorNumber = 13;
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
  console.log('  • RP13/2025: Nov 8 - Dec 5, 2025');
  console.log('  • RP01/2026: Dec 6, 2025 - Jan 2, 2026');
  console.log('  • Rollover from RP13 → RP01 working correctly\n');
} else {
  console.log('❌ Some tests failed. Rollover logic needs review.\n');
}
