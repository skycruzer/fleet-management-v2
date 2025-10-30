'use server'

/**
 * Leave Request Form Server Actions
 *
 * Server actions for pilot leave request submission.
 * Calls service layer directly for better performance and auth handling.
 */

import { revalidatePath } from 'next/cache'
import { submitPilotLeaveRequest } from '@/lib/services/pilot-leave-service'

export async function submitLeaveRequestAction(formData: FormData) {
  try {
    // Extract form data
    const requestType = formData.get('request_type') as string
    const startDate = formData.get('start_date') as string
    const endDate = formData.get('end_date') as string
    const reason = formData.get('reason') as string | null

    // Validate required fields
    if (!requestType || !startDate || !endDate) {
      return { success: false, error: 'Missing required fields' }
    }

    // Call service layer directly (more efficient than API call)
    // Note: roster_period and days_count are calculated server-side
    const result = await submitPilotLeaveRequest({
      request_type: requestType as any,
      start_date: startDate,
      end_date: endDate,
      reason: reason || null,
    })

    if (!result.success) {
      return { success: false, error: result.error || 'Failed to submit leave request' }
    }

    // Revalidate the portal pages to show updated data
    revalidatePath('/portal/leave-requests')
    revalidatePath('/portal/dashboard')

    return { success: true, data: result.data }
  } catch (error) {
    console.error('Submit leave request action error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}
