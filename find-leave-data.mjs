import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// Check different possible tables
const tables = ['leave_requests', 'flight_requests', 'pilot_leave_requests', 'leave_bids']

for (const table of tables) {
  const { count, error } = await supabase
    .from(table)
    .select('*', { count: 'exact', head: true })
  
  if (!error) {
    console.log(`${table}: ${count} records`)
  }
}
