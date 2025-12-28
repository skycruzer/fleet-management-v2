'use server'

/**
 * Leave Request Approval Server Actions
 *
 * Server actions for admin approval/denial of leave requests.
 * Author: Maurice Rondeau
 *
 * @version 1.0.0
 */

import { revalidatePath } from 'next/cache'
import { updateLeaveRequestStatus } from '@/lib/services/unified-request-service'
import { createClient } from '@/lib/supabase/server'

export async function approveLeaveRequest(requestId: string, comments?: string) {
  try {
    // Get authenticated admin user
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        error: 'Unauthorized - Admin login required',
      }
    }

    // Update status via service layer
    const result = await updateLeaveRequestStatus(requestId, 'APPROVED', user.id, comments)

    if (!result.success) {
      return {
        success: false,
        error: result.error ?? 'Failed to approve leave request',
      }
    }

    // Revalidate all affected paths
    revalidatePath('/dashboard/leave/approve')
    revalidatePath('/dashboard/requests')
    revalidatePath('/dashboard')

    return {
      success: true,
      message: 'Leave request approved successfully',
      requestId: result.data?.id ?? requestId,
    }
  } catch (error) {
    console.error('Approve leave request error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to approve leave request',
    }
  }
}

export async function denyLeaveRequest(requestId: string, comments?: string) {
  try {
    // Get authenticated admin user
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        error: 'Unauthorized - Admin login required',
      }
    }

    // Require comments for denials
    if (!comments || comments.trim().length === 0) {
      return {
        success: false,
        error: 'Comments are required when denying leave requests',
      }
    }

    // Update status via service layer
    const result = await updateLeaveRequestStatus(requestId, 'DENIED', user.id, comments)

    if (!result.success) {
      return {
        success: false,
        error: result.error ?? 'Failed to deny leave request',
      }
    }

    // Revalidate all affected paths
    revalidatePath('/dashboard/leave/approve')
    revalidatePath('/dashboard/requests')
    revalidatePath('/dashboard')

    return {
      success: true,
      message: 'Leave request denied successfully',
      requestId: result.data?.id ?? requestId,
    }
  } catch (error) {
    console.error('Deny leave request error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to deny leave request',
    }
  }
}
