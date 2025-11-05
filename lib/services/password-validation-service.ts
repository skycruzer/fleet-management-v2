/**
 * Password Validation Service
 *
 * Enforces strong password requirements to prevent weak credential attacks.
 *
 * @version 1.0.0 - SECURITY: Password complexity enforcement
 * @updated 2025-11-04 - Phase 2C implementation
 * @author Maurice Rondeau
 */

import { createClient } from '@/lib/supabase/server'

/**
 * Password validation configuration
 */
const PASSWORD_CONFIG = {
  MIN_LENGTH: 12,
  REQUIRE_UPPERCASE: true,
  REQUIRE_LOWERCASE: true,
  REQUIRE_NUMBER: true,
  REQUIRE_SPECIAL: true,
  MIN_STRENGTH_SCORE: 3, // 0-4 scale (require "strong" minimum)
} as const

/**
 * Password strength score (0-4)
 */
export enum PasswordStrength {
  VERY_WEAK = 0,
  WEAK = 1,
  FAIR = 2,
  STRONG = 3,
  VERY_STRONG = 4,
}

/**
 * Password validation result
 */
export interface PasswordValidationResult {
  isValid: boolean
  score: PasswordStrength
  errors: string[]
  suggestions: string[]
  strength: {
    length: boolean
    hasUppercase: boolean
    hasLowercase: boolean
    hasNumber: boolean
    hasSpecial: boolean
    notCommon: boolean
    notPreviouslyUsed?: boolean
  }
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
 * Validate password against all requirements
 *
 * @param password - Password to validate
 * @param email - User email (for checking against password)
 * @param userId - Optional user ID (for checking password history)
 * @returns Validation result with score and feedback
 */
export async function validatePassword(
  password: string,
  email: string,
  userId?: string
): Promise<PasswordValidationResult> {
  const errors: string[] = []
  const suggestions: string[] = []
  const strength = {
    length: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSpecial: false,
    notCommon: false,
    notPreviouslyUsed: true,
  }

  // Check minimum length
  if (password.length < PASSWORD_CONFIG.MIN_LENGTH) {
    errors.push(
      `Password must be at least ${PASSWORD_CONFIG.MIN_LENGTH} characters long`
    )
    suggestions.push('Use a longer passphrase with multiple words')
  } else {
    strength.length = true
  }

  // Check uppercase letters
  if (PASSWORD_CONFIG.REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
    suggestions.push('Add uppercase letters (A-Z)')
  } else {
    strength.hasUppercase = true
  }

  // Check lowercase letters
  if (PASSWORD_CONFIG.REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
    suggestions.push('Add lowercase letters (a-z)')
  } else {
    strength.hasLowercase = true
  }

  // Check numbers
  if (PASSWORD_CONFIG.REQUIRE_NUMBER && !/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number')
    suggestions.push('Add numbers (0-9)')
  } else {
    strength.hasNumber = true
  }

  // Check special characters
  if (
    PASSWORD_CONFIG.REQUIRE_SPECIAL &&
    !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
  ) {
    errors.push('Password must contain at least one special character')
    suggestions.push('Add special characters (!@#$%^&*)')
  } else {
    strength.hasSpecial = true
  }

  // Check if password contains email
  if (email && password.toLowerCase().includes(email.toLowerCase())) {
    errors.push('Password cannot contain your email address')
    suggestions.push('Use a password unrelated to your email')
  }

  // Check against common passwords
  const isCommon = checkCommonPassword(password)
  if (isCommon) {
    errors.push('This password is too common and easily guessed')
    suggestions.push('Use a unique password not found in common lists')
  } else {
    strength.notCommon = true
  }

  // Check password history (if user ID provided)
  if (userId) {
    const isReused = await checkPasswordHistory(password, userId)
    if (isReused) {
      errors.push('You have used this password before')
      suggestions.push('Create a new password you have not used previously')
      strength.notPreviouslyUsed = false
    }
  }

  // Calculate strength score
  const score = calculatePasswordScore(password, strength)

  // Determine if valid
  const isValid = errors.length === 0 && score >= PASSWORD_CONFIG.MIN_STRENGTH_SCORE

  return {
    isValid,
    score,
    errors,
    suggestions,
    strength,
  }
}

/**
 * Calculate password strength score (0-4)
 *
 * @param password - Password to evaluate
 * @param strength - Strength characteristics
 * @returns Score from 0 (very weak) to 4 (very strong)
 */
function calculatePasswordScore(
  password: string,
  strength: PasswordValidationResult['strength']
): PasswordStrength {
  let score = 0

  // Base requirements (each adds 1 point)
  if (strength.length) score++
  if (strength.hasUppercase && strength.hasLowercase) score++
  if (strength.hasNumber) score++
  if (strength.hasSpecial) score++

  // Bonus points
  if (password.length >= 16) score++ // Extra long
  if (password.length >= 20) score++ // Very long
  if (!strength.notCommon) score-- // Penalty for common passwords

  // Cap at 4
  return Math.min(4, Math.max(0, score)) as PasswordStrength
}

/**
 * Check if password is in common password list
 *
 * @param password - Password to check
 * @returns True if password is common
 */
function checkCommonPassword(password: string): boolean {
  const normalized = password.toLowerCase()

  // Common passwords list (top 100 most common)
  const commonPasswords = [
    'password',
    'password123',
    '123456',
    '12345678',
    '123456789',
    '12345',
    '1234567',
    'qwerty',
    'abc123',
    'monkey',
    '1234567890',
    'letmein',
    'trustno1',
    'dragon',
    'baseball',
    'iloveyou',
    'master',
    'sunshine',
    'ashley',
    'bailey',
    'passw0rd',
    'shadow',
    '123123',
    '654321',
    'superman',
    'qazwsx',
    'michael',
    'football',
    'welcome',
    'jesus',
    'ninja',
    'mustang',
    'password1',
    'password123!',
    'admin',
    'admin123',
    'root',
    'toor',
    'pass',
    'test',
    'guest',
    'changeme',
    'changeme123',
    'default',
    'user',
    'login',
    'welcome123',
    'qwerty123',
    'abc123456',
    'password1!',
    'password!',
    'p@ssw0rd',
    'p@ssword',
    'p@ssword123',
    'passw0rd123',
  ]

  // Check exact match
  if (commonPasswords.includes(normalized)) {
    return true
  }

  // Check simple variations (leet speak)
  const leetVariations = normalized
    .replace(/0/g, 'o')
    .replace(/1/g, 'i')
    .replace(/3/g, 'e')
    .replace(/4/g, 'a')
    .replace(/5/g, 's')
    .replace(/7/g, 't')
    .replace(/8/g, 'b')
    .replace(/!/g, '')
    .replace(/@/g, 'a')
    .replace(/\$/g, 's')

  if (commonPasswords.includes(leetVariations)) {
    return true
  }

  // Check sequential patterns
  if (
    /^(abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|012|123|234|345|456|567|678|789)+$/i.test(
      password
    )
  ) {
    return true
  }

  // Check keyboard patterns
  const keyboardPatterns = [
    'qwerty',
    'asdfgh',
    'zxcvbn',
    'qwertyuiop',
    'asdfghjkl',
    'zxcvbnm',
    '1qaz2wsx',
    '1q2w3e4r',
    'qazwsx',
    'qweasd',
  ]

  for (const pattern of keyboardPatterns) {
    if (normalized.includes(pattern)) {
      return true
    }
  }

  return false
}

/**
 * Check if password was previously used by this user
 *
 * @param password - Password to check
 * @param userId - User ID
 * @returns True if password was previously used
 */
async function checkPasswordHistory(
  password: string,
  userId: string
): Promise<boolean> {
  try {
    const supabase = await createClient()

    // Get user's password history
    const { data: history, error } = await supabase
      .from('password_history' as any)
      .select('password_hash')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5) // Check last 5 passwords

    if (error) {
      console.error('Error checking password history:', error)
      return false // Don't block on error
    }

    if (!history || history.length === 0) {
      return false
    }

    // Simple comparison using bcrypt (in production)
    // For now, we'll just return false as password_history table may not exist yet
    // This will be implemented when the table is created
    return false
  } catch (error) {
    console.error('Error in checkPasswordHistory:', error)
    return false
  }
}

