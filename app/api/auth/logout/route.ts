/**
 * Authentication Logout API Route
 *
 * POST /api/auth/logout - Sign out user and clear session
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(_request: NextRequest) {
  try {
    const supabase = await createClient()

    // Sign out the user (clears session and cookies)
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error('Logout error:', error)
      // Redirect to login even if there's an error (session might already be invalid)
      return NextResponse.redirect(new URL('/auth/login', _request.url))
    }

    // Successful logout - redirect to login page
    return NextResponse.redirect(new URL('/auth/login', _request.url))
  } catch (error) {
    console.error('Logout API error:', error)
    // Redirect to login even on error
    return NextResponse.redirect(new URL('/auth/login', _request.url))
  }
}
