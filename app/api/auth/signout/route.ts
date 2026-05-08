/**
 * Sign Out API Route
 * Handles user sign out
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { validateCsrf } from '@/lib/middleware/csrf-middleware'
import { NextRequest, NextResponse } from 'next/server'
import { logError, ErrorSeverity } from '@/lib/error-logger'

export async function POST(request: NextRequest) {
  const csrfError = await validateCsrf(request)
  if (csrfError) return csrfError

  const supabase = createAdminClient()

  const { error } = await supabase.auth.signOut()
  if (error) {
    logError(new Error(error.message), {
      source: 'signout:supabase.signOut',
      severity: ErrorSeverity.HIGH,
    })
  }

  // Redirect to home page
  return NextResponse.redirect(
    new URL('/', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
  )
}
