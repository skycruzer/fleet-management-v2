#!/usr/bin/env node

/**
 * Deployment Verification Script
 * Runs automated checks to verify Phase 0 deployment is successful
 */

import https from 'https'
import { execSync } from 'child_process'

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

console.log(`\n${COLORS.bright}${COLORS.cyan}Phase 0 Deployment Verification${COLORS.reset}\n`)

// Configuration
const PRODUCTION_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
const GITHUB_REPO = 'skycruzer/fleet-management-v2'
const TARGET_COMMIT = '051584e'

let passedChecks = 0
let totalChecks = 0
let warnings = []

function check(name) {
  totalChecks++
  console.log(`\n${COLORS.bright}Checking: ${name}${COLORS.reset}`)
}

function pass(message) {
  passedChecks++
  console.log(`  ${SUCCESS} ${message}`)
}

function warn(message) {
  console.log(`  ${WARNING} ${message}`)
  warnings.push(message)
}

function fail(message) {
  console.log(`  ${ERROR} ${message}`)
}

function info(message) {
  console.log(`  ${INFO} ${message}`)
}

// Check 1: Git Status
check('Git Repository Status')
try {
  const branch = execSync('git branch --show-current', { encoding: 'utf8' }).trim()
  const lastCommit = execSync('git log -1 --oneline', { encoding: 'utf8' }).trim()
  const hasUncommitted = execSync('git status --short', { encoding: 'utf8' }).trim()

  if (lastCommit.startsWith(TARGET_COMMIT)) {
    pass(`Latest commit matches: ${lastCommit}`)
  } else {
    warn(`Latest commit: ${lastCommit}`)
    info(`Expected: ${TARGET_COMMIT}`)
  }

  pass(`Current branch: ${branch}`)

  if (hasUncommitted) {
    const newDocs = hasUncommitted
      .split('\n')
      .filter((line) => line.includes('POST-DEPLOYMENT') || line.includes('BETTER-STACK'))
    if (newDocs.length > 0) {
      warn(`${newDocs.length} new documentation files uncommitted`)
      info('Run: git add docs/ && git commit -m "docs: add post-deployment guides"')
    }
  } else {
    pass('No uncommitted changes')
  }
} catch (error) {
  fail(`Git check failed: ${error.message}`)
}

// Check 2: Build Status
check('Production Build Verification')
try {
  info('Running production build test...')
  const buildOutput = execSync('npm run build 2>&1', { encoding: 'utf8', timeout: 60000 })

  if (buildOutput.includes('Compiled successfully')) {
    pass('Build compiles successfully')
  } else {
    fail('Build compilation issues detected')
  }

  if (buildOutput.includes('error TS')) {
    fail('TypeScript errors found')
  } else {
    pass('Zero TypeScript errors')
  }

  const bundleSizeMatch = buildOutput.match(/First Load JS.*?(\d+)\s*kB/i)
  if (bundleSizeMatch) {
    const size = parseInt(bundleSizeMatch[1])
    if (size <= 110) {
      pass(`Bundle size: ${size} kB (within target)`)
    } else {
      warn(`Bundle size: ${size} kB (exceeds 110 kB target)`)
    }
  }
} catch (error) {
  fail(`Build check failed: ${error.message}`)
}

// Check 3: Environment Variables
check('Environment Variables')
try {
  const envLocal = execSync('cat .env.local 2>/dev/null || echo ""', { encoding: 'utf8' })

  if (envLocal.includes('NEXT_PUBLIC_SUPABASE_URL')) {
    pass('Supabase URL configured')
  } else {
    fail('NEXT_PUBLIC_SUPABASE_URL missing')
  }

  if (envLocal.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY')) {
    pass('Supabase anon key configured')
  } else {
    fail('NEXT_PUBLIC_SUPABASE_ANON_KEY missing')
  }

  if (envLocal.includes('LOGTAIL_SOURCE_TOKEN')) {
    pass('Better Stack server token configured')
  } else {
    warn('LOGTAIL_SOURCE_TOKEN not found (Better Stack setup needed)')
  }

  if (envLocal.includes('NEXT_PUBLIC_LOGTAIL_SOURCE_TOKEN')) {
    pass('Better Stack client token configured')
  } else {
    warn('NEXT_PUBLIC_LOGTAIL_SOURCE_TOKEN not found (Better Stack setup needed)')
  }
} catch (error) {
  warn(`Environment check failed: ${error.message}`)
}

// Check 4: Phase 0 Files
check('Phase 0 Files Present')
const requiredFiles = [
  'components/skeletons/dashboard-skeleton.tsx',
  'components/skeletons/pilot-list-skeleton.tsx',
  'components/skeletons/renewal-planning-skeleton.tsx',
  'lib/services/logging-service.ts',
  'lib/hooks/use-optimistic-leave-request.ts',
  'lib/hooks/use-optimistic-pilot.ts',
  'lib/hooks/use-optimistic-certification.ts',
  'app/error.tsx',
  'docs/PHASE-0-COMPLETE.md',
  'docs/DEPLOYMENT-GUIDE.md',
]

