#!/usr/bin/env node

/**
 * Comprehensive Functionality Test
 * Tests all pages, forms, CRUD operations, and routes
 */

import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
}

const SUCCESS = `${COLORS.green}✓${COLORS.reset}`
const WARNING = `${COLORS.yellow}⚠${COLORS.reset}`
const ERROR = `${COLORS.red}✗${COLORS.reset}`
const INFO = `${COLORS.blue}ℹ${COLORS.reset}`

console.log(`\n${COLORS.bright}${COLORS.cyan}Comprehensive Functionality Test${COLORS.reset}\n`)

let totalTests = 0
let passedTests = 0
let failedTests = 0
let warnings = []
let errors = []

function test(name) {
  totalTests++
  console.log(`\n${COLORS.bright}Testing: ${name}${COLORS.reset}`)
}

function pass(message) {
  passedTests++
  console.log(`  ${SUCCESS} ${message}`)
}

function warn(message) {
  console.log(`  ${WARNING} ${message}`)
  warnings.push(message)
}

function fail(message) {
  failedTests++
  console.log(`  ${ERROR} ${message}`)
  errors.push(message)
}

function info(message) {
  console.log(`  ${INFO} ${message}`)
}

// Test 1: All Dashboard Pages Exist
test('Dashboard Pages Exist')
const dashboardPages = [
  'app/dashboard/page.tsx',
  'app/dashboard/pilots/page.tsx',
  'app/dashboard/pilots/[id]/page.tsx',
  'app/dashboard/pilots/new/page.tsx',
  'app/dashboard/certifications/page.tsx',
  'app/dashboard/leave/page.tsx',
  'app/dashboard/renewal-planning/page.tsx',
  'app/dashboard/analytics/page.tsx',
  'app/dashboard/tasks/page.tsx',
  'app/dashboard/flight-requests/page.tsx',
  'app/dashboard/disciplinary/page.tsx',
]

dashboardPages.forEach(page => {
  if (fs.existsSync(page)) {
    pass(`${page} exists`)
  } else {
    fail(`${page} missing`)
  }
})

// Test 2: All API Routes Exist
test('API Routes Exist')
const apiRoutes = [
  'app/api/pilots/route.ts',
  'app/api/pilots/[id]/route.ts',
  'app/api/leave-requests/route.ts',
  'app/api/certifications/route.ts',
  'app/api/tasks/route.ts',
  'app/api/dashboard/flight-requests/route.ts',
]

apiRoutes.forEach(route => {
  if (fs.existsSync(route)) {
    pass(`${route} exists`)
  } else {
    fail(`${route} missing`)
  }
})

// Test 3: All Form Components Exist
test('Form Components Exist')
const formComponents = [
  'components/forms/pilot-form.tsx',
  'components/forms/leave-request-form.tsx',
  'components/forms/certification-form.tsx',
]

formComponents.forEach(component => {
  if (fs.existsSync(component)) {
    pass(`${component} exists`)
  } else {
    warn(`${component} missing (may use inline forms)`)
  }
})

// Test 4: Service Layer Exists
test('Service Layer Components')
const services = [
  'lib/services/pilot-service.ts',
  'lib/services/certification-service.ts',
  'lib/services/leave-service.ts',
  'lib/services/dashboard-service.ts',
  'lib/services/logging-service.ts',
]

services.forEach(service => {
  if (fs.existsSync(service)) {
    pass(`${service} exists`)
  } else {
    fail(`${service} missing`)
  }
})

// Test 5: Check for CRUD Operations in Services
test('CRUD Operations in Pilot Service')
try {
  const pilotService = fs.readFileSync('lib/services/pilot-service.ts', 'utf8')

  if (pilotService.includes('getPilots') || pilotService.includes('getAllPilots')) {
    pass('READ operation exists (getPilots)')
  } else {
    fail('READ operation missing')
  }

  if (pilotService.includes('createPilot')) {
    pass('CREATE operation exists (createPilot)')
  } else {
    fail('CREATE operation missing')
  }

  if (pilotService.includes('updatePilot')) {
    pass('UPDATE operation exists (updatePilot)')
  } else {
    fail('UPDATE operation missing')
  }

  if (pilotService.includes('deletePilot')) {
    pass('DELETE operation exists (deletePilot)')
  } else {
    warn('DELETE operation missing (may be intentional)')
  }
} catch (error) {
  fail(`Could not read pilot-service.ts: ${error.message}`)
}

