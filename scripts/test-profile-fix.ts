/**
 * Test script to verify the profile fix works correctly
 * Tests that service-role client can fetch pilot data (bypasses RLS)
 *
 * Run: npx tsx scripts/test-profile-fix.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function testProfileFix() {
  console.log('\n🧪 Testing Profile Fix - RLS Bypass\n')
  console.log('='.repeat(50))

  // First, get a pilot_user to simulate the lookup
  const serviceClient = createClient(supabaseUrl, serviceRoleKey)

  // Get a pilot user (e.g., Maurice Rondeau)
  const { data: pilotUser, error: userError } = await serviceClient
    .from('pilot_users')
    .select('id, first_name, last_name, employee_id, pilot_id, email')
    .limit(1)
    .single()

  if (userError || !pilotUser) {
    console.error('❌ Could not find pilot user:', userError?.message)
    return
  }

  console.log(`\n📋 Test pilot: ${pilotUser.first_name} ${pilotUser.last_name}`)
  console.log(`   Employee ID: ${pilotUser.employee_id}`)
  console.log(`   Pilot ID: ${pilotUser.pilot_id || 'Not linked'}`)

  // Test 1: Try with ANON key (should fail due to RLS)
  console.log('\n--- Test 1: Using ANON key (simulates old behavior) ---')
  const anonClient = createClient(supabaseUrl, anonKey)

  if (pilotUser.employee_id) {
    const { data: anonData, error: anonError } = await anonClient
      .from('pilots')
      .select(
        'id, first_name, last_name, employee_id, seniority_number, contract_type, commencement_date'
      )
      .eq('employee_id', pilotUser.employee_id)
      .single()

    if (anonError) {
      console.log(`❌ ANON key FAILED (expected): ${anonError.message}`)
    } else if (anonData) {
      console.log('⚠️  ANON key succeeded (unexpected - RLS may be misconfigured)')
      console.log('   Data:', JSON.stringify(anonData, null, 2))
    } else {
      console.log('❌ ANON key returned null (expected due to RLS)')
    }
  }

  // Test 2: Try with SERVICE ROLE key (should succeed)
  console.log('\n--- Test 2: Using SERVICE ROLE key (simulates fix) ---')

  if (pilotUser.employee_id) {
    const { data: serviceData, error: serviceError } = await serviceClient
      .from('pilots')
      .select(
        'id, first_name, last_name, employee_id, seniority_number, contract_type, commencement_date, licence_number, licence_type, passport_number, captain_qualifications'
      )
      .eq('employee_id', pilotUser.employee_id)
      .single()

    if (serviceError) {
      console.log(`❌ SERVICE ROLE key FAILED: ${serviceError.message}`)
    } else if (serviceData) {
      console.log('✅ SERVICE ROLE key SUCCEEDED!')
      console.log('\n📊 Pilot Data Retrieved:')
      console.log(`   Name: ${serviceData.first_name} ${serviceData.last_name}`)
      console.log(`   Employee ID: ${serviceData.employee_id}`)
      console.log(`   Seniority Number: ${serviceData.seniority_number ?? 'N/A'}`)
      console.log(`   Contract Type: ${serviceData.contract_type ?? 'N/A'}`)
      console.log(`   Commencement Date: ${serviceData.commencement_date ?? 'N/A'}`)
      console.log(`   Licence Number: ${serviceData.licence_number ?? 'N/A'}`)
      console.log(`   Licence Type: ${serviceData.licence_type ?? 'N/A'}`)
      console.log(`   Passport Number: ${serviceData.passport_number ?? 'N/A'}`)
      console.log(
        `   Captain Qualifications: ${JSON.stringify(serviceData.captain_qualifications) ?? 'N/A'}`
      )
    } else {
      console.log('❌ SERVICE ROLE key returned null (pilot not found in pilots table)')
    }
  }

  console.log('\n' + '='.repeat(50))
  console.log('✅ Test complete!\n')
}

testProfileFix().catch(console.error)
