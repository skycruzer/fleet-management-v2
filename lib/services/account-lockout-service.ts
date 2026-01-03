/**
 * Account Lockout Service
 *
 * Protects against brute force attacks by tracking failed login attempts
 * and temporarily locking accounts after threshold is exceeded.
 *
 * @version 1.0.0 - SECURITY: Account lockout protection
 * @updated 2025-11-04 - Phase 2C implementation
 * @author Maurice Rondeau
 */

import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

/**
 * Configuration
 */
const MAX_FAILED_ATTEMPTS = 5
const LOCKOUT_DURATION_MINUTES = 30
const FAILED_ATTEMPT_WINDOW_MINUTES = 15

/**
 * Failed login attempt record
 */
interface FailedAttempt {
  email: string
  attemptedAt: Date
  ipAddress?: string
}

/**
 * Account lockout status
 */
interface LockoutStatus {
  isLocked: boolean
  failedAttempts: number
  lockedUntil?: Date
  remainingTime?: number // minutes
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
 * Record a failed login attempt
 *
 * @param email - Email address that failed login
 * @param ipAddress - IP address of the attempt
 * @returns Updated lockout status
 */
export async function recordFailedAttempt(
  email: string,
  ipAddress?: string
): Promise<ServiceResponse<LockoutStatus>> {
  try {
    const supabase = await createClient()

    // Get current failed attempts within window
    const windowStart = new Date()
    windowStart.setMinutes(windowStart.getMinutes() - FAILED_ATTEMPT_WINDOW_MINUTES)

    const { data: attempts, error: fetchError } = await supabase
      .from('failed_login_attempts' as any)
      .select('*')
      .eq('email', email.toLowerCase())
      .gte('attempted_at', windowStart.toISOString())
      .order('attempted_at', { ascending: false })

    if (fetchError) {
      console.error('Error fetching failed attempts:', fetchError)
      return {
        success: false,
        error: 'Failed to check login attempts',
      }
    }

    const currentAttempts = attempts?.length || 0

    // Record this failed attempt
    const { error: insertError } = await supabase.from('failed_login_attempts' as any).insert({
      email: email.toLowerCase(),
      attempted_at: new Date().toISOString(),
      ip_address: ipAddress,
    })

    if (insertError) {
      console.error('Error recording failed attempt:', insertError)
    }

    const newAttemptCount = currentAttempts + 1

    // Check if account should be locked
    if (newAttemptCount >= MAX_FAILED_ATTEMPTS) {
      const lockedUntil = new Date()
      lockedUntil.setMinutes(lockedUntil.getMinutes() + LOCKOUT_DURATION_MINUTES)

      // Lock the account
      const { error: lockError } = await supabase.from('account_lockouts' as any).insert({
        email: email.toLowerCase(),
        locked_at: new Date().toISOString(),
        locked_until: lockedUntil.toISOString(),
        failed_attempts: newAttemptCount,
        reason: 'Too many failed login attempts',
      })

      if (lockError) {
        console.error('Error locking account:', lockError)
      }

      // Send lockout notification email
      await sendLockoutNotification(email, lockedUntil)

      return {
        success: true,
        data: {
          isLocked: true,
          failedAttempts: newAttemptCount,
          lockedUntil,
          remainingTime: LOCKOUT_DURATION_MINUTES,
        },
      }
    }

    return {
      success: true,
      data: {
        isLocked: false,
        failedAttempts: newAttemptCount,
      },
    }
  } catch (error) {
    console.error('Error in recordFailedAttempt:', error)
    return {
      success: false,
      error: 'Failed to process login attempt',
    }
  }
}

/**
 * Check if account is currently locked
 *
 * @param email - Email address to check
 * @returns Lockout status
 */
export async function checkAccountLockout(email: string): Promise<ServiceResponse<LockoutStatus>> {
  try {
    const supabase = await createClient()

    // Get active lockout
    const { data: lockout, error } = await supabase
      .from('account_lockouts' as any)
      .select('*')
      .eq('email', email.toLowerCase())
      .gte('locked_until', new Date().toISOString())
      .order('locked_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error('Error checking account lockout:', error)
      return {
        success: false,
        error: 'Failed to check account status',
      }
    }

    if (!lockout) {
      return {
        success: true,
        data: {
          isLocked: false,
          failedAttempts: 0,
        },
      }
    }

    const lockedUntil = new Date((lockout as any).locked_until)
    const now = new Date()
    const remainingMinutes = Math.ceil((lockedUntil.getTime() - now.getTime()) / 60000)

    return {
      success: true,
      data: {
        isLocked: true,
        failedAttempts: (lockout as any).failed_attempts,
        lockedUntil,
        remainingTime: remainingMinutes,
      },
    }
  } catch (error) {
    console.error('Error in checkAccountLockout:', error)
    return {
      success: false,
      error: 'Failed to check account status',
    }
  }
}

/**
 * Clear failed attempts after successful login
 *
 * @param email - Email address to clear
 */
export async function clearFailedAttempts(email: string): Promise<ServiceResponse<null>> {
  try {
    const supabase = await createClient()

    // Delete failed attempts
    const { error: deleteError } = await supabase
      .from('failed_login_attempts' as any)
      .delete()
      .eq('email', email.toLowerCase())

    if (deleteError) {
      console.error('Error clearing failed attempts:', deleteError)
      return {
        success: false,
        error: 'Failed to clear login attempts',
      }
    }

    return {
      success: true,
      data: null,
    }
  } catch (error) {
    console.error('Error in clearFailedAttempts:', error)
    return {
      success: false,
      error: 'Failed to clear login attempts',
    }
  }
}

/**
 * Manually unlock an account (Admin action)
 *
 * @param email - Email address to unlock
 * @param adminId - ID of admin performing unlock
 */
export async function unlockAccount(
  email: string,
  adminId: string
): Promise<ServiceResponse<null>> {
  try {
    const supabase = await createClient()

    // Delete active lockouts
    const { error: deleteError } = await supabase
      .from('account_lockouts' as any)
      .delete()
      .eq('email', email.toLowerCase())
      .gte('locked_until', new Date().toISOString())

    if (deleteError) {
      console.error('Error unlocking account:', deleteError)
      return {
        success: false,
        error: 'Failed to unlock account',
      }
    }

    // Clear failed attempts
    await clearFailedAttempts(email)

    // Send unlock notification email
    await sendUnlockNotification(email)

    return {
      success: true,
      data: null,
    }
  } catch (error) {
    console.error('Error in unlockAccount:', error)
    return {
      success: false,
      error: 'Failed to unlock account',
    }
  }
}

/**
 * Get lockout statistics for admin dashboard
 */
export async function getLockoutStatistics(): Promise<
  ServiceResponse<{
    totalLocked: number
    totalFailedAttempts24h: number
    recentLockouts: Array<{
      email: string
      lockedAt: Date
      lockedUntil: Date
      failedAttempts: number
    }>
  }>
> {
  try {
    const supabase = await createClient()

    // Get active lockouts
    const { data: lockouts, error: lockoutError } = await supabase
      .from('account_lockouts' as any)
      .select('*')
      .gte('locked_until', new Date().toISOString())

    // Get failed attempts in last 24 hours
    const yesterday = new Date()
    yesterday.setHours(yesterday.getHours() - 24)

    const { data: attempts, error: attemptsError } = await supabase
      .from('failed_login_attempts' as any)
      .select('count')
      .gte('attempted_at', yesterday.toISOString())

    if (lockoutError || attemptsError) {
      console.error('Error fetching lockout statistics')
      return {
        success: false,
        error: 'Failed to fetch statistics',
      }
    }

    return {
      success: true,
      data: {
        totalLocked: lockouts?.length || 0,
        totalFailedAttempts24h: (attempts as any)?.[0]?.count || 0,
        recentLockouts: (lockouts || []).map((l: any) => ({
          email: l.email,
          lockedAt: new Date(l.locked_at),
          lockedUntil: new Date(l.locked_until),
          failedAttempts: l.failed_attempts,
        })),
      },
    }
  } catch (error) {
    console.error('Error in getLockoutStatistics:', error)
    return {
      success: false,
      error: 'Failed to fetch statistics',
    }
  }
}

/**
 * Send lockout notification email
 */
async function sendLockoutNotification(email: string, lockedUntil: Date): Promise<void> {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY)

