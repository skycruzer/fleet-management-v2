/**
 * Unified Authentication Service
 * Developer: Maurice Rondeau
 *
 * Handles authentication for ALL user types (admin, manager, pilot).
 * Replaces: admin-auth-service.ts, session-service.ts, pilot-portal-service.ts (auth parts),
 *           account-lockout-service.ts, password-validation-service.ts
 *
 * Single cookie: `fleet-session`
 * Login uses `staff_id` (not email)
 * Default password: env DEFAULT_USER_PASSWORD (must_change_password = true)
 */

import { createServiceRoleClient } from '@/lib/supabase/service-role'
import * as bcrypt from 'bcryptjs'
import {
  createRedisSession,
  validateRedisSession,
  destroyRedisSession,
  destroyAllUserSessions,
} from '@/lib/services/redis-session-service'
import { BCRYPT_SALT_ROUNDS } from '@/lib/constants/auth'

// ============================================================================
// Constants
// ============================================================================

const SESSION_COOKIE_NAME = 'fleet-session'
const MAX_FAILED_ATTEMPTS = 5
const LOCKOUT_DURATION_MINUTES = 30
const DEFAULT_PASSWORD = process.env.DEFAULT_USER_PASSWORD || 'changeme'

// ============================================================================
// Types
// ============================================================================

export interface AuthUser {
  id: string
  staffId: string
  email: string | null
  name: string
  role: 'admin' | 'manager' | 'pilot'
  isActive: boolean
  mustChangePassword: boolean
  pilotId: string | null
}

export interface AuthSession {
  id: string
  userId: string
  sessionToken: string
  expiresAt: string
  lastActivityAt: string
  isActive: boolean
}

export interface AuthResult {
  success: boolean
  user?: AuthUser
  mustChangePassword?: boolean
  error?: string
}

export interface SessionResult {
  isValid: boolean
  user?: AuthUser
  session?: AuthSession
  error?: string
}

export interface CreateUserInput {
  staffId: string
  email?: string
  name: string
  role: 'admin' | 'manager' | 'pilot'
  pilotId?: string
}

// ============================================================================
// LOGIN
// ============================================================================

/**
 * Authenticate a user with staff_id and password
 */
export async function login(
  staffId: string,
  password: string,
  metadata?: { ipAddress?: string; userAgent?: string }
): Promise<AuthResult> {
  try {
    const supabase = createServiceRoleClient()

    // Find user by staff_id
    const { data: user, error: userError } = await supabase
      .from('users' as any)
      .select(
        'id, staff_id, email, name, password_hash, role, must_change_password, is_active, pilot_id, failed_login_attempts, locked_until'
      )
      .eq('staff_id', staffId)
      .single()

    if (userError || !user) {
      return { success: false, error: 'Invalid staff ID or password' }
    }

    const userData = user as any

    // Check if account is active
    if (!userData.is_active) {
      return { success: false, error: 'Account is disabled. Contact an administrator.' }
    }

    // Check if account is locked
    if (userData.locked_until) {
      const lockedUntil = new Date(userData.locked_until)
      if (lockedUntil > new Date()) {
        const minutesLeft = Math.ceil((lockedUntil.getTime() - Date.now()) / 60000)
        return {
          success: false,
          error: `Account is locked. Try again in ${minutesLeft} minute${minutesLeft !== 1 ? 's' : ''}.`,
        }
      }
      // Lockout expired, clear it
      await supabase
        .from('users' as any)
        .update({ locked_until: null, failed_login_attempts: 0 } as any)
        .eq('id', userData.id)
    }

    // Verify password
    if (!userData.password_hash) {
      return { success: false, error: 'Account not configured. Contact an administrator.' }
    }

    const passwordMatch = await bcrypt.compare(password, userData.password_hash)

    if (!passwordMatch) {
      // Record failed attempt
      const newAttempts = (userData.failed_login_attempts || 0) + 1
      const updateData: any = { failed_login_attempts: newAttempts }

      if (newAttempts >= MAX_FAILED_ATTEMPTS) {
        const lockUntil = new Date()
        lockUntil.setMinutes(lockUntil.getMinutes() + LOCKOUT_DURATION_MINUTES)
        updateData.locked_until = lockUntil.toISOString()
      }

      await supabase
        .from('users' as any)
        .update(updateData)
        .eq('id', userData.id)

      return { success: false, error: 'Invalid staff ID or password' }
    }

    // Successful login - clear failed attempts and update last login
    await supabase
      .from('users' as any)
      .update({
        failed_login_attempts: 0,
        locked_until: null,
        last_login_at: new Date().toISOString(),
      } as any)
      .eq('id', userData.id)

    // Create session via Redis
    const sessionResult = await createRedisSession(
      {
        userId: userData.id,
        role: userData.role,
        email: userData.email,
        staffId: userData.staff_id,
        name: userData.name,
        pilotId: userData.pilot_id,
        mustChangePassword: userData.must_change_password,
      },
      {
        ipAddress: metadata?.ipAddress,
        userAgent: metadata?.userAgent,
        cookieName: SESSION_COOKIE_NAME,
        dbTable: 'sessions',
        dbUserIdColumn: 'user_id',
      }
    )
    if (!sessionResult.success) {
      return { success: false, error: 'Failed to create session' }
    }

    const authUser: AuthUser = {
      id: userData.id,
      staffId: userData.staff_id,
      email: userData.email,
      name: userData.name,
      role: userData.role,
      isActive: userData.is_active,
      mustChangePassword: userData.must_change_password,
      pilotId: userData.pilot_id,
    }

    return {
      success: true,
      user: authUser,
      mustChangePassword: userData.must_change_password,
    }
  } catch (error) {
    console.error('Login error:', error)
    return { success: false, error: 'An error occurred during login' }
  }
}