let filesPresent = 0
requiredFiles.forEach((file) => {
  try {
    execSync(`test -f ${file}`, { encoding: 'utf8' })
    filesPresent++
  } catch {
    fail(`Missing: ${file}`)
  }
})

if (filesPresent === requiredFiles.length) {
  pass(`All ${requiredFiles.length} Phase 0 files present`)
} else {
  warn(`${filesPresent}/${requiredFiles.length} files present`)
}

// Check 5: Package Dependencies
check('Dependencies')
try {
  const packageJson = execSync('cat package.json', { encoding: 'utf8' })
  const pkg = JSON.parse(packageJson)

  if (pkg.dependencies['@logtail/node']) {
    pass('@logtail/node installed')
  } else {
    warn('@logtail/node not found (Better Stack logging will not work)')
  }

  if (pkg.dependencies['@logtail/browser']) {
    pass('@logtail/browser installed')
  } else {
    warn('@logtail/browser not found (Client logging will not work)')
  }

  if (pkg.dependencies['@tanstack/react-query']) {
    pass('@tanstack/react-query installed (optimistic UI support)')
  } else {
    fail('@tanstack/react-query missing (critical for optimistic UI)')
  }
} catch (error) {
  fail(`Dependencies check failed: ${error.message}`)
}

// Check 6: Documentation
check('Documentation')
const docFiles = [
  'docs/PHASE-0-COMPLETE.md',
  'docs/DEPLOYMENT-GUIDE.md',
  'docs/POST-DEPLOYMENT-VERIFICATION.md',
  'docs/BETTER-STACK-SETUP.md',
]

let docsPresent = 0
docFiles.forEach((file) => {
  try {
    execSync(`test -f ${file}`, { encoding: 'utf8' })
    docsPresent++
  } catch {
    warn(`Missing: ${file}`)
  }
})

if (docsPresent === docFiles.length) {
  pass(`All ${docFiles.length} documentation files present`)
} else {
  warn(`${docsPresent}/${docFiles.length} documentation files present`)
}

// Summary
console.log(`\n${COLORS.bright}${COLORS.cyan}─────────────────────────────────────${COLORS.reset}`)
console.log(`${COLORS.bright}Verification Summary${COLORS.reset}\n`)

const percentage = Math.round((passedChecks / totalChecks) * 100)

if (percentage === 100) {
  console.log(
    `${SUCCESS} ${COLORS.green}${COLORS.bright}All checks passed! (${passedChecks}/${totalChecks})${COLORS.reset}`
  )
  console.log(`\n${COLORS.green}✓ Phase 0 is ready for production deployment${COLORS.reset}`)
} else if (percentage >= 80) {
  console.log(
    `${WARNING} ${COLORS.yellow}${COLORS.bright}Most checks passed (${passedChecks}/${totalChecks} - ${percentage}%)${COLORS.reset}`
  )
  console.log(`\n${COLORS.yellow}⚠ Review warnings before deploying${COLORS.reset}`)
} else {
  console.log(
    `${ERROR} ${COLORS.red}${COLORS.bright}Some checks failed (${passedChecks}/${totalChecks} - ${percentage}%)${COLORS.reset}`
  )
  console.log(`\n${COLORS.red}✗ Fix issues before deploying${COLORS.reset}`)
}

if (warnings.length > 0) {
  console.log(`\n${COLORS.bright}Warnings:${COLORS.reset}`)
  warnings.forEach((warning, i) => {
    console.log(`  ${i + 1}. ${warning}`)
  })
}

// Next Steps
console.log(`\n${COLORS.bright}Next Steps:${COLORS.reset}\n`)

if (percentage >= 80) {
  console.log(`  1. ${INFO} Commit new documentation:`)
  console.log(
    `     ${COLORS.cyan}git add docs/ && git commit -m "docs: add post-deployment guides"${COLORS.reset}`
  )
  console.log(`\n  2. ${INFO} Push to GitHub:`)
  console.log(`     ${COLORS.cyan}git push origin 001-missing-core-features${COLORS.reset}`)
  console.log(`\n  3. ${INFO} Set up Better Stack (10 minutes):`)
  console.log(`     ${COLORS.cyan}See: docs/BETTER-STACK-SETUP.md${COLORS.reset}`)
  console.log(`\n  4. ${INFO} Monitor deployment:`)
  console.log(`     ${COLORS.cyan}https://vercel.com${COLORS.reset}`)
  console.log(`\n  5. ${INFO} Verify features:`)
  console.log(`     ${COLORS.cyan}node scripts/test-deployment.mjs${COLORS.reset}`)
} else {
  console.log(`  1. ${ERROR} Fix failing checks above`)
  console.log(`  2. ${INFO} Re-run verification: node scripts/verify-deployment.mjs`)
  console.log(`  3. ${INFO} Review documentation: docs/DEPLOYMENT-GUIDE.md`)
}

console.log(
  `\n${COLORS.bright}${COLORS.cyan}─────────────────────────────────────${COLORS.reset}\n`
)

// Exit with appropriate code
process.exit(percentage >= 80 ? 0 : 1)
