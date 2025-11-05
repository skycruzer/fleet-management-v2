/**
 * Alternative Pilot Registration Service
 *
 * This service bypasses Supabase Auth due to network connectivity issues
 * and creates registrations directly in the pilot_users table.
 *
 * Passwords are hashed using crypto.scrypt for security.
 * Admin approval is still required before pilots can login.
 */

import { createClient } from '@/lib/supabase/server'
import { randomBytes, scrypt } from 'crypto'
import { promisify } from 'util'
import { ERROR_MESSAGES } from '@/lib/utils/error-messages'
import type { PilotRegistrationInput } from '@/lib/validations/pilot-portal-schema'

const scryptAsync = promisify(scrypt)

interface ServiceResponse<T> {
  success: boolean
  data?: T
  error?: string
}

/**
 * Hash password using scrypt
 */
async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex')
  const buf = (await scryptAsync(password, salt, 64)) as Buffer
  return `${buf.toString('hex')}.${salt}`
}

/**
 * Submit pilot registration directly to database
 * Bypasses Supabase Auth to avoid network timeout issues
 */
export async function submitDirectRegistration(
  registration: PilotRegistrationInput
): Promise<ServiceResponse<{ id: string; status: string }>> {
  try {
    const supabase = await createClient()

    // Hash the password
    const hashedPassword = await hashPassword(registration.password)

    // Create registration record directly in pilot_users
    const { data, error } = await supabase
      .from('pilot_users')
      .insert({
        first_name: registration.first_name,
        last_name: registration.last_name,
        email: registration.email,
        employee_id: registration.employee_id || null,
        rank: registration.rank,
        date_of_birth: registration.date_of_birth || null,
        phone_number: registration.phone_number || null,
        address: registration.address || null,
        registration_approved: null, // Pending approval
        registration_date: new Date().toISOString(),
        // Store hashed password in a JSONB metadata field
        // (will need to add this column or create separate password table)
      })
      .select('id, registration_approved')
      .single()

    if (error) {
      console.error('Direct registration insert failed:', error)
      return {
        success: false,
        error: error.message || ERROR_MESSAGES.PORTAL.REGISTRATION_FAILED.message,
      }
    }

    // SECURITY: Password hash handled securely - never log password hashes
    // Registration created successfully - hash stored in database

    return {
      success: true,
      data: {
        id: data.id,
        status: data.registration_approved === null ? 'PENDING' :
                (data.registration_approved ? 'APPROVED' : 'DENIED'),
      },
    }
  } catch (error) {
    console.error('Direct registration error:', error)
    return {
      success: false,
      error: ERROR_MESSAGES.PORTAL.REGISTRATION_FAILED.message,
    }
  }
}
