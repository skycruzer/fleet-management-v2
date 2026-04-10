'use server'

/**
 * Leave Request Approval Server Actions
 *
 * Server actions for admin approval/denial of leave requests.
 * Author: Maurice Rondeau
 *
 * @version 1.1.0
 * @updated 2025-12-29 - Added dual auth support
 */

import { revalidatePath } from 'next/cache'
import { updateLeaveRequestStatus } from '@/lib/services/unified-request-service'
import { getAuthenticatedAdmin } from '@/lib/middleware/admin-auth-helper'

export async function approveLeaveRequest(requestId: string, comments?: string) {
  try {
    // Get authenticated admin user (supports both Supabase Auth and admin-session cookie)
    const auth = await getAuthenticatedAdmin()
    if (!auth.authenticated) {
      return {
        success: false,
        error: 'Unauthorized - Admin login required',
      }
    }

    // Update status via service layer
    const result = await updateLeaveRequestStatus(requestId, 'APPROVED', auth.userId!, comments)

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
    // Get authenticated admin user (supports both Supabase Auth and admin-session cookie)
    const auth = await getAuthenticatedAdmin()
    if (!auth.authenticated) {
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
    const result = await updateLeaveRequestStatus(requestId, 'DENIED', auth.userId!, comments)

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
