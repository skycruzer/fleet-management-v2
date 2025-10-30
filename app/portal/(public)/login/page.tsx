/**
 * Pilot Portal Login Page
 * Aviation-themed, friendly crew authentication
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
import { motion, AnimatePresence } from 'framer-motion'
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
  ChevronLeft
} from 'lucide-react'

export default function PilotLoginPage() {
  const router = useRouter()
  const [error, setError] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [emailFocused, setEmailFocused] = useState(false)
  const [passwordFocused, setPasswordFocused] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

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

      const result = await response.json()

      if (!response.ok || !result.success) {
        setError(result.error?.message || result.message || 'Invalid email or password')
        setIsLoading(false)
        return
      }

      // Success - reset loading state and redirect to dashboard
      // Use window.location.replace() for immediate navigation (bypasses React state batching)
      setIsLoading(false)
      window.location.replace('/portal/dashboard')
    } catch (err) {
      console.error('Login error:', err)
      setError('An unexpected error occurred. Please try again.')
      setIsLoading(false)
    }
  }

  if (!mounted) {
    return null
  }

  const { email, password } = form.watch()

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-cyan-500 via-blue-500 to-indigo-600 px-4">
      {/* Aviation Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Animated Clouds - Multiple Layers */}
        <motion.div
          animate={{
            x: ['-100%', '100%'],
          }}
          transition={{
            duration: 40,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="absolute top-10 left-0"
        >
          <Cloud className="h-24 w-32 text-white/20" />
        </motion.div>

        <motion.div
          animate={{
            x: ['-100%', '100%'],
          }}
          transition={{
            duration: 50,
            repeat: Infinity,
            ease: 'linear',
            delay: 5,
          }}
          className="absolute top-32 left-0"
        >
          <Cloud className="h-32 w-40 text-white/15" />
        </motion.div>

        <motion.div
          animate={{
            x: ['-100%', '100%'],
          }}
          transition={{
            duration: 45,
            repeat: Infinity,
            ease: 'linear',
            delay: 10,
          }}
          className="absolute bottom-32 left-0"
        >
          <Cloud className="h-28 w-36 text-white/25" />
        </motion.div>

        {/* Sky Gradient Orbs */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute -right-1/4 top-1/4 h-96 w-96 rounded-full bg-cyan-300/30 blur-3xl"
        />

        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute -left-1/4 bottom-1/4 h-96 w-96 rounded-full bg-blue-300/30 blur-3xl"
        />
      </div>

      {/* Main Card */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative w-full max-w-md"
      >
        <Card className="border-white/30 bg-white/95 p-8 shadow-2xl backdrop-blur-sm">
          {/* Logo and Title */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="mb-8 text-center"
          >
            <div className="mb-4 inline-flex">
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 shadow-xl"
              >
                <Plane className="h-10 w-10 text-white" />

                {/* Pulsing ring effect */}
                <motion.div
                  animate={{
                    scale: [1, 1.4, 1],
                    opacity: [0.5, 0, 0.5],
                  }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  className="absolute inset-0 rounded-full bg-cyan-400/40"
                />
              </motion.div>
            </div>

            <h1 className="mb-2 bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-4xl font-bold text-transparent">
              Pilot Portal
            </h1>
            <div className="flex items-center justify-center gap-2 text-blue-600">
              <UserCircle className="h-5 w-5" />
              <p className="text-sm font-medium">Crew Member Access</p>
            </div>
          </motion.div>

          {/* Login Form */}
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {/* Error Alert */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -10, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
                    <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email Field */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <motion.div
                animate={{
                  scale: emailFocused ? 1.02 : 1,
                }}
                className="relative"
              >
                <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  {...form.register('email')}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                  placeholder="pilot@airniugini.com"
                  disabled={isLoading}
                  className="border-gray-300 bg-white pl-10 text-gray-900 placeholder:text-gray-400 focus:border-cyan-500 focus:ring-cyan-500/30"
                />
                <AnimatePresence>
                  {email && email.includes('@') && !form.formState.errors.email && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                    >
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
              {form.formState.errors.email && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs text-red-600"
                >
                  {form.formState.errors.email.message}
                </motion.p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <motion.div
                animate={{
                  scale: passwordFocused ? 1.02 : 1,
                }}
                className="relative"
              >
                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  {...form.register('password')}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  placeholder="Enter your password"
                  disabled={isLoading}
                  className="border-gray-300 bg-white px-10 text-gray-900 placeholder:text-gray-400 focus:border-cyan-500 focus:ring-cyan-500/30"
                />
                <motion.button
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.9 }}
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </motion.button>
              </motion.div>
              {form.formState.errors.password && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs text-red-600"
                >
                  {form.formState.errors.password.message}
                </motion.p>
              )}
              {/* Forgot Password Link */}
              <div className="text-right">
                <Link
                  href="/portal/forgot-password"
                  className="text-sm font-medium text-cyan-600 hover:text-cyan-700 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            {/* Submit Button */}
            <motion.div
              whileHover={{ scale: isLoading ? 1 : 1.02 }}
              whileTap={{ scale: isLoading ? 1 : 0.98 }}
            >
              <Button
                type="submit"
                className="relative w-full overflow-hidden bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg hover:from-cyan-600 hover:to-blue-700 disabled:opacity-50"
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

                {!isLoading && (
                  <motion.div
                    animate={{
                      x: ['-100%', '100%'],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                  />
                )}
              </Button>
            </motion.div>
          </form>

          {/* Additional Options */}
          <div className="mt-6 space-y-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">Options</span>
              </div>
            </div>

            {/* Register Link */}
            <div className="text-center">
              <p className="text-sm text-gray-600">
                New crew member?{' '}
                <Link
                  href="/portal/register"
                  className="font-semibold text-cyan-600 hover:text-cyan-700"
                >
                  Register here
                </Link>
              </p>
            </div>
          </div>

          {/* Back to Home */}
          <motion.div
            whileHover={{ x: -4 }}
            className="mt-6 text-center"
          >
            <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-700">
              <ChevronLeft className="h-4 w-4" />
              <span>Back to home</span>
            </Link>
          </motion.div>
        </Card>

        {/* Footer Note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-4 text-center text-xs text-white/80"
        >
          <p>Air Niugini Crew Portal</p>
        </motion.div>
      </motion.div>
    </div>
  )
}
