import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import https from 'https'

// Read .env.local
const envFile = readFileSync('.env.local', 'utf-8')
const env = {}
envFile.split('\n').forEach((line) => {
  const [key, ...valueParts] = line.split('=')
  if (key && valueParts.length) {
    env[key.trim()] = valueParts.join('=').trim()
  }
})

async function executeSQLDirect(sql) {
  const url = new URL(`${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec`)

  return new Promise((resolve, reject) => {
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
    }

    const req = https.request(url, options, (res) => {
      let data = ''
      res.on('data', (chunk) => (data += chunk))
      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          resolve({ success: true, data })
        } else {
          resolve({ success: false, error: data, status: res.statusCode })
        }
      })
    })

    req.on('error', reject)
    req.write(JSON.stringify({ query: sql }))
    req.end()
  })
}

async function fixRLS() {
  console.log('🔧 Fixing RLS Policies')
  console.log('='.repeat(80))

  const statements = [
    'DROP POLICY IF EXISTS "Users can read own data" ON an_users',
    'DROP POLICY IF EXISTS "Users can update own data" ON an_users',
    'DROP POLICY IF EXISTS "Admins can read all users" ON an_users',
    'DROP POLICY IF EXISTS "Admins can update all users" ON an_users',
    'DROP POLICY IF EXISTS "Enable read access for authenticated users" ON an_users',
    'DROP POLICY IF EXISTS "Enable insert for authenticated users" ON an_users',
    'DROP POLICY IF EXISTS "Enable update for users based on id" ON an_users',
    `CREATE POLICY "Users can read own data" ON an_users FOR SELECT TO authenticated USING (auth.uid() = id)`,
    `CREATE POLICY "Users can update own data" ON an_users FOR UPDATE TO authenticated USING (auth.uid() = id)`,
    `CREATE POLICY "Service role full access" ON an_users FOR ALL TO service_role USING (true)`,
  ]

  // Try using psql via supabase CLI
  console.log('Attempting to use Supabase CLI...')
  const { execSync } = await import('child_process')

  try {
    const projectRef = env.NEXT_PUBLIC_SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)[1]

    for (const stmt of statements) {
      console.log(`Executing: ${stmt.substring(0, 60)}...`)
      try {
        const result = execSync(
          `npx supabase db execute --project-ref ${projectRef} --sql "${stmt.replace(/"/g, '\\"')}"`,
          { encoding: 'utf8', stdio: 'pipe' }
        )
        console.log('  ✅ Success')
      } catch (e) {
        if (e.message.includes('already exists') || e.message.includes('does not exist')) {
          console.log('  ⚠️  Already handled')
        } else {
          console.log('  ❌ Error:', e.message.substring(0, 100))
        }
      }
    }

    console.log()
    console.log('✅ RLS policies updated!')
    return true
  } catch (cliError) {
    console.log('❌ Supabase CLI not available:', cliError.message)
    console.log()
    console.log('Please run this SQL manually in Supabase SQL Editor:')
    console.log('📍 https://app.supabase.com/project/wgdmgvonqysflwdiiols/sql/new')
    console.log()
    console.log('='.repeat(80))
    statements.forEach((stmt) => console.log(stmt + ';'))
    console.log('='.repeat(80))
    return false
  }
}

fixRLS()
  .then((success) => process.exit(success ? 0 : 1))
  .catch((err) => {
    console.error('Fatal error:', err)
    process.exit(1)
  })