/**
 * Hash password for storage
 *
 * @param password - Plain text password
 * @returns Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  // Use bcrypt for password hashing
  const bcrypt = require('bcryptjs')
  const saltRounds = 12
  return await bcrypt.hash(password, saltRounds)
}

/**
 * Verify password against hash
 *
 * @param password - Plain text password
 * @param hash - Password hash
 * @returns True if password matches
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  const bcrypt = require('bcryptjs')
  return await bcrypt.compare(password, hash)
}

/**
 * Save password to history (for preventing reuse)
 *
 * @param userId - User ID
 * @param passwordHash - Hashed password
 * @returns Service response
 */
export async function savePasswordHistory(
  userId: string,
  passwordHash: string
): Promise<ServiceResponse<null>> {
  try {
    const supabase = await createClient()

    // Insert password hash into history
    const { error } = await supabase.from('password_history' as any).insert({
      user_id: userId,
      password_hash: passwordHash,
      created_at: new Date().toISOString(),
    })

    if (error) {
      console.error('Error saving password history:', error)
      return {
        success: false,
        error: 'Failed to save password history',
      }
    }

    // Keep only last 5 passwords
    await cleanupPasswordHistory(userId)

    return {
      success: true,
      data: null,
    }
  } catch (error) {
    console.error('Error in savePasswordHistory:', error)
    return {
      success: false,
      error: 'Failed to save password history',
    }
  }
}

