/**
 * Open Final Review Dashboard - Week 3 Feature Test
 */

import { exec } from 'child_process'
import { platform } from 'os'

// Start with login page, then navigate to final review
const loginUrl = 'http://localhost:3000/auth/login'

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('🧪 TESTING WEEK 3: FINAL REVIEW SYSTEM')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

console.log('📍 Opening Login Page First...\n')

console.log('🔐 Steps to Test:')
console.log('   1. Login with admin credentials')
console.log('   2. Navigate to: Dashboard → Leave → Final Review')
console.log('      OR directly visit: http://localhost:3000/dashboard/leave/final-review\n')

console.log('🎯 What to Test:')
console.log('   ✅ Statistics cards show correct numbers')
console.log('   ✅ Critical alerts section displays roster periods')
console.log('   ✅ Urgency badges (🔴 🟠 🟡 🔵) show correct colors')
console.log('   ✅ Pending counts separated by rank (Captains/First Officers)')
console.log('   ✅ Date calculations are accurate (21-day window)')
console.log('   ✅ Checkboxes select roster periods')
console.log('   ✅ "Generate Reports" button works')
console.log('   ✅ "Send Emails" button works\n')

console.log('📊 Expected Data:')
console.log('   • RP13/2025: 4 pending requests')
console.log('   • RP01/2026: 7 pending requests\n')

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

// Determine command based on OS
let command
const os = platform()

switch (os) {
  case 'darwin':
    command = `open "${loginUrl}"`
    break
  case 'win32':
    command = `start "" "${loginUrl}"`
    break
  default:
    command = `xdg-open "${loginUrl}"`
    break
}

// Open browser
exec(command, (error) => {
  if (error) {
    console.error(`❌ Error: ${error.message}`)
    console.log(`\n💡 Manually open: ${loginUrl}`)
    console.log(`   Then navigate to: /dashboard/leave/final-review`)
    process.exit(1)
  } else {
    console.log('✅ Browser opened!')
    console.log('\n📝 After Login:')
    console.log('   Click: Dashboard → Leave → Final Review')
    console.log('   Or go to: http://localhost:3000/dashboard/leave/final-review\n')
  }
})
