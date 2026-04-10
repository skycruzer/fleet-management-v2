'use client'

/**
 * Pilot Registration Form Component
 *
 * Client Component with form validation for pilot registration.
 * Part of User Story 1: Pilot Portal Authentication & Dashboard (US1)
 *
 * @version 1.0.0
 * @since 2025-10-22
 * @spec 001-missing-core-features
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  PilotRegistrationSchema,
  type PilotRegistrationInput,
} from '@/lib/validations/pilot-portal-schema'

export default function PilotRegisterForm() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PilotRegistrationInput>({
    resolver: zodResolver(PilotRegistrationSchema),
  })

  const onSubmit = async (data: PilotRegistrationInput) => {
    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/portal/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        setError(result.error || 'Registration failed. Please try again.')
        setIsSubmitting(false)
        return
      }

      // Registration successful
      setSuccess(true)
      setTimeout(() => router.push('/pilot/login'), 3000)
    } catch (err) {
      console.error('Registration error:', err)
      setError('An unexpected error occurred. Please try again.')
      setIsSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="rounded-md bg-[var(--color-success-muted)] p-4">
        <h3 className="text-lg font-medium text-[var(--color-success-400)]">
          Registration Submitted!
        </h3>
        <p className="mt-2 text-sm text-[var(--color-success-400)]">
          Your registration has been submitted successfully. An administrator will review your
          application shortly. You'll receive an email notification once approved.
        </p>
        <p className="mt-2 text-sm text-[var(--color-success-400)]">Redirecting to login...</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <div className="rounded-md bg-[var(--color-destructive-muted)] p-4">
          <p className="text-sm text-[var(--color-danger-400)]">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {/* First Name */}
        <div>
          <label htmlFor="first_name" className="text-foreground/80 block text-sm font-medium">
            First Name *
          </label>
          <input
            {...register('first_name')}
            type="text"
            id="first_name"
            className="focus:border-primary focus:ring-primary border-border mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none sm:text-sm"
          />
          {errors.first_name && (
            <p className="mt-1 text-sm text-[var(--color-danger-400)]">
              {errors.first_name.message}
            </p>
          )}
        </div>

        {/* Last Name */}
        <div>
          <label htmlFor="last_name" className="text-foreground/80 block text-sm font-medium">
            Last Name *
          </label>
          <input
            {...register('last_name')}
            type="text"
            id="last_name"
            className="focus:border-primary focus:ring-primary border-border mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none sm:text-sm"
          />
          {errors.last_name && (
            <p className="mt-1 text-sm text-[var(--color-danger-400)]">
              {errors.last_name.message}
            </p>
          )}
        </div>
      </div>

      {/* Email */}
      <div>
        <label htmlFor="email" className="text-foreground/80 block text-sm font-medium">
          Email Address *
        </label>
        <input
          {...register('email')}
          type="email"
          id="email"
          className="focus:border-primary focus:ring-primary border-border mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none sm:text-sm"
        />
        {errors.email && (
          <p className="mt-1 text-sm text-[var(--color-danger-400)]">{errors.email.message}</p>
        )}
      </div>

      {/* Password */}
      <div>
        <label htmlFor="password" className="text-foreground/80 block text-sm font-medium">
          Password *
        </label>
        <input
          {...register('password')}
          type="password"
          id="password"
          className="focus:border-primary focus:ring-primary border-border mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none sm:text-sm"
        />
        {errors.password && (
          <p className="mt-1 text-sm text-[var(--color-danger-400)]">{errors.password.message}</p>
        )}
        <p className="text-muted-foreground mt-1 text-xs">
          Must contain uppercase, lowercase, number, and special character
        </p>
      </div>

      {/* Confirm Password */}
      <div>
        <label htmlFor="confirmPassword" className="text-foreground/80 block text-sm font-medium">
          Confirm Password *
        </label>
        <input
          {...register('confirmPassword')}
          type="password"
          id="confirmPassword"
          className="focus:border-primary focus:ring-primary border-border mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none sm:text-sm"
        />
        {errors.confirmPassword && (
          <p className="mt-1 text-sm text-[var(--color-danger-400)]">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      {/* Rank */}
      <div>
        <label htmlFor="rank" className="text-foreground/80 block text-sm font-medium">
          Rank *
        </label>
        <select
          {...register('rank')}
          id="rank"
          className="focus:border-primary focus:ring-primary border-border mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none sm:text-sm"
        >
          <option value="">Select rank</option>
          <option value="Captain">Captain</option>
          <option value="First Officer">First Officer</option>
        </select>
        {errors.rank && (
          <p className="mt-1 text-sm text-[var(--color-danger-400)]">{errors.rank.message}</p>
        )}
      </div>

      {/* Employee ID (Optional) */}
      <div>
        <label htmlFor="employee_id" className="text-foreground/80 block text-sm font-medium">
          Employee ID (Optional)
        </label>
        <input
          {...register('employee_id')}
          type="text"
          id="employee_id"
          className="focus:border-primary focus:ring-primary border-border mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none sm:text-sm"
        />
        {errors.employee_id && (
          <p className="mt-1 text-sm text-[var(--color-danger-400)]">
            {errors.employee_id.message}
          </p>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="bg-primary hover:bg-primary/90 focus:ring-primary flex w-full justify-center rounded-md px-4 py-2 text-sm font-medium text-white shadow-sm focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? 'Submitting...' : 'Register'}
      </button>
    </form>
  )
}
