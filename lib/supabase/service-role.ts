/**
 * Supabase Service Role Client
 *
 * Creates a Supabase client with service role privileges that bypasses RLS.
 * ONLY use this in server-side contexts (API routes, server actions, services).
 *
 * Use cases:
 * - Pilot portal API submissions (pilots use custom auth, not Supabase Auth)
 * - Admin operations that need to bypass RLS
 * - System-level operations (migrations, background jobs)
 *
 * SECURITY WARNING: Service role has full database access. Never expose to client.
 *
 * @author Maurice Rondeau
 * @date November 20, 2025
 */

import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'
import { env } from '@/lib/env'
import { logError, ErrorSeverity } from '@/lib/error-logger'

// Custom fetch with increased timeout
const customFetch: typeof fetch = (input, init?) => {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 30000) // 30 seconds

  return fetch(input, {
    ...init,
    signal: controller.signal,
  }).finally(() => clearTimeout(timeout))
}

/**
 * Create Supabase client with service role privileges
 *
 * Bypasses Row Level Security (RLS) policies.
 * Use ONLY for pilot portal submissions and admin operations.
 */
export function createServiceRoleClient() {
  try {
    const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseServiceKey) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured')
    }

    return createSupabaseClient<Database>(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        fetch: customFetch,
      },
    })
  } catch (error) {
    logError(error as Error, {
      source: 'SupabaseServiceRoleClient',
      severity: ErrorSeverity.CRITICAL,
      metadata: { operation: 'createServiceRoleClient' },
    })
    throw new Error('Failed to initialize Supabase service role client')
  }
}
