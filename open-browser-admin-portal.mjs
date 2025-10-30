import puppeteer from 'puppeteer'

console.log('\n🚀 Opening Fleet Management V2 - Admin Portal in Browser...\n')

const browser = await puppeteer.launch({
  headless: false,
  defaultViewport: null,
  args: [
    '--start-maximized',
    '--disable-blink-features=AutomationControlled',
    '--new-window'
  ]
})

const page = await browser.newPage()

console.log('📍 Navigating to Admin Portal Login...')
await page.goto('http://localhost:3000/auth/login', { 
  waitUntil: 'networkidle2' 
})

console.log('✅ Browser opened!')
console.log('\n📝 Admin Credentials:')
console.log('   Email: skycruzer@icloud.com')
console.log('   Password: mron2393\n')
console.log('💡 Login to access the admin dashboard and manage pilots!')
console.log('📊 Navigate to Dashboard, Pilots, Analytics, etc.\n')
console.log('⚠️  Browser will stay open - Close manually when done.\n')

// Keep the browser open
await new Promise(() => {})
