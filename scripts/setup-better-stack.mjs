#!/usr/bin/env node

/**
 * Better Stack Setup Helper
 * Guides you through Better Stack configuration for Phase 0
 */

import { execSync } from 'child_process'
import readline from 'readline'

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

function question(prompt) {
  return new Promise(resolve => {
    rl.question(prompt, resolve)
  })
}

function header(text) {
  console.log(`\n${COLORS.bright}${COLORS.cyan}${text}${COLORS.reset}\n`)
}

function step(number, text) {
  console.log(`${COLORS.bright}${COLORS.magenta}Step ${number}:${COLORS.reset} ${text}`)
}

function success(text) {
  console.log(`${COLORS.green}✓${COLORS.reset} ${text}`)
}

function info(text) {
  console.log(`${COLORS.blue}ℹ${COLORS.reset} ${text}`)
}

function warn(text) {
  console.log(`${COLORS.yellow}⚠${COLORS.reset} ${text}`)
}

function error(text) {
  console.log(`${COLORS.red}✗${COLORS.reset} ${text}`)
}

console.clear()
header('Better Stack Setup for Phase 0')

console.log('This script will guide you through setting up Better Stack logging.')
console.log('You will need:')
console.log('  • Better Stack account (free tier works)')
console.log('  • Vercel CLI access (or Vercel dashboard access)')
console.log('  • 10 minutes of time\n')

const proceed = await question(`${COLORS.cyan}Ready to proceed? (y/n):${COLORS.reset} `)
if (proceed.toLowerCase() !== 'y') {
  console.log('\nSetup cancelled. Run this script again when ready.')
  process.exit(0)
}

// Step 1: Account Check
header('Step 1: Better Stack Account')
console.log('1. Go to: https://betterstack.com/logs')
console.log('2. Sign up for a free account (1 GB/month)')
console.log('3. Verify your email\n')

const hasAccount = await question(`${COLORS.cyan}Do you have a Better Stack account? (y/n):${COLORS.reset} `)
if (hasAccount.toLowerCase() !== 'y') {
  console.log('\n📋 Action required:')
  console.log('   1. Sign up at: https://betterstack.com/logs')
  console.log('   2. Verify your email')
  console.log('   3. Run this script again\n')
  process.exit(0)
}

success('Better Stack account ready')

// Step 2: Create Sources
header('Step 2: Create Log Sources')
console.log('You need to create TWO sources in Better Stack:\n')

console.log(`${COLORS.bright}Server Source:${COLORS.reset}`)
console.log('  • Name: Fleet Management V2 - Server')
console.log('  • Platform: Node.js')
console.log('  • Framework: Next.js\n')

console.log(`${COLORS.bright}Client Source:${COLORS.reset}`)
console.log('  • Name: Fleet Management V2 - Client')
console.log('  • Platform: Browser (JavaScript)')
console.log('  • Framework: Next.js\n')

const createdSources = await question(
  `${COLORS.cyan}Have you created both sources? (y/n):${COLORS.reset} `
)
if (createdSources.toLowerCase() !== 'y') {
  console.log('\n📋 Action required:')
  console.log('   1. Log in to Better Stack dashboard')
  console.log('   2. Click "Create Source"')
  console.log('   3. Create server source (settings above)')
  console.log('   4. Create client source (settings above)')
  console.log('   5. Run this script again\n')
  process.exit(0)
}

success('Both sources created')

// Step 3: Get Tokens
header('Step 3: Copy Source Tokens')
console.log('Each source has a unique token (starts with "logtail_").\n')

const serverToken = await question(
  `${COLORS.cyan}Paste SERVER source token:${COLORS.reset} `
)
if (!serverToken || !serverToken.startsWith('logtail_')) {
  error('Invalid server token format')
  console.log('\nToken should start with "logtail_"')
  console.log('Get it from: Better Stack → Sources → Fleet Management V2 - Server\n')
  process.exit(1)
}

const clientToken = await question(
  `${COLORS.cyan}Paste CLIENT source token:${COLORS.reset} `
)
if (!clientToken || !clientToken.startsWith('logtail_')) {
  error('Invalid client token format')
  console.log('\nToken should start with "logtail_"')
  console.log('Get it from: Better Stack → Sources → Fleet Management V2 - Client\n')
  process.exit(1)
}

success('Tokens validated')

// Step 4: Choose Deployment Method
header('Step 4: Add Tokens to Vercel')
console.log('Choose how to add environment variables:\n')
console.log('1. Vercel CLI (automated)')
console.log('2. Vercel Dashboard (manual)\n')

const method = await question(`${COLORS.cyan}Choose method (1 or 2):${COLORS.reset} `)

