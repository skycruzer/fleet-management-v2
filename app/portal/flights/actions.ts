'use server'

/**
 * Server Actions for Flight Requests
 */

import { z } from 'zod'
import { submitFlightRequest, getCurrentPilotUser } from '@/lib/services/pilot-portal-service'
import { validateCsrfToken } from '@/lib/csrf'
import { flightRequestRateLimit, formatRateLimitError } from '@/lib/rate-limit'
import { sanitizePlainText } from '@/lib/sanitize'

// Validation schema for flight request action
const flightRequestActionSchema = z.object({
  request_type: z.enum(['Additional Flight', 'Route Change', 'Schedule Preference', 'Training Flight', 'Other'], {
    message: 'Please select a valid request type'
  }),
  flight_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Flight date must be in YYYY-MM-DD format'),
  route: z.string().optional(),
  flight_number: z.string().optional(),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  reason: z.string().optional(),
})

export async function submitFlightRequestAction(formData: FormData) {
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
  const { success: rateLimitSuccess, reset } = await flightRequestRateLimit.limit(`user:${pilotUser.id}`)

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
      flight_date: formData.get('flight_date'),
      route: formData.get('route') || undefined,
      flight_number: formData.get('flight_number') || undefined,
      description: sanitizePlainText(formData.get('description') as string),
      reason: formData.get('reason') ? sanitizePlainText(formData.get('reason') as string) : undefined,
    }

    // Validate input
    const validatedData = flightRequestActionSchema.parse(rawData)

    // Submit flight request
    await submitFlightRequest(pilotUser.id, validatedData)

    return {
      success: true,
      message: 'Flight request submitted successfully'
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0].message
      }
    }
    // Log error type only, no user data or flight request details
    console.error('Error submitting flight request:', {
      errorType: error instanceof Error ? error.name : 'Unknown',
      errorMessage: error instanceof Error ? error.message : 'Unknown error'
    })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to submit flight request'
    }
  }
}
