/**
 * Login Page
 * Simple authentication page for testing purposes
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '../../lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const supabase = createClient()
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        setError(signInError.message)
        setLoading(false)
        return
      }

      // Success - redirect to dashboard
      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      setError('An unexpected error occurred')
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 p-4">
      <Card className="w-full max-w-md space-y-6 p-8">
        {/* Header */}
        <div className="space-y-2 text-center">
          <div className="mb-4 flex items-center justify-center">
            <span className="text-4xl">✈️</span>
          </div>
          <h1 className="text-foreground text-2xl font-bold">Fleet Management V2</h1>
          <p className="text-muted-foreground">Sign in to your account</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="your.email@airniugini.com.pg"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              className="w-full"
            />
          </div>

          {error && (
            <div className="border-destructive/20 rounded-md border bg-red-50 p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="bg-primary hover:bg-primary/90 w-full text-white"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        {/* Test Credentials Helper */}
        <div className="border-border border-t pt-4">
          <p className="text-muted-foreground mb-2 text-center text-xs">Test Credentials:</p>
          <div className="bg-muted/50 space-y-1 rounded-md p-3">
            <p className="text-muted-foreground font-mono text-xs">
              Email: mrondeau@airniugini.com.pg
            </p>
            <p className="text-muted-foreground font-mono text-xs">Password: test123</p>
          </div>
        </div>

        {/* Back to Home Link */}
        <div className="text-center">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/')}
            className="text-muted-foreground hover:text-foreground text-sm"
          >
            ← Back to Home
          </Button>
        </div>
      </Card>
    </div>
  )
}
