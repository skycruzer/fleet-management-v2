/**
 * Pilot Portal Forgot Password Page
 * Aviation-themed password reset request
 *
 * @spec 001-missing-core-features (US1 - Password Reset)
 */

'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  Mail,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ChevronLeft,
  Cloud,
  Key,
} from 'lucide-react'

const ForgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [emailFocused, setEmailFocused] = useState(false)

  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(ForgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  })

  const onSubmit = async (data: ForgotPasswordInput) => {
    setIsLoading(true)
    setError('')
    setSuccess(false)

    try {
      const response = await fetch('/api/portal/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        setError(result.error || 'Failed to process request. Please try again.')
        setIsLoading(false)
        return
      }

      setSuccess(true)
      form.reset()
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const { email } = form.watch()

  return (
    <div className="bg-background relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      {/* Aviation Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Animated Clouds */}
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

        {/* Sky Gradient Orbs */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-20 right-20 h-96 w-96 rounded-full bg-gradient-to-br from-pink-300/30 to-purple-400/30 blur-3xl"
        />

        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.15, 0.25, 0.15],
          }}
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
              <Key className="h-8 w-8 text-white" />
            </motion.div>

            <h1 className="text-foreground mb-2 text-3xl font-bold">Reset Password</h1>
            <p className="text-muted-foreground text-sm">
              Enter your email address and we'll send you a link to reset your password
            </p>
          </div>

          {/* Success Message */}
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 flex items-start gap-3 rounded-lg border border-[var(--color-success-500)]/20 bg-[var(--color-success-muted)] p-4"
            >
              <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-[var(--color-success-400)]" />
              <div className="flex-1">
                <p className="text-sm font-medium text-[var(--color-success-400)]">Email Sent!</p>
                <p className="mt-1 text-sm text-[var(--color-success-400)]/80">
                  If an account exists with this email, you'll receive password reset instructions
                  shortly. Please check your inbox and spam folder.
                </p>
              </div>
            </motion.div>
          )}

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 flex items-start gap-3 rounded-lg border border-[var(--color-danger-500)]/20 bg-[var(--color-destructive-muted)] p-4"
            >
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-[var(--color-danger-400)]" />
              <p className="flex-1 text-sm text-[var(--color-danger-400)]">{error}</p>
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-foreground/80 text-sm font-medium">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute top-1/2 left-3 -translate-y-1/2">
                  <Mail
                    className={`h-5 w-5 transition-colors ${emailFocused ? 'text-primary' : 'text-muted-foreground'}`}
                  />
                </div>
                <Input
                  id="email"
                  type="email"
                  placeholder="captain@airniugini.com.pg"
                  {...form.register('email')}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                  disabled={isLoading || success}
                  className="focus:border-primary focus:ring-primary h-12 border-white/[0.1] bg-white/[0.03] pl-10"
                />
              </div>
              {form.formState.errors.email && (
                <p className="text-sm text-[var(--color-danger-400)]">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading || !email || success}
              className="group bg-primary text-primary-foreground hover:bg-primary/90 relative h-12 w-full overflow-hidden shadow-lg transition-all hover:shadow-xl disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Sending Reset Link...
                </>
              ) : success ? (
                <>
                  <CheckCircle2 className="mr-2 h-5 w-5" />
                  Email Sent
                </>
              ) : (
                <>
                  Send Reset Link
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="my-8 flex items-center">
            <div className="flex-1 border-t border-white/[0.08]" />
            <span className="text-muted-foreground px-4 text-sm">or</span>
            <div className="flex-1 border-t border-white/[0.08]" />
          </div>

          {/* Back to Login Link */}
          <Link
            href="/portal/login"
            className="group text-primary hover:text-primary/80 flex items-center justify-center gap-2 text-sm font-medium transition-colors"
          >
            <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Back to Login
          </Link>

          {/* Help Text */}
          <p className="text-muted-foreground mt-6 text-center text-xs">
            Need help? Contact your system administrator or IT support.
          </p>
        </Card>

        {/* Footer */}
        <p className="text-muted-foreground mt-6 text-center text-sm">
          © {new Date().getFullYear()} Air Niugini · Pilot Portal
        </p>
      </motion.div>
    </div>
  )
}
