/**
 * Pilot Portal - Change Password Page
 * Developer: Maurice Rondeau
 *
 * Forced password change for first-time login.
 * Outside (protected) group to avoid infinite redirect loop.
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Plane, Lock, Eye, EyeOff, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react'

export default function ChangePasswordPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showOldPassword, setShowOldPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    const oldPassword = formData.get('oldPassword') as string
    const newPassword = formData.get('newPassword') as string
    const confirmPassword = formData.get('confirmPassword') as string

    // Client-side validation
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters.')
      setIsLoading(false)
      return
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.')
      setIsLoading(false)
      return
    }

    if (newPassword === oldPassword) {
      setError('New password must be different from your current password.')
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/portal/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPassword, newPassword }),
      })

      const result = await response.json()

      if (result.success) {
        router.push(result.redirect || '/portal/dashboard')
      } else {
        setError(result.error || 'Failed to change password.')
      }
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-background flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo & Title */}
        <div className="mb-8 text-center">
          <div className="bg-primary mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg">
            <Plane className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-foreground text-xl font-semibold">Change Password</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            You must change your password before continuing
          </p>
        </div>

        {/* Change Password Card */}
        <div className="bg-card rounded-lg border border-white/[0.08] p-6">
          {/* Info Banner */}
          <div className="mb-4 flex items-center gap-2 rounded-md border border-[var(--color-warning-500)]/20 bg-[var(--color-warning-muted)] p-3 text-sm text-[var(--color-warning-400)]">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>For security, please set a new personal password.</span>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-md border border-[var(--color-danger-500)]/20 bg-[var(--color-destructive-muted)] p-3 text-sm text-[var(--color-danger-400)]">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Current Password */}
            <div>
              <label
                htmlFor="oldPassword"
                className="text-foreground/80 mb-1.5 block text-sm font-medium"
              >
                Current Password
              </label>
              <div className="relative">
                <Lock className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                <input
                  id="oldPassword"
                  name="oldPassword"
                  type={showOldPassword ? 'text' : 'password'}
                  placeholder="Enter current password"
                  required
                  disabled={isLoading}
                  autoComplete="current-password"
                  className="text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20 w-full rounded-md border border-white/[0.1] bg-white/[0.03] py-2 pr-9 pl-9 text-sm focus:ring-2 focus:outline-none disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowOldPassword(!showOldPassword)}
                  className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
                  disabled={isLoading}
                >
                  {showOldPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label
                htmlFor="newPassword"
                className="text-foreground/80 mb-1.5 block text-sm font-medium"
              >
                New Password
              </label>
              <div className="relative">
                <Lock className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                <input
                  id="newPassword"
                  name="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  placeholder="At least 8 characters"
                  required
                  minLength={8}
                  disabled={isLoading}
                  autoComplete="new-password"
                  className="text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20 w-full rounded-md border border-white/[0.1] bg-white/[0.03] py-2 pr-9 pl-9 text-sm focus:ring-2 focus:outline-none disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
                  disabled={isLoading}
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="text-foreground/80 mb-1.5 block text-sm font-medium"
              >
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Re-enter new password"
                  required
                  minLength={8}
                  disabled={isLoading}
                  autoComplete="new-password"
                  className="text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20 w-full rounded-md border border-white/[0.1] bg-white/[0.03] py-2 pr-9 pl-9 text-sm focus:ring-2 focus:outline-none disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
                  disabled={isLoading}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-primary text-primary-foreground hover:bg-primary/90 w-full disabled:opacity-50"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Changing password...
                </span>
              ) : (
                'Change Password'
              )}
            </Button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-muted-foreground mt-6 text-center text-xs">
          Contact your administrator if you need assistance.
        </p>
      </div>
    </div>
  )
}
