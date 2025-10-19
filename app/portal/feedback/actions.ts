'use server'

/**
 * Server Actions for Feedback Submission
 */

import { z } from 'zod'
import { submitFeedbackPost, getCurrentPilotUser } from '@/lib/services/pilot-portal-service'
import { validateCsrfToken } from '@/lib/csrf'
import { feedbackRateLimit, formatRateLimitError } from '@/lib/rate-limit'
import { sanitizePlainText } from '@/lib/sanitize'

// Validation schema for feedback action
const feedbackActionSchema = z.object({
  title: z.string().min(10, 'Title must be at least 10 characters'),
  content: z.string().min(20, 'Feedback content must be at least 20 characters'),
  category_id: z.string().optional(),
  is_anonymous: z.boolean(),
  csrfToken: z.string(),
})

export async function submitFeedbackAction(formData: FormData) {
  try {
    // Get current pilot user
    const pilotUser = await getCurrentPilotUser()
    if (!pilotUser || !pilotUser.registration_approved) {
      return {
        success: false,
        error: 'You must be an approved pilot to submit feedback',
      }
    }

    // Validate CSRF token
    const csrfToken = formData.get('csrfToken') as string
    const isValidToken = await validateCsrfToken(csrfToken)
    if (!isValidToken) {
      return {
        success: false,
        error: 'Invalid security token. Please refresh the page and try again.',
      }
    }

    // Rate limiting (5 submissions per minute)
    const { success: rateLimitSuccess, reset } = await feedbackRateLimit.limit(
      `user:${pilotUser.id}`
    )

    if (!rateLimitSuccess) {
      return {
        success: false,
        error: formatRateLimitError(reset),
      }
    }

    // Parse and validate form data
    const rawData = {
      title: formData.get('title'),
      content: formData.get('content'),
      category_id: formData.get('category_id') || undefined,
      is_anonymous: formData.get('is_anonymous') === 'true',
      csrfToken,
    }

    const validationResult = feedbackActionSchema.safeParse(rawData)
    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error.issues[0]?.message || 'Validation failed',
      }
    }

    const data = validationResult.data

    // Sanitize text inputs
    const sanitizedTitle = sanitizePlainText(data.title)
    const sanitizedContent = sanitizePlainText(data.content)

    // Submit feedback
    await submitFeedbackPost(pilotUser.id, {
      title: sanitizedTitle,
      content: sanitizedContent,
      category_id: data.category_id,
      is_anonymous: data.is_anonymous,
      author_display_name: `${pilotUser.first_name} ${pilotUser.last_name}`,
      author_rank: pilotUser.rank || 'Unknown',
    })

    return {
      success: true,
      message: 'Feedback submitted successfully!',
    }
  } catch (error) {
    console.error('Error in submitFeedbackAction:', error)
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    }
  }
}
