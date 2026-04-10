'use server'

/**
 * Feedback Form Server Actions
 *
 * Server actions for pilot feedback submission.
 * Author: Maurice Rondeau
 */

import { revalidatePath } from 'next/cache'
import { submitFeedback } from '@/lib/services/pilot-feedback-service'
import { PilotFeedbackSchema } from '@/lib/validations/pilot-feedback-schema'

export async function submitFeedbackAction(formData: FormData) {
  try {
    // Extract form data
    const category = formData.get('category') as string
    const subject = formData.get('subject') as string
    const message = formData.get('message') as string
    const isAnonymous = formData.get('is_anonymous') === 'true'

    // Validate using Zod schema
    const validation = PilotFeedbackSchema.safeParse({
      category,
      subject,
      message,
      is_anonymous: isAnonymous,
    })

    if (!validation.success) {
      return {
        success: false,
        error: validation.error.issues[0]?.message || 'Invalid feedback data',
      }
    }

    // Submit via service layer
    const result = await submitFeedback(validation.data)

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Failed to submit feedback',
      }
    }

    // Revalidate portal pages to show new feedback
    revalidatePath('/portal/feedback')
    revalidatePath('/portal/dashboard')

    return {
      success: true,
      data: result.data,
      message: 'Feedback submitted successfully',
    }
  } catch (error) {
    console.error('Submit feedback action error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}
