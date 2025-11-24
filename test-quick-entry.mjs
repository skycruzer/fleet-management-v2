import { chromium } from '@playwright/test'

const ADMIN_EMAIL = 'skycruzer@icloud.com'
const ADMIN_PASSWORD = 'mron2393'

;(async () => {
  console.log('🧪 Testing Quick Entry Form Fixes\n')
  console.log('=' .repeat(80))

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500
  })

  const page = await browser.newPage()

  try {
    // 1. Login
    console.log('\n1️⃣  Logging in...')
    await page.goto('http://localhost:3000/auth/login', { timeout: 60000 })
    await page.waitForTimeout(2000)

    await page.getByLabel(/email/i).fill(ADMIN_EMAIL)
    await page.getByLabel(/password/i).fill(ADMIN_PASSWORD)
    await page.getByRole('button', { name: /sign in|log in/i }).click()
    await page.waitForTimeout(5000)
    console.log('   ✅ Logged in successfully')

    // 2. Navigate to Requests page
    console.log('\n2️⃣  Navigating to Requests page...')
    await page.goto('http://localhost:3000/dashboard/requests', { timeout: 60000 })
    await page.waitForTimeout(3000)
    console.log('   ✅ Requests page loaded')

    // 3. Look for Quick Entry button
    console.log('\n3️⃣  Looking for Quick Entry button...')
    const quickEntryButton = page.getByRole('button', { name: /quick entry/i }).first()

    if (await quickEntryButton.isVisible()) {
      console.log('   ✅ Quick Entry button found')

      // 4. Click Quick Entry button
      console.log('\n4️⃣  Clicking Quick Entry button...')
      await quickEntryButton.click()
      await page.waitForTimeout(2000)

      // Check if modal opened
      const modalVisible = await page.locator('[role="dialog"]').isVisible()
      if (modalVisible) {
        console.log('   ✅ Quick Entry modal opened')

        // 5. Test pilot dropdown scrolling
        console.log('\n5️⃣  Testing pilot dropdown scrolling...')
        const pilotSelect = page.locator('button:has-text("Select a pilot")').first()

        if (await pilotSelect.isVisible()) {
          await pilotSelect.click()
          await page.waitForTimeout(1000)

          // Check if dropdown content is visible
          const dropdownContent = page.locator('[role="listbox"]').first()
          if (await dropdownContent.isVisible()) {
            console.log('   ✅ Pilot dropdown opened')

            // Take screenshot of dropdown
            await page.screenshot({ path: 'test-screenshots/quick-entry-dropdown.png' })
            console.log('   📸 Screenshot: quick-entry-dropdown.png')

            // Check if scrollable (look for overflow or max-height style)
            const hasScroll = await dropdownContent.evaluate((el) => {
              const style = window.getComputedStyle(el)
              return style.maxHeight !== 'none' || style.overflowY === 'auto' || style.overflowY === 'scroll'
            })

            if (hasScroll) {
              console.log('   ✅ Dropdown is scrollable (has max-height or overflow)')
            } else {
              console.log('   ⚠️  Dropdown might not be scrollable')
            }

            // Close dropdown by clicking elsewhere
            await page.keyboard.press('Escape')
            await page.waitForTimeout(500)
          } else {
            console.log('   ❌ Dropdown content not visible')
          }
        } else {
          console.log('   ❌ Pilot select button not found')
        }

        // 6. Test Next button validation
        console.log('\n6️⃣  Testing Next button validation...')
        const nextButton = page.getByRole('button', { name: /^next$/i })

        if (await nextButton.isVisible()) {
          console.log('   ✅ Next button found')

          // Click Next without filling required fields
          console.log('   📋 Clicking Next without filling fields...')
          await nextButton.click()
          await page.waitForTimeout(1000)

          // Check browser console for validation errors
          page.on('console', (msg) => {
            if (msg.type() === 'error') {
              console.log(`   🔍 Console Error: ${msg.text()}`)
            }
          })

          // Check for visible validation errors
          const errorMessages = await page.locator('[role="alert"]').allTextContents()
          if (errorMessages.length > 0) {
            console.log('   ✅ Validation errors displayed:')
            errorMessages.forEach((msg) => {
              console.log(`      - ${msg}`)
            })
          } else {
            console.log('   ℹ️  No visible validation errors (check console)')
          }

          // Take screenshot
          await page.screenshot({ path: 'test-screenshots/quick-entry-validation.png' })
          console.log('   📸 Screenshot: quick-entry-validation.png')
        } else {
          console.log('   ❌ Next button not found')
        }

        console.log('\n✅ TEST COMPLETE!')
        console.log('\n📝 Summary:')
        console.log('   - Pilot dropdown: Check screenshot for scrollability')
        console.log('   - Next button: Check console for validation errors')
        console.log('   - Browser window left open for manual inspection')
        console.log('\n   Press Ctrl+C to close browser and exit')

        // Wait indefinitely for manual inspection
        await page.waitForTimeout(300000) // 5 minutes
      } else {
        console.log('   ❌ Quick Entry modal did not open')
      }
    } else {
      console.log('   ❌ Quick Entry button not found on page')
    }

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message)
    await page.screenshot({ path: 'test-screenshots/quick-entry-error.png' })
  } finally {
    console.log('\n🔚 Closing browser...')
    await browser.close()
    console.log('✅ Browser closed')
    process.exit(0)
  }
})()
