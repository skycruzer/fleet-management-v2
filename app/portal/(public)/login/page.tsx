/**
 * Pilot Portal Login Page
 * Developer: Maurice Rondeau
 *
 * Clean Nova-style: centered card on dark navy premium background.
 * No registration or forgot-password — admin manages accounts.
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { IdCard, Lock, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react'

export default function PilotLoginPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)

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
    <div className="bg-background flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo & Title */}
        <div className="mb-8 text-center">
          <Image
            src="/images/air-niugini-logo.jpg"
            alt="Air Niugini"
            width={48}
            height={48}
            className="mx-auto mb-0 h-12 w-12 rounded-lg object-contain"
          />
          <p className="text-muted-foreground mt-1 text-xs font-medium tracking-wide">
            Air Niugini Ltd
          </p>
          <h1 className="text-foreground text-xl font-semibold">B767 Pilot Portal</h1>
          <p className="text-muted-foreground mt-1 text-sm">Crew member access</p>
        </div>

        {/* Login Card */}
        <div className="bg-card border-border rounded-lg border p-6">
          {/* Error */}
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-md border border-[var(--color-danger-500)]/20 bg-[var(--color-destructive-muted)] p-3 text-sm text-[var(--color-danger-400)]">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

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
                <input
                  id="staffId"
                  name="staffId"
                  type="text"
                  placeholder="Enter your staff ID"
                  required
                  disabled={isLoading}
                  autoComplete="username"
                  className="text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20 border-border bg-muted/40 w-full rounded-md border py-2 pr-3 pl-9 text-sm focus:ring-2 focus:outline-none disabled:opacity-50"
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
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  required
                  disabled={isLoading}
                  autoComplete="current-password"
                  className="text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20 border-border bg-muted/40 w-full rounded-md border py-2 pr-9 pl-9 text-sm focus:ring-2 focus:outline-none disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center gap-2">
              <input
                id="rememberMe"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={isLoading}
                className="text-primary focus:ring-primary/20 border-border bg-muted/40 h-4 w-4 rounded"
              />
              <label htmlFor="rememberMe" className="text-muted-foreground text-sm">
                Remember me for 30 days
              </label>
            </div>

            {/* Submit */}
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
          </form>
        </div>

        {/* Footer */}
        <p className="text-muted-foreground mt-6 text-center text-xs">
          Contact your administrator if you need account access.
        </p>
      </div>
    </div>
  )
}
