/**
 * Admin Portal Login Page
 * Minimal/Clean design - professional authentication interface
 * Completely separate from Pilot Portal
 */

import Link from 'next/link'
import Image from 'next/image'
import { Card } from '@/components/ui/card'
import { Shield, ChevronLeft } from 'lucide-react'
import { LoginForm } from './login-form'
import { ThemeToggle } from '@/components/ui/theme-toggle'

export default function AdminLoginPage() {
  return (
    <div className="bg-background flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <Card className="bg-card border-border p-8 shadow-lg">
          {/* Logo and Title */}
          <div className="mb-8 text-center">
            <div className="mb-4 inline-flex">
              <Image
                src="/images/air-niugini-logo.jpg"
                alt="Air Niugini"
                width={56}
                height={56}
                className="h-14 w-14 rounded-xl object-contain shadow-lg"
              />
            </div>
            <h1 className="text-foreground mb-2 text-xl font-semibold">Administration</h1>
            <div className="text-muted-foreground flex items-center justify-center gap-2">
              <Shield className="h-4 w-4" />
              <p className="text-sm">Fleet Management System</p>
            </div>
          </div>

          {/* Login Form */}
          <LoginForm />

          {/* Back to Home */}
          <div className="mt-6 text-center">
            <Link
              href="/"
              className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm font-medium"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Back to home</span>
            </Link>
          </div>
        </Card>

        {/* Footer Note */}
        <div className="text-muted-foreground/60 mt-4 flex items-center justify-center gap-3 text-xs">
          <p>Authorized Personnel Only</p>
          <ThemeToggle />
        </div>
      </div>
    </div>
  )
}
