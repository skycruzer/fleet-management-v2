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
        <div className="flex items-center gap-2 rounded-lg border border-[var(--color-danger-500)]/50 bg-[var(--color-destructive-muted)] p-3 text-sm text-[var(--color-danger-400)]">
          <AlertCircle className="h-4 w-4 shrink-0" />
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
            required
            disabled={isPending}
            className="border-border bg-muted/50 text-foreground placeholder:text-muted-foreground/60 focus:border-muted-foreground focus:ring-muted-foreground/30 pl-10"
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
            required
            disabled={isPending}
            className="border-border bg-muted/50 text-foreground placeholder:text-muted-foreground/60 focus:border-muted-foreground focus:ring-muted-foreground/30 pr-10 pl-10"
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

      {/* Submit Button */}
      <div>
        <Button
          type="submit"
          disabled={isPending}
          className="bg-muted text-foreground hover:bg-muted/80 relative w-full overflow-hidden shadow-lg transition-all disabled:opacity-50"
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
    </form>
  )
}
