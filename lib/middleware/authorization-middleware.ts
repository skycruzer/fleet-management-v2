/**
 * Authorization Middleware
 *
 * Provides resource ownership verification and role-based access control (RBAC).
 *
 * @version 1.0.0 - SECURITY: Authorization layer for resource access
 * @updated 2025-11-04 - Phase 2C implementation
 * @author Maurice Rondeau
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * User roles in the system
 */
export enum UserRole {
  ADMIN = 'Admin',
  MANAGER = 'Manager',
  USER = 'User',
  PILOT = 'Pilot',
}

/**
 * Resource types that can be owned
 */
export enum ResourceType {
  TASK = 'task',
  LEAVE_REQUEST = 'leave_request',
  FLIGHT_REQUEST = 'flight_request',
  FEEDBACK = 'feedback',
  DISCIPLINARY = 'disciplinary_action',
  LEAVE_BID = 'leave_bid',
  CERTIFICATION = 'pilot_check',
}

/**
 * Authorization result
 */
interface AuthorizationResult {
  authorized: boolean
  error?: string
  statusCode?: number
}

/**
 * Get user's role from database
 */
export async function getUserRole(userId: string): Promise<UserRole | null> {
  try {
    const supabase = await createClient()

    const { data: userData, error } = await supabase
      .from('an_users')
      .select('role')
      .eq('id', userId)
      .single()

    if (error || !userData) {
      return null
    }

    return userData.role as UserRole
  } catch (error) {
    console.error('Error fetching user role:', error)
    return null
  }
}

/**
 * Check if user has required role
 *
 * @param userId - User ID to check
 * @param requiredRoles - Array of allowed roles
 * @returns Authorization result
 */
export async function verifyUserRole(
  userId: string,
  requiredRoles: UserRole[]
): Promise<AuthorizationResult> {
  const userRole = await getUserRole(userId)

  if (!userRole) {
    return {
      authorized: false,
      error: 'User role not found',
      statusCode: 404,
    }
  }

  if (!requiredRoles.includes(userRole)) {
    return {
      authorized: false,
      error: 'Insufficient permissions',
      statusCode: 403,
    }
  }

  return { authorized: true }
}

/**
 * Verify resource ownership
 *
 * Checks if the authenticated user owns the specified resource.
 * Admins and Managers bypass ownership checks.
 *
 * @param userId - Authenticated user ID
 * @param resourceType - Type of resource
 * @param resourceId - Resource ID to check
 * @returns Authorization result
 */
export async function verifyResourceOwnership(
  userId: string,
  resourceType: ResourceType,
  resourceId: string
): Promise<AuthorizationResult> {
  try {
    // Check if user is Admin or Manager (bypass ownership check)
    const userRole = await getUserRole(userId)

    if (userRole === UserRole.ADMIN || userRole === UserRole.MANAGER) {
      return { authorized: true }
    }

    const supabase = await createClient()

    // Map resource type to table and user column
    const resourceConfig = getResourceConfig(resourceType)

    if (!resourceConfig) {
      return {
        authorized: false,
        error: 'Unknown resource type',
        statusCode: 400,
      }
    }

    // Query resource to check ownership
    const { data, error } = await supabase
      .from(resourceConfig.table as any)
      .select(resourceConfig.userColumn)
      .eq('id', resourceId)
      .single()

    if (error || !data) {
      return {
        authorized: false,
        error: 'Resource not found',
        statusCode: 404,
      }
    }

    // Check if user owns the resource
    const ownerId = (data as any)[resourceConfig.userColumn]

    if (ownerId !== userId) {
      return {
        authorized: false,
        error: 'You do not have permission to access this resource',
        statusCode: 403,
      }
    }

    return { authorized: true }
  } catch (error) {
    console.error('Error verifying resource ownership:', error)
    return {
      authorized: false,
      error: 'Authorization check failed',
      statusCode: 500,
    }
  }
}

/**
 * Get database configuration for resource type
 */
function getResourceConfig(resourceType: ResourceType): {
  table: string
  userColumn: string
} | null {
  const configs: Record<
    ResourceType,
    { table: string; userColumn: string }
  > = {
    [ResourceType.TASK]: {
      table: 'tasks',
      userColumn: 'created_by',
    },
    [ResourceType.LEAVE_REQUEST]: {
      table: 'leave_requests',
      userColumn: 'pilot_id',
    },
    [ResourceType.FLIGHT_REQUEST]: {
      table: 'flight_requests',
      userColumn: 'pilot_id',
    },
    [ResourceType.FEEDBACK]: {
      table: 'feedback',
      userColumn: 'pilot_id',
    },
    [ResourceType.DISCIPLINARY]: {
      table: 'disciplinary_actions',
      userColumn: 'pilot_id',
    },
    [ResourceType.LEAVE_BID]: {
      table: 'leave_bids',
      userColumn: 'pilot_id',
    },
    [ResourceType.CERTIFICATION]: {
      table: 'pilot_checks',
      userColumn: 'pilot_id',
    },
  }

  return configs[resourceType] || null
}

/**
 * Middleware helper to verify request authorization
 *
 * Usage in API routes:
 * ```typescript
 * const authResult = await verifyRequestAuthorization(
 *   request,
 *   ResourceType.TASK,
 *   taskId
 * )
 * if (!authResult.authorized) {
 *   return NextResponse.json(
 *     { success: false, error: authResult.error },
 *     { status: authResult.statusCode }
 *   )
 * }
 * ```
 */
export async function verifyRequestAuthorization(
  request: NextRequest,
  resourceType: ResourceType,
  resourceId: string
): Promise<AuthorizationResult> {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return {
        authorized: false,
        error: 'Unauthorized',
        statusCode: 401,
      }
    }

    // Verify resource ownership
    return await verifyResourceOwnership(user.id, resourceType, resourceId)
  } catch (error) {
    console.error('Error in request authorization:', error)
    return {
      authorized: false,
      error: 'Authorization failed',
      statusCode: 500,
    }
  }
}

/**
 * Require specific role for endpoint
 *
 * Usage:
 * ```typescript
 * const roleCheck = await requireRole(request, [UserRole.ADMIN, UserRole.MANAGER])
 * if (!roleCheck.authorized) {
 *   return NextResponse.json(
 *     { success: false, error: roleCheck.error },
 *     { status: roleCheck.statusCode }
 *   )
 * }
 * ```
 */
export async function requireRole(
  request: NextRequest,
  requiredRoles: UserRole[]
): Promise<AuthorizationResult> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return {
        authorized: false,
        error: 'Unauthorized',
        statusCode: 401,
      }
    }

    return await verifyUserRole(user.id, requiredRoles)
  } catch (error) {
    console.error('Error in role verification:', error)
    return {
      authorized: false,
      error: 'Role verification failed',
      statusCode: 500,
    }
  }
}

/**
 * Check if user is admin
 */
export async function isAdmin(userId: string): Promise<boolean> {
  const role = await getUserRole(userId)
  return role === UserRole.ADMIN
}

/**
 * Check if user is manager or admin
 */
export async function isManagerOrAdmin(userId: string): Promise<boolean> {
  const role = await getUserRole(userId)
  return role === UserRole.ADMIN || role === UserRole.MANAGER
}
