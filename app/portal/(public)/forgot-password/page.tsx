/**
 * Pilot Portal Forgot Password Page
 * Developer: Maurice Rondeau
 *
 * Clean Nova-style: centered card on dark navy premium background.
 * Matches login page visual style.
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
import Link from 'next/link'
import {
  Mail,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ChevronLeft,
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
    <div className="bg-background flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo & Title */}
        <div className="mb-8 text-center">
          <div className="bg-primary mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg">
            <Key className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-foreground text-xl font-semibold">Reset Password</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Enter your email address and we&apos;ll send you a reset link
          </p>
        </div>

        {/* Card */}
        <div className="bg-card border-border rounded-lg border p-6">
          {/* Success Message */}
          {success && (
            <div className="mb-4 flex items-start gap-2 rounded-md border border-[var(--color-success-500)]/20 bg-[var(--color-success-muted)] p-3 text-sm">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-success-400)]" />
              <div>
                <p className="font-medium text-[var(--color-success-400)]">Email Sent!</p>
                <p className="mt-1 text-[var(--color-success-400)]/80">
                  If an account exists with this email, you&apos;ll receive password reset
                  instructions shortly.
                </p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-md border border-[var(--color-danger-500)]/20 bg-[var(--color-destructive-muted)] p-3 text-sm text-[var(--color-danger-400)]">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="text-foreground/80 mb-1.5 block text-sm font-medium"
              >
                Email Address
              </label>
              <div className="relative">
                <Mail className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                <Input
                  id="email"
                  type="email"
                  placeholder="captain@airniugini.com.pg"
                  {...form.register('email')}
                  disabled={isLoading || success}
                  className="focus:border-primary focus:ring-primary/20 border-border bg-muted/40 pl-9 text-sm focus:ring-2"
                />
              </div>
              {form.formState.errors.email && (
                <p className="mt-1 text-sm text-[var(--color-danger-400)]">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading || !email || success}
              className="bg-primary hover:bg-primary/90 w-full text-white disabled:opacity-50"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending Reset Link...
                </span>
              ) : success ? (
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Email Sent
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Send Reset Link
                  <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center">
            <div className="border-border flex-1 border-t" />
            <span className="text-muted-foreground px-4 text-sm">or</span>
            <div className="border-border flex-1 border-t" />
          </div>

          {/* Back to Login Link */}
          <Link
            href="/portal/login"
            className="text-primary hover:text-primary/80 flex items-center justify-center gap-2 text-sm font-medium transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Login
          </Link>
        </div>

        {/* Footer */}
        <p className="text-muted-foreground mt-6 text-center text-xs">
          Need help? Contact your system administrator or IT support.
        </p>
      </div>
    </div>
  )
}
