'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Key,
  Cloud,
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

export function ResetPasswordContent() {
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
  const [passwordFocused, setPasswordFocused] = useState(false)
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false)

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

    if (strength <= 2) return { strength: 33, label: 'Weak', color: 'bg-red-500' }
    if (strength === 3) return { strength: 66, label: 'Good', color: 'bg-yellow-500' }
    return { strength: 100, label: 'Strong', color: 'bg-green-500' }
  }

  const passwordStrength = getPasswordStrength(password)

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 px-4">
      {/* Aviation Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
          className="absolute top-10 left-0"
        >
          <Cloud className="h-24 w-32 text-white/20" />
        </motion.div>

        <motion.div
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 50, repeat: Infinity, ease: 'linear', delay: 5 }}
          className="absolute top-32 left-0"
        >
          <Cloud className="h-32 w-40 text-white/15" />
        </motion.div>

        <motion.div
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 45, repeat: Infinity, ease: 'linear', delay: 10 }}
          className="absolute bottom-32 left-0"
        >
          <Cloud className="h-28 w-36 text-white/25" />
        </motion.div>

        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-20 right-20 h-96 w-96 rounded-full bg-gradient-to-br from-pink-300/30 to-purple-400/30 blur-3xl"
        />

        <motion.div
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.15, 0.25, 0.15] }}
          transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut', delay: 5 }}
          className="absolute bottom-20 left-20 h-96 w-96 rounded-full bg-gradient-to-tr from-blue-200/30 to-cyan-300/30 blur-3xl"
        />
      </div>

      {/* Main Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        <Card className="bg-card border-white/[0.08] p-8 shadow-2xl backdrop-blur-sm">
          {/* Header */}
          <div className="mb-8 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="bg-primary mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full"
            >
              <Shield className="h-8 w-8 text-white" />
            </motion.div>

            <h1 className="text-foreground mb-2 text-3xl font-bold">Set New Password</h1>
            {email && (
              <p className="text-muted-foreground text-sm">
                for <span className="text-foreground font-medium">{email}</span>
              </p>
            )}
          </div>

          {/* Loading State */}
          {isValidating && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="text-primary h-12 w-12 animate-spin" />
              <p className="text-muted-foreground mt-4 text-sm">Validating reset link...</p>
            </div>
          )}

          {/* Invalid Token */}
          {!isValidating && !tokenValid && (
            <div className="space-y-6">
              <div className="flex items-start gap-3 rounded-lg border border-red-500/20 bg-red-500/10 p-4">
                <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-400">Invalid Reset Link</p>
                  <p className="mt-1 text-sm text-red-400/80">{error}</p>
                </div>
              </div>

              <Link href="/portal/forgot-password">
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90 w-full">
                  Request New Reset Link
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          )}

          {/* Success Message */}
          {!isValidating && tokenValid && success && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6"
            >
              <div className="flex flex-col items-center text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                  className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10"
                >
                  <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                </motion.div>

                <p className="text-foreground text-lg font-semibold">
                  Password Reset Successfully!
                </p>
                <p className="text-muted-foreground mt-2 text-sm">
                  You'll be redirected to login in a few seconds...
                </p>
              </div>
            </motion.div>
          )}

          {/* Reset Form */}
          {!isValidating && tokenValid && !success && (
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-3 rounded-lg border border-red-500/20 bg-red-500/10 p-4"
                >
                  <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-400" />
                  <p className="flex-1 text-sm text-red-400">{error}</p>
                </motion.div>
              )}

              {/* Password Field */}
              <div className="space-y-2">
                <label htmlFor="password" className="text-foreground/80 text-sm font-medium">
                  New Password
                </label>
                <div className="relative">
                  <div className="absolute top-1/2 left-3 -translate-y-1/2">
                    <Lock
                      className={`h-5 w-5 transition-colors ${passwordFocused ? 'text-primary' : 'text-muted-foreground'}`}
                    />
                  </div>
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter new password"
                    {...form.register('password')}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                    disabled={isLoading}
                    className="focus:border-primary focus:ring-primary h-12 border-white/[0.1] bg-white/[0.03] pr-10 pl-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {password && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Password strength:</span>
                      <span
                        className={`font-medium ${passwordStrength.strength === 100 ? 'text-emerald-400' : passwordStrength.strength === 66 ? 'text-amber-400' : 'text-red-400'}`}
                      >
                        {passwordStrength.label}
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-white/[0.08]">
                      <div
                        className={`h-full rounded-full transition-all ${passwordStrength.color}`}
                        style={{ width: `${passwordStrength.strength}%` }}
                      />
                    </div>
                  </div>
                )}

                {form.formState.errors.password && (
                  <p className="text-sm text-red-400">{form.formState.errors.password.message}</p>
                )}

                {/* Password Requirements */}
                <div className="text-muted-foreground space-y-1 text-xs">
                  <p className="font-medium">Password must contain:</p>
                  <ul className="ml-4 space-y-0.5">
                    <li className={password.length >= 8 ? 'text-emerald-400' : ''}>
                      • At least 8 characters
                    </li>
                    <li className={/[A-Z]/.test(password) ? 'text-emerald-400' : ''}>
                      • One uppercase letter
                    </li>
                    <li className={/[a-z]/.test(password) ? 'text-emerald-400' : ''}>
                      • One lowercase letter
                    </li>
                    <li className={/[0-9]/.test(password) ? 'text-emerald-400' : ''}>
                      • One number
                    </li>
                    <li className={/[^A-Za-z0-9]/.test(password) ? 'text-emerald-400' : ''}>
                      • One special character
                    </li>
                  </ul>
                </div>
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-foreground/80 text-sm font-medium">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute top-1/2 left-3 -translate-y-1/2">
                    <Lock
                      className={`h-5 w-5 transition-colors ${confirmPasswordFocused ? 'text-primary' : 'text-muted-foreground'}`}
                    />
                  </div>
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm new password"
                    {...form.register('confirmPassword')}
                    onFocus={() => setConfirmPasswordFocused(true)}
                    onBlur={() => setConfirmPasswordFocused(false)}
                    disabled={isLoading}
                    className="focus:border-primary focus:ring-primary h-12 border-white/[0.1] bg-white/[0.03] pr-10 pl-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {form.formState.errors.confirmPassword && (
                  <p className="text-sm text-red-400">
                    {form.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading || !password || !confirmPassword}
                className="group bg-primary text-primary-foreground hover:bg-primary/90 relative h-12 w-full overflow-hidden shadow-lg transition-all hover:shadow-xl disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Resetting Password...
                  </>
                ) : (
                  <>
                    Reset Password
                    <Key className="ml-2 h-5 w-5 transition-transform group-hover:rotate-12" />
                  </>
                )}
              </Button>
            </form>
          )}

          {/* Footer Link */}
          {!isValidating && !success && (
            <>
              <div className="my-8 flex items-center">
                <div className="flex-1 border-t border-white/[0.08]" />
                <span className="text-muted-foreground px-4 text-sm">or</span>
                <div className="flex-1 border-t border-white/[0.08]" />
              </div>

              <Link
                href="/portal/login"
                className="text-primary hover:text-primary/80 flex items-center justify-center text-sm font-medium transition-colors"
              >
                Back to Login
              </Link>
            </>
          )}
        </Card>

        {/* Footer */}
        <p className="mt-6 text-center text-sm text-white/80">
          © {new Date().getFullYear()} Air Niugini · Pilot Portal
        </p>
      </motion.div>
    </div>
  )
}
