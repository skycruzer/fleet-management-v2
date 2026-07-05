/**
 * System Settings API - Collection Operations
 * GET /api/settings - Get all system settings
 *
 * Developer: Maurice Rondeau
 *
 * HTTP CACHING: Public, 2 hour cache (settings rarely change)
 *
 * @version 2.2.0
 * @updated 2026-01 - Added HTTP Cache-Control headers
 * @updated 2026-06-10 - Migrated to createAdminRoute factory
 */

import { NextResponse } from 'next/server'
import { getSystemSettings } from '@/lib/services/admin-service'
import { createAdminRoute } from '@/lib/middleware/create-api-route'
import { getCacheHeadersPreset } from '@/lib/utils/cache-headers'
import { sanitizeError } from '@/lib/utils/error-sanitizer'

export const GET = createAdminRoute(
  {
    operation: 'getSystemSettings',
    endpoint: '/api/settings',
    rateLimit: false,
  },
  async () => {
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
      const s = sanitizeError(error, { operation: 'getSystemSettings', endpoint: '/api/settings' })
      return NextResponse.json({ success: false, error: s.error }, { status: s.statusCode || 500 })
    }
  }
)
