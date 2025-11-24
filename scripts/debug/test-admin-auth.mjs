/**
 * Test Admin Authentication
 * Verify Supabase Auth is working
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('=== Testing Admin Authentication ===\n')

console.log('1. Environment Variables:')
console.log('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ SET' : '❌ MISSING')
console.log('   NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? '✅ SET' : '❌ MISSING')
console.log()

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

console.log('2. Testing Supabase Connection:')
try {
  // Test basic query
  const { data, error } = await supabase
    .from('pilots')
    .select('id')
    .limit(1)

  if (error) {
    console.error('   ❌ Connection failed:', error.message)
  } else {
    console.log('   ✅ Connection successful')
  }
} catch (err) {
  console.error('   ❌ Connection error:', err.message)
}

console.log('\n3. Checking Auth Users:')
try {
  // List auth users (requires service role key)
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!serviceRoleKey) {
    console.log('   ⚠️  SUPABASE_SERVICE_ROLE_KEY not set')
    console.log('   ℹ️  Cannot list users without service role key')
    console.log('   ℹ️  Check Supabase Dashboard: https://app.supabase.com/project/wgdmgvonqysflwdiiols/auth/users')
  } else {
    const adminClient = createClient(supabaseUrl, serviceRoleKey)
    const { data: { users }, error } = await adminClient.auth.admin.listUsers()

    if (error) {
      console.error('   ❌ Failed to list users:', error.message)
    } else {
      console.log(`   ✅ Found ${users?.length || 0} auth users`)
      if (users && users.length > 0) {
        console.log('\n   Auth Users:')
        users.forEach(user => {
          console.log(`   - ${user.email} (created: ${new Date(user.created_at).toLocaleDateString()})`)
        })
      }
    }
  }
} catch (err) {
  console.error('   ❌ Error checking users:', err.message)
}

console.log('\n4. Recommended Actions:')
console.log('   1. Visit Supabase Dashboard to verify admin user exists:')
console.log('      https://app.supabase.com/project/wgdmgvonqysflwdiiols/auth/users')
console.log('   2. If user exists, try resetting password')
console.log('   3. Clear browser cache and cookies')
console.log('   4. Try incognito/private browsing mode')
console.log('   5. Verify .env.local has correct Supabase credentials')
console.log('\n5. Admin Login URL:')
console.log('   http://localhost:3002/auth/login')
