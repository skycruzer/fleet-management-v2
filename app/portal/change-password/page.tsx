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
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useCsrfToken } from '@/lib/hooks/use-csrf-token'
import { Lock, Eye, EyeOff, AlertCircle, Loader2, ShieldCheck } from 'lucide-react'

export default function ChangePasswordPage() {
  const router = useRouter()
  const { csrfToken } = useCsrfToken()
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
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken && { 'x-csrf-token': csrfToken }),
        },
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
        <div className="mb-8 text-center">
          <h1 className="text-foreground text-xl font-semibold tracking-tight">Change password</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            You must change your password before continuing.
          </p>
        </div>

        <div className="bg-card border-border rounded-xl border p-6">
          <Alert className="mb-4">
            <ShieldCheck className="h-4 w-4" />
            <AlertDescription>For security, please set a new personal password.</AlertDescription>
          </Alert>

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
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
                  className="text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20 border-border bg-background w-full rounded-md border py-2 pr-9 pl-9 text-sm focus:ring-2 focus:outline-none disabled:opacity-50"
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
                  className="text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20 border-border bg-background w-full rounded-md border py-2 pr-9 pl-9 text-sm focus:ring-2 focus:outline-none disabled:opacity-50"
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
                  className="text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20 border-border bg-background w-full rounded-md border py-2 pr-9 pl-9 text-sm focus:ring-2 focus:outline-none disabled:opacity-50"
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
            <Button type="submit" disabled={isLoading} className="w-full disabled:opacity-50">
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Changing password…
                </span>
              ) : (
                'Change password'
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
