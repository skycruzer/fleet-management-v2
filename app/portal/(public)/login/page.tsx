/**
 * Pilot Portal Login Page
 * Minimal/Clean design - friendly crew authentication
 * Completely separate from Admin Portal
 *
 * @spec 001-missing-core-features (US1)
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { PilotLoginSchema, type PilotLoginInput } from '@/lib/validations/pilot-portal-schema'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import Link from 'next/link'
import {
  Plane,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Loader2,
  UserCircle,
  Cloud,
  ChevronLeft,
} from 'lucide-react'

export default function PilotLoginPage() {
  const router = useRouter()
  const [error, setError] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [emailFocused, setEmailFocused] = useState(false)
  const [passwordFocused, setPasswordFocused] = useState(false)

  const form = useForm<PilotLoginInput>({
    resolver: zodResolver(PilotLoginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = async (data: PilotLoginInput) => {
    setIsLoading(true)
    setError('')

    try {
      // Call the login API endpoint which handles password authentication
      const response = await fetch('/api/portal/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
        }),
      })

      // Success - browser followed redirect to dashboard
      if (response.redirected && response.url.includes('/portal/dashboard')) {
        window.location.href = '/portal/dashboard'
        return
      }

      // Handle different response statuses
      if (response.status === 200) {
        const result = await response.json()

        if (result.success) {
          // Force a small delay to ensure state updates
          setTimeout(() => {
            window.location.href = '/portal/dashboard'
          }, 100)
          return
        } else {
          setError(result.error?.message || result.message || 'Login failed')
          setIsLoading(false)
          return
        }
      }

      // Handle error responses (4xx, 5xx)
      if (response.status === 401) {
        setError('Invalid email or password')
        setIsLoading(false)
        return
      }

      if (response.status === 423) {
        const result = await response.json()
        setError(result.error?.message || 'Account is temporarily locked')
        setIsLoading(false)
        return
      }

      // Try to parse error response
      try {
        const result = await response.json()
        setError(result.error?.message || result.message || 'Login failed')
      } catch {
        setError(`Login failed (Status: ${response.status})`)
      }
      setIsLoading(false)
    } catch {
      setError('Network error. Please check your connection and try again.')
      setIsLoading(false)
    }
  }

  const { email, password } = form.watch()

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-zinc-100 via-zinc-50 to-white px-4 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
      {/* Minimal Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Subtle gradient orbs */}
        <div className="absolute top-1/4 -right-1/4 h-96 w-96 rounded-full bg-zinc-200/40 blur-3xl dark:bg-zinc-800/20" />
        <div className="absolute bottom-1/4 -left-1/4 h-96 w-96 rounded-full bg-zinc-200/40 blur-3xl dark:bg-zinc-800/20" />
      </div>

      {/* Main Card */}
      <div className="relative w-full max-w-md">
        <Card className="border-white/30 bg-white/95 p-8 shadow-2xl backdrop-blur-sm dark:border-gray-700 dark:bg-gray-900/95">
          {/* Logo and Title */}
          <div className="mb-8 text-center">
            <div className="mb-4 inline-flex">
              <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-zinc-900 shadow-xl dark:bg-zinc-100">
                <Plane className="h-10 w-10 text-white dark:text-zinc-900" />
              </div>
            </div>

            <h1 className="mb-2 text-4xl font-bold text-zinc-900 dark:text-zinc-100">
              Pilot Portal
            </h1>
            <div className="flex items-center justify-center gap-2 text-zinc-600 dark:text-zinc-400">
              <UserCircle className="h-5 w-5" />
              <p className="text-sm font-medium">Crew Member Access</p>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {/* Error Alert */}
            {error && (
              <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950">
                <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-400" />
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                <Input
                  id="email"
                  type="email"
                  {...form.register('email')}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                  placeholder="pilot@airniugini.com"
                  disabled={isLoading}
                  className="border-zinc-300 bg-white pl-10 text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:ring-blue-500/30 dark:border-zinc-600 dark:bg-gray-800 dark:text-zinc-100 dark:placeholder:text-zinc-500"
                />
                {email && email.includes('@') && !form.formState.errors.email && (
                  <div className="absolute top-1/2 right-3 -translate-y-1/2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  </div>
                )}
              </div>
              {form.formState.errors.email && (
                <p className="text-xs text-red-600">{form.formState.errors.email.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  {...form.register('password')}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  placeholder="Enter your password"
                  disabled={isLoading}
                  className="border-zinc-300 bg-white px-10 text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:ring-blue-500/30 dark:border-zinc-600 dark:bg-gray-800 dark:text-zinc-100 dark:placeholder:text-zinc-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {form.formState.errors.password && (
                <p className="text-xs text-red-600">{form.formState.errors.password.message}</p>
              )}
              {/* Forgot Password Link */}
              <div className="text-right">
                <Link
                  href="/portal/forgot-password"
                  className="text-sm font-medium text-blue-600 transition-colors hover:text-blue-700"
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            {/* Submit Button */}
            <div>
              <Button
                type="submit"
                className="relative w-full overflow-hidden bg-zinc-900 text-white shadow-lg hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                disabled={isLoading}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <>
                      <span>Access Portal</span>
                      <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </span>
              </Button>
            </div>
          </form>

          {/* Additional Options */}
          <div className="mt-6 space-y-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500 dark:bg-gray-900 dark:text-gray-400">
                  Options
                </span>
              </div>
            </div>

            {/* Register Link */}
            <div className="text-center">
              <p className="text-sm text-zinc-600">
                New crew member?{' '}
                <Link
                  href="/portal/register"
                  className="font-semibold text-blue-600 hover:text-blue-700"
                >
                  Register here
                </Link>
              </p>
            </div>
          </div>

          {/* Back to Home */}
          <div className="mt-6 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-zinc-700"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Back to home</span>
            </Link>
          </div>
        </Card>

        {/* Footer Note */}
        <div className="mt-4 text-center text-xs text-zinc-500">
          <p>Air Niugini Crew Portal</p>
        </div>
      </div>
    </div>
  )
}
