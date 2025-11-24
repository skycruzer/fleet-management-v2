import puppeteer from 'puppeteer'

console.log('\n🚀 Opening Fleet Management V2 - Pilot Portal in Browser...\n')

const browser = await puppeteer.launch({
  headless: false,
  defaultViewport: null,
  args: [
    '--start-maximized',
    '--disable-blink-features=AutomationControlled'
  ]
})

const page = await browser.newPage()

console.log('📍 Navigating to Pilot Portal Login...')
await page.goto('http://localhost:3000/portal/login', { 
  waitUntil: 'networkidle2' 
})

console.log('✅ Browser opened!')
console.log('\n📝 Test Credentials:')
console.log('   Email: mrondeau@airniugini.com.pg')
console.log('   Password: Lemakot@1972\n')
console.log('💡 Login to access the pilot portal and test features!')
console.log('🔔 Check the notification bell in the top-right of the sidebar!\n')
console.log('⚠️  Browser will stay open - Close manually when done.\n')

// Keep the browser open
await new Promise(() => {})