    const lockoutTime = Math.ceil((lockedUntil.getTime() - new Date().getTime()) / 60000)

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'no-reply@fleet-mgmt.com',
      to: email,
      subject: '🔒 Account Temporarily Locked - Fleet Management',
      html: `
        <h2>Account Temporarily Locked</h2>
        <p>Your account has been temporarily locked due to multiple failed login attempts.</p>

        <p><strong>Lockout Duration:</strong> ${lockoutTime} minutes</p>
        <p><strong>Locked Until:</strong> ${lockedUntil.toLocaleString()}</p>

        <p>If this wasn't you, please contact your system administrator immediately.</p>

        <p>Your account will automatically unlock after the lockout period expires.</p>

        <p>For immediate assistance, contact your administrator.</p>
      `,
    })
  } catch (error) {
    console.error('Error sending lockout notification:', error)
    // Don't throw - email failure shouldn't break lockout functionality
  }
}

/**
 * Send unlock notification email
 */
async function sendUnlockNotification(email: string): Promise<void> {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY)

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'no-reply@fleet-mgmt.com',
      to: email,
      subject: '✅ Account Unlocked - Fleet Management',
      html: `
        <h2>Account Unlocked</h2>
        <p>Your account has been unlocked by a system administrator.</p>

        <p>You can now log in to your account.</p>

        <p>If you have any questions, please contact your administrator.</p>
      `,
    })
  } catch (error) {
    console.error('Error sending unlock notification:', error)
  }
}

