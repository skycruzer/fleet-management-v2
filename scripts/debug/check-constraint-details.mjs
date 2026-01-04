/**
 * Check constraint details from database
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

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

async function checkConstraints() {
  console.log('\n🔍 Checking leave_requests Table Constraints\n')

  // Query pg_catalog for constraint details
  const { data, error } = await supabase.rpc('exec_sql', {
    query: `
      SELECT
        con.conname AS constraint_name,
        con.contype AS constraint_type,
        CASE con.contype
          WHEN 'c' THEN 'CHECK'
          WHEN 'f' THEN 'FOREIGN KEY'
          WHEN 'p' THEN 'PRIMARY KEY'
          WHEN 'u' THEN 'UNIQUE'
          WHEN 't' THEN 'TRIGGER'
          WHEN 'x' THEN 'EXCLUSION'
        END AS type_description,
        pg_get_constraintdef(con.oid) AS constraint_definition
      FROM pg_constraint con
      JOIN pg_class rel ON rel.oid = con.conrelid
      JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
      WHERE rel.relname = 'leave_requests'
      AND nsp.nspname = 'public'
      ORDER BY con.conname;
    `,
  })

  if (error) {
    console.error('Error:', error.message)
    console.log('\nTrying alternative query...\n')

    // Try direct query
    const { data: constraints, error: err2 } = await supabase
      .from('information_schema.table_constraints')
      .select('*')
      .eq('table_name', 'leave_requests')

    if (err2) {
      console.error('Alternative query error:', err2.message)
      return
    }

    console.log('Constraints found:', JSON.stringify(constraints, null, 2))
  } else {
    console.log('Constraints:', data)
  }
}

checkConstraints()
