#!/usr/bin/env node

/**
 * Clear Sample Renewal Data
 * Author: Maurice Rondeau
 * Date: November 9, 2025
 */

import fs from 'fs'

const envContent = fs.readFileSync('.env.local', 'utf8')
const env = {}
envContent.split('\n').forEach((line) => {
  const trimmedLine = line.trim()
  if (trimmedLine && !trimmedLine.startsWith('#')) {
    const [key, ...valueParts] = trimmedLine.split('=')
    if (key && valueParts.length > 0) {
      env[key.trim()] = valueParts
        .join('=')
        .trim()
        .replace(/^["']|["']$/g, '')
    }
  }
})

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('\n🗑️  Clearing Sample Renewal Data')
console.log('═══════════════════════════════════════════════════════════\n')

async function clearData() {
  try {
    // Count existing plans
    const countResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/certification_renewal_plans?select=count`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          Prefer: 'count=exact',
        },
      }
    )

    const beforeCount = countResponse.headers.get('content-range')?.split('/')[1] || '0'
    console.log(`📊 Current renewal plans: ${beforeCount}\n`)

    if (beforeCount === '0') {
      console.log('✅ No data to clear. Database is already empty.\n')
      return
    }

    // Delete all renewal plans
    console.log('🗑️  Deleting all renewal plans...')
    const deleteResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/certification_renewal_plans?id=neq.00000000-0000-0000-0000-000000000000`,
      {
        method: 'DELETE',
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          Prefer: 'return=minimal',
        },
      }
    )

    if (!deleteResponse.ok) {
      throw new Error(`Failed to delete: ${deleteResponse.statusText}`)
    }

    console.log('✅ All renewal plans deleted\n')

    // Verify deletion
    const verifyResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/certification_renewal_plans?select=count`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          Prefer: 'count=exact',
        },
      }
    )

    const afterCount = verifyResponse.headers.get('content-range')?.split('/')[1] || '0'
    console.log(`📊 Remaining renewal plans: ${afterCount}\n`)

    console.log('═══════════════════════════════════════════════════════════')
    console.log('✅ Sample Data Cleared Successfully!')
    console.log('═══════════════════════════════════════════════════════════\n')
    console.log('📝 Next Step:\n')
    console.log('   Generate real renewal plans from actual certifications\n')
    console.log('═══════════════════════════════════════════════════════════\n')
  } catch (error) {
    console.error('\n═══════════════════════════════════════════════════════════')
    console.error('❌ Clear Failed')
    console.error('═══════════════════════════════════════════════════════════')
    console.error('Error:', error.message)
    console.error('═══════════════════════════════════════════════════════════\n')
    process.exit(1)
  }
}

clearData()