/**
 * Database migration SQL for account lockout tables
 *
 * Run this in Supabase SQL Editor:
 *
 * ```sql
 * -- Failed login attempts tracking
 * CREATE TABLE IF NOT EXISTS failed_login_attempts (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   email VARCHAR(255) NOT NULL,
 *   attempted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
 *   ip_address VARCHAR(45),
 *   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
 * );
 *
 * CREATE INDEX idx_failed_attempts_email ON failed_login_attempts(email);
 * CREATE INDEX idx_failed_attempts_timestamp ON failed_login_attempts(attempted_at);
 *
 * -- Account lockouts
 * CREATE TABLE IF NOT EXISTS account_lockouts (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   email VARCHAR(255) NOT NULL,
 *   locked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
 *   locked_until TIMESTAMP WITH TIME ZONE NOT NULL,
 *   failed_attempts INTEGER NOT NULL,
 *   reason TEXT,
 *   unlocked_by UUID REFERENCES an_users(id),
 *   unlocked_at TIMESTAMP WITH TIME ZONE,
 *   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
 * );
 *
 * CREATE INDEX idx_lockouts_email ON account_lockouts(email);
 * CREATE INDEX idx_lockouts_locked_until ON account_lockouts(locked_until);
 *
 * -- Enable Row Level Security
 * ALTER TABLE failed_login_attempts ENABLE ROW LEVEL SECURITY;
 * ALTER TABLE account_lockouts ENABLE ROW LEVEL SECURITY;
 *
 * -- RLS Policies (Admin-only access)
 * CREATE POLICY "Admins can view failed attempts" ON failed_login_attempts
 *   FOR SELECT USING (
 *     EXISTS (
 *       SELECT 1 FROM an_users
 *       WHERE an_users.id = auth.uid()
 *       AND an_users.role = 'Admin'
 *     )
 *   );
 *
 * CREATE POLICY "Admins can view lockouts" ON account_lockouts
 *   FOR SELECT USING (
 *     EXISTS (
 *       SELECT 1 FROM an_users
 *       WHERE an_users.id = auth.uid()
 *       AND an_users.role = 'Admin'
 *     )
 *   );
 * ```
 */
