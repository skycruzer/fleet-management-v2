/**
 * Admin Portal Authentication Service
 * Author: Maurice Rondeau
 * Date: December 28, 2025
 *
 * Handles admin authentication using bcrypt password verification.
 * Now delegates session management to redis-session-service for
 * Redis-backed sessions with DB audit logging.
 *
 * SECURITY:
 * - bcrypt password hashing (10 salt rounds)
 * - Cryptographically secure session tokens
 * - Redis + DB dual-write sessions
 * - HTTP-only secure cookies
 */

import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'
import {
  createRedisSession,
  validateRedisSession,
  destroyRedisSession,
} from '@/lib/services/redis-session-service'

/**
 * Admin session cookie name
 */
const ADMIN_SESSION_COOKIE_NAME = 'admin-session'

/**
 * Salt rounds for bcrypt
 */
const BCRYPT_SALT_ROUNDS = 10

/**
 * Admin user interface
 */
export interface AdminUser {
  id: string
  email: string
  name: string
  role: string
  user_type?: string
}

/**
 * Admin session interface
 */
export interface AdminSession {
  id: string
  session_token: string
  admin_user_id: string
  created_at: string
  expires_at: string
  last_activity_at: string
  ip_address?: string
  user_agent?: string
  is_active: boolean
}

/**
 * Login credentials interface
 */
export interface AdminLoginCredentials {
  email: string
  password: string
}

/**
 * Service response type
 */
interface ServiceResponse<T> {
  success: boolean
  data?: T
  error?: string
}

/**
 * Session validation result
 */
export interface AdminSessionValidationResult {
  isValid: boolean
  session?: AdminSession
  user?: AdminUser
  error?: string
}

/**
 * Admin login with email and password
 */
export async function adminLogin(
  credentials: AdminLoginCredentials,
  metadata?: { ipAddress?: string; userAgent?: string }
): Promise<ServiceResponse<{ user: AdminUser; sessionToken: string }>> {
  try {
    const supabase = createServiceRoleClient()

    const { data: adminUser, error: adminError } = await supabase
      .from('an_users' as any)
      .select('id, email, name, role, user_type, password_hash')
      .eq('email', credentials.email)
      .single()

    if (adminError || !adminUser) {
      return { success: false, error: 'Invalid email or password' }
    }

    const user = adminUser as any

    if (!user.password_hash) {
      console.error('Admin user has no password set:', credentials.email)
      return {
        success: false,
        error: 'Account not configured. Please contact system administrator.',
      }
    }

    const passwordMatch = await bcrypt.compare(credentials.password, user.password_hash)
    if (!passwordMatch) {
      return { success: false, error: 'Invalid email or password' }
    }

    // Update last login time
    await supabase
      .from('an_users' as any)
      .update({ last_login_at: new Date().toISOString() } as any)
      .eq('id', user.id)

    // Create session via Redis
    const sessionResult = await createRedisSession(
      {
        userId: user.id,
        role: user.role === 'admin' ? 'admin' : 'manager',
        email: user.email,
        staffId: user.email, // Admin sessions use email as identifier
        name: user.name,
        pilotId: null,
        mustChangePassword: false,
      },
      {
        ipAddress: metadata?.ipAddress,
        userAgent: metadata?.userAgent,
        cookieName: ADMIN_SESSION_COOKIE_NAME,
        dbTable: 'admin_sessions',
        dbUserIdColumn: 'admin_user_id',
      }
    )

    if (!sessionResult.success || !sessionResult.sessionToken) {
      return { success: false, error: 'Failed to create session' }
    }

    const adminUserData: AdminUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      user_type: user.user_type,
    }

    return {
      success: true,
      data: {
        user: adminUserData,
        sessionToken: sessionResult.sessionToken,
      },
    }
  } catch (error) {
    console.error('Admin login error:', error)
    return { success: false, error: 'An error occurred during login' }
  }
}

/**
 * Create a new admin session
 * SECURITY: Generates secure token, stores in Redis + DB
 */
export async function createAdminSession(
  adminUserId: string,
  metadata?: {
    ipAddress?: string
    userAgent?: string
  }
): Promise<{ success: boolean; sessionToken?: string; error?: string }> {
  try {
    // Look up admin user data for Redis session
    const supabase = createServiceRoleClient()
    const { data: adminUser, error: userError } = await supabase
      .from('an_users')
      .select('id, email, name, role')
      .eq('id', adminUserId)
      .single()

    if (userError || !adminUser) {
      return { success: false, error: 'Admin user not found' }
    }

    return await createRedisSession(
      {
        userId: adminUserId,
        role: adminUser.role === 'admin' ? 'admin' : 'manager',
        email: adminUser.email,
        staffId: adminUser.email,
        name: adminUser.name,
        pilotId: null,
        mustChangePassword: false,
      },
      {
        ipAddress: metadata?.ipAddress,
        userAgent: metadata?.userAgent,
        cookieName: ADMIN_SESSION_COOKIE_NAME,
        dbTable: 'admin_sessions',
        dbUserIdColumn: 'admin_user_id',
      }
    )
  } catch (error) {
    console.error('Error creating admin session:', error)
    return { success: false, error: 'Session creation error' }
  }
}

