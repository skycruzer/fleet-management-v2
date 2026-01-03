/**
 * Admin Supabase Client
 * Uses service role key to bypass RLS for authenticated admin operations
 *
 * SECURITY: Only use this client AFTER verifying admin authentication
 * via getAuthenticatedAdmin() in API routes. Never expose to client.
 *
 * @author Maurice Rondeau (Skycruzer)
 * @version 1.0.0
 */

import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

/**
 * Creates a Supabase client with service role key.
 * BYPASSES RLS - only use after verifying admin authentication!
 *
 * Usage: Only call from API routes or services that have verified
 * admin auth via getAuthenticatedAdmin()
 *
 * @example
 * ```typescript
 * // In a service function called from an authenticated API route
 * import { createAdminClient } from '@/lib/supabase/admin'
 *
 * export async function updatePilot(id: string, data: PilotData) {
 *   const supabase = createAdminClient()
 *   const { data, error } = await supabase
 *     .from('pilots')
 *     .update(data)
 *     .eq('id', id)
 *   // ...
 * }
 * ```
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is required')
  }

  // In production/runtime, require service role key
  // During build, allow fallback to anon key (won't be used for actual operations)
  const isBuildPhase =
    process.env.NEXT_PHASE === 'phase-production-build' || process.env.NEXT_PHASE === 'phase-export'

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!serviceRoleKey && !isBuildPhase) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is required for admin operations. ' +
        'Ensure this environment variable is set in your deployment.'
    )
  }

  // During build, use anon key as fallback (won't actually make DB calls)
  const key = serviceRoleKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

  return createClient<Database>(supabaseUrl, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
