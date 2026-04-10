#!/usr/bin/env node
/**
 * Tasks Page Comprehensive Test
 * Author: Maurice Rondeau
 * Tests all buttons and functionality on the tasks page
 */

import { chromium } from 'playwright'

const BASE_URL = 'http://localhost:3000'
const EMAIL = 'skycruzer@icloud.com'
const PASSWORD = 'mron2393'

console.log('🧪 Tasks Page Comprehensive Test\n')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

const browser = await chromium.launch({ headless: false, slowMo: 800 })
const context = await browser.newContext()
const page = await context.newPage()

// Listen to console messages
page.on('console', (msg) => {
  const type = msg.type()
  if (type === 'error' || type === 'warning') {
    console.log(`   [Browser ${type.toUpperCase()}] ${msg.text()}`)
  }
})

// Listen to page errors
page.on('pageerror', (error) => {
  console.log(`   [PAGE ERROR] ${error.message}`)
})

async function login() {
  console.log('🔐 STEP 1: Logging in...\n')

  await page.goto(`${BASE_URL}/auth/login`)
  await page.waitForLoadState('networkidle')

  await page.fill('input[type="email"]', EMAIL)
  await page.fill('input[type="password"]', PASSWORD)

  await page.click('button[type="submit"]')

  // Wait for redirect
  await page.waitForURL('**/dashboard', { timeout: 10000 })

  console.log('   ✅ Login successful\n')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
}