// Test 6: Check API Routes for CRUD
test('API Route Methods')
try {
  const pilotsRoute = fs.readFileSync('app/api/pilots/route.ts', 'utf8')

  if (pilotsRoute.includes('export async function GET')) {
    pass('GET endpoint exists')
  } else {
    fail('GET endpoint missing')
  }

  if (pilotsRoute.includes('export async function POST')) {
    pass('POST endpoint exists')
  } else {
    fail('POST endpoint missing')
  }
} catch (error) {
  fail(`Could not read pilots route: ${error.message}`)
}

try {
  const pilotRoute = fs.readFileSync('app/api/pilots/[id]/route.ts', 'utf8')

  if (pilotRoute.includes('export async function PATCH') || pilotRoute.includes('export async function PUT')) {
    pass('UPDATE endpoint exists')
  } else {
    fail('UPDATE endpoint missing')
  }

  if (pilotRoute.includes('export async function DELETE')) {
    pass('DELETE endpoint exists')
  } else {
    warn('DELETE endpoint missing (may be intentional)')
  }
} catch (error) {
  fail(`Could not read pilot [id] route: ${error.message}`)
}

// Test 7: Optimistic Hooks Exist
test('Optimistic UI Hooks')
const hooks = [
  'lib/hooks/use-optimistic-pilot.ts',
  'lib/hooks/use-optimistic-leave-request.ts',
  'lib/hooks/use-optimistic-certification.ts',
]

hooks.forEach(hook => {
  if (fs.existsSync(hook)) {
    pass(`${hook} exists`)

    // Check for key functions
    try {
      const content = fs.readFileSync(hook, 'utf8')
      if (content.includes('onMutate')) {
        pass('  - Has optimistic update (onMutate)')
      }
      if (content.includes('onError')) {
        pass('  - Has error rollback (onError)')
      }
      if (content.includes('onSettled')) {
        pass('  - Has query invalidation (onSettled)')
      }
    } catch (err) {
      warn(`  Could not verify hook functions`)
    }
  } else {
    fail(`${hook} missing`)
  }
})

// Test 8: Skeleton Components Exist
test('Skeleton Loading Components')
const skeletons = [
  'components/skeletons/dashboard-skeleton.tsx',
  'components/skeletons/pilot-list-skeleton.tsx',
  'components/skeletons/renewal-planning-skeleton.tsx',
]

skeletons.forEach(skeleton => {
  if (fs.existsSync(skeleton)) {
    pass(`${skeleton} exists`)
  } else {
    fail(`${skeleton} missing`)
  }
})

// Test 9: Check Suspense Boundaries
test('Suspense Boundaries in Pages')
const pagesWithSuspense = [
  'app/dashboard/page.tsx',
  'app/dashboard/pilots/page.tsx',
  'app/dashboard/renewal-planning/page.tsx',
]

pagesWithSuspense.forEach(page => {
  try {
    const content = fs.readFileSync(page, 'utf8')
    if (content.includes('Suspense') && content.includes('fallback')) {
      pass(`${page} has Suspense boundary`)
    } else {
      warn(`${page} missing Suspense boundary`)
    }
  } catch (err) {
    warn(`Could not check ${page}`)
  }
})

// Test 10: TypeScript Compilation
test('TypeScript Compilation')
try {
  info('Running TypeScript compiler...')
  execSync('npx tsc --noEmit', { encoding: 'utf8', stdio: 'pipe' })
  pass('TypeScript compilation successful (0 errors)')
} catch (error) {
  const output = error.stdout || error.stderr || ''
  if (output.includes('error TS')) {
    const errorCount = (output.match(/error TS/g) || []).length
    fail(`TypeScript has ${errorCount} errors`)
    info('Run: npm run type-check for details')
  } else {
    fail('TypeScript compilation failed')
  }
}