/**
 * Validate admin session
 * SECURITY: Checks token validity via Redis (with DB fallback)
 */
export async function validateAdminSession(
  sessionToken?: string
): Promise<AdminSessionValidationResult> {
  try {
    // If a specific token was passed, check if it matches the cookie
    if (sessionToken) {
      const cookieStore = await cookies()
      const existingToken = cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value
      if (existingToken !== sessionToken) {
        // Token passed explicitly doesn't match cookie — fall back to DB
        return await validateAdminSessionByToken(sessionToken)
      }
    }

    const result = await validateRedisSession(
      ADMIN_SESSION_COOKIE_NAME,
      'admin_sessions',
      'admin_user_id'
    )

    if (!result.isValid || !result.data) {
      return { isValid: false, error: result.error }
    }

    const data = result.data

    const adminSession: AdminSession = {
      id: data.sessionId,
      session_token: '',
      admin_user_id: data.userId,
      created_at: data.createdAt,
      expires_at: data.expiresAt,
      last_activity_at: data.lastActivityAt,
      is_active: true,
    }

    const adminUser: AdminUser = {
      id: data.userId,
      email: data.email || '',
      name: data.name,
      role: data.role,
    }

    return { isValid: true, session: adminSession, user: adminUser }
  } catch (error) {
    console.error('Error validating admin session:', error)
    return { isValid: false, error: 'Session validation error' }
  }
}

/**
 * Fallback: validate by explicit token via DB
 */
async function validateAdminSessionByToken(
  sessionToken: string
): Promise<AdminSessionValidationResult> {
  try {
    const supabase = createServiceRoleClient()

    const { data: session, error: sessionError } = await supabase
      .from('admin_sessions' as any)
      .select('*')
      .eq('session_token', sessionToken)
      .eq('is_active', true)
      .single()

    if (sessionError || !session) {
      return { isValid: false, error: 'Session not found' }
    }

    const sessionData = session as any
    const now = new Date()
    const expiresAt = new Date(sessionData.expires_at)
    if (now > expiresAt) {
      await supabase
        .from('admin_sessions' as any)
        .update({ is_active: false } as any)
        .eq('id', sessionData.id)
      return { isValid: false, error: 'Session expired' }
    }

    const { data: adminUser, error: userError } = await supabase
      .from('an_users')
      .select('id, email, name, role, user_type')
      .eq('id', sessionData.admin_user_id)
      .single()

    if (userError || !adminUser) {
      return { isValid: false, error: 'User not found' }
    }

    await supabase
      .from('admin_sessions' as any)
      .update({ last_activity_at: new Date().toISOString() } as any)
      .eq('id', sessionData.id)

    return {
      isValid: true,
      session: sessionData as AdminSession,
      user: adminUser as AdminUser,
    }
  } catch (error) {
    console.error('Error validating admin session by token:', error)
    return { isValid: false, error: 'Session validation error' }
  }
}

/**
 * Revoke admin session (logout)
 */
export async function revokeAdminSession(
  _sessionToken?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await destroyRedisSession(ADMIN_SESSION_COOKIE_NAME, 'admin_sessions')
    return { success: true }
  } catch (error) {
    console.error('Error revoking admin session:', error)
    return { success: false, error: 'Failed to revoke session' }
  }
}

/**
 * Get current admin session from cookies
 */
export async function getCurrentAdminSession(): Promise<AdminSessionValidationResult> {
  return validateAdminSession()
}

/**
 * Hash a password using bcrypt
 */
export async function hashAdminPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_SALT_ROUNDS)
}

/**
 * Set password for an admin user
 */
export async function setAdminPassword(
  email: string,
  password: string
): Promise<ServiceResponse<void>> {
  try {
    const supabase = createServiceRoleClient()
    const passwordHash = await hashAdminPassword(password)

    const { error } = await supabase
      .from('an_users' as any)
      .update({ password_hash: passwordHash } as any)
      .eq('email', email)

    if (error) {
      console.error('Failed to set admin password:', error)
      return { success: false, error: 'Failed to set password' }
    }

    return { success: true }
  } catch (error) {
    console.error('Error setting admin password:', error)
    return { success: false, error: 'Failed to set password' }
  }
}
