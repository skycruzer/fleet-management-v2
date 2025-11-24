import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Get one existing record to see its structure
const { data, error } = await supabase
  .from('pilot_requests')
  .select('*')
  .limit(1)
  .single()

if (error) {
  console.error('Error:', error.message)
} else {
  console.log('\n=== PILOT_REQUESTS SCHEMA ===\n')
  console.log('Required fields in existing record:\n')
  const sortedKeys = Object.keys(data).sort()
  sortedKeys.forEach(key => {
    const value = data[key]
    const type = value === null ? 'null' : typeof value
    console.log(`   ${key.padEnd(30)} = ${value}`)
  })
}
