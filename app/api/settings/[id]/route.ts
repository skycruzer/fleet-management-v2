/**
 * System Settings API - Individual Setting Operations
 * PUT /api/settings/[id] - Update a specific setting
 *
 * @version 2.1.0 - SECURITY: Added CSRF protection and rate limiting
 * @updated 2025-11-04 - Critical security hardening
 * @updated 2026-06-10 - Migrated to createAdminRoute factory
 */

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { authRateLimit } from '@/lib/rate-limit'
import { updateSystemSetting } from '@/lib/services/admin-service'
import { invalidateSettingsCaches } from '@/lib/services/cache-invalidation-helper'
import { createAdminRoute } from '@/lib/middleware/create-api-route'
import { UserRole } from '@/lib/middleware/authorization-middleware'
import { sanitizeError } from '@/lib/utils/error-sanitizer'

const UpdateSettingSchema = z.object({
  value: z.union([z.string(), z.number(), z.boolean()]).optional(),
  description: z.string().max(1000, 'Description too long').optional(),
})

export const PUT = createAdminRoute(
  {
    operation: 'updateSystemSetting',
    endpoint: '/api/settings/[id]',
    rateLimit: { limiter: authRateLimit, by: 'user' },
    roles: [UserRole.ADMIN],
  },
  async ({ request, params }) => {
    try {
      const { id } = params
      const body = await request.json()
      const validation = UpdateSettingSchema.safeParse(body)

      if (!validation.success) {
        return NextResponse.json(
          { success: false, error: 'Invalid setting data', details: validation.error.issues },
          { status: 400 }
        )
      }

      const { value, description } = validation.data

      // Validate input
      if (value === undefined && !description) {
        return NextResponse.json({ success: false, error: 'No updates provided' }, { status: 400 })
      }

      // Update the setting
      const updated = await updateSystemSetting(id, { value, description })

      // Revalidate all pages that use settings (especially app_title)
      await invalidateSettingsCaches().catch((error) =>
        console.error('Cache invalidation failed (non-blocking):', error)
      )

      return NextResponse.json({
        success: true,
        data: updated,
        message: 'Setting updated successfully',
      })
    } catch (error) {
      console.error('❌ PUT /api/settings/[id] - Error:', error)
      const sanitized = sanitizeError(error, {
        operation: 'updateSystemSetting',
        settingId: params.id,
      })
      return NextResponse.json(sanitized, { status: sanitized.statusCode || 500 })
    }
  }
)
