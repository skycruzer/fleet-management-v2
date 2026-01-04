#!/usr/bin/env node

/**
 * Fix RLS Policy on failed_login_attempts Table
 * Author: Maurice Rondeau
 *
 * Disables RLS on failed_login_attempts to allow pilot portal login to work
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

// Read .env.local
const envFile = readFileSync('.env.local', 'utf8')
const env = {}
envFile.split('\n').forEach((line) => {
  const match = line.match(/^([^=:#]+)=(.*)$/)
  if (match) env[match[1].trim()] = match[2].trim()
})

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function fixRLSPolicy() {
  console.log('\n🔧 Fixing RLS Policy on failed_login_attempts Table...\n')

  try {
    // Execute SQL to disable RLS
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE failed_login_attempts DISABLE ROW LEVEL SECURITY;',
    })

    if (error) {
      console.error('❌ Error executing SQL:', error.message)
      console.log('\n💡 Trying alternative method...\n')

      // Alternative: Try using Postgres connection string
      console.log('⚠️  Direct SQL execution not available via RPC.')
      console.log('📋 Please run this SQL manually in Supabase dashboard:\n')
      console.log('   ALTER TABLE failed_login_attempts DISABLE ROW LEVEL SECURITY;\n')
      console.log('🌐 Supabase SQL Editor:')
      console.log('   https://app.supabase.com/project/wgdmgvonqysflwdiiols/sql/new\n')
      return false
    }

    console.log('✅ RLS disabled successfully!\n')

    // Verify the change
    const { data: tableInfo, error: verifyError } = await supabase
      .from('pg_tables')
      .select('tablename, rowsecurity')
      .eq('tablename', 'failed_login_attempts')
      .single()

    if (!verifyError && tableInfo) {
      console.log('📊 Verification:')
      console.log(`   Table: ${tableInfo.tablename}`)
      console.log(`   RLS Enabled: ${tableInfo.rowsecurity}`)
      console.log('\n✨ Pilot portal login should now work!')
    }

    return true
  } catch (err) {
    console.error('❌ Unexpected error:', err)
    return false
  }
}

fixRLSPolicy()
  .then((success) => {
    if (success) {
      console.log('\n🎉 Fix applied successfully!')
      console.log('\n🧪 Next steps:')
      console.log('   1. Test login at: http://localhost:3003/portal/login')
      console.log('   2. Email: mrondeau@airniugini.com.pg')
      console.log('   3. Password: mron2393')
      console.log('   4. Should redirect to /portal/dashboard ✅\n')
    }
    process.exit(0)
  })
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
