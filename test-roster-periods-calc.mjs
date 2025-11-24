import { addDays } from 'date-fns';

// Constants
const ROSTER_DURATION = 28;
const PERIODS_PER_YEAR = 13;
const KNOWN_ROSTER = {
  number: 13,
  year: 2025,
  startDate: new Date('2025-11-08')
};

function getRosterPeriodFromDate(date) {
  const targetDate = new Date(date);
  const daysSinceKnown = Math.floor((targetDate - KNOWN_ROSTER.startDate) / (1000 * 60 * 60 * 24));
  const periodsPassed = Math.floor(daysSinceKnown / ROSTER_DURATION);

  let rosterNumber = KNOWN_ROSTER.number + periodsPassed;
  let year = KNOWN_ROSTER.year;

  while (rosterNumber > PERIODS_PER_YEAR) {
    rosterNumber -= PERIODS_PER_YEAR;
    year += 1;
  }

  while (rosterNumber <= 0) {
    rosterNumber += PERIODS_PER_YEAR;
    year -= 1;
  }

  const startDate = new Date(KNOWN_ROSTER.startDate);
  startDate.setDate(startDate.getDate() + (periodsPassed * ROSTER_DURATION));

  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + ROSTER_DURATION - 1);

  return {
    code: 'RP' + String(rosterNumber).padStart(2, '0') + '/' + year,
    number: rosterNumber,
    year,
    startDate,
    endDate
  };
}

function getAffectedRosterPeriods(startDate, endDate) {
  const periods = [];
  const startPeriod = getRosterPeriodFromDate(startDate);
  const endPeriod = getRosterPeriodFromDate(endDate);

  // If same period, return just one
  if (startPeriod.code === endPeriod.code) {
    return [startPeriod];
  }

  // Get all periods between start and end dates
  let currentDate = new Date(startDate);
  const finalDate = new Date(endDate);

  while (currentDate <= finalDate) {
    const currentPeriod = getRosterPeriodFromDate(currentDate);

    // Add period if not already included
    if (!periods.some((p) => p.code === currentPeriod.code)) {
      periods.push(currentPeriod);
    }

    // Move to the next period's start date
    currentDate = new Date(currentPeriod.endDate);
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return periods;
}

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

console.log('\n📋 Display format:', periods.map(p => p.code).join(', '));

// Also test individual dates
console.log('\n📅 Individual Date Analysis:');
console.log('Dec 29, 2025 →', getRosterPeriodFromDate(new Date('2025-12-29')).code);
console.log('Dec 30, 2025 →', getRosterPeriodFromDate(new Date('2025-12-30')).code);
console.log('Dec 31, 2025 →', getRosterPeriodFromDate(new Date('2025-12-31')).code);
console.log('Jan 1, 2026 →', getRosterPeriodFromDate(new Date('2026-01-01')).code);
console.log('Jan 2, 2026 →', getRosterPeriodFromDate(new Date('2026-01-02')).code);
console.log('Jan 3, 2026 →', getRosterPeriodFromDate(new Date('2026-01-03')).code);
console.log('Jan 4, 2026 →', getRosterPeriodFromDate(new Date('2026-01-04')).code);

// Show RP01 and RP02 boundaries
console.log('\n📊 Roster Period Boundaries:');
const rp01 = getRosterPeriodFromDate(new Date('2025-12-29'));
const rp02 = getRosterPeriodFromDate(new Date('2026-01-03'));

console.log(`${rp01.code}: ${rp01.startDate.toISOString().split('T')[0]} to ${rp01.endDate.toISOString().split('T')[0]}`);
console.log(`${rp02.code}: ${rp02.startDate.toISOString().split('T')[0]} to ${rp02.endDate.toISOString().split('T')[0]}`);
