/**
 * Cache Refresh API Testing Script
 * Tests cache invalidation by verifying revalidatePath() calls in API responses
 *
 * Author: Maurice Rondeau
 * Date: November 20, 2025
 */

import { readFile, readdir, stat } from 'fs/promises'
import { join } from 'path'

const testResults = {
  passed: [],
  failed: [],
  warnings: []
}

// Recursive directory walker to replace glob
async function getAllFiles(dir, pattern = /\.tsx?$/) {
  const results = []
  const entries = await readdir(dir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = join(dir, entry.name)

    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.next') {
        results.push(...await getAllFiles(fullPath, pattern))
      }
    } else if (pattern.test(entry.name)) {
      results.push(fullPath)
    }
  }

  return results
}

function logResult(category, test, passed, details = '') {
  const status = passed ? '✅ PASS' : '❌ FAIL'
  console.log(`${status} [${category}] ${test}${details ? ': ' + details : ''}`)

  if (passed) {
    testResults.passed.push(`${category}: ${test}`)
  } else {
    testResults.failed.push(`${category}: ${test} - ${details}`)
  }
}

function logWarning(category, test, message) {
  console.log(`⚠️  WARN [${category}] ${test}: ${message}`)
  testResults.warnings.push(`${category}: ${test} - ${message}`)
}

async function checkFileForCacheInvalidation(filePath) {
  const content = await readFile(filePath, 'utf-8')

  const hasMutations = /export\s+(async\s+)?function\s+(POST|PUT|DELETE|PATCH)/g.test(content) ||
    /export\s+const\s+(POST|PUT|DELETE|PATCH)\s*=/g.test(content)

  if (!hasMutations) {
    return { hasMutations: false }
  }

  const hasRevalidatePath = content.includes('revalidatePath')
  const hasImport = content.includes("from 'next/cache'") || content.includes('from "next/cache"')

  return {
    hasMutations: true,
    hasRevalidatePath,
    hasImport,
    filePath
  }
}

async function checkComponentForRouterRefresh(filePath) {
  const content = await readFile(filePath, 'utf-8')

  // Check if it's a client component
  const isClientComponent = content.includes("'use client'") || content.includes('"use client"')

  if (!isClientComponent) {
    return { isClientComponent: false }
  }

  // Check for form submissions or mutations
  const hasMutations = /onSubmit|handleSubmit|fetch.*method.*POST|fetch.*method.*PUT|fetch.*method.*DELETE/gi.test(content)

  if (!hasMutations) {
    return { isClientComponent: true, hasMutations: false }
  }

  const hasRouterRefresh = /router\.refresh\(\)/g.test(content)
  const hasRouterImport = content.includes("from 'next/navigation'") || content.includes('from "next/navigation"')
  const hasUseRouter = /const\s+router\s*=\s*useRouter\(\)/g.test(content)

  return {
    isClientComponent: true,
    hasMutations: true,
    hasRouterRefresh,
    hasRouterImport,
    hasUseRouter,
    filePath
  }
}

async function testAPIRoutes() {
  console.log('\n📋 Testing API Routes for Cache Invalidation')
  console.log('='.repeat(80))

  const apiRoutes = await getAllFiles('app/api', /route\.ts$/)

  for (const route of apiRoutes) {
    const result = await checkFileForCacheInvalidation(route)

    if (!result.hasMutations) {
      continue // Skip read-only routes (GET only)
    }

    const routeName = route.replace('app/api/', '').replace('/route.ts', '')

    if (result.hasRevalidatePath && result.hasImport) {
      logResult('API Routes', routeName, true, 'Has revalidatePath() with import')
    } else if (result.hasRevalidatePath && !result.hasImport) {
      logResult('API Routes', routeName, false, 'Has revalidatePath() but missing import')
    } else {
      logResult('API Routes', routeName, false, 'Missing revalidatePath() call')
    }
  }
}

async function testPortalComponents() {
  console.log('\n📋 Testing Portal Components for router.refresh()')
  console.log('='.repeat(80))

  const components = await getAllFiles('components/portal', /\.tsx$/)
  const pages = await getAllFiles('app/portal', /\.tsx$/)

  const allFiles = [...components, ...pages]

  for (const file of allFiles) {
    const result = await checkComponentForRouterRefresh(file)

    if (!result.isClientComponent) {
      continue // Skip server components
    }

    if (!result.hasMutations) {
      continue // Skip components without mutations
    }

    const fileName = file.replace('components/portal/', '').replace('app/portal/', '')

    if (result.hasRouterRefresh && result.hasRouterImport && result.hasUseRouter) {
      logResult('Portal Components', fileName, true, 'Has router.refresh() with proper setup')
    } else if (result.hasRouterRefresh && !result.hasRouterImport) {
      logResult('Portal Components', fileName, false, 'Has router.refresh() but missing import')
    } else if (result.hasRouterRefresh && !result.hasUseRouter) {
      logResult('Portal Components', fileName, false, 'Has router.refresh() but missing useRouter hook')
    } else {
      logResult('Portal Components', fileName, false, 'Missing router.refresh() call')
    }
  }
}

