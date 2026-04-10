/**
 * Test Script for Certifications Filtering
 * Tests the new expiry grouping logic with mock data
 *
 * Run with: node test-certifications-filter.mjs
 */

// Mock data to simulate certifications
const mockCertifications = [
  {
    id: 'cert-1',
    pilot_id: 'pilot-1',
    check_type_id: 'check-1',
    expiry_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Expired 10 days ago
    pilot: { first_name: 'John', last_name: 'Doe', employee_id: '100001', role: 'Captain' },
    check_type: {
      check_code: 'PC',
      check_description: 'Proficiency Check',
      category: 'Flight Operations',
    },
    status: { color: 'red', label: 'Expired', daysUntilExpiry: -10 },
  },
  {
    id: 'cert-2',
    pilot_id: 'pilot-2',
    check_type_id: 'check-2',
    expiry_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days
    pilot: { first_name: 'Jane', last_name: 'Smith', employee_id: '100002', role: 'First Officer' },
    check_type: {
      check_code: 'LC',
      check_description: 'Line Check',
      category: 'Flight Operations',
    },
    status: { color: 'yellow', label: 'Expiring Soon', daysUntilExpiry: 7 },
  },
  {
    id: 'cert-3',
    pilot_id: 'pilot-3',
    check_type_id: 'check-3',
    expiry_date: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 25 days
    pilot: { first_name: 'Bob', last_name: 'Johnson', employee_id: '100003', role: 'Captain' },
    check_type: { check_code: 'MC', check_description: 'Medical Certificate', category: 'Medical' },
    status: { color: 'yellow', label: 'Expiring Soon', daysUntilExpiry: 25 },
  },
  {
    id: 'cert-4',
    pilot_id: 'pilot-4',
    check_type_id: 'check-4',
    expiry_date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 45 days
    pilot: {
      first_name: 'Alice',
      last_name: 'Williams',
      employee_id: '100004',
      role: 'First Officer',
    },
    check_type: {
      check_code: 'DG',
      check_description: 'Dangerous Goods',
      category: 'Ground Training',
    },
    status: { color: 'yellow', label: 'Expiring Soon', daysUntilExpiry: 45 },
  },
  {
    id: 'cert-5',
    pilot_id: 'pilot-5',
    check_type_id: 'check-5',
    expiry_date: new Date(Date.now() + 75 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 75 days
    pilot: { first_name: 'Charlie', last_name: 'Brown', employee_id: '100005', role: 'Captain' },
    check_type: {
      check_code: 'SEP',
      check_description: 'Security Training',
      category: 'Ground Training',
    },
    status: { color: 'yellow', label: 'Expiring Soon', daysUntilExpiry: 75 },
  },
  {
    id: 'cert-6',
    pilot_id: 'pilot-6',
    check_type_id: 'check-6',
    expiry_date: new Date(Date.now() + 150 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 150 days - CURRENT
    pilot: {
      first_name: 'David',
      last_name: 'Miller',
      employee_id: '100006',
      role: 'First Officer',
    },
    check_type: {
      check_code: 'CRM',
      check_description: 'Crew Resource Management',
      category: 'Ground Training',
    },
    status: { color: 'green', label: 'Current', daysUntilExpiry: 150 },
  },
  {
    id: 'cert-7',
    pilot_id: 'pilot-7',
    check_type_id: 'check-7',
    expiry_date: new Date(Date.now() + 200 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 200 days - CURRENT
    pilot: { first_name: 'Eve', last_name: 'Davis', employee_id: '100007', role: 'Captain' },
    check_type: {
      check_code: 'FFS',
      check_description: 'Full Flight Simulator',
      category: 'Simulator',
    },
    status: { color: 'green', label: 'Current', daysUntilExpiry: 200 },
  },
]

// Filtering function (same logic as in the actual implementation)
function groupCertificationsByExpiry(certifications) {
  // Filter out current certifications (green status)
  const expiringOrExpired = certifications.filter(
    (cert) => cert.status && (cert.status.color === 'red' || cert.status.color === 'yellow')
  )

  const groups = {
    expired: {
      id: 'expired',
      label: 'Expired',
      description: 'Certifications that have already expired',
      color: 'red',
      certifications: expiringOrExpired.filter(
        (cert) => cert.status?.daysUntilExpiry !== undefined && cert.status.daysUntilExpiry < 0
      ),
    },
    within14Days: {
      id: 'within14Days',
      label: 'Expiring Within 14 Days',
      description: 'Critical - requires immediate action',
      color: 'red',
      certifications: expiringOrExpired.filter(
        (cert) =>
          cert.status?.daysUntilExpiry !== undefined &&
          cert.status.daysUntilExpiry >= 0 &&
          cert.status.daysUntilExpiry <= 14
      ),
    },
    within30Days: {
      id: 'within30Days',
      label: 'Expiring Within 30 Days',
      description: 'High priority - action required soon',
      color: 'orange',
      certifications: expiringOrExpired.filter(
        (cert) =>
          cert.status?.daysUntilExpiry !== undefined &&
          cert.status.daysUntilExpiry >= 15 &&
          cert.status.daysUntilExpiry <= 30
      ),
    },
    within60Days: {
      id: 'within60Days',
      label: 'Expiring Within 60 Days',
      description: 'Medium priority - plan renewal',
      color: 'yellow',
      certifications: expiringOrExpired.filter(
        (cert) =>
          cert.status?.daysUntilExpiry !== undefined &&
          cert.status.daysUntilExpiry >= 31 &&
          cert.status.daysUntilExpiry <= 60
      ),
    },
    within90Days: {
      id: 'within90Days',
      label: 'Expiring Within 90 Days',
      description: 'Normal priority - schedule renewal',
      color: 'yellow',
      certifications: expiringOrExpired.filter(
        (cert) =>
          cert.status?.daysUntilExpiry !== undefined &&
          cert.status.daysUntilExpiry >= 61 &&
          cert.status.daysUntilExpiry <= 90
      ),
    },
  }

  return groups
}

function getTotalExpiringCount(groups) {
  return Object.values(groups).reduce((total, group) => total + group.certifications.length, 0)
}

function getMostCriticalGroup(groups) {
  const priority = ['expired', 'within14Days', 'within30Days', 'within60Days', 'within90Days']

  for (const groupId of priority) {
    const group = groups[groupId]
    if (group && group.certifications.length > 0) {
      return group
    }
  }

  return null
}

// Run the test
console.log('🧪 Testing Certifications Filtering Logic\n')
console.log('='.repeat(80))

console.log('\n📊 Mock Data:')
console.log(`Total certifications: ${mockCertifications.length}`)
console.log(`- Expired: ${mockCertifications.filter((c) => c.status.daysUntilExpiry < 0).length}`)
console.log(
  `- Expiring Soon: ${mockCertifications.filter((c) => c.status.color === 'yellow').length}`
)
console.log(
  `- Current (should be filtered out): ${mockCertifications.filter((c) => c.status.color === 'green').length}`
)

console.log('\n' + '='.repeat(80))
console.log('\n🔍 Applying Filter...\n')

const groups = groupCertificationsByExpiry(mockCertifications)
const totalExpiring = getTotalExpiringCount(groups)
const mostCritical = getMostCriticalGroup(groups)

console.log('✅ RESULTS:\n')

Object.entries(groups).forEach(([groupId, group]) => {
  const icon = group.color === 'red' ? '🔴' : group.color === 'orange' ? '🟠' : '🟡'
  console.log(`${icon} ${group.label}:`)
  console.log(`   Count: ${group.certifications.length}`)
  console.log(`   Description: ${group.description}`)

  if (group.certifications.length > 0) {
    group.certifications.forEach((cert) => {
      console.log(
        `   - ${cert.pilot.first_name} ${cert.pilot.last_name} (${cert.pilot.employee_id})`
      )
      console.log(
        `     ${cert.check_type.check_description} - Expires in ${cert.status.daysUntilExpiry} days`
      )
    })
  }
  console.log()
})

console.log('='.repeat(80))
console.log('\n📈 Summary Statistics:\n')
console.log(`Total Requiring Attention: ${totalExpiring}`)
console.log(`Most Critical Group: ${mostCritical ? mostCritical.label : 'None'}`)
console.log(`Current Certifications Filtered: ${mockCertifications.length - totalExpiring}`)

console.log('\n' + '='.repeat(80))
console.log('\n✅ TEST VERIFICATION:\n')

const tests = [
  {
    name: 'Filters out current certifications',
    pass: totalExpiring === 5, // Should be 5, not 7 (2 green filtered out)
    expected: 5,
    actual: totalExpiring,
  },
  {
    name: 'Groups expired certifications correctly',
    pass: groups.expired.certifications.length === 1,
    expected: 1,
    actual: groups.expired.certifications.length,
  },
  {
    name: 'Groups 14-day certifications correctly',
    pass: groups.within14Days.certifications.length === 1,
    expected: 1,
    actual: groups.within14Days.certifications.length,
  },
  {
    name: 'Groups 30-day certifications correctly',
    pass: groups.within30Days.certifications.length === 1,
    expected: 1,
    actual: groups.within30Days.certifications.length,
  },
  {
    name: 'Groups 60-day certifications correctly',
    pass: groups.within60Days.certifications.length === 1,
    expected: 1,
    actual: groups.within60Days.certifications.length,
  },
  {
    name: 'Groups 90-day certifications correctly',
    pass: groups.within90Days.certifications.length === 1,
    expected: 1,
    actual: groups.within90Days.certifications.length,
  },
  {
    name: 'Identifies most critical group',
    pass: mostCritical?.id === 'expired',
    expected: 'expired',
    actual: mostCritical?.id,
  },
]

tests.forEach((test, index) => {
  const icon = test.pass ? '✅' : '❌'
  console.log(`${icon} Test ${index + 1}: ${test.name}`)
  console.log(`   Expected: ${test.expected}`)
  console.log(`   Actual: ${test.actual}`)
  console.log(`   Status: ${test.pass ? 'PASS' : 'FAIL'}`)
  console.log()
})

const passedTests = tests.filter((t) => t.pass).length
const totalTests = tests.length

console.log('='.repeat(80))
console.log(`\n🎯 FINAL RESULT: ${passedTests}/${totalTests} tests passed\n`)

if (passedTests === totalTests) {
  console.log('✅ ALL TESTS PASSED! The filtering logic works correctly.')
  console.log('\nThe implementation successfully:')
  console.log('  • Filters out current/valid certifications (green status)')
  console.log('  • Groups certifications by expiry timeframes')
  console.log('  • Identifies the most critical group')
  console.log('  • Maintains accurate counts')
} else {
  console.log('❌ SOME TESTS FAILED. Please review the implementation.')
}

console.log('\n' + '='.repeat(80))
console.log('\n💡 Next Steps:')
console.log('  1. Login to the application at http://localhost:3001/auth/login')
console.log('  2. Navigate to /dashboard/certifications')
console.log('  3. Verify the UI matches the filtered data shown above')
console.log('  4. Test accordion interactions and responsive design')
console.log('\n' + '='.repeat(80))
