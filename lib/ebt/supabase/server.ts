import 'server-only'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/ebt/types'

/**
 * Server-side EBT client (service role, `ebt` schema).
 *
 * EBT's RLS policies key on a `user_role` JWT claim from the old standalone auth model,
 * which fleet admins don't carry (they authenticate via the fleet admin gate). The whole
 * /dashboard/ebt section is gated by `requireRole` (fleet admin/manager), so server-side
 * data access runs through the service role and RLS is bypassed — mirroring how the fleet
 * admin dashboard reads its own data. Never import this into a client component.
 *
 * Kept `async` + the name `createClient` so existing `await createClient()` call sites are
 * unchanged.
 */
export async function createClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set (server-only).')
  return createSupabaseClient<Database, 'ebt'>(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    db: { schema: 'ebt' },
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
