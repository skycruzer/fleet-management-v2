'use server'

/**
 * Server Actions for Feedback
 */

import { z } from 'zod'
import { submitFeedbackPost, getCurrentPilotUser } from '@/lib/services/pilot-portal-service'
import { validateCsrfToken } from '@/lib/csrf'
import { feedbackRateLimit, formatRateLimitError } from '@/lib/rate-limit'
import { sanitizePlainText, sanitizeHtml } from '@/lib/sanitize'

// Validation schema for feedback action
const feedbackActionSchema = z.object({
  title: z.string().min(10, 'Title must be at least 10 characters'),
  content: z.string().min(20, 'Feedback content must be at least 20 characters'),
  category_id: z.string().optional(),
  is_anonymous: z.boolean(),
})

export async function submitFeedbackAction(formData: FormData) {
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

  // Check rate limit (5 requests per minute)
  const { success: rateLimitSuccess, reset } = await feedbackRateLimit.limit(`user:${pilotUser.id}`)

  if (!rateLimitSuccess) {
    return {
      success: false,
      error: formatRateLimitError(reset)
    }
  }

  try {
    // Extract and sanitize form data to prevent XSS attacks
    const rawData = {
      title: sanitizePlainText(formData.get('title') as string),
      content: sanitizeHtml(formData.get('content') as string),
      category_id: formData.get('category_id') || undefined,
      is_anonymous: formData.get('is_anonymous') === 'true',
    }

    // Validate input
    const validatedData = feedbackActionSchema.parse(rawData)

    // Submit feedback post
    await submitFeedbackPost(pilotUser.id, {
      ...validatedData,
      author_display_name: `${pilotUser.rank} ${pilotUser.first_name} ${pilotUser.last_name}`,
      author_rank: pilotUser.rank,
    })

    return {
      success: true,
      message: 'Feedback submitted successfully'
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0].message
      }
    }
    // Log error type only, no user data or feedback content
    console.error('Error submitting feedback:', {
      errorType: error instanceof Error ? error.name : 'Unknown',
      errorMessage: error instanceof Error ? error.message : 'Unknown error'
    })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to submit feedback'
    }
  }
}
