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

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      {/* Mobile Header - Touch-optimized */}
      <header className="border-border/40 bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky top-0 z-40 border-b backdrop-blur lg:hidden">
        <div className="flex h-12 items-center justify-between px-3">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="bg-accent flex h-7 w-7 items-center justify-center rounded-md">
              <Plane className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-foreground text-[13px] font-semibold">Fleet Management</span>
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
          <div className="bg-accent flex h-7 w-7 shrink-0 items-center justify-center rounded-md">
            <Plane className="h-3.5 w-3.5 text-white" />
          </div>
          <SheetTitle className="text-[13px] font-semibold">Fleet Management</SheetTitle>
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
              <form action="/api/auth/signout" method="POST">
                <Button
                  type="submit"
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground h-6 touch-manipulation px-0 text-xs"
                >
                  Sign out
                </Button>
              </form>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
