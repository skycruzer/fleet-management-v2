/**
 * Error Message Examples
 * Demonstrates how to use standardized error messages across the application
 *
 * @version 1.0.0
 * @since 2025-10-19
 */

import { ERROR_MESSAGES, formatApiError, formatUserError } from '@/lib/utils/error-messages'
import { logError, ErrorSeverity } from '@/lib/error-logger'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// ===================================
// EXAMPLE 1: API Route Error Handling
// ===================================

/**
 * Example API route showing proper error handling
 */
export async function exampleApiRoute(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      // ✅ Use standardized auth error
      return NextResponse.json(formatApiError(ERROR_MESSAGES.AUTH.UNAUTHORIZED, 401), {
        status: 401,
      })
    }

    // Validate request body
    const body = await request.json()

    if (!body.pilotId) {
      // ✅ Use standardized validation error with context
      const validationError = ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD('Pilot ID')
      return NextResponse.json(formatApiError(validationError, 400), { status: 400 })
    }

    // Fetch data
    const { data: pilot, error } = await supabase
      .from('pilots')
      .select('*')
      .eq('id', body.pilotId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // ✅ Resource not found
        return NextResponse.json(formatApiError(ERROR_MESSAGES.PILOT.NOT_FOUND, 404), {
          status: 404,
        })
      }

      // ✅ Generic database error
      return NextResponse.json(formatApiError(ERROR_MESSAGES.PILOT.FETCH_FAILED, 500), {
        status: 500,
      })
    }

    return NextResponse.json({
      success: true,
      data: pilot,
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(formatApiError(ERROR_MESSAGES.NETWORK.SERVER_ERROR, 500), {
      status: 500,
    })
  }
}

// ===================================
// EXAMPLE 2: Service Function Error Handling
// ===================================

/**
 * Example service function with proper error handling and logging
 */
export async function exampleServiceFunction(pilotId: string) {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase.from('pilots').select('*').eq('id', pilotId).single()

    if (error) {
      // ✅ Log error with context
      logError(new Error(ERROR_MESSAGES.PILOT.FETCH_FAILED.message), {
        source: 'exampleServiceFunction',
        severity: ErrorSeverity.ERROR,
        metadata: { pilotId, error: error.message },
      })

      // ✅ Throw standardized error
      throw new Error(ERROR_MESSAGES.PILOT.FETCH_FAILED.message)
    }

    return data
  } catch (error) {
    // Re-throw with context if needed
    if (error instanceof Error) {
      logError(error, {
        source: 'exampleServiceFunction',
        severity: ErrorSeverity.ERROR,
        metadata: { pilotId },
      })
    }
    throw error
  }
}

// ===================================
// EXAMPLE 3: React Component Error Handling
// ===================================

/**
 * Example React component with toast notifications
 */
export function ExamplePilotForm() {
  const handleSubmit = async (data: { name: string; employeeId: string }) => {
    try {
      const response = await fetch('/api/pilots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        // ✅ Display standardized error message
        console.error(formatUserError(ERROR_MESSAGES.PILOT.CREATE_FAILED))
        return
      }

      console.log('Success!')
    } catch (error) {
      // ✅ Handle network errors
      console.error(formatUserError(ERROR_MESSAGES.NETWORK.CONNECTION_FAILED))
    }
  }

  return null // Component implementation
}

// ===================================
// EXAMPLE 4: Validation Error Handling
// ===================================

/**
 * Example form validation with specific error messages
 */
export function validatePilotForm(data: {
  employeeId?: string
  email?: string
  dateOfBirth?: string
  seniorityNumber?: number
}) {
  const errors: string[] = []

  // ✅ Required field validation
  if (!data.employeeId) {
    errors.push(ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD('Employee ID').message)
  }

  // ✅ Email format validation
  if (data.email && !data.email.includes('@')) {
    errors.push(ERROR_MESSAGES.VALIDATION.INVALID_EMAIL.message)
  }

  // ✅ Date validation
  if (data.dateOfBirth && isNaN(new Date(data.dateOfBirth).getTime())) {
    errors.push(ERROR_MESSAGES.VALIDATION.INVALID_DATE.message)
  }

  // ✅ Range validation
  if (data.seniorityNumber && (data.seniorityNumber < 1 || data.seniorityNumber > 100)) {
    errors.push(ERROR_MESSAGES.VALIDATION.OUT_OF_RANGE('Seniority number', 1, 100).message)
  }

  return errors
}

