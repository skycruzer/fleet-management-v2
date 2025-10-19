/**
 * Login Page
 * User authentication with Supabase
 */

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
        return
      }

      if (data.session) {
        router.push('/dashboard')
        router.refresh()
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-muted/50 flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md p-8">
        {/* Logo and Title */}
        <div className="mb-8 text-center">
          <div className="bg-primary mb-4 inline-flex h-16 w-16 items-center justify-center rounded-lg">
            <span className="text-primary-foreground text-2xl font-bold">FM</span>
          </div>
          <h1 className="text-foreground text-2xl font-bold">Fleet Management V2</h1>
          <p className="text-muted-foreground mt-2">Sign in to your account</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="border-destructive/20 rounded-lg border bg-red-50 p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div>
            <label htmlFor="email" className="text-card-foreground mb-1 block text-sm font-medium">
              Email
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="pilot@example.com"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="text-card-foreground mb-1 block text-sm font-medium"
            >
              Password
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={loading}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>

        {/* Development Helper */}
        <div className="bg-primary/5 mt-6 rounded-lg border border-blue-200 p-4">
          <p className="mb-2 text-xs font-medium text-blue-900">Development Mode</p>
          <p className="text-xs text-blue-700">
            Create an account in Supabase dashboard or use test credentials if available.
          </p>
        </div>

        {/* Back to Home */}
        <div className="mt-6 text-center">
          <Link href="/" className="text-sm font-medium text-blue-600 hover:text-blue-700">
            ← Back to home
          </Link>
        </div>
      </Card>
    </div>
  )
}
