/**
 * Admin Portal Authentication Service
 * Author: Maurice Rondeau
 * Date: December 28, 2025
 *
 * Handles admin authentication using bcrypt password verification.
 * Implements secure server-side session management for admin portal.
 *
 * SECURITY:
 * - bcrypt password hashing (10 salt rounds)
 * - Cryptographically secure session tokens
 * - Server-side session storage
 * - HTTP-only secure cookies
 *
 * NOTE: Uses 'as any' type assertions because the admin_sessions table
 * and password_hash column are not yet in the generated TypeScript types.
 * Run `npm run db:types` after applying the migration to fix types.
 */

import { createServiceRoleClient } from '@/lib/supabase/service-role'
import crypto from 'crypto'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'

/**
 * Admin session cookie name
 */
const ADMIN_SESSION_COOKIE_NAME = 'admin-session'

/**
 * Session duration (24 hours)
 */
const SESSION_DURATION_HOURS = 24

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
 * Generate a cryptographically secure session token
 * Uses 32 bytes (256 bits) of random data
 */
function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('base64url')
}

/**
 * Admin login with email and password
 *
 * @param credentials - Login credentials
 * @param metadata - Optional request metadata (IP address, user agent)
 * @returns Service response with admin user and session
 */
export async function adminLogin(
  credentials: AdminLoginCredentials,
  metadata?: { ipAddress?: string; userAgent?: string }
): Promise<ServiceResponse<{ user: AdminUser; sessionToken: string }>> {
  try {
    // Use service role client to bypass RLS for login query
    const supabase = createServiceRoleClient()

    // Find admin user by email (using 'as any' because password_hash not in types yet)
    const { data: adminUser, error: adminError } = await supabase
      .from('an_users' as any)
      .select('id, email, name, role, user_type, password_hash')
      .eq('email', credentials.email)
      .single()

    if (adminError || !adminUser) {
      return {
        success: false,
        error: 'Invalid email or password',
      }
    }

    const user = adminUser as any

    // Check if password_hash exists
    if (!user.password_hash) {
      console.error('Admin user has no password set:', credentials.email)
      return {
        success: false,
        error: 'Account not configured. Please contact system administrator.',
      }
    }

    // Verify password using bcrypt
    const passwordMatch = await bcrypt.compare(credentials.password, user.password_hash)

    if (!passwordMatch) {
      return {
        success: false,
        error: 'Invalid email or password',
      }
    }

    // Update last login time (using 'as any' because last_login_at not in types yet)
    await supabase
      .from('an_users' as any)
      .update({ last_login_at: new Date().toISOString() } as any)
      .eq('id', user.id)

    // Create admin session
    const sessionResult = await createAdminSession(user.id, metadata)

    if (!sessionResult.success || !sessionResult.sessionToken) {
      return {
        success: false,
        error: 'Failed to create session',
      }
    }

    // Return user without password_hash
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
    return {
      success: false,
      error: 'An error occurred during login',
    }
  }
}

/**
 * Create a new admin session
 * SECURITY: Generates secure token, stores server-side
 */
export async function createAdminSession(
  adminUserId: string,
  metadata?: {
    ipAddress?: string
    userAgent?: string
  }
): Promise<{ success: boolean; sessionToken?: string; error?: string }> {
  try {
    const supabase = createServiceRoleClient()

    // Generate secure session token
    const sessionToken = generateSessionToken()

    // Calculate expiry time
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + SESSION_DURATION_HOURS)

    // Create session in database (using 'as any' because admin_sessions not in types yet)
    const { error } = await supabase.from('admin_sessions' as any).insert({
      session_token: sessionToken,
      admin_user_id: adminUserId,
      expires_at: expiresAt.toISOString(),
      ip_address: metadata?.ipAddress,
      user_agent: metadata?.userAgent,
      is_active: true,
    } as any)

    if (error) {
      console.error('Failed to create admin session:', error)
      return {
        success: false,
        error: 'Failed to create session',
      }
    }

    // Set session cookie (HTTP-only, secure)
    const cookieStore = await cookies()
    cookieStore.set(ADMIN_SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: SESSION_DURATION_HOURS * 60 * 60, // Convert to seconds
    })

    return {
      success: true,
      sessionToken,
    }
  } catch (error) {
    console.error('Error creating admin session:', error)
    return {
      success: false,
      error: 'Session creation error',
    }
  }
}