// ===================================
// EXAMPLE 5: Constraint Error Handling
// ===================================

/**
 * Example leave request creation with duplicate detection
 */
export async function createLeaveRequest(data: {
  pilotId: string
  startDate: string
  endDate: string
}) {
  const supabase = await createClient()

  try {
    const { data: result, error } = await supabase.from('leave_requests').insert({
      pilot_id: data.pilotId,
      start_date: data.startDate,
      end_date: data.endDate,
      status: 'PENDING',
    })

    if (error) {
      // ✅ Check for unique constraint violation
      if (error.code === '23505') {
        // PostgreSQL unique violation
        throw new Error(ERROR_MESSAGES.LEAVE.DUPLICATE_REQUEST.message)
      }

      // ✅ Generic creation error
      throw new Error(ERROR_MESSAGES.LEAVE.CREATE_FAILED.message)
    }

    return result
  } catch (error) {
    logError(error as Error, {
      source: 'createLeaveRequest',
      severity: ErrorSeverity.ERROR,
      metadata: data,
    })
    throw error
  }
}

// ===================================
// EXAMPLE 6: Multiple Error Scenarios
// ===================================

/**
 * Example function handling multiple error scenarios
 */
export async function updateCertification(
  certificationId: string,
  updates: { expiryDate?: string; checkTypeId?: string }
) {
  const supabase = await createClient()

  try {
    // ✅ Validation: Check if certification exists
    const { data: existing, error: fetchError } = await supabase
      .from('pilot_checks')
      .select('*')
      .eq('id', certificationId)
      .single()

    if (fetchError || !existing) {
      throw new Error(ERROR_MESSAGES.CERTIFICATION.NOT_FOUND.message)
    }

    // ✅ Validation: Check if certification is expired
    if (existing.expiry_date && new Date(existing.expiry_date) < new Date()) {
      logError(new Error(ERROR_MESSAGES.CERTIFICATION.EXPIRED_CERTIFICATION.message), {
        source: 'updateCertification',
        severity: ErrorSeverity.WARNING,
        metadata: { certificationId, expiryDate: existing.expiry_date },
      })
    }

    // ✅ Perform update
    const { data, error } = await supabase
      .from('pilot_checks')
      .update(updates)
      .eq('id', certificationId)

    if (error) {
      throw new Error(ERROR_MESSAGES.CERTIFICATION.UPDATE_FAILED.message)
    }

    return data
  } catch (error) {
    logError(error as Error, {
      source: 'updateCertification',
      severity: ErrorSeverity.ERROR,
      metadata: { certificationId, updates },
    })
    throw error
  }
}

// ===================================
// EXAMPLE 7: Batch Operation Errors
// ===================================

/**
 * Example batch update with combined error handling
 */
export async function batchUpdateCertifications(
  updates: Array<{ id: string; expiryDate: string }>
) {
  const supabase = await createClient()
  const errors: Error[] = []
  const successes: string[] = []

  for (const update of updates) {
    try {
      const { error } = await supabase
        .from('pilot_checks')
        .update({ expiry_date: update.expiryDate })
        .eq('id', update.id)

      if (error) {
        errors.push(new Error(`Failed to update ${update.id}: ${error.message}`))
      } else {
        successes.push(update.id)
      }
    } catch (error) {
      errors.push(error as Error)
    }
  }

  if (errors.length > 0) {
    // ✅ Log batch operation failure
    logError(new Error(ERROR_MESSAGES.CERTIFICATION.BULK_UPDATE_FAILED.message), {
      source: 'batchUpdateCertifications',
      severity: ErrorSeverity.ERROR,
      metadata: {
        totalAttempted: updates.length,
        successes: successes.length,
        failures: errors.length,
      },
    })

    if (errors.length === updates.length) {
      // All failed
      throw new Error(ERROR_MESSAGES.CERTIFICATION.BULK_UPDATE_FAILED.message)
    } else {
      // Partial failure - log but don't throw
      console.warn(`Partial success: ${successes.length}/${updates.length} updated`)
    }
  }

  return { successes, errors }
}

