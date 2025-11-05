#!/usr/bin/env node
/**
 * Analyze Pilot Age Distribution
 * Author: Maurice Rondeau
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

// Load environment variables
const envFile = readFileSync('.env.local', 'utf-8')
const env = {}
envFile.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=')
  if (key && valueParts.length > 0) {
    env[key.trim()] = valueParts.join('=').trim()
  }
})

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

console.log('📊 Pilot Age Distribution Analysis\n')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

async function analyzePilotAges() {
  const retirementAge = 65

  const { data: pilots, error } = await supabase
    .from('pilots')
    .select('id, first_name, last_name, role, date_of_birth, is_active')
    .eq('is_active', true)
    .not('date_of_birth', 'is', null)
    .order('date_of_birth', { ascending: true })

  if (error) {
    console.error('❌ Error:', error.message)
    return
  }

  const today = new Date()

  console.log(`Active Pilots with Birth Dates: ${pilots.length}`)
  console.log(`Retirement Age: ${retirementAge}\n`)

  // Separate by rank
  const captains = []
  const firstOfficers = []

  pilots.forEach(pilot => {
    const birthDate = new Date(pilot.date_of_birth)
    const retirementDate = new Date(birthDate)
    retirementDate.setFullYear(birthDate.getFullYear() + retirementAge)

    const currentAge = Math.floor((today - birthDate) / (1000 * 60 * 60 * 24 * 365.25))
    const yearsToRetirement = retirementAge - currentAge

    const pilotInfo = {
      name: `${pilot.first_name} ${pilot.last_name}`,
      rank: pilot.role,
      birthDate: pilot.date_of_birth,
      currentAge,
      retirementDate: retirementDate.toISOString().split('T')[0],
      yearsToRetirement,
    }

    if (pilot.role === 'Captain') {
      captains.push(pilotInfo)
    } else {
      firstOfficers.push(pilotInfo)
    }
  })

  // Display Captains
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`👨‍✈️ CAPTAINS (${captains.length} total)\n`)

  captains.forEach(p => {
    const status = p.yearsToRetirement <= 2 ? '🔴' : p.yearsToRetirement <= 5 ? '🟡' : '🟢'
    console.log(`${status} ${p.name}`)
    console.log(`   Age: ${p.currentAge} | Retires: ${p.retirementDate} (${p.yearsToRetirement} years)`)
  })

  // Display First Officers
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`👨‍✈️ FIRST OFFICERS (${firstOfficers.length} total)\n`)

  firstOfficers.forEach(p => {
    const status = p.yearsToRetirement <= 2 ? '🔴' : p.yearsToRetirement <= 5 ? '🟡' : '🟢'
    console.log(`${status} ${p.name}`)
    console.log(`   Age: ${p.currentAge} | Retires: ${p.retirementDate} (${p.yearsToRetirement} years)`)
  })

  // Summary
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('📊 AGE DISTRIBUTION SUMMARY\n')

  const captainAges = captains.map(p => p.currentAge)
  const foAges = firstOfficers.map(p => p.currentAge)

  console.log(`Captains:`)
  console.log(`   Youngest: ${Math.min(...captainAges)} years`)
  console.log(`   Oldest: ${Math.max(...captainAges)} years`)
  console.log(`   Average: ${(captainAges.reduce((a,b) => a+b, 0) / captainAges.length).toFixed(1)} years`)
  console.log(`   Retiring in 2 years: ${captains.filter(p => p.yearsToRetirement <= 2).length}`)
  console.log(`   Retiring in 5 years: ${captains.filter(p => p.yearsToRetirement <= 5).length}`)

  console.log(`\nFirst Officers:`)
  console.log(`   Youngest: ${Math.min(...foAges)} years`)
  console.log(`   Oldest: ${Math.max(...foAges)} years`)
  console.log(`   Average: ${(foAges.reduce((a,b) => a+b, 0) / foAges.length).toFixed(1)} years`)
  console.log(`   Retiring in 2 years: ${firstOfficers.filter(p => p.yearsToRetirement <= 2).length}`)
  console.log(`   Retiring in 5 years: ${firstOfficers.filter(p => p.yearsToRetirement <= 5).length}`)

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('✅ Analysis complete\n')
}

analyzePilotAges()
