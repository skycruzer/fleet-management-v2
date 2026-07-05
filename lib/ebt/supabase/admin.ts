import 'server-only'
import { createClient as createAdmin } from '@supabase/supabase-js'
import type { Database } from '@/lib/ebt/types'

/** Service-role client. NEVER import into a client component. Bypasses RLS. */
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set (server-only).')
  return createAdmin<Database, 'ebt'>(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    // EBT objects live in the `ebt` schema of the shared fleet Supabase project.
    db: { schema: 'ebt' },
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
