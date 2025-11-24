import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const { data, error } = await supabase
  .from('pilot_requests')
  .select('id, request_category, start_date, end_date, workflow_status, roster_period, created_at')
  .order('created_at', { ascending: false })
  .limit(5)

if (error) {
  console.error('Error:', error)
} else {
  console.log('Most recent 5 requests:')
  data.forEach((req, idx) => {
    console.log(`${idx + 1}. [${req.request_category}] ${req.start_date} to ${req.end_date} | Status: ${req.workflow_status} | RP: ${req.roster_period} | Created: ${new Date(req.created_at).toLocaleString()}`)
  })
}
