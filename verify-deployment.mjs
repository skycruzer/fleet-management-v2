#!/usr/bin/env node
/**
 * Post-Deployment Verification Script
 * Tests critical endpoints after Vercel deployment
 */

const PRODUCTION_URL = process.env.PRODUCTION_URL || 'https://your-app.vercel.app'

console.log('🔍 Fleet Management V2 - Post-Deployment Verification')
console.log('=' .repeat(60))
console.log(`Testing: ${PRODUCTION_URL}\n`)

const tests = [
  {
    name: 'Health Check - Home Page',
    url: `${PRODUCTION_URL}/`,
    expectedStatus: 200,
  },
  {
    name: 'Auth - Login Page',
    url: `${PRODUCTION_URL}/auth/login`,
    expectedStatus: 200,
  },
  {
    name: 'Portal - Login Page',
    url: `${PRODUCTION_URL}/portal/login`,
    expectedStatus: 200,
  },
  {
    name: 'API - Certifications (requires auth)',
    url: `${PRODUCTION_URL}/api/certifications`,
    expectedStatus: [200, 401], // 401 = auth working correctly
  },
]

async function runTests() {
  let passed = 0
  let failed = 0

  for (const test of tests) {
    try {
      const response = await fetch(test.url)
      const statusOk = Array.isArray(test.expectedStatus)
        ? test.expectedStatus.includes(response.status)
        : response.status === test.expectedStatus

      if (statusOk) {
        console.log(`✅ ${test.name}`)
        console.log(`   Status: ${response.status}\n`)
        passed++
      } else {
        console.log(`❌ ${test.name}`)
        console.log(`   Expected: ${test.expectedStatus}, Got: ${response.status}\n`)
        failed++
      }
    } catch (error) {
      console.log(`❌ ${test.name}`)
      console.log(`   Error: ${error.message}\n`)
      failed++
    }
  }

  console.log('=' .repeat(60))
  console.log(`Results: ${passed} passed, ${failed} failed`)
  console.log('\n📋 Next: Login as skycruzer@icloud.com and test full workflow')
  
  process.exit(failed > 0 ? 1 : 0)
}

runTests()
