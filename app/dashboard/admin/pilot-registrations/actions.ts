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
    // TEMPORARY: Manually update database to bypass service layer issues
    // TODO: Fix reviewPilotRegistration to handle NULL approved_by properly
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    console.log('Approving registration:', registrationId)

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

    console.log('✅ Registration approved successfully')

    // Send approval email to pilot
    const emailResult = await sendRegistrationApprovalEmail({
      firstName: pilotData.first_name,
      lastName: pilotData.last_name,
      email: pilotData.email,
      rank: pilotData.rank || 'Pilot',
      employeeId: pilotData.employee_id || undefined,
    })

    if (!emailResult.success) {
      console.error('⚠️  Failed to send approval email:', emailResult.error)
      // Don't fail the approval if email fails - log it and continue
    } else {
      console.log('📧 Approval email sent successfully')
    }

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

    console.log('Denying registration:', registrationId)

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

    console.log('✅ Registration denied successfully')

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

    if (!emailResult.success) {
      console.error('⚠️  Failed to send denial email:', emailResult.error)
      // Don't fail the denial if email fails - log it and continue
    } else {
      console.log('📧 Denial email sent successfully')
    }

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