// ===================================
// EXAMPLE 8: Conditional Error Messages
// ===================================

/**
 * Example with conditional error based on business logic
 */
export async function approveLeavRequest(requestId: string) {
  const supabase = await createClient()

  try {
    // Fetch request details
    const { data: request, error } = await supabase
      .from('leave_requests')
      .select('*, pilots(*)')
      .eq('id', requestId)
      .single()

    if (error || !request) {
      throw new Error(ERROR_MESSAGES.LEAVE.NOT_FOUND.message)
    }

    // Check if past date
    if (new Date(request.start_date) < new Date()) {
      throw new Error(ERROR_MESSAGES.LEAVE.PAST_DATE.message)
    }

    // ✅ Business logic validation
    const crewCount = await getAvailableCrewCount(request.start_date, request.end_date)

    if (crewCount < 10) {
      // ✅ Use specific business rule error
      throw new Error(ERROR_MESSAGES.LEAVE.INSUFFICIENT_CREW.message)
    }

    // Approve request
    const { error: updateError } = await supabase
      .from('leave_requests')
      .update({ status: 'APPROVED' })
      .eq('id', requestId)

    if (updateError) {
      throw new Error(ERROR_MESSAGES.LEAVE.UPDATE_FAILED.message)
    }

    return { success: true }
  } catch (error) {
    logError(error as Error, {
      source: 'approveLeavRequest',
      severity: ErrorSeverity.ERROR,
      metadata: { requestId },
    })
    throw error
  }
}

// Helper function for example
async function getAvailableCrewCount(startDate: string, endDate: string): Promise<number> {
  // Simplified implementation
  return 12
}

// ===================================
// EXAMPLE 9: User-Facing Error Display
// ===================================

/**
 * Example error display component
 */
export function ErrorDisplay({ error }: { error: Error | null }) {
  if (!error) return null

  // ✅ Format error for user display
  const userMessage = formatUserError(
    ERROR_MESSAGES.PILOT.FETCH_FAILED // Could be any error message
  )

  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
      <h4 className="text-sm font-medium text-red-800">Error</h4>
      <p className="mt-1 text-sm text-red-700">{userMessage}</p>
    </div>
  )
}

// ===================================
// EXAMPLE 10: Network Error Handling
// ===================================

/**
 * Example fetch with network error handling
 */
export async function fetchWithErrorHandling(url: string) {
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(10000), // 10 second timeout
    })

    if (!response.ok) {
      // ✅ Map HTTP status to error message
      if (response.status === 401) {
        throw new Error(ERROR_MESSAGES.AUTH.UNAUTHORIZED.message)
      }
      if (response.status === 403) {
        throw new Error(ERROR_MESSAGES.AUTH.FORBIDDEN.message)
      }
      if (response.status === 404) {
        throw new Error(ERROR_MESSAGES.DATABASE.NOT_FOUND('Resource').message)
      }
      if (response.status >= 500) {
        throw new Error(ERROR_MESSAGES.NETWORK.SERVER_ERROR.message)
      }

      throw new Error('Request failed')
    }

    return await response.json()
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        // ✅ Timeout error
        throw new Error(ERROR_MESSAGES.NETWORK.TIMEOUT.message)
      }
      if (error.message.includes('fetch')) {
        // ✅ Network error
        throw new Error(ERROR_MESSAGES.NETWORK.CONNECTION_FAILED.message)
      }
    }
    throw error
  }
}
