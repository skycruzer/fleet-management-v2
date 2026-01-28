/**
 * Sign Out API Route
 * Handles user sign out
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST() {
  const supabase = createAdminClient()

  // Sign out user
  await supabase.auth.signOut()

  // Redirect to home page
  return NextResponse.redirect(
    new URL('/', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
  )
}