async function testAdminPages() {
  console.log('\n📋 Testing Admin Pages for Proper Refresh Pattern')
  console.log('='.repeat(80))

  const pages = await getAllFiles('app/dashboard', /\.tsx$/)

  for (const file of pages) {
    const content = await readFile(file, 'utf-8')

    // Check for window.location.reload (bad pattern)
    if (content.includes('window.location.reload')) {
      const fileName = file.replace('app/dashboard/', '')
      logWarning('Admin Pages', fileName, 'Uses window.location.reload() - should use router.refresh()')
    }
  }
}

async function verifySpecificFixes() {
  console.log('\n📋 Verifying Specific Fixes from Implementation')
  console.log('='.repeat(80))

  // Verify specific files that were modified

  // 1. Check /app/api/pilots/route.ts
  const pilotsRoute = await readFile('app/api/pilots/route.ts', 'utf-8')
  const hasPilotsRevalidate = pilotsRoute.includes("revalidatePath('/dashboard/pilots')") &&
    pilotsRoute.includes("revalidatePath('/dashboard')")
  logResult('Specific Fixes', 'app/api/pilots/route.ts POST', hasPilotsRevalidate,
    hasPilotsRevalidate ? 'Has proper revalidatePath()' : 'Missing expected revalidatePath()')

  // 2. Check /app/api/pilots/[id]/route.ts
  const pilotIdRoute = await readFile('app/api/pilots/[id]/route.ts', 'utf-8')
  const hasPilotIdRevalidate = pilotIdRoute.includes("revalidatePath('/dashboard/pilots')") &&
    pilotIdRoute.includes("revalidatePath(`/dashboard/pilots/${pilotId}`)")
  logResult('Specific Fixes', 'app/api/pilots/[id]/route.ts PUT/DELETE', hasPilotIdRevalidate,
    hasPilotIdRevalidate ? 'Has proper revalidatePath()' : 'Missing expected revalidatePath()')

  // 3. Check /app/api/leave-requests/route.ts
  const leaveRoute = await readFile('app/api/leave-requests/route.ts', 'utf-8')
  const hasLeaveRevalidate = leaveRoute.includes("revalidatePath('/dashboard/leave-requests')") &&
    leaveRoute.includes("revalidatePath('/dashboard/requests')")
  logResult('Specific Fixes', 'app/api/leave-requests/route.ts POST', hasLeaveRevalidate,
    hasLeaveRevalidate ? 'Has proper revalidatePath()' : 'Missing expected revalidatePath()')

  // 4. Check /components/portal/leave-request-form.tsx
  const leaveForm = await readFile('components/portal/leave-request-form.tsx', 'utf-8')
  const hasLeaveFormRefresh = leaveForm.includes('router.refresh()') &&
    leaveForm.includes('setTimeout')
  logResult('Specific Fixes', 'components/portal/leave-request-form.tsx', hasLeaveFormRefresh,
    hasLeaveFormRefresh ? 'Has router.refresh() with delay' : 'Missing expected pattern')

  // 5. Check /app/dashboard/certifications/page.tsx (should NOT have window.location.reload)
  const certPage = await readFile('app/dashboard/certifications/page.tsx', 'utf-8')
  const noWindowReload = !certPage.includes('window.location.reload')
  logResult('Specific Fixes', 'app/dashboard/certifications/page.tsx', noWindowReload,
    noWindowReload ? 'No window.location.reload() found' : 'Still has window.location.reload()')

  // 6. Check /app/api/certifications/[id]/route.ts (should already be good)
  const certRoute = await readFile('app/api/certifications/[id]/route.ts', 'utf-8')
  const hasCertRevalidate = certRoute.includes("revalidatePath('/dashboard/certifications')") &&
    certRoute.includes("revalidatePath(`/dashboard/certifications/${id}`)")
  logResult('Specific Fixes', 'app/api/certifications/[id]/route.ts PUT', hasCertRevalidate,
    hasCertRevalidate ? 'Has comprehensive revalidatePath()' : 'Missing expected revalidatePath()')
}

async function runTests() {
  console.log('🚀 Starting Cache Refresh API Verification Tests\n')
  console.log('=' .repeat(80))

  try {
    await testAPIRoutes()
    await testPortalComponents()
    await testAdminPages()
    await verifySpecificFixes()

    // Print Summary
    console.log('\n' + '='.repeat(80))
    console.log('TEST SUMMARY')
    console.log('='.repeat(80))
    console.log(`✅ Passed: ${testResults.passed.length}`)
    console.log(`❌ Failed: ${testResults.failed.length}`)
    console.log(`⚠️  Warnings: ${testResults.warnings.length}`)
    console.log(`📊 Total: ${testResults.passed.length + testResults.failed.length}`)

    if (testResults.failed.length > 0) {
      console.log('\n❌ Failed Tests:')
      testResults.failed.forEach(test => console.log(`  - ${test}`))
    }

    if (testResults.warnings.length > 0) {
      console.log('\n⚠️  Warnings:')
      testResults.warnings.forEach(warning => console.log(`  - ${warning}`))
    }

    console.log('\n' + '='.repeat(80))

    if (testResults.failed.length === 0) {
      console.log('✅ All cache invalidation patterns are correctly implemented!')
    } else {
      console.log('❌ Some cache invalidation patterns need attention')
    }

  } catch (error) {
    console.error('\n❌ Test execution failed:', error.message)
    console.error(error.stack)
    process.exit(1)
  }

  process.exit(testResults.failed.length > 0 ? 1 : 0)
}

// Run tests
runTests().catch(console.error)