/**
 * Validate admin session
 * SECURITY: Checks token validity, expiry, and active status
 */
export async function validateAdminSession(
  sessionToken?: string
): Promise<AdminSessionValidationResult> {
  try {
    // Get session token from cookie if not provided
    if (!sessionToken) {
      const cookieStore = await cookies()
      const cookieToken = cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value
      if (!cookieToken) {
        return {
          isValid: false,
          error: 'No session token found',
        }
      }
      sessionToken = cookieToken
    }

    const supabase = createServiceRoleClient()

    // Find session in database (using 'as any' because admin_sessions not in types yet)
    const { data: session, error: sessionError } = await supabase
      .from('admin_sessions' as any)
      .select('*')
      .eq('session_token', sessionToken)
      .eq('is_active', true)
      .single()

    if (sessionError || !session) {
      return {
        isValid: false,
        error: 'Session not found',
      }
    }

    const sessionData = session as any

    // Check if session is expired
    const now = new Date()
    const expiresAt = new Date(sessionData.expires_at)
    if (now > expiresAt) {
      // Mark session as inactive
      await supabase
        .from('admin_sessions' as any)
        .update({ is_active: false } as any)
        .eq('id', sessionData.id)

      return {
        isValid: false,
        error: 'Session expired',
      }
    }

    // Get admin user details
    const { data: adminUser, error: userError } = await supabase
      .from('an_users')
      .select('id, email, name, role, user_type')
      .eq('id', sessionData.admin_user_id)
      .single()

    if (userError || !adminUser) {
      return {
        isValid: false,
        error: 'User not found',
      }
    }

    // Update last activity
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
    console.error('Error validating admin session:', error)
    return {
      isValid: false,
      error: 'Session validation error',
    }
  }
}

/**
 * Revoke admin session (logout)
 */
export async function revokeAdminSession(
  sessionToken?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const cookieStore = await cookies()

    // Get session token from cookie if not provided
    if (!sessionToken) {
      const cookieToken = cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value
      if (!cookieToken) {
        return { success: true } // No session to revoke
      }
      sessionToken = cookieToken
    }

    const supabase = createServiceRoleClient()

    // Mark session as inactive (using 'as any' because admin_sessions not in types yet)
    const { error } = await supabase
      .from('admin_sessions' as any)
      .update({ is_active: false } as any)
      .eq('session_token', sessionToken)

    if (error) {
      console.error('Failed to revoke admin session:', error)
    }

    // Clear session cookie
    cookieStore.delete(ADMIN_SESSION_COOKIE_NAME)

    return { success: true }
  } catch (error) {
    console.error('Error revoking admin session:', error)
    return {
      success: false,
      error: 'Failed to revoke session',
    }
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
 * @param password - Plain text password
 * @returns Hashed password
 */
export async function hashAdminPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_SALT_ROUNDS)
}

/**
 * Set password for an admin user
 * @param email - Admin email
 * @param password - New password
 */
export async function setAdminPassword(
  email: string,
  password: string
): Promise<ServiceResponse<void>> {
  try {
    const supabase = createServiceRoleClient()

    const passwordHash = await hashAdminPassword(password)

    // Using 'as any' because password_hash not in types yet
    const { error } = await supabase
      .from('an_users' as any)
      .update({ password_hash: passwordHash } as any)
      .eq('email', email)

    if (error) {
      console.error('Failed to set admin password:', error)
      return {
        success: false,
        error: 'Failed to set password',
      }
    }

    return { success: true }
  } catch (error) {
    console.error('Error setting admin password:', error)
    return {
      success: false,
      error: 'Failed to set password',
    }
  }
}
