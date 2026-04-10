#!/usr/bin/env tsx

/**
 * Migrate Existing Pilots to Supabase Auth
 *
 * This script migrates pilot_users records that use bcrypt authentication
 * to Supabase Auth. After migration, pilots will log in via Supabase Auth
 * instead of custom bcrypt password verification.
 *
 * Process:
 * 1. Find all pilot_users without auth_user_id (not yet migrated)
 * 2. For each pilot:
 *    - Create Supabase Auth user (admin.createUser)
 *    - Link pilot_users.auth_user_id to new auth.users.id
 *    - Send password reset email (pilots must set new password)
 *    - Log migration progress
 *
 * Usage:
 *   npm run migrate:pilots
 *   # OR
 *   npx tsx scripts/migrate-pilots-to-supabase-auth.ts
 *
 * Environment Variables Required:
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY (server-side only, never expose to client)
 *   - NEXT_PUBLIC_APP_URL
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { readFileSync } from 'fs'

// Load environment variables
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const envPath = join(__dirname, '..', '.env.local')

try {
  const envFile = readFileSync(envPath, 'utf-8')
  const env: Record<string, string> = {}

  envFile.split('\n').forEach((line) => {
    const match = line.match(/^([^#=]+)=(.*)$/)
    if (match) {
      const key = match[1].trim()
      let value = match[2].trim()
      value = value.replace(/^["']|["']$/g, '')
      env[key] = value
    }
  })

  // Set environment variables
  Object.keys(env).forEach((key) => {
    if (!process.env[key]) {
      process.env[key] = env[key]
    }
  })
} catch (error) {
  console.error('❌ Error loading .env.local:', error)
  process.exit(1)
}

// Validate required environment variables
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'NEXT_PUBLIC_APP_URL',
]

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ Missing required environment variable: ${envVar}`)
    process.exit(1)
  }
}

// Create Supabase admin client (service role)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

interface PilotUser {
  id: string
  email: string
  password_hash: string | null
  first_name: string
  last_name: string
  rank: string
  employee_id: string | null
  date_of_birth: string | null
  phone_number: string | null
  address: string | null
  registration_approved: boolean | null
  created_at: string
}

interface MigrationResult {
  success: number
  failed: number
  skipped: number
  errors: Array<{
    email: string
    error: string
  }>
}

async function migratePilotsToSupabaseAuth(): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: 0,
    failed: 0,
    skipped: 0,
    errors: [],
  }

  console.log('🚀 Starting pilot migration to Supabase Auth...\n')

  // ============================================================================
  // STEP 1: Find pilots to migrate
  // ============================================================================
  console.log('📋 Finding pilots to migrate...')

  const { data: pilotsToMigrate, error: queryError } = await supabase
    .from('pilot_users')
    .select('*')
    .is('auth_user_id', null)
    .order('created_at', { ascending: true })

  if (queryError) {
    console.error('❌ Error querying pilot_users:', queryError)
    throw queryError
  }

  if (!pilotsToMigrate || pilotsToMigrate.length === 0) {
    console.log('✅ No pilots to migrate. All pilots already have Supabase Auth accounts.')
    return result
  }

  console.log(`📊 Found ${pilotsToMigrate.length} pilots to migrate\n`)

  // ============================================================================
  // STEP 2: Migrate each pilot
  // ============================================================================
  for (let i = 0; i < pilotsToMigrate.length; i++) {
    const pilot = pilotsToMigrate[i] as PilotUser
    const pilotNum = i + 1

    console.log(`\n[${pilotNum}/${pilotsToMigrate.length}] Migrating pilot: ${pilot.email}`)
    console.log(`   Name: ${pilot.first_name} ${pilot.last_name}`)
    console.log(`   Rank: ${pilot.rank}`)
    console.log(`   Approved: ${pilot.registration_approved ? 'Yes' : 'No'}`)

    try {
      // Skip if pilot doesn't have an email
      if (!pilot.email || pilot.email.trim() === '') {
        console.log('   ⚠️  Skipped - No email address')
        result.skipped++
        continue
      }

      // ========================================================================
      // STEP 2.1: Check if auth user already exists
      // ========================================================================
      const { data: existingAuthUser } = await supabase.auth.admin.listUsers()

      const userExists = existingAuthUser.users?.some(
        (u) => u.email?.toLowerCase() === pilot.email.toLowerCase()
      )

      let authUserId: string

      if (userExists) {
        console.log('   ℹ️  Auth user already exists, linking...')
        const existingUser = existingAuthUser.users.find(
          (u) => u.email?.toLowerCase() === pilot.email.toLowerCase()
        )
        authUserId = existingUser!.id
      } else {
        // ======================================================================
        // STEP 2.2: Create Supabase Auth user
        // ======================================================================
        console.log('   📝 Creating Supabase Auth user...')

        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: pilot.email,
          email_confirm: true, // Auto-confirm email (pilots are pre-approved)
          user_metadata: {
            first_name: pilot.first_name,
            last_name: pilot.last_name,
            rank: pilot.rank,
            employee_id: pilot.employee_id,
            user_type: 'pilot',
            migrated_from_bcrypt: true,
            migration_date: new Date().toISOString(),
          },
        })

        if (authError) {
          console.error(`   ❌ Failed to create auth user: ${authError.message}`)
          result.failed++
          result.errors.push({
            email: pilot.email,
            error: authError.message,
          })
          continue
        }

        authUserId = authData.user.id
        console.log(`   ✅ Auth user created: ${authUserId}`)
      }

      // ========================================================================
      // STEP 2.3: Link pilot_users to auth.users
      // ========================================================================
      console.log('   🔗 Linking pilot_users to auth.users...')

      const { error: updateError } = await supabase
        .from('pilot_users')
        .update({
          auth_user_id: authUserId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', pilot.id)

      if (updateError) {
        console.error(`   ❌ Failed to link pilot_users: ${updateError.message}`)
        result.failed++
        result.errors.push({
          email: pilot.email,
          error: updateError.message,
        })
        continue
      }

      console.log('   ✅ Linked successfully')

      // ========================================================================
      // STEP 2.4: Send password reset email
      // ========================================================================
      console.log('   📧 Sending password reset email...')

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(pilot.email, {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/portal/reset-password`,
      })

      if (resetError) {
        console.warn(`   ⚠️  Failed to send password reset email: ${resetError.message}`)
        // Don't fail the migration - pilot can request password reset manually
      } else {
        console.log('   ✅ Password reset email sent')
      }

      result.success++
      console.log(`   ✅ Migration complete for ${pilot.email}`)
    } catch (error: any) {
      console.error(`   ❌ Unexpected error migrating ${pilot.email}:`, error.message)
      result.failed++
      result.errors.push({
        email: pilot.email,
        error: error.message || 'Unknown error',
      })
    }
  }

  return result
}

// ============================================================================
// Main execution
// ============================================================================
async function main() {
  try {
    console.log('╔════════════════════════════════════════════════════════════╗')
    console.log('║   Pilot Migration to Supabase Auth                         ║')
    console.log('║   Fleet Management V2                                      ║')
    console.log('╚════════════════════════════════════════════════════════════╝\n')

    const result = await migratePilotsToSupabaseAuth()

    console.log('\n\n╔════════════════════════════════════════════════════════════╗')
    console.log('║   Migration Summary                                        ║')
    console.log('╚════════════════════════════════════════════════════════════╝\n')

    console.log(`✅ Successfully migrated: ${result.success}`)
    console.log(`❌ Failed migrations: ${result.failed}`)
    console.log(`⚠️  Skipped: ${result.skipped}`)
    console.log(`📊 Total processed: ${result.success + result.failed + result.skipped}\n`)

    if (result.errors.length > 0) {
      console.log('❌ Errors encountered:\n')
      result.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error.email}`)
        console.log(`   Error: ${error.error}\n`)
      })
    }

    if (result.success > 0) {
      console.log('\n📧 Next Steps:')
      console.log('   1. Migrated pilots will receive password reset emails')
      console.log('   2. They must click the link and set a new password')
      console.log('   3. After password reset, they can login via /portal/login')
      console.log('   4. Old bcrypt passwords will no longer work\n')
    }

    console.log('✅ Migration complete!')
    process.exit(0)
  } catch (error: any) {
    console.error('\n❌ Migration failed:', error.message)
    process.exit(1)
  }
}

// Run migration
main()
