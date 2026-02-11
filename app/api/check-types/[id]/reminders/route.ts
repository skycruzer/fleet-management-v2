/** Developer: Maurice Rondeau */

/**
 * Check Type Reminders API Route
 * PUT /api/check-types/[id]/reminders
 *
 * Updates reminder settings (reminder_days, email_notifications_enabled)
 * for a specific check type.
 */

import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAuthenticatedAdmin } from '@/lib/middleware/admin-auth-helper'
import { validateCsrf } from '@/lib/middleware/csrf-middleware'
import { unauthorizedResponse, validationErrorResponse } from '@/lib/utils/api-response-helper'
import { sanitizeError } from '@/lib/utils/error-sanitizer'

const VALID_REMINDER_DAYS = [90, 60, 30, 14, 7] as const

const ReminderSettingsSchema = z.object({
  reminder_days: z
    .array(
      z.number().refine((n) => (VALID_REMINDER_DAYS as readonly number[]).includes(n), {
        message: `Must be one of: ${VALID_REMINDER_DAYS.join(', ')}`,
      })
    )
    .min(0)
    .max(VALID_REMINDER_DAYS.length),
  email_notifications_enabled: z.boolean(),
})

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // CSRF Protection
    const csrfError = await validateCsrf(request)
    if (csrfError) {
      return csrfError
    }

    // Verify authentication
    const auth = await getAuthenticatedAdmin()
    if (!auth.authenticated) {
      return unauthorizedResponse()
    }

    const { id: checkTypeId } = await params

    if (!checkTypeId) {
      return NextResponse.json(
        { success: false, error: 'Check type ID is required' },
        { status: 400 }
      )
    }

    // Parse and validate request body
    let validatedData
    try {
      const body = await request.json()
      validatedData = ReminderSettingsSchema.parse(body)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return validationErrorResponse('Invalid reminder settings', [
          { field: 'body', message: error.message },
        ])
      }
      throw error
    }

    // Update check type using admin client
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('check_types')
      .update({
        reminder_days: validatedData.reminder_days,
        email_notifications_enabled: validatedData.email_notifications_enabled,
      })
      .eq('id', checkTypeId)
      .select()
      .single()

    if (error) {
      console.error('Error updating check type reminders:', error)
      return NextResponse.json(
        { success: false, error: `Failed to update reminder settings: ${error.message}` },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json({ success: false, error: 'Check type not found' }, { status: 404 })
    }

    // Revalidate admin pages
    revalidatePath('/dashboard/admin/check-types')
    revalidatePath('/dashboard/admin')

    return NextResponse.json({
      success: true,
      data,
      message: 'Reminder settings updated successfully',
    })
  } catch (error) {
    console.error('Error updating check type reminders:', error)
    const { id: checkTypeId } = await params
    const sanitized = sanitizeError(error, {
      operation: 'updateCheckTypeReminders',
      resourceId: checkTypeId,
      endpoint: '/api/check-types/[id]/reminders',
    })
    return NextResponse.json(sanitized, { status: sanitized.statusCode })
  }
}
