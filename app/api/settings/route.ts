/**
 * System Settings API - Collection Operations
 * GET /api/settings - Get all system settings
 *
 * Developer: Maurice Rondeau
 *
 * HTTP CACHING: Public, 2 hour cache (settings rarely change)
 *
 * @version 2.1.0
 * @updated 2026-01 - Added HTTP Cache-Control headers
 */

import { NextResponse } from 'next/server'
import { getSystemSettings } from '@/lib/services/admin-service'
import { getCacheHeadersPreset } from '@/lib/utils/cache-headers'

export async function GET() {
  try {
    const settings = await getSystemSettings()

    return NextResponse.json(
      {
        success: true,
        data: settings,
      },
      {
        headers: getCacheHeadersPreset('REFERENCE_DATA'),
      }
    )
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
