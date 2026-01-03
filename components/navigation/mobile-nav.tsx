/**
 * Mobile Navigation Component
 * Enhanced mobile menu with swipe gestures and touch-optimized interactions
 */

'use client'

import * as React from 'react'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
  const [isOpen, setIsOpen] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [dragX, setDragX] = useState(0)
  const drawerRef = useRef<HTMLDivElement>(null)
  const startXRef = useRef(0)
  const currentXRef = useRef(0)

  // Close menu and lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Keyboard navigation: Close drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  // Swipe gesture handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX
    currentXRef.current = e.touches[0].clientX
    setIsDragging(true)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return

    currentXRef.current = e.touches[0].clientX
    const diff = currentXRef.current - startXRef.current

    // Only allow dragging to close (swipe left when open)
    if (isOpen && diff < 0) {
      setDragX(diff)
    }
    // Allow dragging to open (swipe right from edge)
    else if (!isOpen && startXRef.current < 20 && diff > 0) {
      setDragX(Math.min(diff, 288)) // 288px = w-72
    }
  }

  const handleTouchEnd = () => {
    if (!isDragging) return

    const diff = currentXRef.current - startXRef.current
    const threshold = 100 // Minimum swipe distance

    if (isOpen && diff < -threshold) {
      setIsOpen(false)
    } else if (!isOpen && diff > threshold) {
      setIsOpen(true)
    }

    setIsDragging(false)
    setDragX(0)
  }

  // Calculate drawer transform based on drag or open state
  const getDrawerTransform = () => {
    if (isDragging && dragX !== 0) {
      if (isOpen) {
        return `translateX(${Math.min(0, dragX)}px)`
      } else {
        return `translateX(${Math.max(-288, -288 + dragX)}px)`
      }
    }
    return isOpen ? 'translateX(0)' : 'translateX(-100%)'
  }

  return (
    <>
      {/* Mobile Header - Touch-optimized */}
      <header className="border-border/40 bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky top-0 z-40 border-b backdrop-blur lg:hidden">
        <div className="flex h-12 items-center justify-between px-3">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="bg-accent flex h-7 w-7 items-center justify-center rounded-md">
              <span className="text-xs font-semibold text-white">FM</span>
            </div>
            <span className="text-foreground text-[13px] font-semibold">Fleet Management</span>
          </Link>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(!isOpen)}
            aria-label={isOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isOpen}
            className="text-muted-foreground hover:text-foreground h-9 w-9"
          >
            {isOpen ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" aria-hidden="true" />
            )}
          </Button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity duration-200 lg:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Menu Drawer - With swipe support */}
      <div
        ref={drawerRef}
        className="bg-background border-border/40 fixed inset-y-0 left-0 z-50 w-64 border-r shadow-lg transition-transform duration-200 ease-out lg:hidden"
        style={{
          transform: getDrawerTransform(),
          transition: isDragging ? 'none' : 'transform 200ms ease-out',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        {/* Logo */}
        <div className="border-border/40 flex h-12 items-center border-b px-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-2"
            onClick={() => setIsOpen(false)}
          >
            <div className="bg-accent flex h-7 w-7 items-center justify-center rounded-md">
              <span className="text-xs font-semibold text-white">FM</span>
            </div>
            <span className="text-foreground text-[13px] font-semibold">Fleet Management</span>
          </Link>
        </div>

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

        {/* Swipe indicator (visual hint) */}
        <div className="bg-border absolute top-1/2 right-0 h-10 w-0.5 -translate-y-1/2 rounded-l-full" />
      </div>

      {/* Edge swipe detection zone */}
      {!isOpen && (
        <div
          className="fixed inset-y-0 left-0 z-40 w-5 lg:hidden"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        />
      )}
    </>
  )
}