// ============================================================================
// LOGOUT
// ============================================================================

/**
 * Logout the current user by revoking their session
 */
export async function logout(): Promise<void> {
  await destroyRedisSession(SESSION_COOKIE_NAME, 'sessions')
}

// ============================================================================
// SESSION MANAGEMENT
// ============================================================================

// Session creation is now handled by redis-session-service.ts

/**
 * Validate the current session from the fleet-session cookie
 */
export async function validateSession(): Promise<SessionResult> {
  const result = await validateRedisSession(SESSION_COOKIE_NAME, 'sessions', 'user_id')

  if (!result.isValid || !result.data) {
    return { isValid: false, error: result.error }
  }

  const data = result.data

  const authUser: AuthUser = {
    id: data.userId,
    staffId: data.staffId,
    email: data.email,
    name: data.name,
    role: data.role,
    isActive: true,
    mustChangePassword: data.mustChangePassword,
    pilotId: data.pilotId,
  }

  const authSession: AuthSession = {
    id: data.sessionId,
    userId: data.userId,
    sessionToken: '', // Token is not exposed from Redis for security
    expiresAt: data.expiresAt,
    lastActivityAt: data.lastActivityAt,
    isActive: true,
  }

  return { isValid: true, user: authUser, session: authSession }
}

// ============================================================================
// USER ACCOUNT MANAGEMENT
// ============================================================================

/**
 * Create a new user account (admin only)
 * New accounts default to password "niugini" with must_change_password = true
 */
export async function createUserAccount(
  data: CreateUserInput
): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
  try {
    const supabase = createServiceRoleClient()

    // Hash default password
    const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, BCRYPT_SALT_ROUNDS)

    const { data: newUser, error } = await supabase
      .from('users' as any)
      .insert({
        staff_id: data.staffId,
        email: data.email || null,
        name: data.name,
        password_hash: passwordHash,
        role: data.role,
        must_change_password: true,
        is_active: true,
        pilot_id: data.pilotId || null,
      } as any)
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: 'Staff ID already exists' }
      }
      console.error('Failed to create user:', error)
      return { success: false, error: 'Failed to create user account' }
    }

    const userData = newUser as any

    return {
      success: true,
      user: {
        id: userData.id,
        staffId: userData.staff_id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        isActive: userData.is_active,
        mustChangePassword: userData.must_change_password,
        pilotId: userData.pilot_id,
      },
    }
  } catch (error) {
    console.error('Error creating user:', error)
    return { success: false, error: 'User creation error' }
  }
}

/**
 * Change password for the current user
 */
export async function changePassword(
  userId: string,
  oldPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createServiceRoleClient()

    // Get current password hash
    const { data: user, error: userError } = await supabase
      .from('users' as any)
      .select('password_hash')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      return { success: false, error: 'User not found' }
    }

    const userData = user as any

    // Verify old password
    const oldMatch = await bcrypt.compare(oldPassword, userData.password_hash)
    if (!oldMatch) {
      return { success: false, error: 'Current password is incorrect' }
    }

    // Validate new password
    if (newPassword.length < 8) {
      return { success: false, error: 'New password must be at least 8 characters' }
    }

    if (newPassword === oldPassword) {
      return { success: false, error: 'New password must be different from current password' }
    }

    // Hash and save new password
    const newHash = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS)

    const { error: updateError } = await supabase
      .from('users' as any)
      .update({
        password_hash: newHash,
        must_change_password: false,
        updated_at: new Date().toISOString(),
      } as any)
      .eq('id', userId)

    if (updateError) {
      console.error('Failed to update password:', updateError)
      return { success: false, error: 'Failed to update password' }
    }

    return { success: true }
  } catch (error) {
    console.error('Change password error:', error)
    return { success: false, error: 'Password change error' }
  }
}

/**
 * Reset a user's password to default (admin only)
 */
export async function resetUserPassword(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createServiceRoleClient()
    const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, BCRYPT_SALT_ROUNDS)

    const { error } = await supabase
      .from('users' as any)
      .update({
        password_hash: passwordHash,
        must_change_password: true,
        failed_login_attempts: 0,
        locked_until: null,
        updated_at: new Date().toISOString(),
      } as any)
      .eq('id', userId)

    if (error) {
      console.error('Failed to reset password:', error)
      return { success: false, error: 'Failed to reset password' }
    }

    // Revoke all active sessions for this user (Redis + DB)
    await destroyAllUserSessions(userId, 'sessions', 'user_id')

    return { success: true }
  } catch (error) {
    console.error('Reset password error:', error)
    return { success: false, error: 'Password reset error' }
  }
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Get the session cookie name (for middleware use)
 */
export function getSessionCookieName(): string {
  return SESSION_COOKIE_NAME
}
