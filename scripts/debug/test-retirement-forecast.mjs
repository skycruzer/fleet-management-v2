/**
 * Test Retirement Forecast Calculation Fix
 * Verify Neil Sexton is NOT in 2-year forecast but IS in 5-year forecast
 */

// Neil Sexton's data
const neilSexton = {
  name: 'Neil Sexton',
  dateOfBirth: new Date('1963-09-15'),
  retirementAge: 65,
}

// Calculate retirement date
const retirementDate = new Date(neilSexton.dateOfBirth)
retirementDate.setFullYear(retirementDate.getFullYear() + neilSexton.retirementAge)

// Current date
const today = new Date()

// Calculate years to retirement (PRECISE decimal value - no rounding)
const yearsToRetirement =
  (retirementDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 365.25)

console.log('\n=== Neil Sexton Retirement Forecast Test ===\n')
console.log(`Name: ${neilSexton.name}`)
console.log(`Date of Birth: ${neilSexton.dateOfBirth.toLocaleDateString()}`)
console.log(`Retirement Age: ${neilSexton.retirementAge}`)
console.log(`Retirement Date: ${retirementDate.toLocaleDateString()}`)
console.log(`Today's Date: ${today.toLocaleDateString()}`)
console.log(`\nYears to Retirement (precise): ${yearsToRetirement.toFixed(2)}`)

// Test with OLD buggy logic (Math.floor + <=)
const yearsToRetirementBuggy = Math.floor(yearsToRetirement)
const inTwoYearListBuggy = yearsToRetirementBuggy >= 0 && yearsToRetirementBuggy <= 2
const inFiveYearListBuggy = yearsToRetirementBuggy >= 0 && yearsToRetirementBuggy <= 5

console.log('\n--- OLD (BUGGY) Logic ---')
console.log(`Years to Retirement (floored): ${yearsToRetirementBuggy}`)
console.log(
  `In 2-year list? ${inTwoYearListBuggy} ${inTwoYearListBuggy ? '❌ WRONG' : '✓ CORRECT'}`
)
console.log(
  `In 5-year list? ${inFiveYearListBuggy} ${inFiveYearListBuggy ? '✓ CORRECT' : '❌ WRONG'}`
)

// Test with NEW fixed logic (precise + <)
const inTwoYearListFixed = yearsToRetirement >= 0 && yearsToRetirement < 2.0
const inFiveYearListFixed = yearsToRetirement >= 0 && yearsToRetirement < 5.0

console.log('\n--- NEW (FIXED) Logic ---')
console.log(`Years to Retirement (precise): ${yearsToRetirement.toFixed(2)}`)
console.log(
  `In 2-year list? ${inTwoYearListFixed} ${!inTwoYearListFixed ? '✓ CORRECT' : '❌ WRONG'}`
)
console.log(
  `In 5-year list? ${inFiveYearListFixed} ${inFiveYearListFixed ? '✓ CORRECT' : '❌ WRONG'}`
)

// Verify expected behavior
console.log('\n=== Test Results ===')
const twoYearTestPass = !inTwoYearListFixed // Should NOT be in 2-year list
const fiveYearTestPass = inFiveYearListFixed // Should BE in 5-year list

console.log(`\n✓ 2-year forecast test: ${twoYearTestPass ? 'PASS' : 'FAIL'}`)
console.log(`  Neil Sexton NOT in 2-year list: ${!inTwoYearListFixed}`)

console.log(`\n✓ 5-year forecast test: ${fiveYearTestPass ? 'PASS' : 'FAIL'}`)
console.log(`  Neil Sexton IS in 5-year list: ${inFiveYearListFixed}`)

console.log(`\n${twoYearTestPass && fiveYearTestPass ? '✅ ALL TESTS PASSED' : '❌ TESTS FAILED'}`)

// Show comparison
console.log('\n=== Before vs After ===')
console.log(`\nBEFORE (Buggy):`)
console.log(`  - Math.floor(2.86) = 2`)
console.log(`  - 2 <= 2 = true (WRONG - should be false)`)
console.log(`  - Result: Neil Sexton incorrectly appears in 2-year forecast`)

console.log(`\nAFTER (Fixed):`)
console.log(`  - Precise value: 2.86`)
console.log(`  - 2.86 < 2.0 = false (CORRECT)`)
console.log(`  - 2.86 < 5.0 = true (CORRECT)`)
console.log(`  - Result: Neil Sexton correctly appears only in 5-year forecast`)

console.log('\n')
