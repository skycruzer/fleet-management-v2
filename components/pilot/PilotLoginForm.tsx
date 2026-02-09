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
import { motion, AnimatePresence } from 'framer-motion'
import { useAnimationSettings } from '@/lib/hooks/use-reduced-motion'
import { Loader2, ArrowRight } from 'lucide-react'

export default function PilotLoginForm() {
  const router = useRouter()
  const { shouldAnimate } = useAnimationSettings()
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
        <input
          {...register('staffId')}
          type="text"
          id="staffId"
          autoComplete="username"
          className="focus:border-primary focus:ring-primary bg-background text-foreground mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none sm:text-sm"
          placeholder="Enter your staff ID"
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
        <input
          {...register('password')}
          type="password"
          id="password"
          autoComplete="current-password"
          className="focus:border-primary focus:ring-primary bg-background text-foreground mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none sm:text-sm"
          placeholder="••••••••"
        />
        {errors.password && (
          <p className="mt-1 text-sm text-[var(--color-status-high)]">{errors.password.message}</p>
        )}
      </div>

      {/* Submit Button */}
      <motion.button
        type="submit"
        disabled={isSubmitting}
        whileHover={shouldAnimate ? { scale: isSubmitting ? 1 : 1.02 } : undefined}
        whileTap={shouldAnimate ? { scale: isSubmitting ? 1 : 0.98 } : undefined}
        className="bg-primary hover:bg-primary/90 focus:ring-primary relative w-full overflow-hidden rounded-md px-4 py-3 text-sm font-medium text-white shadow-lg focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
      >
        {/* Animated progress bar */}
        <AnimatePresence>
          {isSubmitting && (
            <motion.div
              initial={shouldAnimate ? { x: '-100%' } : { x: '100%' }}
              animate={shouldAnimate ? { x: '100%' } : { x: '100%' }}
              exit={{ x: '100%' }}
              transition={
                shouldAnimate
                  ? {
                      duration: 1.5,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }
                  : { duration: 0 }
              }
              className="via-primary/30 absolute inset-0 bg-gradient-to-r from-transparent to-transparent"
            />
          )}
        </AnimatePresence>

        <span className="relative z-10 flex items-center justify-center gap-2">
          <AnimatePresence mode="wait">
            {isSubmitting ? (
              <motion.span
                key="loading"
                initial={shouldAnimate ? { opacity: 0, y: 10 } : { opacity: 1 }}
                animate={{ opacity: 1, y: 0 }}
                exit={shouldAnimate ? { opacity: 0, y: -10 } : { opacity: 0 }}
                className="flex items-center gap-2"
              >
                <motion.div
                  animate={shouldAnimate ? { rotate: 360 } : undefined}
                  transition={
                    shouldAnimate
                      ? {
                          duration: 1,
                          repeat: Infinity,
                          ease: 'linear',
                        }
                      : { duration: 0 }
                  }
                >
                  <Loader2 className="h-5 w-5" />
                </motion.div>
                <span>Authenticating...</span>
              </motion.span>
            ) : (
              <motion.span
                key="signin"
                initial={shouldAnimate ? { opacity: 0, y: 10 } : { opacity: 1 }}
                animate={{ opacity: 1, y: 0 }}
                exit={shouldAnimate ? { opacity: 0, y: -10 } : { opacity: 0 }}
                className="flex items-center gap-2"
              >
                <span>Sign In</span>
                <motion.div
                  animate={shouldAnimate ? { x: [0, 4, 0] } : undefined}
                  transition={
                    shouldAnimate
                      ? {
                          duration: 1.5,
                          repeat: Infinity,
                          ease: 'easeInOut',
                        }
                      : { duration: 0 }
                  }
                >
                  <ArrowRight className="h-5 w-5" />
                </motion.div>
              </motion.span>
            )}
          </AnimatePresence>
        </span>
      </motion.button>
    </form>
  )
}
