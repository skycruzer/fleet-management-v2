import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/supabase'
import { env } from '@/lib/env'
import { logError, ErrorSeverity } from '@/lib/error-logger'

export async function createClient() {
  try {
    const cookieStore = await cookies()

    return createServerClient<Database>(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
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
      }
    )
  } catch (error) {
    logError(error as Error, {
      source: 'SupabaseClient',
      severity: ErrorSeverity.CRITICAL,
      metadata: { operation: 'createClient' },
    })
    throw new Error('Failed to initialize Supabase client. Please check your configuration.')
  }
}
