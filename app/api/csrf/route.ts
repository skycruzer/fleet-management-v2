/**
 * CSRF Token API Route
 * Provides CSRF tokens to authenticated clients
 *
 * Developer: Maurice Rondeau
 *
 * @version 1.0.0
 * @since 2025-10-27
 */

import { NextResponse } from 'next/server';
import { getCsrfToken, generateNewCsrfTokenPair } from '@/lib/security/csrf';

/**
 * GET /api/csrf
 * Returns the current CSRF token or generates a new one
 */
export async function GET() {
  try {
    const token = await getCsrfToken();

    return NextResponse.json({
      success: true,
      csrfToken: token,
    });
  } catch (error) {
    console.error('Error getting CSRF token:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get CSRF token' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/csrf
 * Generates a new CSRF token pair
 */
export async function POST() {
  try {
    const { token } = await generateNewCsrfTokenPair();

    return NextResponse.json({
      success: true,
      csrfToken: token,
    });
  } catch (error) {
    console.error('Error generating CSRF token:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate CSRF token' },
      { status: 500 }
    );
  }
}
