import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

// Load .env.local manually
const envContent = readFileSync('.env.local', 'utf-8')
const envVars = {}
envContent.split('\n').forEach((line) => {
  const match = line.match(/^([^=]+)=(.*)$/)
  if (match) {
    envVars[match[1].trim()] = match[2].trim()
  }
})

const supabase = createClient(
  envVars.NEXT_PUBLIC_SUPABASE_URL,
  envVars.SUPABASE_SERVICE_ROLE_KEY || envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function checkAuth() {
  console.log('=== ADMIN AUTHENTICATION (Supabase Auth) ===')
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
  if (authError) {
    console.log('Error fetching auth users:', authError.message)
  } else {
    console.log('Total auth users:', authUsers.users.length)
    authUsers.users.forEach((user) => {
      console.log(
        `- Email: ${user.email} | ID: ${user.id} | Confirmed: ${user.email_confirmed_at ? 'Yes' : 'No'}`
      )
    })
  }

  console.log('\n=== CHECKING PILOT PORTAL TABLES ===')

  // Check pilot_users table
  console.log('\n1. pilot_users table (expected for pilot portal):')
  const { data: pilotUsersData, error: pilotUsersError } = await supabase
    .from('pilot_users')
    .select('*')
    .limit(5)

  if (pilotUsersError) {
    console.log('   ERROR:', pilotUsersError.message)
  } else if (pilotUsersData && pilotUsersData.length > 0) {
    console.log('   Available columns:', Object.keys(pilotUsersData[0]).join(', '))
    console.log('   Total records:', pilotUsersData.length)
    pilotUsersData.forEach((u) => {
      const hasPassword = u.password_hash && u.password_hash.length > 0
      console.log(`   - Email: ${u.email}`)
      console.log(`     Approved: ${u.registration_approved}`)
      console.log(`     Has Password: ${hasPassword ? 'YES' : 'NO (⚠️ CANNOT LOGIN)'}`)
      console.log(`     Pilot ID: ${u.pilot_id || 'N/A'}`)
      console.log(`     Auth User ID: ${u.auth_user_id || 'N/A'}`)
    })
  } else {
    console.log('   Table exists but is EMPTY')
  }

  console.log('\n2. an_users table (admin users only):')

  // First check what columns exist
  const { data: schema, error: schemaError } = await supabase.from('an_users').select('*').limit(1)

  if (schema && schema.length > 0) {
    console.log('Available columns:', Object.keys(schema[0]).join(', '))
  }

  const { data: pilotUsers, error: pilotError } = await supabase
    .from('an_users')
    .select('*')
    .order('created_at', { ascending: false })

  if (pilotError) {
    console.log('Error fetching pilot users:', pilotError.message)
  } else {
    console.log('Total pilot portal users:', pilotUsers?.length || 0)
    pilotUsers?.forEach((user) => {
      const empNum = user.employee_number || user.pilot_id || user.username || 'N/A'
      console.log(`- User: ${empNum} | Email: ${user.email} | Status: ${user.status || 'N/A'}`)
      console.log(`  Full record:`, JSON.stringify(user, null, 2))
    })
  }

  console.log('\n=== CHECKING PILOT-USER LINKS ===')
  const { data: pilots, error: pilotsError } = await supabase
    .from('pilots')
    .select('id, employee_number, first_name, last_name, email')
    .order('employee_number')

  if (!pilotsError && pilots) {
    console.log('Total pilots in system:', pilots.length)
    console.log('\nFirst 5 pilots:')
    pilots.slice(0, 5).forEach((p) => {
      console.log(`- #${p.employee_number}: ${p.first_name} ${p.last_name} | Email: ${p.email}`)
    })
  }

  console.log('\n=== RECENT MIGRATIONS ===')
  const { data: migrations, error: migError } = await supabase
    .from('schema_migrations')
    .select('version')
    .order('version', { ascending: false })
    .limit(5)

  if (!migError && migrations) {
    migrations.forEach((m) => console.log(`- ${m.version}`))
  }
}

checkAuth().catch(console.error)
