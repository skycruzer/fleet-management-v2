import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const envContent = readFileSync('.env.local', 'utf8')
const envVars = {}
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=')
  if (key && valueParts.length) {
    envVars[key.trim()] = valueParts.join('=').trim()
  }
})

const supabase = createClient(
  envVars.NEXT_PUBLIC_SUPABASE_URL,
  envVars.SUPABASE_SERVICE_ROLE_KEY
)

async function checkChannels() {
  console.log('Checking original leave_requests channels...\n')

  const { data } = await supabase
    .from('leave_requests')
    .select('request_method')

  const methods = {}
  data.forEach(req => {
    const method = req.request_method || 'NULL'
    methods[method] = (methods[method] || 0) + 1
  })

  console.log('Request methods:')
  Object.entries(methods).forEach(([method, count]) => {
    console.log(`  ${method}: ${count}`)
  })
}

checkChannels().catch(console.error)
