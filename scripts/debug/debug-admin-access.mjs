import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

// Read .env.local manually
const envFile = readFileSync('.env.local', 'utf-8')
const env = {}
envFile.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=')
  if (key && valueParts.length) {
    env[key.trim()] = valueParts.join('=').trim()
  }
})

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function debugAdminAccess() {
  console.log('🔍 Debugging Admin Access for skycruzer@icloud.com')
  console.log('='.repeat(80))

  // 1. Get user from Supabase Auth
  const { data: authData } = await supabase.auth.admin.listUsers()
  const authUser = authData.users.find(u => u.email === 'skycruzer@icloud.com')

  if (!authUser) {
    console.log('❌ User not found in Supabase Auth')
    return
  }

  console.log('✅ Supabase Auth User Found:')
  console.log('   ID:', authUser.id)
  console.log('   Email:', authUser.email)
  console.log()

  // 2. Try the EXACT query that proxy.ts uses (line 214-218)
  console.log('Testing proxy.ts query (lines 214-218):')
  console.log(`  .from('an_users')`)
  console.log(`  .select('id, role')`)
  console.log(`  .eq('id', '${authUser.id}')`)
  console.log(`  .single()`)
  console.log()

  const { data: adminUser, error: adminError } = await supabase
    .from('an_users')
    .select('id, role')
    .eq('id', authUser.id)
    .single()

  if (adminError) {
    console.log('❌ Query ERROR:', adminError.message)
    console.log('   Code:', adminError.code)
    console.log('   Details:', adminError.details)
    console.log('   Hint:', adminError.hint)
    console.log()
  } else {
    console.log('✅ Query SUCCESS:')
    console.log('   Found:', !!adminUser)
    console.log('   ID:', adminUser?.id)
    console.log('   Role:', adminUser?.role)
    console.log()
  }

  // 3. Try alternative query with maybeSingle()
  console.log('Testing alternative query with .maybeSingle():')
  const { data: adminUser2, error: adminError2 } = await supabase
    .from('an_users')
    .select('id, role')
    .eq('id', authUser.id)
    .maybeSingle()

  if (adminError2) {
    console.log('❌ Query ERROR:', adminError2.message)
  } else {
    console.log('✅ Query SUCCESS:')
    console.log('   Found:', !!adminUser2)
    console.log('   ID:', adminUser2?.id)
    console.log('   Role:', adminUser2?.role)
  }
  console.log()

  // 4. Check all columns in an_users for this user
  console.log('Checking ALL columns in an_users:')
  const { data: fullUser, error: fullError } = await supabase
    .from('an_users')
    .select('*')
    .eq('id', authUser.id)
    .maybeSingle()

  if (fullError) {
    console.log('❌ Error:', fullError.message)
  } else if (!fullUser) {
    console.log('❌ No record found')
  } else {
    console.log('✅ Full record:')
    console.log(JSON.stringify(fullUser, null, 2))
  }
  console.log()

  // 5. Check RLS policies
  console.log('Checking if RLS might be blocking access...')
  const { data: rlsCheck, error: rlsError } = await supabase
    .from('an_users')
    .select('count')
    .eq('id', authUser.id)

  console.log('   RLS check result:', rlsCheck, rlsError?.message || 'no error')
  console.log()

  console.log('='.repeat(80))
}

debugAdminAccess()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
