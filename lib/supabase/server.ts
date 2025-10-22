import 'server-only'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/supabase'
import { env } from '@/lib/env'
import { logError, ErrorSeverity } from '@/lib/error-logger'

export async function createClient() {
  try {
    const cookieStore = await cookies()

    // During build phase, use process.env directly as env vars may not be validated yet
    const supabaseUrl =
      process.env.NEXT_PHASE === 'phase-production-build' ||
      process.env.NEXT_PHASE === 'phase-export'
        ? process.env.NEXT_PUBLIC_SUPABASE_URL || ''
        : env.NEXT_PUBLIC_SUPABASE_URL

    const supabaseKey =
      process.env.NEXT_PHASE === 'phase-production-build' ||
      process.env.NEXT_PHASE === 'phase-export'
        ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
        : env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    return createServerClient<Database>(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          try {
            return cookieStore.getAll()
          } catch (error) {
            logError(error as Error, {
              source: 'SupabaseClient',
              severity: ErrorSeverity.HIGH,
              metadata: { operation: 'getAll' },
            })
            return []
          }
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch (error) {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
            logError(error as Error, {
              source: 'SupabaseClient',
              severity: ErrorSeverity.MEDIUM,
              metadata: { operation: 'setAll' },
            })
          }
        },
      },
    })
  } catch (error) {
    logError(error as Error, {
      source: 'SupabaseClient',
      severity: ErrorSeverity.CRITICAL,
      metadata: { operation: 'createClient' },
    })
    throw new Error('Failed to initialize Supabase client. Please check your configuration.')
  }
}
