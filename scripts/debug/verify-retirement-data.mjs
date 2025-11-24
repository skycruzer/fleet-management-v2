#!/usr/bin/env node
/**
 * Verify Retirement Forecast Data Accuracy
 * Author: Maurice Rondeau
 * Checks pilot birth dates and retirement calculations
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

// Load environment variables from .env.local
const envFile = readFileSync('.env.local', 'utf-8')
const env = {}
envFile.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=')
  if (key && valueParts.length > 0) {
    env[key.trim()] = valueParts.join('=').trim()
  }
})

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

console.log('🔍 Retirement Forecast Data Verification\n')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

async function verifyRetirementData() {
  // 1. Check retirement age setting
  console.log('1️⃣  Checking retirement age setting...\n')

  const { data: settings, error: settingsError } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'pilot_requirements')
    .single()

  if (settingsError) {
    console.error('❌ Error fetching settings:', settingsError.message)
    return
  }

  const retirementAge = settings?.value?.pilot_retirement_age || 65
  console.log(`   ✅ Retirement age: ${retirementAge} years\n`)

  // 2. Fetch all active pilots with birth dates
  console.log('2️⃣  Fetching active pilot data...\n')

  const { data: pilots, error: pilotsError } = await supabase
    .from('pilots')
    .select('id, first_name, last_name, role, date_of_birth, is_active')
    .eq('is_active', true)
    .order('date_of_birth', { ascending: true })

  if (pilotsError) {
    console.error('❌ Error fetching pilots:', pilotsError.message)
    return
  }

  console.log(`   ✅ Total active pilots: ${pilots.length}`)

  const pilotsWithDOB = pilots.filter(p => p.date_of_birth)
  const pilotsWithoutDOB = pilots.filter(p => !p.date_of_birth)

  console.log(`   ✅ Pilots with birth date: ${pilotsWithDOB.length}`)
  console.log(`   ⚠️  Pilots missing birth date: ${pilotsWithoutDOB.length}\n`)

  if (pilotsWithoutDOB.length > 0) {
    console.log('   Pilots missing birth dates:')
    pilotsWithoutDOB.forEach(p => {
      console.log(`   • ${p.first_name} ${p.last_name} (${p.role})`)
    })
    console.log()
  }

  // 3. Calculate retirement forecasts
  console.log('3️⃣  Calculating retirement forecasts...\n')

  const today = new Date()
  const twoYearsFromNow = new Date(today)
  twoYearsFromNow.setFullYear(today.getFullYear() + 2)
  const fiveYearsFromNow = new Date(today)
  fiveYearsFromNow.setFullYear(today.getFullYear() + 5)

  console.log(`   Today: ${today.toISOString().split('T')[0]}`)
  console.log(`   2 years from now: ${twoYearsFromNow.toISOString().split('T')[0]}`)
  console.log(`   5 years from now: ${fiveYearsFromNow.toISOString().split('T')[0]}\n`)

  const twoYearRetirements = []
  const fiveYearRetirements = []
  const alreadyRetired = []

  pilotsWithDOB.forEach((pilot) => {
    const birthDate = new Date(pilot.date_of_birth)
    const retirementDate = new Date(birthDate)
    retirementDate.setFullYear(birthDate.getFullYear() + retirementAge)

    const age = today.getFullYear() - birthDate.getFullYear()
    const monthsUntilRetirement = Math.floor(
      (retirementDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30.44)
    )

    const pilotData = {
      name: `${pilot.first_name} ${pilot.last_name}`,
      rank: pilot.role,
      birthDate: pilot.date_of_birth,
      retirementDate: retirementDate.toISOString().split('T')[0],
      currentAge: age,
      monthsUntilRetirement,
    }

    // Already retired
    if (retirementDate <= today) {
      alreadyRetired.push(pilotData)
      return
    }

    // Retiring within 2 years
    if (retirementDate <= twoYearsFromNow) {
      twoYearRetirements.push(pilotData)
    }

    // Retiring within 5 years (includes 2-year pilots)
    if (retirementDate <= fiveYearsFromNow) {
      fiveYearRetirements.push(pilotData)
    }
  })

  // 4. Display results
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('📊 RETIREMENT FORECAST RESULTS\n')

  console.log(`🔴 Already Retired: ${alreadyRetired.length} pilots`)
  if (alreadyRetired.length > 0) {
    alreadyRetired.forEach(p => {
      console.log(`   • ${p.name} (${p.rank})`)
      console.log(`     Birth: ${p.birthDate}, Should have retired: ${p.retirementDate}`)
      console.log(`     Current age: ${p.currentAge} years\n`)
    })
  }

  console.log(`🟡 Retiring in 2 Years: ${twoYearRetirements.length} pilots`)
  if (twoYearRetirements.length > 0) {
    // Separate by rank
    const captains = twoYearRetirements.filter(p => p.rank === 'Captain')
    const fos = twoYearRetirements.filter(p => p.rank === 'First Officer')

    console.log(`   Captains: ${captains.length}`)
    captains.forEach(p => {
      console.log(`   • ${p.name}`)
      console.log(`     Retirement: ${p.retirementDate} (${p.monthsUntilRetirement} months)`)
    })

    console.log(`\n   First Officers: ${fos.length}`)
    fos.forEach(p => {
      console.log(`   • ${p.name}`)
      console.log(`     Retirement: ${p.retirementDate} (${p.monthsUntilRetirement} months)`)
    })
    console.log()
  }

  console.log(`🟢 Retiring in 5 Years: ${fiveYearRetirements.length} pilots`)
  if (fiveYearRetirements.length > 0) {
    // Separate by rank
    const captains = fiveYearRetirements.filter(p => p.rank === 'Captain')
    const fos = fiveYearRetirements.filter(p => p.rank === 'First Officer')

    console.log(`   Captains: ${captains.length}`)
    console.log(`   First Officers: ${fos.length}\n`)
  }

  // 5. Check for data accuracy issues
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('⚠️  DATA ACCURACY CHECKS\n')

  let issuesFound = false

  if (alreadyRetired.length > 0) {
    console.log(`❌ ISSUE: ${alreadyRetired.length} pilots marked active but past retirement age`)
    issuesFound = true
  }

  if (pilotsWithoutDOB.length > 0) {
    console.log(`❌ ISSUE: ${pilotsWithoutDOB.length} pilots missing birth dates`)
    issuesFound = true
  }

  // Check if 2-year count matches what user might see
  console.log(`\n📊 Expected Dashboard Display:`)
  console.log(`   2-Year Retirements: ${twoYearRetirements.length}`)
  console.log(`   5-Year Retirements: ${fiveYearRetirements.length}`)

  if (!issuesFound) {
    console.log('\n✅ No data accuracy issues detected')
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('✅ Verification complete\n')
}

verifyRetirementData()
