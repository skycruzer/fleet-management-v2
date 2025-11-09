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
import { PilotRegistrationSchema, type PilotRegistrationInput } from '@/lib/validations/pilot-portal-schema'

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
      <div className="rounded-md bg-green-50 p-4 dark:bg-green-900/20">
        <h3 className="text-lg font-medium text-green-800 dark:text-green-200">Registration Submitted!</h3>
        <p className="mt-2 text-sm text-green-700 dark:text-green-300">
          Your registration has been submitted successfully. An administrator will review your application
          shortly. You'll receive an email notification once approved.
        </p>
        <p className="mt-2 text-sm text-green-600 dark:text-green-400">
          Redirecting to login...
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/20">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {/* First Name */}
        <div>
          <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            First Name *
          </label>
          <input
            {...register('first_name')}
            type="text"
            id="first_name"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
          />
          {errors.first_name && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.first_name.message}</p>
          )}
        </div>

        {/* Last Name */}
        <div>
          <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Last Name *
          </label>
          <input
            {...register('last_name')}
            type="text"
            id="last_name"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
          />
          {errors.last_name && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.last_name.message}</p>
          )}
        </div>
      </div>

      {/* Email */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Email Address *
        </label>
        <input
          {...register('email')}
          type="email"
          id="email"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email.message}</p>
        )}
      </div>

      {/* Password */}
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Password *
        </label>
        <input
          {...register('password')}
          type="password"
          id="password"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
        />
        {errors.password && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password.message}</p>
        )}
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Must contain uppercase, lowercase, number, and special character
        </p>
      </div>

      {/* Confirm Password */}
      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Confirm Password *
        </label>
        <input
          {...register('confirmPassword')}
          type="password"
          id="confirmPassword"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
        />
        {errors.confirmPassword && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.confirmPassword.message}</p>
        )}
      </div>

      {/* Rank */}
      <div>
        <label htmlFor="rank" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Rank *
        </label>
        <select
          {...register('rank')}
          id="rank"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
        >
          <option value="">Select rank</option>
          <option value="Captain">Captain</option>
          <option value="First Officer">First Officer</option>
        </select>
        {errors.rank && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.rank.message}</p>
        )}
      </div>

      {/* Employee ID (Optional) */}
      <div>
        <label htmlFor="employee_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Employee ID (Optional)
        </label>
        <input
          {...register('employee_id')}
          type="text"
          id="employee_id"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
        />
        {errors.employee_id && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.employee_id.message}</p>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="flex w-full justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? 'Submitting...' : 'Register'}
      </button>
    </form>
  )
}
