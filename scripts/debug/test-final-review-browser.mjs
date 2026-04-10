/**
 * Open Final Review Dashboard in Browser
 * Opens the final review page for manual testing
 */

import { exec } from 'child_process'
import { platform } from 'os'

const url = 'http://localhost:3000/dashboard/leave/final-review'

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('🌐 OPENING FINAL REVIEW DASHBOARD IN BROWSER')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

console.log(`📍 URL: ${url}\n`)

console.log('📝 Testing Checklist:')
console.log('   1. ✅ Login with admin credentials')
console.log('   2. ✅ View final review dashboard')
console.log('   3. ✅ Check roster period alerts displayed')
console.log('   4. ✅ Verify urgency color coding (🔴 critical, 🟠 urgent, 🟡 warning, 🔵 normal)')
console.log('   5. ✅ Check pending request counts by rank')
console.log('   6. ✅ Test period selection checkboxes')
console.log('   7. ✅ Test "Generate Reports" button')
console.log('   8. ✅ Test "Send Emails" button')
console.log('   9. ✅ Verify statistics cards (Total Alerts, Critical Alerts, etc.)')
console.log('   10. ✅ Check responsive design on different screen sizes\n')

console.log('🔐 Admin Login Credentials:')
console.log('   Email: admin@fleetmanagement.com')
console.log('   Password: [Use your admin password]\n')

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

// Determine command based on OS
let command
const os = platform()

switch (os) {
  case 'darwin': // macOS
    command = `open "${url}"`
    break
  case 'win32': // Windows
    command = `start "" "${url}"`
    break
  default: // Linux
    command = `xdg-open "${url}"`
    break
}

// Open browser
exec(command, (error) => {
  if (error) {
    console.error(`❌ Error opening browser: ${error.message}`)
    console.log(`\n💡 Manually open this URL in your browser: ${url}`)
    process.exit(1)
  } else {
    console.log('✅ Browser opened successfully!')
    console.log('\n📊 Expected Data (from database):')
    console.log('   • RP13/2025: 5 total requests (4 pending, 1 approved)')
    console.log('   • RP01/2026: 7 total requests (7 pending, 0 approved)')
    console.log('\n🎯 Focus Areas for Testing:')
    console.log('   • Alert detection accuracy')
    console.log('   • Date calculations (21-day window)')
    console.log('   • Urgency level assignment')
    console.log('   • Batch operation functionality')
    console.log('   • PDF generation (when implemented)')
    console.log('   • Email sending (when configured)')
    console.log('')
  }
})
