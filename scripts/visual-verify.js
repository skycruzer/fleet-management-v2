/* eslint-disable no-console */
/**
 * One-off visual verification pass for the design remediation.
 * Screenshots key pages in light/dark and desktop/mobile.
 * Run: node scripts/visual-verify.js
 */
const { chromium } = require('playwright')
const fs = require('fs')

const BASE = 'http://localhost:3000'
const OUT = 'screenshots/design-verify'
const ADMIN_EMAIL = process.env.VERIFY_EMAIL || ''
const ADMIN_PASSWORD = process.env.VERIFY_PASSWORD || ''

const PUBLIC_PAGES = [
  ['/', 'landing'],
  ['/auth/login', 'auth-login'],
  ['/portal/login?error=not_registered', 'portal-login-error'],
]

async function shoot(page, name) {
  await page.screenshot({
    path: `${OUT}/${name}.png`,
    animations: 'disabled',
    timeout: 30000,
  })
  console.log('saved', name)
}

async function run() {
  if (!ADMIN_EMAIL) console.log('No VERIFY_EMAIL set — authenticated pass will be skipped')
  fs.mkdirSync(OUT, { recursive: true })
  const browser = await chromium.launch()

  for (const [scheme, label] of [
    ['light', 'light'],
    ['dark', 'dark'],
  ]) {
    for (const [vp, vplabel] of [
      [{ width: 1280, height: 900 }, 'desktop'],
      [{ width: 375, height: 812 }, 'mobile'],
    ]) {
      const ctx = await browser.newContext({ viewport: vp, colorScheme: scheme })
      const page = await ctx.newPage()
      for (const [path, name] of PUBLIC_PAGES) {
        try {
          await page.goto(BASE + path, { waitUntil: 'load', timeout: 60000 })
          await page.waitForTimeout(1500)
          await shoot(page, `${name}-${label}-${vplabel}`)
        } catch (e) {
          console.log('FAILED', name, label, vplabel, e.message.split('\n')[0])
        }
      }
      await ctx.close()
    }
  }

  // Authenticated admin pass (light + dark, desktop) if credentials work
  for (const [scheme, label] of [
    ['light', 'light'],
    ['dark', 'dark'],
  ]) {
    const ctx = await browser.newContext({
      viewport: { width: 1280, height: 900 },
      colorScheme: scheme,
    })
    const page = await ctx.newPage()
    try {
      await page.goto(BASE + '/auth/login', { waitUntil: 'load', timeout: 60000 })
      await page.fill('#email', ADMIN_EMAIL)
      await page.fill('#password', ADMIN_PASSWORD)
      await page.click('button[type="submit"]')
      await page.waitForURL('**/dashboard**', { timeout: 20000 })
      await page.waitForTimeout(3000)
      await shoot(page, `dashboard-${label}-desktop`)
      for (const [path, name] of [
        ['/dashboard/certifications?filter=attention', 'certifications-attention'],
        ['/dashboard/requests', 'requests'],
        ['/dashboard/admin', 'admin'],
        ['/dashboard/audit', 'audit'],
      ]) {
        await page.goto(BASE + path, { waitUntil: 'load', timeout: 60000 })
        await page.waitForTimeout(2500)
        await shoot(page, `${name}-${label}-desktop`)
      }
    } catch (e) {
      console.log('AUTH PASS SKIPPED (' + label + '):', e.message.split('\n')[0])
    }
    await ctx.close()
  }

  await browser.close()
  console.log('done')
}

run()
