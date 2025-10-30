/**
 * Simple Login Debug Test
 * Helps identify issues with the login flow
 */

import puppeteer from 'puppeteer'

const CONFIG = {
  BASE_URL: 'http://localhost:3000',
  PILOT_EMAIL: 'mrondeau@airniugini.com.pg',
  PILOT_PASSWORD: 'Lemakot@1972'
}

async function debugLogin() {
  console.log('🔍 Starting Login Debug Test...\n')

  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 100,
    args: ['--window-size=1920,1080']
  })

  const page = await browser.newPage()
  await page.setViewport({ width: 1920, height: 1080 })

  // Log all console messages
  page.on('console', msg => {
    console.log('BROWSER LOG:', msg.type(), msg.text())
  })

  // Log all network requests
  page.on('request', request => {
    if (request.url().includes('portal')) {
      console.log('REQUEST:', request.method(), request.url())
    }
  })

  // Log all responses
  page.on('response', response => {
    if (response.url().includes('portal')) {
      console.log('RESPONSE:', response.status(), response.url())
    }
  })

  try {
    // Step 1: Navigate to login page
    console.log('📍 Step 1: Navigating to login page...')
    await page.goto(`${CONFIG.BASE_URL}/portal/login`, {
      waitUntil: 'networkidle2',
      timeout: 10000
    })

    console.log('✅ Page loaded')
    console.log('Current URL:', page.url())
    console.log('Page title:', await page.title())

    // Take screenshot of login page
    await page.screenshot({ path: 'debug-login-page.png', fullPage: true })
    console.log('📸 Screenshot saved: debug-login-page.png')

    // Step 2: Analyze page structure
    console.log('\n📍 Step 2: Analyzing page structure...')
    const pageStructure = await page.evaluate(() => {
      return {
        hasEmailInput: !!document.querySelector('input[type="email"]'),
        hasPasswordInput: !!document.querySelector('input[type="password"]'),
        hasSubmitButton: !!document.querySelector('button[type="submit"]'),
        allInputs: Array.from(document.querySelectorAll('input')).map(input => ({
          type: input.type,
          name: input.name,
          id: input.id,
          placeholder: input.placeholder
        })),
        allButtons: Array.from(document.querySelectorAll('button')).map(btn => ({
          type: btn.type,
          text: btn.textContent.trim()
        })),
        headings: Array.from(document.querySelectorAll('h1, h2, h3')).map(h => h.textContent.trim()),
        forms: document.querySelectorAll('form').length
      }
    })

    console.log('\nPage Structure Analysis:')
    console.log('Has email input:', pageStructure.hasEmailInput)
    console.log('Has password input:', pageStructure.hasPasswordInput)
    console.log('Has submit button:', pageStructure.hasSubmitButton)
    console.log('Number of forms:', pageStructure.forms)
    console.log('\nAll inputs found:')
    pageStructure.allInputs.forEach((input, i) => {
      console.log(`  ${i + 1}. Type: ${input.type}, Name: ${input.name || 'N/A'}, ID: ${input.id || 'N/A'}, Placeholder: ${input.placeholder || 'N/A'}`)
    })
    console.log('\nAll buttons found:')
    pageStructure.allButtons.forEach((btn, i) => {
      console.log(`  ${i + 1}. Type: ${btn.type}, Text: "${btn.text}"`)
    })
    console.log('\nHeadings:')
    pageStructure.headings.forEach(h => console.log(`  - ${h}`))

    // Step 3: Try to login if elements exist
    if (pageStructure.hasEmailInput && pageStructure.hasPasswordInput && pageStructure.hasSubmitButton) {
      console.log('\n📍 Step 3: Attempting login...')

      // Fill email
      await page.waitForSelector('input[type="email"]', { timeout: 5000 })
      await page.type('input[type="email"]', CONFIG.PILOT_EMAIL, { delay: 50 })
      console.log('✅ Email entered:', CONFIG.PILOT_EMAIL)

      // Fill password
      await page.waitForSelector('input[type="password"]', { timeout: 5000 })
      await page.type('input[type="password"]', CONFIG.PILOT_PASSWORD, { delay: 50 })
      console.log('✅ Password entered: ********')

      // Take screenshot before submit
      await page.screenshot({ path: 'debug-before-submit.png', fullPage: true })
      console.log('📸 Screenshot saved: debug-before-submit.png')

      // Click submit
      console.log('🖱️  Clicking submit button...')
      await page.click('button[type="submit"]')

      // Wait for navigation or error
      try {
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 })
        console.log('✅ Navigation occurred')
        console.log('New URL:', page.url())

        // Take screenshot after login
        await page.screenshot({ path: 'debug-after-login.png', fullPage: true })
        console.log('📸 Screenshot saved: debug-after-login.png')

        if (page.url().includes('/portal/dashboard')) {
          console.log('🎉 SUCCESS! Logged in successfully!')
        } else {
          console.log('⚠️  Redirected but not to dashboard')
        }
      } catch (error) {
        console.log('⚠️  No navigation occurred or timeout')
        console.log('Still at:', page.url())

        // Check for error messages
        const errorMessages = await page.evaluate(() => {
          const errors = []
          // Check for common error selectors
          document.querySelectorAll('[role="alert"], .error, .text-red-500, .text-destructive').forEach(el => {
            errors.push(el.textContent.trim())
          })
          return errors
        })

        if (errorMessages.length > 0) {
          console.log('Error messages found:')
          errorMessages.forEach(msg => console.log(`  - ${msg}`))
        }

        await page.screenshot({ path: 'debug-login-error.png', fullPage: true })
        console.log('📸 Screenshot saved: debug-login-error.png')
      }
    } else {
      console.log('\n❌ Login form elements not found!')
      console.log('Cannot proceed with login test')
    }

    // Keep browser open for inspection
    console.log('\n⏳ Keeping browser open for 10 seconds for inspection...')
    await new Promise(resolve => setTimeout(resolve, 10000))

  } catch (error) {
    console.error('\n❌ Error during test:', error.message)
    console.error(error.stack)
    await page.screenshot({ path: 'debug-critical-error.png', fullPage: true })
  } finally {
    await browser.close()
    console.log('\n✅ Test complete')
  }
}

debugLogin().catch(console.error)
