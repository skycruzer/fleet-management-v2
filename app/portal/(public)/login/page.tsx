/**
 * Pilot Portal Login Page
 * Developer: Maurice Rondeau
 */

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Image from 'next/image'
import { IdCard, Lock, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react'
import { ThemeToggle } from '@/components/ui/theme-toggle'

export default function PilotLoginPage() {
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
        window.location.href = result.redirect || '/portal/dashboard'
        return
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
    <div className="bg-background relative flex min-h-screen items-center justify-center px-4">
      <div className="fixed top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Image
            src="/images/air-niugini-logo.jpg"
            alt="Air Niugini"
            width={48}
            height={48}
            className="mx-auto h-12 w-12 rounded-xl object-contain"
          />
          <p className="text-muted-foreground mt-3 text-xs font-medium tracking-wide">
            Air Niugini Ltd
          </p>
          <h1 className="text-foreground text-xl font-semibold tracking-tight">
            B767 Pilot Portal
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">Crew member access</p>
        </div>

        <div className="bg-card border-border rounded-xl border p-6">
          {error && (
            <div
              role="alert"
              aria-live="assertive"
              className="border-destructive/20 bg-destructive/5 text-destructive mb-4 flex items-center gap-2 rounded-md border p-3 text-sm"
            >
              <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="staffId"
                className="text-foreground/80 mb-1.5 block text-sm font-medium"
              >
                Staff ID
              </label>
              <div className="relative">
                <IdCard className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                <Input
                  id="staffId"
                  name="staffId"
                  type="text"
                  placeholder="Enter your staff ID"
                  required
                  disabled={isLoading}
                  autoComplete="username"
                  className="pl-9"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="text-foreground/80 mb-1.5 block text-sm font-medium"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  required
                  disabled={isLoading}
                  autoComplete="current-password"
                  className="pr-9 pl-9"
                  showIcon={false}
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  id="rememberMe"
                  type="button"
                  role="checkbox"
                  aria-checked={rememberMe}
                  onClick={() => setRememberMe(!rememberMe)}
                  disabled={isLoading}
                  className={`border-border focus-visible:ring-ring flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${rememberMe ? 'bg-primary border-primary text-primary-foreground' : 'bg-muted/40'}`}
                >
                  {rememberMe && (
                    <svg
                      className="h-3 w-3"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
                <label
                  htmlFor="rememberMe"
                  className="text-muted-foreground cursor-pointer text-sm"
                  onClick={() => setRememberMe(!rememberMe)}
                >
                  Remember me for 30 days
                </label>
              </div>
              <Link
                href="/portal/forgot-password"
                className="text-foreground hover:text-foreground/80 text-sm font-medium"
              >
                Forgot password?
              </Link>
            </div>

            <Button type="submit" disabled={isLoading} className="w-full disabled:opacity-50">
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in…
                </span>
              ) : (
                'Sign in'
              )}
            </Button>
          </form>
        </div>

        <p className="text-muted-foreground mt-6 text-center text-xs">
          Contact your administrator if you need account access.
        </p>
      </div>
    </div>
  )
}
