'use server'

/**
 * Server Actions for Leave Requests
 */

import { z } from 'zod'
import { submitLeaveRequest, getCurrentPilotUser } from '@/lib/services/pilot-portal-service'
import { validateCsrfToken } from '@/lib/csrf'
import { leaveRequestRateLimit, formatRateLimitError } from '@/lib/rate-limit'
import { sanitizePlainText } from '@/lib/sanitize'

// Validation schema for leave request action
const leaveRequestActionSchema = z.object({
  request_type: z.enum(['Annual Leave', 'Sick Leave', 'Personal Leave', 'Training', 'Other'], {
    message: 'Please select a valid leave type'
  }),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format'),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format'),
  roster_period: z.string().regex(/^RP\d{1,2}\/\d{4}$/, 'Roster period must be in format RP##/YYYY'),
  reason: z.string().optional(),
  days_count: z.number().positive('Days count must be a positive number'),
}).refine((data) => new Date(data.end_date) >= new Date(data.start_date), {
  message: 'End date must be on or after start date',
  path: ['end_date'],
})

export async function submitLeaveRequestAction(formData: FormData) {
  // Validate CSRF token first
  const csrfToken = formData.get('csrf_token') as string
  if (!await validateCsrfToken(csrfToken)) {
    return {
      success: false,
      error: 'Invalid security token. Please refresh the page and try again.'
    }
  }

  // Get current pilot user
  const pilotUser = await getCurrentPilotUser()

  if (!pilotUser || !pilotUser.registration_approved) {
    return {
      success: false,
      error: 'Unauthorized: Not a registered pilot'
    }
  }

  // Check rate limit (3 requests per minute)
  const { success: rateLimitSuccess, reset } = await leaveRequestRateLimit.limit(`user:${pilotUser.id}`)

  if (!rateLimitSuccess) {
    return {
      success: false,
      error: formatRateLimitError(reset)
    }
  }

  try {
    // Extract and sanitize form data to prevent XSS attacks
    const rawData = {
      request_type: formData.get('request_type'),
      start_date: formData.get('start_date'),
      end_date: formData.get('end_date'),
      roster_period: formData.get('roster_period'),
      reason: formData.get('reason') ? sanitizePlainText(formData.get('reason') as string) : undefined,
      days_count: parseInt(formData.get('days_count') as string),
    }

    // Validate input
    const validatedData = leaveRequestActionSchema.parse(rawData)

    // Submit leave request
    await submitLeaveRequest(pilotUser.id, validatedData)

    return {
      success: true,
      message: 'Leave request submitted successfully'
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0].message
      }
    }
    // Log error type only, no user data or leave request details (may contain medical info)
    console.error('Error submitting leave request:', {
      errorType: error instanceof Error ? error.name : 'Unknown',
      errorMessage: error instanceof Error ? error.message : 'Unknown error'
    })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to submit leave request'
    }
  }
}
