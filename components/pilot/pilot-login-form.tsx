'use client'

/**
 * Pilot Login Form Component
 *
 * Client Component with form validation for pilot authentication.
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
import { PilotLoginSchema, type PilotLoginInput } from '@/lib/validations/pilot-portal-schema'
import { Loader2, ArrowRight } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function PilotLoginForm() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PilotLoginInput>({
    resolver: zodResolver(PilotLoginSchema),
  })

  const onSubmit = async (data: PilotLoginInput) => {
    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/pilot/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        setError(result.error || 'Login failed. Please check your credentials.')
        setIsSubmitting(false)
        return
      }

      // Login successful, redirect to dashboard
      router.push('/pilot/dashboard')
      router.refresh()
    } catch (err) {
      console.error('Login error:', err)
      setError('An unexpected error occurred. Please try again.')
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="rounded-md bg-[var(--color-status-high-bg)] p-4">
          <p className="text-sm text-[var(--color-status-high)]">{error}</p>
        </div>
      )}

      {/* Staff ID Field */}
      <div>
        <label htmlFor="staffId" className="text-foreground block text-sm font-medium">
          Staff ID
        </label>
        <Input
          {...register('staffId')}
          type="text"
          id="staffId"
          autoComplete="username"
          placeholder="Enter your staff ID"
          error={!!errors.staffId}
          className="mt-1"
        />
        {errors.staffId && (
          <p className="mt-1 text-sm text-[var(--color-status-high)]">{errors.staffId.message}</p>
        )}
      </div>

      {/* Password Field */}
      <div>
        <label htmlFor="password" className="text-foreground block text-sm font-medium">
          Password
        </label>
        <Input
          {...register('password')}
          type="password"
          id="password"
          autoComplete="current-password"
          placeholder="••••••••"
          error={!!errors.password}
          className="mt-1"
        />
        {errors.password && (
          <p className="mt-1 text-sm text-[var(--color-status-high)]">{errors.password.message}</p>
        )}
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={isSubmitting}
        className="group bg-primary text-primary-foreground hover:bg-primary/90 relative w-full overflow-hidden shadow-lg transition-all disabled:opacity-50"
      >
        {isSubmitting ? (
          <span className="relative z-10 flex items-center justify-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Authenticating...</span>
          </span>
        ) : (
          <span className="relative z-10 flex items-center justify-center gap-2">
            <span>Sign In</span>
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </span>
        )}
      </Button>
    </form>
  )
}
