'use server'

/**
 * Flight Request Form Server Actions
 *
 * Server actions for pilot flight request submission.
 */

import { revalidatePath } from 'next/cache'

export async function submitFlightRequestAction(formData: FormData) {
  try {
    // Extract form data
    const requestType = formData.get('request_type')
    const flightDate = formData.get('flight_date')
    const description = formData.get('description')
    const reason = formData.get('reason')

    // Validate required fields
    if (!requestType || !flightDate || !description) {
      return { success: false, error: 'Missing required fields' }
    }

    // Make API request to submit flight request
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/portal/flight-requests`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          request_type: requestType,
          flight_date: flightDate,
          description: description,
          reason: reason || undefined,
        }),
      }
    )

    const result = await response.json()

    if (!response.ok || !result.success) {
      return { success: false, error: result.error || 'Failed to submit flight request' }
    }

    // Revalidate the portal pages to show updated data
    revalidatePath('/portal/flight-requests')
    revalidatePath('/portal/dashboard')

    return { success: true, data: result.data }
  } catch (error) {
    console.error('Submit flight request action error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}
