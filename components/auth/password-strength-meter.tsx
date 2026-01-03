/**
 * Password Strength Meter Component
 *
 * Visual feedback for password strength with requirements checklist.
 *
 * @version 1.0.0 - SECURITY: Password strength visualization
 * @updated 2025-11-04 - Phase 2C implementation
 * @author Maurice Rondeau
 */

'use client'

import { useMemo, useRef, useEffect } from 'react'
import { Check, X } from 'lucide-react'
import {
  PasswordStrength,
  getPasswordStrengthLabel,
  getPasswordStrengthColor,
  type PasswordValidationResult,
} from '@/lib/services/password-validation-service'

// Common passwords list - defined outside component for stability
const COMMON_PASSWORDS = [
  'password',
  'password123',
  '123456',
  '12345678',
  'qwerty',
  'abc123',
  'letmein',
  'welcome',
  'admin',
  'admin123',
]

// Helper function to check for common passwords
function isCommonPassword(pass: string): boolean {
  return COMMON_PASSWORDS.includes(pass.toLowerCase())
}

// Pure function to compute validation result
function computeValidation(password: string, email: string): PasswordValidationResult {
  if (!password) {
    return {
      isValid: false,
      score: PasswordStrength.VERY_WEAK,
      errors: [],
      suggestions: [],
      strength: {
        length: false,
        hasUppercase: false,
        hasLowercase: false,
        hasNumber: false,
        hasSpecial: false,
        notCommon: false,
      },
    }
  }

  const errors: string[] = []
  const suggestions: string[] = []
  const strength = {
    length: password.length >= 12,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    notCommon: !isCommonPassword(password),
  }

  // Calculate score
  let score = 0
  if (strength.length) score++
  if (strength.hasUppercase && strength.hasLowercase) score++
  if (strength.hasNumber) score++
  if (strength.hasSpecial) score++
  if (password.length >= 16) score++
  if (!strength.notCommon) score--

  const finalScore = Math.min(4, Math.max(0, score)) as PasswordStrength

  // Generate errors
  if (!strength.length) {
    errors.push('Password must be at least 12 characters long')
    suggestions.push('Use a longer passphrase')
  }
  if (!strength.hasUppercase) {
    errors.push('Add at least one uppercase letter')
  }
  if (!strength.hasLowercase) {
    errors.push('Add at least one lowercase letter')
  }
  if (!strength.hasNumber) {
    errors.push('Add at least one number')
  }
  if (!strength.hasSpecial) {
    errors.push('Add at least one special character')
  }
  if (!strength.notCommon) {
    errors.push('This password is too common')
    suggestions.push('Use a unique password')
  }
  if (email && password.toLowerCase().includes(email.toLowerCase())) {
    errors.push('Password cannot contain your email')
  }

  return {
    isValid: errors.length === 0 && finalScore >= 3,
    score: finalScore,
    errors,
    suggestions,
    strength,
  }
}

interface PasswordStrengthMeterProps {
  password: string
  email: string
  onValidationChange?: (result: PasswordValidationResult) => void
  showRequirements?: boolean
}

export function PasswordStrengthMeter({
  password,
  email,
  onValidationChange,
  showRequirements = true,
}: PasswordStrengthMeterProps) {
  // Compute validation as a pure memo - no effects needed
  const validation = useMemo(() => computeValidation(password, email), [password, email])

  // Track previous validation to notify parent only on changes
  const prevValidationRef = useRef<PasswordValidationResult | null>(null)

  // Notify parent of validation changes during render
  useEffect(() => {
    if (onValidationChange && validation !== prevValidationRef.current) {
      onValidationChange(validation)
      prevValidationRef.current = validation
    }
  }, [validation, onValidationChange])

  if (!password) {
    return null
  }

  const strengthLabel = getPasswordStrengthLabel(validation.score)
  const strengthColor = getPasswordStrengthColor(validation.score)

  // Progress bar width based on score
  const progressWidth = (validation.score / 4) * 100

  // Progress bar color
  const progressColorClass = {
    [PasswordStrength.VERY_WEAK]: 'bg-red-600',
    [PasswordStrength.WEAK]: 'bg-orange-600',
    [PasswordStrength.FAIR]: 'bg-yellow-600',
    [PasswordStrength.STRONG]: 'bg-green-600',
    [PasswordStrength.VERY_STRONG]: 'bg-emerald-600',
  }[validation.score]

  return (
    <div className="space-y-3">
      {/* Strength Bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Password Strength</span>
          <span className={`font-medium ${strengthColor}`}>{strengthLabel}</span>
        </div>

        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
          <div
            className={`h-full transition-all duration-300 ${progressColorClass}`}
            style={{ width: `${progressWidth}%` }}
          />
        </div>
      </div>

      {/* Requirements Checklist */}
      {showRequirements && (
        <div className="space-y-2 text-sm">
          <p className="font-medium text-gray-700 dark:text-gray-300">Requirements:</p>

          <ul className="space-y-1.5">
            <RequirementItem met={validation.strength.length} text="At least 12 characters" />
            <RequirementItem
              met={validation.strength.hasUppercase}
              text="One uppercase letter (A-Z)"
            />
            <RequirementItem
              met={validation.strength.hasLowercase}
              text="One lowercase letter (a-z)"
            />
            <RequirementItem met={validation.strength.hasNumber} text="One number (0-9)" />
            <RequirementItem
              met={validation.strength.hasSpecial}
              text="One special character (!@#$%)"
            />
            <RequirementItem met={validation.strength.notCommon} text="Not a common password" />
          </ul>
        </div>
      )}

      {/* Errors */}
      {validation.errors.length > 0 && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950">
          <ul className="space-y-1 text-sm text-red-700 dark:text-red-400">
            {validation.errors.slice(0, 3).map((error, index) => (
              <li key={index} className="flex items-start gap-2">
                <X className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Suggestions */}
      {validation.suggestions.length > 0 && validation.score < 3 && (
        <div className="rounded-md border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950">
          <p className="mb-1.5 text-sm font-medium text-blue-900 dark:text-blue-300">
            Suggestions:
          </p>
          <ul className="space-y-1 text-sm text-blue-700 dark:text-blue-400">
            {validation.suggestions.map((suggestion, index) => (
              <li key={index} className="flex items-start gap-2">
                <span>•</span>
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

interface RequirementItemProps {
  met: boolean
  text: string
}

function RequirementItem({ met, text }: RequirementItemProps) {
  return (
    <li className="flex items-center gap-2">
      {met ? (
        <Check className="h-4 w-4 flex-shrink-0 text-green-600 dark:text-green-500" />
      ) : (
        <X className="h-4 w-4 flex-shrink-0 text-gray-400 dark:text-gray-600" />
      )}
      <span
        className={met ? 'text-green-700 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}
      >
        {text}
      </span>
    </li>
  )
}
