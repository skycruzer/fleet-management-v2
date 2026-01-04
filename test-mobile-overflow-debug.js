/**
 * Mobile Overflow Debugging Script
 * Identifies which element(s) are causing horizontal overflow on mobile viewport
 */

import puppeteer from 'puppeteer'

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

console.log('\n' + '='.repeat(80))
console.log('  🔍 MOBILE OVERFLOW DEBUGGING - PILOT PORTAL')
console.log('='.repeat(80) + '\n')

const browser = await puppeteer.launch({
  headless: false,
  defaultViewport: null,
  args: ['--start-maximized'],
  slowMo: 50,
})

const page = await browser.newPage()

// Login to pilot portal
console.log('Step 1: Logging into Pilot Portal...')
await page.goto('http://localhost:3000/portal/login', { waitUntil: 'networkidle2' })
await sleep(1000)

await page.type('input[type="email"]', 'mrondeau@airniugini.com.pg', { delay: 50 })
await sleep(500)
await page.type('input[type="password"]', 'Lemakot@1972', { delay: 50 })
await sleep(500)

await page.click('button[type="submit"]')
await sleep(3000)

console.log('✅ Logged in successfully\n')

// Set mobile viewport
console.log('Step 2: Setting mobile viewport (375x667 - iPhone SE)...')
await page.setViewport({ width: 375, height: 667 })
await sleep(2000)

console.log('✅ Viewport set to 375px width\n')

// Analyze overflow
console.log('Step 3: Analyzing overflow...\n')

const overflowAnalysis = await page.evaluate(() => {
  const viewportWidth = window.innerWidth
  const bodyWidth = document.body.scrollWidth
  const hasOverflow = bodyWidth > viewportWidth

  // Find all elements that are wider than viewport
  const elements = document.querySelectorAll('*')
  const overflowing = []

  elements.forEach((el) => {
    const rect = el.getBoundingClientRect()
    const computedStyle = window.getComputedStyle(el)

    // Check if element extends beyond viewport
    if (rect.width > viewportWidth || rect.right > viewportWidth) {
      overflowing.push({
        tag: el.tagName,
        class: el.className,
        id: el.id,
        width: rect.width,
        right: rect.right,
        overflow: computedStyle.overflow,
        overflowX: computedStyle.overflowX,
        position: computedStyle.position,
        // Get parent context
        parent: el.parentElement
          ? {
              tag: el.parentElement.tagName,
              class: el.parentElement.className,
            }
          : null,
      })
    }
  })

  // Sort by how far they extend beyond viewport
  overflowing.sort((a, b) => b.right - a.right)

  return {
    viewportWidth,
    bodyWidth,
    hasOverflow,
    overflowAmount: bodyWidth - viewportWidth,
    overflowingElements: overflowing.slice(0, 10), // Top 10 offenders
  }
})

// Print results
console.log('📊 OVERFLOW ANALYSIS RESULTS\n')
console.log(`Viewport Width: ${overflowAnalysis.viewportWidth}px`)
console.log(`Body Scroll Width: ${overflowAnalysis.bodyWidth}px`)
console.log(`Has Overflow: ${overflowAnalysis.hasOverflow ? '❌ YES' : '✅ NO'}`)

if (overflowAnalysis.hasOverflow) {
  console.log(`Overflow Amount: ${overflowAnalysis.overflowAmount}px\n`)

  console.log('🔴 OVERFLOWING ELEMENTS (Top 10):\n')

  overflowAnalysis.overflowingElements.forEach((el, index) => {
    console.log(`${index + 1}. <${el.tag}> ${el.class ? `class="${el.class}"` : ''}`)
    console.log(
      `   Width: ${Math.round(el.width)}px (extends ${Math.round(el.right - overflowAnalysis.viewportWidth)}px beyond viewport)`
    )
    console.log(`   Position: ${el.position}`)
    console.log(`   Overflow-X: ${el.overflowX}`)
    if (el.parent) {
      console.log(
        `   Parent: <${el.parent.tag}> ${el.parent.class ? `class="${el.parent.class}"` : ''}`
      )
    }
    console.log('')
  })

  // Take screenshot
  const screenshotPath = './test-screenshots/mobile-overflow-debug.png'
  await page.screenshot({
    path: screenshotPath,
    fullPage: true,
  })
  console.log(`📸 Screenshot saved: ${screenshotPath}\n`)
}

console.log('='.repeat(80))
console.log('  ✅ ANALYSIS COMPLETE')
console.log('='.repeat(80))
console.log('\n💡 Browser will stay open for manual inspection.')
console.log('   Close browser window when done.\n')

// Keep browser open
await new Promise(() => {})
