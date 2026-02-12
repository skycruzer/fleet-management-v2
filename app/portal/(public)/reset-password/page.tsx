/**
 * Pilot Portal Reset Password Page
 * Developer: Maurice Rondeau
 *
 * Clean Nova-style: centered card on dark navy premium background.
 * Matches login page visual style.
 *
 * @spec 001-missing-core-features (US1 - Password Reset)
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import {
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Key,
  Shield,
  ArrowRight,
} from 'lucide-react'

const ResetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isValidating, setIsValidating] = useState(true)
  const [tokenValid, setTokenValid] = useState(false)
  const [email, setEmail] = useState<string>('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(ResetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  })

  // Validate token on mount
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setError('Invalid reset link. No token provided.')
        setIsValidating(false)
        return
      }

      try {
        const response = await fetch(`/api/portal/reset-password?token=${token}`)
        const result = await response.json()

        if (!response.ok || !result.success) {
          setError(result.error || 'Invalid or expired reset link')
          setTokenValid(false)
        } else {
          setTokenValid(true)
          setEmail(result.data?.email || '')
        }
      } catch (err) {
        setError('Failed to validate reset link')
        setTokenValid(false)
      } finally {
        setIsValidating(false)
      }
    }

    validateToken()
  }, [token])

  const onSubmit = async (data: ResetPasswordInput) => {
    if (!token) {
      setError('Invalid reset link')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/portal/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          password: data.password,
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        setError(result.error || 'Failed to reset password. Please try again.')
        setIsLoading(false)
        return
      }

      setSuccess(true)
      form.reset()

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/portal/login')
      }, 3000)
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
      setIsLoading(false)
    }
  }

  const { password, confirmPassword } = form.watch()

  // Password strength indicator
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { strength: 0, label: '', color: '' }

    let strength = 0
    if (pwd.length >= 8) strength++
    if (/[A-Z]/.test(pwd)) strength++
    if (/[a-z]/.test(pwd)) strength++
    if (/[0-9]/.test(pwd)) strength++
    if (/[^A-Za-z0-9]/.test(pwd)) strength++

    if (strength <= 2) return { strength: 33, label: 'Weak', color: 'bg-[var(--color-danger-500)]' }
    if (strength === 3)
      return { strength: 66, label: 'Good', color: 'bg-[var(--color-warning-500)]' }
    return { strength: 100, label: 'Strong', color: 'bg-[var(--color-success-500)]' }
  }

  const passwordStrength = getPasswordStrength(password)

  return (
    <div className="bg-background flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo & Title */}
        <div className="mb-8 text-center">
          <div className="bg-primary mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-foreground text-xl font-semibold">Set New Password</h1>
          {email && (
            <p className="text-muted-foreground mt-1 text-sm">
              for <span className="text-foreground font-medium">{email}</span>
            </p>
          )}
        </div>

        {/* Card */}
        <div className="bg-card border-border rounded-lg border p-6">
          {/* Loading State */}
          {isValidating && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="text-primary h-8 w-8 animate-spin" />
              <p className="text-muted-foreground mt-4 text-sm">Validating reset link...</p>
            </div>
          )}

          {/* Invalid Token */}
          {!isValidating && !tokenValid && (
            <div className="space-y-4">
              <div className="flex items-start gap-2 rounded-md border border-[var(--color-danger-500)]/20 bg-[var(--color-destructive-muted)] p-3 text-sm">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-danger-400)]" />
                <div>
                  <p className="font-medium text-[var(--color-danger-400)]">Invalid Reset Link</p>
                  <p className="mt-1 text-[var(--color-danger-400)]/80">{error}</p>
                </div>
              </div>

              <Link href="/portal/forgot-password">
                <Button className="bg-primary hover:bg-primary/90 w-full text-white">
                  Request New Reset Link
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          )}

          {/* Success Message */}
          {!isValidating && tokenValid && success && (
            <div className="space-y-4">
              <div className="flex flex-col items-center text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-success-muted)]">
                  <CheckCircle2 className="h-6 w-6 text-[var(--color-success-400)]" />
                </div>
                <p className="text-foreground text-lg font-semibold">
                  Password Reset Successfully!
                </p>
                <p className="text-muted-foreground mt-2 text-sm">
                  You&apos;ll be redirected to login in a few seconds...
                </p>
              </div>
            </div>
          )}

          {/* Reset Form */}
          {!isValidating && tokenValid && !success && (
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Error Message */}
              {error && (
                <div className="flex items-center gap-2 rounded-md border border-[var(--color-danger-500)]/20 bg-[var(--color-destructive-muted)] p-3 text-sm text-[var(--color-danger-400)]">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Password Field */}
              <div>
                <label
                  htmlFor="password"
                  className="text-foreground/80 mb-1.5 block text-sm font-medium"
                >
                  New Password
                </label>
                <div className="relative">
                  <Lock className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter new password"
                    {...form.register('password')}
                    disabled={isLoading}
                    className="focus:border-primary focus:ring-primary/20 border-border bg-muted/40 pr-9 pl-9 text-sm focus:ring-2"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {password && (
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Password strength:</span>
                      <span
                        className={`font-medium ${passwordStrength.strength === 100 ? 'text-[var(--color-success-400)]' : passwordStrength.strength === 66 ? 'text-[var(--color-warning-400)]' : 'text-[var(--color-danger-400)]'}`}
                      >
                        {passwordStrength.label}
                      </span>
                    </div>
                    <div className="bg-muted/60 h-1.5 w-full rounded-full">
                      <div
                        className={`h-full rounded-full transition-all ${passwordStrength.color}`}
                        style={{ width: `${passwordStrength.strength}%` }}
                      />
                    </div>
                  </div>
                )}

                {form.formState.errors.password && (
                  <p className="mt-1 text-sm text-[var(--color-danger-400)]">
                    {form.formState.errors.password.message}
                  </p>
                )}

                {/* Password Requirements */}
                <div className="text-muted-foreground mt-2 space-y-1 text-xs">
                  <p className="font-medium">Password must contain:</p>
                  <ul className="ml-4 space-y-0.5">
                    <li className={password.length >= 8 ? 'text-[var(--color-success-400)]' : ''}>
                      • At least 8 characters
                    </li>
                    <li className={/[A-Z]/.test(password) ? 'text-[var(--color-success-400)]' : ''}>
                      • One uppercase letter
                    </li>
                    <li className={/[a-z]/.test(password) ? 'text-[var(--color-success-400)]' : ''}>
                      • One lowercase letter
                    </li>
                    <li className={/[0-9]/.test(password) ? 'text-[var(--color-success-400)]' : ''}>
                      • One number
                    </li>
                    <li
                      className={
                        /[^A-Za-z0-9]/.test(password) ? 'text-[var(--color-success-400)]' : ''
                      }
                    >
                      • One special character
                    </li>
                  </ul>
                </div>
              </div>

              {/* Confirm Password Field */}
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="text-foreground/80 mb-1.5 block text-sm font-medium"
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm new password"
                    {...form.register('confirmPassword')}
                    disabled={isLoading}
                    className="focus:border-primary focus:ring-primary/20 border-border bg-muted/40 pr-9 pl-9 text-sm focus:ring-2"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {form.formState.errors.confirmPassword && (
                  <p className="mt-1 text-sm text-[var(--color-danger-400)]">
                    {form.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading || !password || !confirmPassword}
                className="bg-primary hover:bg-primary/90 w-full text-white disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Resetting Password...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Reset Password
                    <Key className="h-4 w-4" />
                  </span>
                )}
              </Button>
            </form>
          )}

          {/* Footer Link */}
          {!isValidating && !success && (
            <>
              <div className="my-6 flex items-center">
                <div className="border-border flex-1 border-t" />
                <span className="text-muted-foreground px-4 text-sm">or</span>
                <div className="border-border flex-1 border-t" />
              </div>

              <Link
                href="/portal/login"
                className="text-primary hover:text-primary/80 flex items-center justify-center text-sm font-medium transition-colors"
              >
                Back to Login
              </Link>
            </>
          )}
        </div>

        {/* Footer */}
        <p className="text-muted-foreground mt-6 text-center text-xs">
          © {new Date().getFullYear()} Air Niugini · Pilot Portal
        </p>
      </div>
    </div>
  )
}
