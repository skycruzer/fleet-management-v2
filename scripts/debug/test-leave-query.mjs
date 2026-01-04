import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const { data, error } = await supabase
  .from('leave_requests')
  .select(
    `
    *,
    pilot:pilots!leave_requests_pilot_id_fkey(
      first_name,
      last_name,
      role,
      employee_id
    )
  `
  )
  .limit(3)

if (error) {
  console.error('Error:', error)
} else {
  console.log('Leave requests with pilots:')
  console.log(JSON.stringify(data, null, 2))
}
