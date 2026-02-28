/**
 * Pilot Portal Login Page
 * Developer: Maurice Rondeau
 *
 * Clean Nova-style: centered card on dark navy premium background.
 * Enhanced with entrance animation, error shake, and button press feedback.
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Image from 'next/image'
import { IdCard, Lock, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react'
import { useAnimationSettings } from '@/lib/hooks/use-reduced-motion'
import { EASING, DURATION } from '@/lib/animations/motion-variants'
import { ThemeToggle } from '@/components/ui/theme-toggle'

export default function PilotLoginPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const { shouldAnimate } = useAnimationSettings()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    const staffId = formData.get('staffId') as string
    const password = formData.get('password') as string

    try {
      const response = await fetch('/api/portal/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staffId, password, rememberMe }),
      })

      const result = await response.json()

      if (result.success) {
        router.push(result.redirect || '/portal/dashboard')
      } else {
        setError(result.error?.message || result.error || 'Invalid credentials')
      }
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-background relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,#000_70%,transparent_110%)] bg-[size:4rem_4rem] opacity-20" />
        <div className="bg-primary/5 absolute -top-1/4 -left-1/4 h-96 w-96 rounded-full blur-3xl" />
        <div className="bg-primary/5 absolute -right-1/4 -bottom-1/4 h-96 w-96 rounded-full blur-3xl" />
      </div>
      <div className="fixed top-4 right-4 z-10">
        <ThemeToggle />
      </div>
      <motion.div
        className="w-full max-w-sm"
        initial={shouldAnimate ? { opacity: 0, y: 16, scale: 0.98 } : undefined}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: DURATION.slow, ease: EASING.easeOut }}
      >
        {/* Logo & Title */}
        <div className="mb-8 text-center">
          <Image
            src="/images/air-niugini-logo.jpg"
            alt="Air Niugini"
            width={48}
            height={48}
            className="mx-auto mb-0 h-14 w-14 rounded-xl object-contain shadow-lg"
          />
          <p className="text-muted-foreground mt-1 text-xs font-medium tracking-wide">
            Air Niugini Ltd
          </p>
          <h1 className="text-foreground text-xl font-semibold">B767 Pilot Portal</h1>
          <p className="text-muted-foreground mt-1 text-sm">Crew member access</p>
        </div>

        {/* Login Card */}
        <div className="bg-card border-border rounded-xl border p-6 shadow-2xl">
          {/* Error — with shake animation */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                key="error"
                initial={shouldAnimate ? { opacity: 0, x: 0 } : { opacity: 1 }}
                animate={
                  shouldAnimate
                    ? {
                        opacity: 1,
                        x: [0, -6, 6, -4, 4, 0],
                        transition: {
                          x: { duration: 0.4, times: [0, 0.15, 0.35, 0.55, 0.75, 1] },
                          opacity: { duration: DURATION.fast },
                        },
                      }
                    : { opacity: 1 }
                }
                exit={
                  shouldAnimate
                    ? { opacity: 0, transition: { duration: DURATION.fast } }
                    : undefined
                }
                role="alert"
                aria-live="assertive"
                className="border-destructive/20 bg-destructive/5 text-destructive mb-4 flex items-center gap-2 rounded-md border p-3 text-sm"
              >
                <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Staff ID */}
            <div>
              <label
                htmlFor="staffId"
                className="text-foreground/80 mb-1.5 block text-sm font-medium"
              >
                Staff ID
              </label>
              <div className="relative">
                <IdCard className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                <Input
                  id="staffId"
                  name="staffId"
                  type="text"
                  placeholder="Enter your staff ID"
                  required
                  disabled={isLoading}
                  autoComplete="username"
                  className="pl-9"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="text-foreground/80 mb-1.5 block text-sm font-medium"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  required
                  disabled={isLoading}
                  autoComplete="current-password"
                  className="pr-9 pl-9"
                  showIcon={false}
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me + Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  id="rememberMe"
                  type="button"
                  role="checkbox"
                  aria-checked={rememberMe}
                  onClick={() => setRememberMe(!rememberMe)}
                  disabled={isLoading}
                  className={`border-border focus-visible:ring-ring flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${rememberMe ? 'bg-primary border-primary text-primary-foreground' : 'bg-muted/40'}`}
                >
                  {rememberMe && (
                    <svg
                      className="h-3 w-3"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
                <label
                  htmlFor="rememberMe"
                  className="text-muted-foreground cursor-pointer text-sm"
                  onClick={() => setRememberMe(!rememberMe)}
                >
                  Remember me for 30 days
                </label>
              </div>
              <Link
                href="/portal/forgot-password"
                className="text-primary hover:text-primary/80 text-sm font-medium"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit — with press feedback */}
            <motion.div
              whileTap={shouldAnimate ? { scale: 0.98 } : undefined}
              transition={{ duration: 0.1 }}
            >
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-primary hover:bg-primary/90 w-full text-white disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Signing in...
                  </span>
                ) : (
                  'Sign In'
                )}
              </Button>
            </motion.div>
          </form>
        </div>

        {/* Footer */}
        <div className="mt-6 flex flex-col items-center gap-2 text-xs">
          <p className="text-muted-foreground">
            Contact your administrator if you need account access.
          </p>
          <Link
            href="/auth/login"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Admin access →
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
