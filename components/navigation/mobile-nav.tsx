/**
 * Mobile Navigation Component
 * Developer: Maurice Rondeau
 *
 * Uses Sheet (Radix Dialog) for accessible mobile drawer with focus trapping,
 * scroll lock, and overlay dismiss. Visible only on screens below lg breakpoint.
 */

'use client'

import * as React from 'react'
import Link from 'next/link'
import { Menu, Plane } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { DashboardNavLink } from './dashboard-nav-link'
import { useCsrfToken } from '@/lib/hooks/use-csrf-token'

interface MobileNavProps {
  user: {
    email?: string
  }
  navLinks: Array<{
    href: string
    icon: React.ReactNode
    label: string
  }>
}

export function MobileNav({ user, navLinks }: MobileNavProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [isSigningOut, setIsSigningOut] = React.useState(false)
  const { csrfToken } = useCsrfToken()

  // A native <form method="POST"> cannot set the x-csrf-token header, so the
  // logout endpoint rejected it with 403 and the browser rendered the raw JSON
  // error as a page while the admin stayed signed in. Post it via fetch instead.
  const handleSignOut = async () => {
    setIsSigningOut(true)
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken && { 'x-csrf-token': csrfToken }),
        },
        credentials: 'include',
      })

      if (response.ok || response.redirected) {
        window.location.href = '/auth/login'
        return
      }
      console.error('Sign out failed:', response.status)
    } catch (error) {
      console.error('Sign out error:', error)
    }
    setIsSigningOut(false)
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      {/* Mobile Header - Touch-optimized */}
      <header className="border-border bg-card sticky top-0 z-40 border-b lg:hidden">
        <div className="flex h-12 items-center justify-between px-3">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="bg-primary flex h-7 w-7 items-center justify-center rounded-md">
              <Plane className="text-primary-foreground h-3.5 w-3.5" />
            </div>
            <span className="text-foreground text-[13px] font-semibold">Fleet Office</span>
          </Link>

          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Open menu"
              className="text-muted-foreground hover:text-foreground h-9 w-9"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </Button>
          </SheetTrigger>
        </div>
      </header>

      {/* Sheet Drawer - slides in from left */}
      <SheetContent side="left" className="w-64 p-0">
        <SheetHeader className="border-border/40 flex h-12 flex-row items-center gap-2 border-b px-4 py-0">
          <div className="bg-primary flex h-7 w-7 shrink-0 items-center justify-center rounded-md">
            <Plane className="text-primary-foreground h-3.5 w-3.5" />
          </div>
          <SheetTitle className="text-[13px] font-semibold">Fleet Office</SheetTitle>
        </SheetHeader>

        {/* Navigation - Touch-optimized */}
        <nav className="flex-1 space-y-0.5 overflow-y-auto p-2">
          {navLinks.map((link) => (
            <div key={link.href} onClick={() => setIsOpen(false)}>
              <DashboardNavLink
                href={link.href}
                icon={link.icon}
                className="min-h-[40px] touch-manipulation rounded-md"
              >
                {link.label}
              </DashboardNavLink>
            </div>
          ))}
        </nav>

        {/* User Info - Touch-optimized */}
        <div className="border-border/40 border-t p-3">
          <div className="flex items-center gap-2">
            <div className="bg-muted flex h-8 w-8 items-center justify-center rounded-full">
              <span className="text-muted-foreground text-xs font-medium">
                {user.email?.[0].toUpperCase()}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-foreground truncate text-[13px] font-medium">{user.email}</p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                // Disabled until the CSRF token has loaded: posting without the
                // header is guaranteed to 403 and leave the admin signed in.
                disabled={isSigningOut || !csrfToken}
                className="text-muted-foreground hover:text-foreground h-6 touch-manipulation px-0 text-xs"
              >
                {isSigningOut ? 'Signing out…' : 'Sign out'}
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
