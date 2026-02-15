/**
 * Pilot Portal - Settings Page
 * Developer: Maurice Rondeau
 *
 * Account settings with password change functionality.
 * Uses existing /api/portal/change-password endpoint.
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PageBreadcrumbs } from '@/components/navigation/page-breadcrumbs'
import { useCsrfToken } from '@/lib/hooks/use-csrf-token'
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle2, Loader2, Settings } from 'lucide-react'

export default function SettingsPage() {
  const router = useRouter()
  const { csrfToken } = useCsrfToken()
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showOldPassword, setShowOldPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  async function handlePasswordChange(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')

    const formData = new FormData(e.currentTarget)
    const oldPassword = formData.get('oldPassword') as string
    const newPassword = formData.get('newPassword') as string
    const confirmPassword = formData.get('confirmPassword') as string

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
        setSuccess('Password changed successfully.')
        ;(e.target as HTMLFormElement).reset()
        router.refresh()
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
    <div className="p-4 lg:p-8">
      <PageBreadcrumbs />

      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
            <Settings className="text-primary h-5 w-5" />
          </div>
          <div>
            <h1 className="text-foreground text-2xl font-bold">Settings</h1>
            <p className="text-muted-foreground text-sm">Manage your account and security</p>
          </div>
        </div>
      </div>

      {/* Password Change Card */}
      <Card className="max-w-lg p-6">
        <div className="mb-4">
          <h2 className="text-foreground text-lg font-semibold">Change Password</h2>
          <p className="text-muted-foreground text-sm">
            Update your password to keep your account secure.
          </p>
        </div>

        {/* Success Alert */}
        {success && (
          <div className="mb-4 flex items-center gap-2 rounded-md border border-[var(--color-success-500)]/20 bg-[var(--color-success-muted)] p-3 text-sm text-[var(--color-success-400)]">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-md border border-[var(--color-danger-500)]/20 bg-[var(--color-destructive-muted)] p-3 text-sm text-[var(--color-danger-400)]">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handlePasswordChange} className="space-y-4">
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
                className="text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20 border-border bg-muted/30 w-full rounded-md border py-2 pr-9 pl-9 text-sm focus:ring-2 focus:outline-none disabled:opacity-50"
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
                className="text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20 border-border bg-muted/30 w-full rounded-md border py-2 pr-9 pl-9 text-sm focus:ring-2 focus:outline-none disabled:opacity-50"
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
                className="text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20 border-border bg-muted/30 w-full rounded-md border py-2 pr-9 pl-9 text-sm focus:ring-2 focus:outline-none disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
                disabled={isLoading}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
      </Card>
    </div>
  )
}