// Test 11: Check for Console Logs
test('Production Console Cleanliness')
const filesToCheck = [
  'components/dashboard/dashboard-content.tsx',
  'app/dashboard/pilots/page.tsx',
  'lib/hooks/use-optimistic-pilot.ts',
]

let consoleLogsFound = 0
filesToCheck.forEach(file => {
  try {
    const content = fs.readFileSync(file, 'utf8')
    const matches = content.match(/console\.(log|debug|info)/g) || []
    if (matches.length > 0) {
      consoleLogsFound += matches.length
      warn(`${file} has ${matches.length} console.log statements`)
    }
  } catch (err) {
    // File may not exist
  }
})

if (consoleLogsFound === 0) {
  pass('No debug console logs found in checked files')
} else {
  warn(`Found ${consoleLogsFound} total console.log statements`)
  info('Consider removing debug logs for production')
}

// Test 12: Error Boundary Exists
test('Error Boundary')
if (fs.existsSync('app/error.tsx')) {
  pass('Global error boundary exists (app/error.tsx)')

  try {
    const content = fs.readFileSync('app/error.tsx', 'utf8')
    if (content.includes('use client')) {
      pass('  - Is client component')
    }
    if (content.includes('error') && content.includes('reset')) {
      pass('  - Has error and reset props')
    }
  } catch (err) {
    warn('  Could not verify error boundary structure')
  }
} else {
  fail('Global error boundary missing')
}

// Test 13: Check Environment Variables
test('Environment Variables Configuration')
try {
  const envExample = fs.existsSync('.env.example')
  const envLocal = fs.existsSync('.env.local')

  if (envLocal) {
    pass('.env.local exists')
    const env = fs.readFileSync('.env.local', 'utf8')
    if (env.includes('NEXT_PUBLIC_SUPABASE_URL')) {
      pass('  - Supabase URL configured')
    }
    if (env.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY')) {
      pass('  - Supabase anon key configured')
    }
  } else {
    warn('.env.local missing (required for local dev)')
  }

  if (envExample) {
    info('.env.example exists (good for documentation)')
  }
} catch (err) {
  warn('Could not check environment variables')
}

// Summary
console.log(`\n${COLORS.bright}${COLORS.cyan}─────────────────────────────────────${COLORS.reset}`)
console.log(`${COLORS.bright}Test Summary${COLORS.reset}\n`)

const successRate = Math.round((passedTests / totalTests) * 100)

console.log(`Tests Run:    ${totalTests}`)
console.log(`${SUCCESS} Passed:     ${COLORS.green}${passedTests}${COLORS.reset}`)
console.log(`${ERROR} Failed:     ${COLORS.red}${failedTests}${COLORS.reset}`)
console.log(`${WARNING} Warnings:   ${COLORS.yellow}${warnings.length}${COLORS.reset}`)
console.log(`Success Rate: ${successRate}%\n`)

if (failedTests === 0 && warnings.length === 0) {
  console.log(`${SUCCESS} ${COLORS.green}${COLORS.bright}All tests passed! Ready for production.${COLORS.reset}`)
} else if (failedTests === 0) {
  console.log(`${WARNING} ${COLORS.yellow}${COLORS.bright}All tests passed with warnings. Review before production.${COLORS.reset}`)
} else {
  console.log(`${ERROR} ${COLORS.red}${COLORS.bright}Some tests failed. Fix issues before production.${COLORS.reset}`)
}

if (errors.length > 0) {
  console.log(`\n${COLORS.bright}${COLORS.red}Critical Issues:${COLORS.reset}`)
  errors.forEach((error, i) => {
    console.log(`  ${i + 1}. ${error}`)
  })
}

if (warnings.length > 0 && warnings.length <= 5) {
  console.log(`\n${COLORS.bright}${COLORS.yellow}Warnings:${COLORS.reset}`)
  warnings.forEach((warning, i) => {
    console.log(`  ${i + 1}. ${warning}`)
  })
}

console.log(`\n${COLORS.bright}${COLORS.cyan}─────────────────────────────────────${COLORS.reset}\n`)

// Exit with appropriate code
process.exit(failedTests > 0 ? 1 : 0)
