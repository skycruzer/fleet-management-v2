'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Mail, Lock, ArrowRight, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react'
import { loginAction } from './actions'

export function LoginForm() {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [showPassword, setShowPassword] = useState(false)

  async function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await loginAction(formData)
      if (result?.error) {
        setError(result.error)
      }
    })
  }

  return (
    <form action={handleSubmit} className="space-y-5">
      {/* Error Message */}
      {error && (
        <div role="alert" aria-live="assertive" className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {/* Email Field */}
      <div className="space-y-2">
        <label htmlFor="email" className="text-muted-foreground block text-sm font-medium">
          Email Address
        </label>
        <div className="relative">
          <Mail className="text-muted-foreground/60 absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2" />
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="admin@airniugini.com"
            autoComplete="email"
            required
            disabled={isPending}
            className="border-border bg-muted/50 text-foreground placeholder:text-muted-foreground focus:border-muted-foreground focus:ring-muted-foreground/30 pl-10"
          />
        </div>
      </div>

      {/* Password Field */}
      <div className="space-y-2">
        <label htmlFor="password" className="text-muted-foreground block text-sm font-medium">
          Password
        </label>
        <div className="relative">
          <Lock className="text-muted-foreground/60 absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2" />
          <Input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            autoComplete="current-password"
            required
            disabled={isPending}
            className="border-border bg-muted/50 text-foreground placeholder:text-muted-foreground focus:border-muted-foreground focus:ring-muted-foreground/30 pr-10 pl-10"
          />
          <button
            type="button"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            onClick={() => setShowPassword(!showPassword)}
            className="text-muted-foreground/60 hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 transition-colors"
            disabled={isPending}
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Forgot Password */}
      <div className="text-right">
        <a
          href="/auth/forgot-password"
          className="text-muted-foreground hover:text-foreground text-sm transition-colors"
        >
          Forgot password?
        </a>
      </div>

      {/* Submit Button */}
      <div>
        <Button
          type="submit"
          disabled={isPending}
          className="group bg-primary text-primary-foreground hover:bg-primary/90 relative w-full overflow-hidden shadow-lg transition-all disabled:opacity-50"
        >
          {isPending ? (
            <span className="relative z-10 flex items-center justify-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Signing In...</span>
            </span>
          ) : (
            <span className="relative z-10 flex items-center justify-center gap-2">
              <span>Sign In</span>
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </span>
          )}
        </Button>
      </div>
      {/* Cross-portal links */}
      <div className="flex items-center justify-between pt-2 text-sm">
        <a
          href="/"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          Back to home
        </a>
        <a
          href="/portal/login"
          className="text-primary hover:text-primary/80 font-medium transition-colors"
        >
          Pilot Portal →
        </a>
      </div>
    </form>
  )
}
