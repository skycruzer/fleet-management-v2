/**
 * Developer: Maurice Rondeau
 * Check flight_requests table constraints
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkConstraints() {
  console.log('🔍 Checking flight_requests table constraints...\n')

  // Query CHECK constraints on flight_requests table
  const { data, error } = await supabase.rpc('execute_sql', {
    query: `
      SELECT
        conname AS constraint_name,
        pg_get_constraintdef(oid) AS constraint_definition
      FROM pg_constraint
      WHERE conrelid = 'flight_requests'::regclass
        AND contype = 'c';
    `,
  })

  if (error) {
    console.error('❌ Error querying constraints:', error.message)

    // Try alternative approach using direct SQL
    console.log('\n🔄 Trying alternative query method...\n')

    const { data: altData, error: altError } = await supabase
      .from('pg_constraint')
      .select('conname, oid')
      .eq('contype', 'c')

    if (altError) {
      console.error('❌ Alternative query also failed:', altError.message)
      console.log('\n📋 Manual Check Required:')
      console.log('Run this SQL in Supabase SQL Editor:')
      console.log(`
SELECT
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'flight_requests'::regclass
  AND contype = 'c';
      `)
      process.exit(1)
    }

    console.log('Alternative data:', altData)
  } else {
    console.log('✅ Constraints found:', data)
  }

  // Also check the table structure
  console.log('\n🔍 Checking flight_requests table columns...\n')

  const { data: columns, error: colError } = await supabase
    .from('flight_requests')
    .select('*')
    .limit(0)

  if (colError) {
    console.error('❌ Error checking columns:', colError.message)
  } else {
    console.log('✅ Table exists and is accessible')
  }
}

checkConstraints()
  .then(() => {
    console.log('\n✅ Constraint check complete')
    process.exit(0)
  })
  .catch((err) => {
    console.error('❌ Unexpected error:', err)
    process.exit(1)
  })
