/**
 * Authentication Logout API Route
 *
 * POST /api/auth/logout - Sign out user and clear session
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ERROR_MESSAGES, formatApiError } from '@/lib/utils/error-messages'

export async function POST(_request: NextRequest) {
  try {
    const supabase = await createClient()

    // Sign out the user (clears session and cookies)
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error('Logout error:', error)
      return NextResponse.json(formatApiError(ERROR_MESSAGES.NETWORK.SERVER_ERROR, 500), {
        status: 500,
      })
    }

    // Successful logout
    return NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    })
  } catch (error) {
    console.error('Logout API error:', error)
    return NextResponse.json(formatApiError(ERROR_MESSAGES.NETWORK.SERVER_ERROR, 500), {
      status: 500,
    })
  }
}
