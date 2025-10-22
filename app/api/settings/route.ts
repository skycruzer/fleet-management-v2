/**
 * System Settings API - Collection Operations
 * GET /api/settings - Get all system settings
 */

import { NextResponse } from 'next/server'
import { getSystemSettings } from '@/lib/services/admin-service'

export async function GET() {
  try {
    const settings = await getSystemSettings()

    return NextResponse.json({
      success: true,
      data: settings,
    })
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch settings',
      },
      { status: 500 }
    )
  }
}
