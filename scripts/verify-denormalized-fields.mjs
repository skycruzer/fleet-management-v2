/**
 * Verify Denormalized Fields in pilot_requests Table
 * Phase 2.2 of Unified Request System Overhaul
 *
 * Checks that all pilot_requests have properly populated denormalized fields:
 * - name (pilot full name)
 * - rank (Captain/First Officer)
 * - employee_number
 *
 * Backfills any missing data from pilots table.
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const envContent = readFileSync('.env.local', 'utf-8')
const envVars = {}
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/)
  if (match) {
    envVars[match[1].trim()] = match[2].trim()
  }
})

const supabase = createClient(
  envVars.NEXT_PUBLIC_SUPABASE_URL,
  envVars.SUPABASE_SERVICE_ROLE_KEY || envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function verifyDenormalizedFields() {
  console.log('\n🔍 Verifying Denormalized Fields in pilot_requests\n')

  // Fetch all requests with pilot data for comparison
  const { data: requests, error } = await supabase
    .from('pilot_requests')
    .select(`
      id,
      pilot_id,
      employee_number,
      rank,
      name,
      request_category,
      start_date,
      pilots!pilot_requests_pilot_id_fkey (
        id,
        employee_id,
        first_name,
        last_name,
        role
      )
    `)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('❌ Error fetching requests:', error.message)
    return
  }

  console.log(`✅ Found ${requests.length} total requests\n`)

  // Check for missing or incorrect denormalized fields
  const issues = {
    missingName: [],
    missingRank: [],
    missingEmployeeNumber: [],
    incorrectName: [],
    incorrectRank: [],
    incorrectEmployeeNumber: []
  }

  requests.forEach(req => {
    const pilot = req.pilots

    // Check if denormalized fields are missing
    if (!req.name) {
      issues.missingName.push(req.id)
    }
    if (!req.rank) {
      issues.missingRank.push(req.id)
    }
    if (!req.employee_number) {
      issues.missingEmployeeNumber.push(req.id)
    }

    // Check if denormalized fields match pilot table
    if (pilot) {
      const expectedName = `${pilot.first_name} ${pilot.last_name}`.toUpperCase()
      if (req.name && req.name !== expectedName) {
        issues.incorrectName.push({
          id: req.id,
          current: req.name,
          expected: expectedName
        })
      }

      if (req.rank && req.rank !== pilot.role) {
        issues.incorrectRank.push({
          id: req.id,
          current: req.rank,
          expected: pilot.role
        })
      }

      if (req.employee_number && req.employee_number !== pilot.employee_id) {
        issues.incorrectEmployeeNumber.push({
          id: req.id,
          current: req.employee_number,
          expected: pilot.employee_id
        })
      }
    }
  })

  // Report findings
  console.log('📊 Verification Results:\n')

  const totalIssues =
    issues.missingName.length +
    issues.missingRank.length +
    issues.missingEmployeeNumber.length +
    issues.incorrectName.length +
    issues.incorrectRank.length +
    issues.incorrectEmployeeNumber.length

  if (totalIssues === 0) {
    console.log('✅ ALL DENORMALIZED FIELDS ARE CORRECT!')
    console.log(`   All ${requests.length} requests have properly populated fields.\n`)
    return
  }

  console.log(`⚠️  Found ${totalIssues} issue(s) across ${requests.length} requests\n`)

  // Missing fields
  if (issues.missingName.length > 0) {
    console.log(`❌ Missing name field: ${issues.missingName.length} record(s)`)
    console.log(`   IDs: ${issues.missingName.slice(0, 5).join(', ')}${issues.missingName.length > 5 ? '...' : ''}`)
  }

  if (issues.missingRank.length > 0) {
    console.log(`❌ Missing rank field: ${issues.missingRank.length} record(s)`)
    console.log(`   IDs: ${issues.missingRank.slice(0, 5).join(', ')}${issues.missingRank.length > 5 ? '...' : ''}`)
  }

  if (issues.missingEmployeeNumber.length > 0) {
    console.log(`❌ Missing employee_number field: ${issues.missingEmployeeNumber.length} record(s)`)
    console.log(`   IDs: ${issues.missingEmployeeNumber.slice(0, 5).join(', ')}${issues.missingEmployeeNumber.length > 5 ? '...' : ''}`)
  }

  // Incorrect fields
  if (issues.incorrectName.length > 0) {
    console.log(`\n⚠️  Incorrect name field: ${issues.incorrectName.length} record(s)`)
    issues.incorrectName.slice(0, 3).forEach(issue => {
      console.log(`   ID ${issue.id}: "${issue.current}" should be "${issue.expected}"`)
    })
  }

  if (issues.incorrectRank.length > 0) {
    console.log(`\n⚠️  Incorrect rank field: ${issues.incorrectRank.length} record(s)`)
    issues.incorrectRank.slice(0, 3).forEach(issue => {
      console.log(`   ID ${issue.id}: "${issue.current}" should be "${issue.expected}"`)
    })
  }

  if (issues.incorrectEmployeeNumber.length > 0) {
    console.log(`\n⚠️  Incorrect employee_number field: ${issues.incorrectEmployeeNumber.length} record(s)`)
    issues.incorrectEmployeeNumber.slice(0, 3).forEach(issue => {
      console.log(`   ID ${issue.id}: "${issue.current}" should be "${issue.expected}"`)
    })
  }

  // Offer to fix issues
  console.log('\n🔧 Backfilling Missing Data...\n')

  let fixedCount = 0

  for (const req of requests) {
    const pilot = req.pilots
    if (!pilot) continue

    const updates = {}
    let needsUpdate = false

    // Backfill missing or incorrect fields
    const expectedName = `${pilot.first_name} ${pilot.last_name}`.toUpperCase()
    if (!req.name || req.name !== expectedName) {
      updates.name = expectedName
      needsUpdate = true
    }

    if (!req.rank || req.rank !== pilot.role) {
      updates.rank = pilot.role
      needsUpdate = true
    }

    if (!req.employee_number || req.employee_number !== pilot.employee_id) {
      updates.employee_number = pilot.employee_id
      needsUpdate = true
    }

    if (needsUpdate) {
      const { error: updateError } = await supabase
        .from('pilot_requests')
        .update(updates)
        .eq('id', req.id)

      if (updateError) {
        console.error(`   ❌ Failed to update ${req.id}:`, updateError.message)
      } else {
        fixedCount++
        console.log(`   ✅ Fixed request ${req.id}`)
      }
    }
  }

  console.log(`\n✅ Backfill Complete: Fixed ${fixedCount} record(s)\n`)

  // Re-verify after fixes
  console.log('🔍 Re-verifying after backfill...\n')
  await verifyDenormalizedFields()
}

verifyDenormalizedFields()
