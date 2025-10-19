/**
 * Sign Out API Route
 * Handles user sign out
 */

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { NextResponse } from 'next/server'

export async function POST() {
  const supabase = await createClient()

  // Sign out user
  await supabase.auth.signOut()

  // Redirect to home page
  return NextResponse.redirect(new URL('/', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'))
}
