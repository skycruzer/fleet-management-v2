#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

console.log('\n🔍 Querying database constraint\n')

const { data, error } = await supabase.rpc('exec_sql', {
  query: `
    SELECT consrc
    FROM pg_constraint
    WHERE conname = 'chk_flight_requests_type_valid'
  `
})

console.log('Constraint definition:', data, error)
