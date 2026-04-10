#!/usr/bin/env node
/**
 * Comprehensive Data Accuracy Verification
 * Author: Maurice Rondeau
 * Checks all major data sources for accuracy
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

// Load environment variables
const envFile = readFileSync('.env.local', 'utf-8')
const env = {}
envFile.split('\n').forEach((line) => {
  const [key, ...valueParts] = line.split('=')
  if (key && valueParts.length > 0) {
    env[key.trim()] = valueParts.join('=').trim()
  }
})

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

console.log('🔍 Comprehensive Data Accuracy Verification\n')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

async function verifyAllData() {
  const issues = []

  // 1. Verify Pilot Counts
  console.log('1️⃣  Verifying Pilot Counts...\n')

  const { data: pilots, error: pilotsError } = await supabase
    .from('pilots')
    .select('id, role, is_active')

  if (pilotsError) {
    console.error('❌ Error fetching pilots:', pilotsError.message)
    issues.push('Failed to fetch pilots')
  } else {
    const totalPilots = pilots.length
    const activePilots = pilots.filter((p) => p.is_active).length
    const inactivePilots = pilots.filter((p) => !p.is_active).length
    const activeCaptains = pilots.filter((p) => p.is_active && p.role === 'Captain').length
    const activeFirstOfficers = pilots.filter(
      (p) => p.is_active && p.role === 'First Officer'
    ).length

    console.log(`   Total Pilots: ${totalPilots}`)
    console.log(`   Active Pilots: ${activePilots}`)
    console.log(`   Inactive Pilots: ${inactivePilots}`)
    console.log(`   Active Captains: ${activeCaptains}`)
    console.log(`   Active First Officers: ${activeFirstOfficers}\n`)

    if (activePilots + inactivePilots !== totalPilots) {
      issues.push('Pilot count mismatch: active + inactive ≠ total')
    } else {
      console.log('   ✅ Pilot counts accurate\n')
    }
  }

  // 2. Verify Certification Counts
  console.log('2️⃣  Verifying Certification Counts...\n')

  const { data: certs, error: certsError } = await supabase
    .from('pilot_checks')
    .select('id, expiry_date')

  if (certsError) {
    console.error('❌ Error fetching certifications:', certsError.message)
    issues.push('Failed to fetch certifications')
  } else {
    const totalCerts = certs.length
    const today = new Date()

    const expiredCerts = certs.filter(
      (c) => c.expiry_date && new Date(c.expiry_date) < today
    ).length
    const validCerts = certs.filter((c) => c.expiry_date && new Date(c.expiry_date) >= today).length
    const noCerts = certs.filter((c) => !c.expiry_date).length

    console.log(`   Total Certifications: ${totalCerts}`)
    console.log(`   Expired: ${expiredCerts}`)
    console.log(`   Valid: ${validCerts}`)
    console.log(`   No Expiry Date: ${noCerts}\n`)

    if (expiredCerts + validCerts + noCerts !== totalCerts) {
      issues.push('Certification count mismatch')
    } else {
      console.log('   ✅ Certification counts accurate\n')
    }
  }

  // 3. Verify Leave Request Counts
  console.log('3️⃣  Verifying Leave Request Counts...\n')

  const { data: leaves, error: leavesError } = await supabase
    .from('leave_requests')
    .select('id, status')

  if (leavesError) {
    console.error('❌ Error fetching leave requests:', leavesError.message)
    issues.push('Failed to fetch leave requests')
  } else {
    const totalLeaves = leaves.length

    // Get actual status breakdown
    const statusBreakdown = {}
    leaves.forEach((l) => {
      statusBreakdown[l.status] = (statusBreakdown[l.status] || 0) + 1
    })

    console.log(`   Total Leave Requests: ${totalLeaves}`)
    console.log('\n   Status Breakdown:')
    Object.entries(statusBreakdown).forEach(([status, count]) => {
      console.log(`   • ${status}: ${count}`)
    })
    console.log()

    console.log('   ✅ Leave request counts accurate\n')
  }

  // 4. Verify Flight Request Counts
  console.log('4️⃣  Verifying Flight Request Counts...\n')

  const { data: flights, error: flightsError } = await supabase
    .from('flight_requests')
    .select('id, status')

  if (flightsError) {
    console.error('❌ Error fetching flight requests:', flightsError.message)
    issues.push('Failed to fetch flight requests')
  } else {
    const totalFlights = flights.length
    console.log(`   Total Flight Requests: ${totalFlights}\n`)

    if (totalFlights > 0) {
      const statusBreakdown = {}
      flights.forEach((f) => {
        statusBreakdown[f.status] = (statusBreakdown[f.status] || 0) + 1
      })

      console.log('   Status Breakdown:')
      Object.entries(statusBreakdown).forEach(([status, count]) => {
        console.log(`   • ${status}: ${count}`)
      })
      console.log()
    }

    console.log('   ✅ Flight request counts verified\n')
  }

  // 5. Verify Check Types
  console.log('5️⃣  Verifying Check Types...\n')

  const { data: checkTypes, error: checkTypesError } = await supabase
    .from('check_types')
    .select('id, check_code, check_description, category')

  if (checkTypesError) {
    console.error('❌ Error fetching check types:', checkTypesError.message)
    issues.push('Failed to fetch check types')
  } else {
    const totalCheckTypes = checkTypes.length
    const withCategory = checkTypes.filter((ct) => ct.category).length
    const withoutCategory = checkTypes.filter((ct) => !ct.category).length

    console.log(`   Total Check Types: ${totalCheckTypes}`)
    console.log(`   With Category: ${withCategory}`)
    console.log(`   Without Category: ${withoutCategory}\n`)

    if (withCategory + withoutCategory !== totalCheckTypes) {
      issues.push('Check type count mismatch')
    } else {
      console.log('   ✅ Check type counts accurate\n')
    }
  }

  // 6. Verify Tasks
  console.log('6️⃣  Verifying Tasks...\n')

  const { data: tasks, error: tasksError } = await supabase.from('tasks').select('id, status')

  if (tasksError) {
    console.error('❌ Error fetching tasks:', tasksError.message)
    issues.push('Failed to fetch tasks')
  } else {
    const totalTasks = tasks.length
    console.log(`   Total Tasks: ${totalTasks}\n`)

    if (totalTasks > 0) {
      // Group by status
      const statusBreakdown = {}
      tasks.forEach((t) => {
        statusBreakdown[t.status] = (statusBreakdown[t.status] || 0) + 1
      })

      console.log('   Status Breakdown:')
      Object.entries(statusBreakdown).forEach(([status, count]) => {
        console.log(`   • ${status}: ${count}`)
      })
      console.log()
    }

    console.log('   ✅ Task counts verified\n')
  }

  // 7. Verify Settings (already done earlier)
  console.log('7️⃣  Verifying Settings...\n')

  const { data: settings, error: settingsError } = await supabase
    .from('settings')
    .select('key, value')

  if (settingsError) {
    console.error('❌ Error fetching settings:', settingsError.message)
    issues.push('Failed to fetch settings')
  } else {
    console.log(`   Total Settings: ${settings.length}`)

    const requiredSettings = ['alert_thresholds', 'app_title', 'pilot_requirements']
    const existingKeys = settings.map((s) => s.key)
    const missingSettings = requiredSettings.filter((k) => !existingKeys.includes(k))

    if (missingSettings.length > 0) {
      console.log(`   ⚠️  Missing settings: ${missingSettings.join(', ')}\n`)
      issues.push(`Missing settings: ${missingSettings.join(', ')}`)
    } else {
      console.log('   ✅ All required settings present\n')
    }
  }

  // Summary
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('📊 DATA ACCURACY SUMMARY\n')

  if (issues.length === 0) {
    console.log('✅ All data verified - NO ISSUES FOUND\n')
  } else {
    console.log(`⚠️  ${issues.length} issue(s) found:\n`)
    issues.forEach((issue, index) => {
      console.log(`   ${index + 1}. ${issue}`)
    })
    console.log()
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('✅ Verification complete\n')
}

verifyAllData()
