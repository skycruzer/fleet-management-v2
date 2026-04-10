/**
 * Check request_method values in leave_requests table
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

// Load environment variables from .env.local
const envFile = readFileSync('.env.local', 'utf-8')
const env = {}
envFile.split('\n').forEach((line) => {
  const [key, ...valueParts] = line.split('=')
  if (key && valueParts.length) {
    env[key.trim()] = valueParts.join('=').trim()
  }
})

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

console.log('🔍 Checking request_method values in leave_requests table...\n')

// Check request_method distribution
const { data: requests, error } = await supabase
  .from('leave_requests')
  .select('id, request_method, request_type, status, created_at')
  .order('created_at', { ascending: false })
  .limit(20)

if (error) {
  console.error('❌ Error:', error.message)
  process.exit(1)
}

console.log(`📊 Found ${requests.length} recent leave requests:\n`)

const methodCounts = {}
requests.forEach((r) => {
  const method = r.request_method || 'NULL'
  methodCounts[method] = (methodCounts[method] || 0) + 1
})

console.log('Distribution by request_method:')
Object.entries(methodCounts).forEach(([method, count]) => {
  console.log(`  ${method}: ${count}`)
})

console.log('\nSample records:')
requests.slice(0, 5).forEach((r) => {
  console.log(
    `  - ID: ${r.id.substring(0, 8)}... | Method: ${r.request_method || 'NULL'} | Type: ${r.request_type} | Status: ${r.status}`
  )
})

// Check total count
const { count } = await supabase.from('leave_requests').select('*', { count: 'exact', head: true })

console.log(`\n📈 Total leave requests in database: ${count}`)

// Check NULL request_method count
const { count: nullCount } = await supabase
  .from('leave_requests')
  .select('*', { count: 'exact', head: true })
  .is('request_method', null)

console.log(`⚠️  Records with NULL request_method: ${nullCount}`)

if (nullCount > 0) {
  console.log(`\n💡 Recommendation: Backfill NULL request_method values`)
  console.log(
    `   Run: UPDATE leave_requests SET request_method = 'SYSTEM' WHERE request_method IS NULL;`
  )
}

process.exit(0)
