import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

// Read environment variables
const envContent = readFileSync('.env.local', 'utf8')
const lines = envContent.split('\n')

let supabaseUrl, supabaseServiceKey
for (const line of lines) {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
    supabaseUrl = line.split('=')[1].trim()
  }
  if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) {
    supabaseServiceKey = line.split('=')[1].trim()
  }
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

console.log('🔍 Checking table schemas...\n')

// Get leave_requests columns
const { data: lr_columns } = await supabase
  .rpc('query', {
    query_text: `
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'leave_requests'
      ORDER BY ordinal_position;
    `
  }).select()

console.log('📋 leave_requests columns:')
if (lr_columns && lr_columns.length > 0) {
  lr_columns.forEach(col => console.log(`   - ${col.column_name} (${col.data_type})`))
} else {
  console.log('   ⚠️ Could not fetch columns')
}

// Get flight_requests columns
const { data: fr_columns } = await supabase
  .rpc('query', {
    query_text: `
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'flight_requests'
      ORDER BY ordinal_position;
    `
  }).select()

console.log('\n📋 flight_requests columns:')
if (fr_columns && fr_columns.length > 0) {
  fr_columns.forEach(col => console.log(`   - ${col.column_name} (${col.data_type})`))
} else {
  console.log('   ⚠️ Could not fetch columns')
}

// Get notifications columns
const { data: n_columns } = await supabase
  .rpc('query', {
    query_text: `
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'notifications'
      ORDER BY ordinal_position;
    `
  }).select()

console.log('\n📋 notifications columns:')
if (n_columns && n_columns.length > 0) {
  n_columns.forEach(col => console.log(`   - ${col.column_name} (${col.data_type})`))
} else {
  console.log('   ⚠️ Could not fetch columns')
}

// Get pilots table to understand user_id relationship
const { data: p_columns } = await supabase
  .rpc('query', {
    query_text: `
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'pilots'
      ORDER BY ordinal_position;
    `
  }).select()

console.log('\n📋 pilots columns:')
if (p_columns && p_columns.length > 0) {
  p_columns.forEach(col => console.log(`   - ${col.column_name} (${col.data_type})`))
} else {
  console.log('   ⚠️ Could not fetch columns')
}