if (method === '1') {
  // Vercel CLI method
  console.log('\n📋 Using Vercel CLI...\n')

  try {
    // Check if Vercel CLI is installed
    execSync('vercel --version', { encoding: 'utf8', stdio: 'ignore' })
    success('Vercel CLI found')
  } catch {
    warn('Vercel CLI not found')
    console.log('\nInstalling Vercel CLI...')
    try {
      execSync('npm i -g vercel', { encoding: 'utf8', stdio: 'inherit' })
      success('Vercel CLI installed')
    } catch (err) {
      error('Failed to install Vercel CLI')
      console.log('\nManual installation:')
      console.log('  npm i -g vercel\n')
      process.exit(1)
    }
  }

  // Login check
  try {
    execSync('vercel whoami', { encoding: 'utf8', stdio: 'ignore' })
    success('Already logged in to Vercel')
  } catch {
    console.log('\nLogging in to Vercel...')
    try {
      execSync('vercel login', { encoding: 'utf8', stdio: 'inherit' })
      success('Logged in to Vercel')
    } catch (err) {
      error('Failed to login to Vercel')
      process.exit(1)
    }
  }

  // Add environment variables
  console.log('\n📋 Adding environment variables...\n')

  try {
    // Add server token
    info('Adding LOGTAIL_SOURCE_TOKEN...')
    execSync(`echo "${serverToken}" | vercel env add LOGTAIL_SOURCE_TOKEN production`, {
      encoding: 'utf8',
      stdio: 'inherit',
    })
    success('Server token added')

    // Add client token
    info('Adding NEXT_PUBLIC_LOGTAIL_SOURCE_TOKEN...')
    execSync(
      `echo "${clientToken}" | vercel env add NEXT_PUBLIC_LOGTAIL_SOURCE_TOKEN production`,
      {
        encoding: 'utf8',
        stdio: 'inherit',
      }
    )
    success('Client token added')

    console.log('\n✅ Environment variables added successfully!\n')
  } catch (err) {
    error('Failed to add environment variables')
    console.log('\nFall back to manual method:')
    console.log('1. Go to: https://vercel.com')
    console.log('2. Select your project')
    console.log('3. Settings → Environment Variables')
    console.log(`4. Add LOGTAIL_SOURCE_TOKEN = ${serverToken}`)
    console.log(`5. Add NEXT_PUBLIC_LOGTAIL_SOURCE_TOKEN = ${clientToken}`)
    console.log('6. Select "Production" environment\n')
    process.exit(1)
  }
} else {
  // Manual method
  console.log('\n📋 Manual Setup Instructions:\n')
  console.log('1. Go to: https://vercel.com')
  console.log('2. Select your project: fleet-management-v2')
  console.log('3. Go to: Settings → Environment Variables')
  console.log('4. Click "Add Variable"\n')

  console.log(`${COLORS.bright}Server Token:${COLORS.reset}`)
  console.log(`   Name: LOGTAIL_SOURCE_TOKEN`)
  console.log(`   Value: ${COLORS.cyan}${serverToken}${COLORS.reset}`)
  console.log(`   Environment: Production ✅\n`)

  console.log(`${COLORS.bright}Client Token:${COLORS.reset}`)
  console.log(`   Name: NEXT_PUBLIC_LOGTAIL_SOURCE_TOKEN`)
  console.log(`   Value: ${COLORS.cyan}${clientToken}${COLORS.reset}`)
  console.log(`   Environment: Production ✅\n`)

  const added = await question(
    `${COLORS.cyan}Have you added both variables? (y/n):${COLORS.reset} `
  )
  if (added.toLowerCase() !== 'y') {
    console.log('\nAdd the variables and run this script again.')
    process.exit(0)
  }
}

// Step 5: Redeploy
header('Step 5: Redeploy Application')
console.log('New environment variables require a fresh deployment.\n')

const shouldDeploy = await question(`${COLORS.cyan}Deploy now? (y/n):${COLORS.reset} `)
if (shouldDeploy.toLowerCase() === 'y') {
  try {
    console.log('\n📋 Deploying to production...\n')
    execSync('vercel --prod', { encoding: 'utf8', stdio: 'inherit' })
    success('Deployment initiated')
  } catch (err) {
    warn('Deployment failed via CLI')
    console.log('\nManual deployment:')
    console.log('1. Go to: https://vercel.com')
    console.log('2. Deployments tab')
    console.log('3. Click "..." → Redeploy\n')
  }
} else {
  console.log('\nManual deployment:')
  console.log('1. Go to: https://vercel.com')
  console.log('2. Deployments tab')
  console.log('3. Click "..." → Redeploy')
  console.log('4. Wait 5-7 minutes for completion\n')
}

// Step 6: Verification
header('Step 6: Verify Logs Flowing')
console.log('After deployment completes (5-7 minutes):\n')
console.log('1. Go to Better Stack dashboard')
console.log('2. Click on "Fleet Management V2 - Server"')
console.log('3. Click "Live Tail" (top right)')
console.log('4. Navigate through your app')
console.log('5. Verify logs appearing in real-time\n')

// Summary
header('Setup Complete! 🎉')
success('Better Stack tokens configured')
success('Environment variables added to Vercel')
success('Deployment initiated (or ready to deploy)')

console.log('\n📋 Next Steps:\n')
console.log('1. Wait 5-7 minutes for deployment')
console.log('2. Verify logs flowing in Better Stack')
console.log('3. Set up alerts (recommended):')
console.log('   • High error rate (>5 errors/min)')
console.log('   • Critical component errors')
console.log('   • Client-side crashes')
console.log('4. Create dashboard views:')
console.log('   • Error Dashboard')
console.log('   • API Performance')
console.log('   • Top Errors\n')

console.log('📖 Complete guide: docs/BETTER-STACK-SETUP.md\n')

rl.close()

console.log(`${COLORS.green}${COLORS.bright}Happy Monitoring! 📊${COLORS.reset}\n`)
