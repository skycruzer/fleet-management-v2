import { getAffectedRosterPeriods, getRosterPeriodFromDate } from './lib/utils/roster-utils.js';

console.log('Testing Roster Period Calculation for NAMA MARIOLE\n');
console.log('Dates: 2025-12-29 to 2026-01-02\n');

const startDate = new Date('2025-12-29');
const endDate = new Date('2026-01-02');

// Test affected roster periods
const periods = getAffectedRosterPeriods(startDate, endDate);

console.log(`✅ Affected Roster Periods: ${periods.length}`);
periods.forEach((period, i) => {
  console.log(`   ${i + 1}. ${period.code}`);
  console.log(`      Start: ${period.startDate.toISOString().split('T')[0]}`);
  console.log(`      End: ${period.endDate.toISOString().split('T')[0]}`);
});

console.log('\nDisplay format:', periods.map(p => p.code).join(', '));

// Also test individual dates
console.log('\nIndividual Date Analysis:');
console.log('Dec 29, 2025 →', getRosterPeriodFromDate(new Date('2025-12-29')).code);
console.log('Dec 30, 2025 →', getRosterPeriodFromDate(new Date('2025-12-30')).code);
console.log('Dec 31, 2025 →', getRosterPeriodFromDate(new Date('2025-12-31')).code);
console.log('Jan 1, 2026 →', getRosterPeriodFromDate(new Date('2026-01-01')).code);
console.log('Jan 2, 2026 →', getRosterPeriodFromDate(new Date('2026-01-02')).code);
console.log('Jan 3, 2026 →', getRosterPeriodFromDate(new Date('2026-01-03')).code);
