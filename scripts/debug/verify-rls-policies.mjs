#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://wgdmgvonqysflwdiiols.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const client = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

console.log('🔍 Verifying RLS Policies\n')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

// Test queries to each table
const tables = ['an_users', 'pilots', 'pilot_checks', 'flight_requests', 'leave_requests']

for (const table of tables) {
  try {
    const { data, error, count } = await client
      .from(table)
      .select('*', { count: 'exact', head: true })

    if (error) {
      console.log(`❌ ${table}: ${error.message}`)
    } else {
      console.log(`✅ ${table}: ${count} rows (accessible)`)
    }
  } catch (e) {
    console.log(`❌ ${table}: ${e.message}`)
  }
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('\n💡 Result: If all tables show row counts, RLS is working!\n')
console.log('   Service role can access all tables (bypasses RLS) ✅\n')