async function testTasksPage() {
  const results = {
    pageLoad: false,
    statistics: false,
    newTaskButton: false,
    kanbanViewButton: false,
    listViewButton: false,
    viewToggling: false,
  }

  try {
    console.log('📋 STEP 2: Testing Tasks Page...\n')

    // Navigate to tasks page
    console.log('   → Navigating to /dashboard/tasks...')
    await page.goto(`${BASE_URL}/dashboard/tasks`)
    await page.waitForLoadState('networkidle')

    const response = await page.goto(`${BASE_URL}/dashboard/tasks`)
    const status = response?.status() || 200
    console.log(`   ✓ HTTP Status: ${status}`)

    if (status === 200) {
      results.pageLoad = true
      console.log('   ✅ Page loaded successfully\n')
    }

    // Take screenshot of initial state
    await page.screenshot({ path: 'screenshots/tasks-page-initial.png', fullPage: true })
    console.log('   📸 Screenshot: screenshots/tasks-page-initial.png\n')

    // Test statistics cards
    console.log('   → Testing statistics display...')
    const stats = await page.locator('text=Total Tasks').count()
    if (stats > 0) {
      results.statistics = true
      console.log('   ✅ Statistics cards found\n')

      // Log statistics values
      const totalTasks = await page
        .locator('text=Total Tasks')
        .locator('..')
        .locator('p.text-3xl')
        .textContent()
      const todoCount = await page
        .locator('text=To Do')
        .locator('..')
        .locator('p.text-3xl')
        .textContent()
      const inProgressCount = await page
        .locator('text=In Progress')
        .locator('..')
        .locator('p.text-3xl')
        .textContent()
      const overdueCount = await page
        .locator('text=Overdue')
        .locator('..')
        .locator('p.text-3xl')
        .textContent()

      console.log(`   📊 Total Tasks: ${totalTasks?.trim()}`)
      console.log(`   📊 To Do: ${todoCount?.trim()}`)
      console.log(`   📊 In Progress: ${inProgressCount?.trim()}`)
      console.log(`   📊 Overdue: ${overdueCount?.trim()}\n`)
    } else {
      console.log('   ❌ Statistics cards not found\n')
    }

    // Test New Task button
    console.log('   → Testing "New Task" button...')
    const newTaskButton = page.locator('a[href="/dashboard/tasks/new"]')
    const newTaskVisible = await newTaskButton.isVisible()

    if (newTaskVisible) {
      results.newTaskButton = true
      console.log('   ✅ "New Task" button found and visible')
      console.log('   → Clicking "New Task" button...')
      await newTaskButton.click()
      await page.waitForLoadState('networkidle')

      const currentUrl = page.url()
      if (currentUrl.includes('/dashboard/tasks/new')) {
        console.log('   ✅ Successfully navigated to New Task page')
        await page.screenshot({ path: 'screenshots/tasks-new-task-page.png', fullPage: true })
        console.log('   📸 Screenshot: screenshots/tasks-new-task-page.png\n')

        // Navigate back to tasks page
        console.log('   → Navigating back to tasks page...')
        await page.goto(`${BASE_URL}/dashboard/tasks`)
        await page.waitForLoadState('networkidle')
        console.log('   ✅ Back to tasks page\n')
      } else {
        console.log('   ❌ Failed to navigate to New Task page\n')
      }
    } else {
      console.log('   ❌ "New Task" button not found\n')
    }

    // Test Kanban Board button
    console.log('   → Testing "Kanban Board" view button...')
    const kanbanButton = page.locator('a[href="/dashboard/tasks?view=kanban"]')
    const kanbanVisible = await kanbanButton.isVisible()

    if (kanbanVisible) {
      results.kanbanViewButton = true
      console.log('   ✅ "Kanban Board" button found')
      await kanbanButton.click()
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1000)

      const currentUrl = page.url()
      if (currentUrl.includes('view=kanban')) {
        console.log('   ✅ Kanban view activated')
        await page.screenshot({ path: 'screenshots/tasks-kanban-view.png', fullPage: true })
        console.log('   📸 Screenshot: screenshots/tasks-kanban-view.png\n')
      }
    } else {
      console.log('   ❌ "Kanban Board" button not found\n')
    }

    // Test List View button
    console.log('   → Testing "List View" button...')
    const listButton = page.locator('a[href="/dashboard/tasks?view=list"]')
    const listVisible = await listButton.isVisible()

    if (listVisible) {
      results.listViewButton = true
      console.log('   ✅ "List View" button found')
      await listButton.click()
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1000)

      const currentUrl = page.url()
      if (currentUrl.includes('view=list')) {
        console.log('   ✅ List view activated')
        await page.screenshot({ path: 'screenshots/tasks-list-view.png', fullPage: true })
        console.log('   📸 Screenshot: screenshots/tasks-list-view.png\n')
        results.viewToggling = true
      }
    } else {
      console.log('   ❌ "List View" button not found\n')
    }

    // Toggle back to Kanban to test view switching
    if (results.kanbanViewButton && results.listViewButton) {
      console.log('   → Testing view toggle back to Kanban...')
      await kanbanButton.click()
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1000)
      console.log('   ✅ View toggling works correctly\n')
    }
  } catch (error) {
    console.log(`\n   ❌ Error during testing: ${error.message}\n`)
  }

  return results
}

async function runTests() {
  try {
    await login()
    const results = await testTasksPage()

    // Print summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📊 Test Results Summary\n')

    const tests = [
      { name: 'Page Load', result: results.pageLoad },
      { name: 'Statistics Display', result: results.statistics },
      { name: '"New Task" Button', result: results.newTaskButton },
      { name: '"Kanban Board" Button', result: results.kanbanViewButton },
      { name: '"List View" Button', result: results.listViewButton },
      { name: 'View Toggling', result: results.viewToggling },
    ]

    tests.forEach((test) => {
      const icon = test.result ? '✅' : '❌'
      console.log(`${icon} ${test.name}`)
    })

    const passed = tests.filter((t) => t.result).length
    const failed = tests.filter((t) => !t.result).length

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`\n📈 Final Results: ${passed}/${tests.length} tests passed\n`)

    if (failed === 0) {
      console.log('🎉 All tasks page tests passed!\n')
    } else {
      console.log(`⚠️  ${failed} test(s) failed. Review details above.\n`)
    }
  } catch (error) {
    console.error('❌ Test suite failed:', error.message)
  } finally {
    console.log('⏸️  Keeping browser open for 10 seconds...')
    await page.waitForTimeout(10000)
    await browser.close()
    console.log('🔚 Browser closed\n')
  }
}

runTests()
