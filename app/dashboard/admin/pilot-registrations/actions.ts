'use server'

/**
 * Server Actions for Pilot Registration Approval
 *
 * These server actions use proper admin authentication to capture the admin ID
 * for audit trail purposes.
 *
 * Developer: Maurice Rondeau
 */

import { revalidatePath } from 'next/cache'
import { getAuthenticatedAdmin } from '@/lib/middleware/admin-auth-helper'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  sendRegistrationApprovalEmail,
  sendRegistrationDenialEmail,
} from '@/lib/services/pilot-email-service'

export async function approvePilotRegistration(registrationId: string) {
  try {
    // Get authenticated admin for audit trail
    const auth = await getAuthenticatedAdmin()
    if (!auth.authenticated) {
      return {
        success: false,
        error: 'Authentication required',
      }
    }

    // Use service role client for database operations
    const supabase = createAdminClient()

    // First, get pilot details for email
    const { data: pilotData, error: fetchError } = await supabase
      .from('pilot_users')
      .select('first_name, last_name, email, rank, employee_id')
      .eq('id', registrationId)
      .single()

    if (fetchError || !pilotData) {
      return {
        success: false,
        error: 'Failed to fetch pilot information',
      }
    }

    // Update approval status with admin ID for audit trail
    const { error } = await supabase
      .from('pilot_users')
      .update({
        registration_approved: true,
        approved_at: new Date().toISOString(),
        approved_by: auth.userId,
      })
      .eq('id', registrationId)

    if (error) {
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

    // Revalidate the page to show updated data
    revalidatePath('/dashboard/admin/pilot-registrations')

    return {
      success: true,
      message:
        'Registration approved successfully' +
        (emailResult.success ? ' and email notification sent' : ''),
    }
  } catch {
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

export async function denyPilotRegistration(registrationId: string, denialReason?: string) {
  try {
    // Get authenticated admin for audit trail
    const auth = await getAuthenticatedAdmin()
    if (!auth.authenticated) {
      return {
        success: false,
        error: 'Authentication required',
      }
    }

    // Use service role client for database operations
    const supabase = createAdminClient()

    // First, get pilot details for email
    const { data: pilotData, error: fetchError } = await supabase
      .from('pilot_users')
      .select('first_name, last_name, email, rank, employee_id')
      .eq('id', registrationId)
      .single()

    if (fetchError || !pilotData) {
      return {
        success: false,
        error: 'Failed to fetch pilot information',
      }
    }

    // Update denial status with admin ID for audit trail
    const { error } = await supabase
      .from('pilot_users')
      .update({
        registration_approved: false,
        approved_at: new Date().toISOString(),
        approved_by: auth.userId,
        denial_reason: denialReason || 'Registration did not meet approval criteria',
      })
      .eq('id', registrationId)

    if (error) {
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

    // Revalidate the page to show updated data
    revalidatePath('/dashboard/admin/pilot-registrations')

    return {
      success: true,
      message:
        'Registration denied successfully' +
        (emailResult.success ? ' and email notification sent' : ''),
    }
  } catch {
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}
