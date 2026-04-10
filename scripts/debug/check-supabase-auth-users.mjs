/**
 * Check Supabase Auth users
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

// Use service role if available, otherwise anon key
const supabase = createClient(supabaseUrl, serviceRoleKey || supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function checkAuthUsers() {
  console.log('Checking Supabase Auth users...')

  // If we have service role, we can list users
  if (serviceRoleKey) {
    const { data, error } = await supabase.auth.admin.listUsers()

    if (error) {
      console.error('Error fetching users:', error)
      return
    }

    console.log(`\nFound ${data.users.length} auth users:`)
    data.users.forEach((user, i) => {
      console.log(`\n${i + 1}. Email: ${user.email}`)
      console.log(`   ID: ${user.id}`)
      console.log(`   Created: ${user.created_at}`)
      console.log(`   Confirmed: ${user.email_confirmed_at ? 'Yes' : 'No'}`)
    })
  } else {
    console.log('\nNo service role key found - cannot list users without it')
    console.log('Set SUPABASE_SERVICE_ROLE_KEY in .env.local to list users')
  }
}

async function checkPilots() {
  console.log('\n\nChecking pilots table...')

  const { data, error } = await supabase
    .from('pilots')
    .select('id, first_name, last_name, employee_number, email')
    .limit(10)

  if (error) {
    console.error('Error fetching pilots:', error)
    return
  }

  console.log(`\nFound ${data.length} pilots:`)
  data.forEach((pilot, i) => {
    console.log(
      `${i + 1}. ${pilot.first_name} ${pilot.last_name} (${pilot.employee_number}) - ${pilot.email || 'No email'}`
    )
  })
}

async function checkAnUsers() {
  console.log('\n\nChecking an_users table (pilot portal)...')

  const { data, error } = await supabase
    .from('an_users')
    .select('id, employee_number, created_at, status')
    .limit(10)

  if (error) {
    console.error('Error fetching an_users:', error)
    return
  }

  console.log(`\nFound ${data.length} pilot portal users:`)
  data.forEach((user, i) => {
    console.log(
      `${i + 1}. Employee #${user.employee_number} - Status: ${user.status} - Created: ${user.created_at}`
    )
  })
}

async function main() {
  await checkAuthUsers()
  await checkPilots()
  await checkAnUsers()
}

main().catch(console.error)