/**
 * Cleanup old password history (keep last 5)
 *
 * @param userId - User ID
 */
async function cleanupPasswordHistory(userId: string): Promise<void> {
  try {
    const supabase = await createClient()

    // Get all password history for user
    const { data: history } = await supabase
      .from('password_history' as any)
      .select('id, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (history && history.length > 5) {
      // Delete all except the 5 most recent
      const idsToDelete = (history as any).slice(5).map((h: any) => h.id)

      await supabase.from('password_history' as any).delete().in('id', idsToDelete)
    }
  } catch (error) {
    console.error('Error cleaning up password history:', error)
  }
}

/**
 * Get password strength label
 *
 * @param score - Password strength score
 * @returns Human-readable label
 */
export function getPasswordStrengthLabel(score: PasswordStrength): string {
  const labels: Record<PasswordStrength, string> = {
    [PasswordStrength.VERY_WEAK]: 'Very Weak',
    [PasswordStrength.WEAK]: 'Weak',
    [PasswordStrength.FAIR]: 'Fair',
    [PasswordStrength.STRONG]: 'Strong',
    [PasswordStrength.VERY_STRONG]: 'Very Strong',
  }

  return labels[score]
}

/**
 * Get password strength color (for UI)
 *
 * @param score - Password strength score
 * @returns Tailwind color class
 */
export function getPasswordStrengthColor(score: PasswordStrength): string {
  const colors: Record<PasswordStrength, string> = {
    [PasswordStrength.VERY_WEAK]: 'text-red-600',
    [PasswordStrength.WEAK]: 'text-orange-600',
    [PasswordStrength.FAIR]: 'text-yellow-600',
    [PasswordStrength.STRONG]: 'text-green-600',
    [PasswordStrength.VERY_STRONG]: 'text-emerald-600',
  }

  return colors[score]
}

/**
 * Database migration SQL for password history table
 *
 * Run this in Supabase SQL Editor:
 *
 * ```sql
 * -- Password history tracking
 * CREATE TABLE IF NOT EXISTS password_history (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   user_id UUID NOT NULL REFERENCES an_users(id) ON DELETE CASCADE,
 *   password_hash TEXT NOT NULL,
 *   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
 * );
 *
 * CREATE INDEX idx_password_history_user_id ON password_history(user_id);
 * CREATE INDEX idx_password_history_created_at ON password_history(created_at DESC);
 *
 * -- Enable Row Level Security
 * ALTER TABLE password_history ENABLE ROW LEVEL SECURITY;
 *
 * -- RLS Policies (Users can only view their own history, Admins can view all)
 * CREATE POLICY "Users can view own password history" ON password_history
 *   FOR SELECT USING (user_id = auth.uid());
 *
 * CREATE POLICY "Admins can view all password history" ON password_history
 *   FOR SELECT USING (
 *     EXISTS (
 *       SELECT 1 FROM an_users
 *       WHERE an_users.id = auth.uid()
 *       AND an_users.role = 'Admin'
 *     )
 *   );
 *
 * -- System can insert password history
 * CREATE POLICY "System can insert password history" ON password_history
 *   FOR INSERT WITH CHECK (true);
 *
 * -- System can delete old password history
 * CREATE POLICY "System can delete password history" ON password_history
 *   FOR DELETE USING (true);
 * ```
 */
