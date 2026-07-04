import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/lib/ebt/types'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    // EBT objects live in the `ebt` schema of the shared fleet Supabase project.
    { db: { schema: 'ebt' } }
  )
}
