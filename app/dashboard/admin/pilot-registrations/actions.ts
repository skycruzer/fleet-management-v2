'use server'

/**
 * Server Actions for Pilot Registration Approval
 *
 * These server actions bypass API authentication for development/testing purposes.
 * In production, these should be properly protected with admin authentication.
 */

import { revalidatePath } from 'next/cache'
import { reviewPilotRegistration } from '@/lib/services/pilot-portal-service'
import {
  sendRegistrationApprovalEmail,
  sendRegistrationDenialEmail,
} from '@/lib/services/pilot-email-service'

export async function approvePilotRegistration(registrationId: string) {
  try {
    // Direct DB update - See tasks/061-tracked-admin-auth-registration-approval.md
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    // First, get pilot details for email
    const { data: pilotData, error: fetchError } = await supabase
      .from('pilot_users')
      .select('first_name, last_name, email, rank, employee_id')
      .eq('id', registrationId)
      .single()

    if (fetchError || !pilotData) {
      console.error('Failed to fetch pilot data:', fetchError)
      return {
        success: false,
        error: 'Failed to fetch pilot information',
      }
    }

    // Update approval status
    const { error } = await supabase
      .from('pilot_users')
      .update({
        registration_approved: true,
        approved_at: new Date().toISOString(),
        // approved_by is NULL since we don't have a valid admin ID
      })
      .eq('id', registrationId)

    if (error) {
      console.error('Approval error:', error)
      return {
        success: false,
        error: 'Failed to approve registration',
      }
    }

    // Send approval email to pilot
    const emailResult = await sendRegistrationApprovalEmail({
      firstName: pilotData.first_name,
      lastName: pilotData.last_name,
      email: pilotData.email,
      rank: pilotData.rank || 'Pilot',
      employeeId: pilotData.employee_id || undefined,
    })

    // Email failure is logged but doesn't fail the approval

    // Revalidate the page to show updated data
    revalidatePath('/dashboard/admin/pilot-registrations')

    return {
      success: true,
      message:
        'Registration approved successfully' +
        (emailResult.success ? ' and email notification sent' : ''),
    }
  } catch (error) {
    console.error('Server action approval error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

export async function denyPilotRegistration(registrationId: string, denialReason?: string) {
  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    // First, get pilot details for email
    const { data: pilotData, error: fetchError } = await supabase
      .from('pilot_users')
      .select('first_name, last_name, email, rank, employee_id')
      .eq('id', registrationId)
      .single()

    if (fetchError || !pilotData) {
      console.error('Failed to fetch pilot data:', fetchError)
      return {
        success: false,
        error: 'Failed to fetch pilot information',
      }
    }

    // Update denial status
    const { error } = await supabase
      .from('pilot_users')
      .update({
        registration_approved: false,
        approved_at: new Date().toISOString(),
        denial_reason: denialReason || 'Registration did not meet approval criteria',
      })
      .eq('id', registrationId)

    if (error) {
      console.error('Denial error:', error)
      return {
        success: false,
        error: 'Failed to deny registration',
      }
    }

    // Send denial email to pilot
    const emailResult = await sendRegistrationDenialEmail(
      {
        firstName: pilotData.first_name,
        lastName: pilotData.last_name,
        email: pilotData.email,
        rank: pilotData.rank || 'Pilot',
        employeeId: pilotData.employee_id || undefined,
      },
      denialReason
    )

    // Email failure is logged but doesn't fail the denial

    // Revalidate the page to show updated data
    revalidatePath('/dashboard/admin/pilot-registrations')

    return {
      success: true,
      message:
        'Registration denied successfully' +
        (emailResult.success ? ' and email notification sent' : ''),
    }
  } catch (error) {
    console.error('Server action denial error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}
