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
        <div className="flex items-center gap-2 rounded-lg border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Email Field */}
      <div className="space-y-2">
        <label htmlFor="email" className="block text-sm font-medium text-slate-300">
          Email Address
        </label>
        <div className="relative">
          <Mail className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-slate-500" />
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="admin@airniugini.com"
            required
            disabled={isPending}
            className="border-slate-700 bg-slate-800/50 pl-10 text-white placeholder:text-slate-500 focus:border-slate-600 focus:ring-slate-600/30"
          />
        </div>
      </div>

      {/* Password Field */}
      <div className="space-y-2">
        <label htmlFor="password" className="block text-sm font-medium text-slate-300">
          Password
        </label>
        <div className="relative">
          <Lock className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-slate-500" />
          <Input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            required
            disabled={isPending}
            className="border-slate-700 bg-slate-800/50 pr-10 pl-10 text-white placeholder:text-slate-500 focus:border-slate-600 focus:ring-slate-600/30"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-500 transition-colors hover:text-slate-300"
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
          className="relative w-full overflow-hidden bg-slate-700 text-white shadow-lg transition-all hover:bg-slate-600 disabled:opacity-50"
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
