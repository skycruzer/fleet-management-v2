/**
 * Admin Portal Login Page
 * Professional, corporate authentication interface
 * Completely separate from Pilot Portal
 */

import Link from 'next/link'
import { Card } from '@/components/ui/card'
import {
  Building2,
  Shield,
  ChevronLeft
} from 'lucide-react'
import { LoginForm } from './login-form'

export default function AdminLoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4">
      {/* Professional Background Pattern */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,#000_70%,transparent_110%)] opacity-20" />

        {/* Subtle gradient orbs */}
        <div className="absolute -left-1/4 -top-1/4 h-96 w-96 rounded-full bg-blue-600/20 blur-3xl" />
        <div className="absolute -bottom-1/4 -right-1/4 h-96 w-96 rounded-full bg-slate-600/20 blur-3xl" />
      </div>

      {/* Main Card */}
      <div className="relative w-full max-w-md">
        <Card className="border-slate-800 bg-slate-900/95 p-8 shadow-2xl backdrop-blur-sm">
          {/* Logo and Title */}
          <div className="mb-8 text-center">
            <div className="mb-4 inline-flex">
              <div className="relative flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 shadow-lg ring-2 ring-slate-700">
                <Building2 className="h-8 w-8 text-slate-300" />
              </div>
            </div>
            <h1 className="mb-2 text-3xl font-bold text-white">
              Administration
            </h1>
            <div className="flex items-center justify-center gap-2 text-slate-400">
              <Shield className="h-4 w-4" />
              <p className="text-sm">Fleet Management System</p>
            </div>
          </div>

          {/* Login Form */}
          <LoginForm />

          {/* Back to Home */}
          <div className="mt-6 text-center">
            <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-slate-200">
              <ChevronLeft className="h-4 w-4" />
              <span>Back to home</span>
            </Link>
          </div>
        </Card>

        {/* Footer Note */}
        <div className="mt-4 text-center text-xs text-slate-600">
          <p>Authorized Personnel Only</p>
        </div>
      </div>
    </div>
  )
}
