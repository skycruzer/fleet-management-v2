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
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 lg:hidden">
        <div className="flex h-16 items-center justify-between px-4">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <span className="text-sm font-bold text-primary-foreground">FM</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-foreground">Admin Dashboard</span>
              <span className="text-xs text-muted-foreground">Fleet Management</span>
            </div>
          </Link>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(!isOpen)}
            aria-label={isOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isOpen}
            className="h-11 w-11" // Touch-optimized size (44px)
          >
            {isOpen ? (
              <X className="h-6 w-6" aria-hidden="true" />
            ) : (
              <Menu className="h-6 w-6" aria-hidden="true" />
            )}
          </Button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 transition-opacity duration-300 lg:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Menu Drawer - With swipe support */}
      <div
        ref={drawerRef}
        className="fixed inset-y-0 left-0 z-50 w-72 bg-card shadow-xl transition-transform duration-300 ease-in-out lg:hidden"
        style={{
          transform: getDrawerTransform(),
          transition: isDragging ? 'none' : 'transform 300ms ease-in-out',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Logo */}
        <div className="flex h-16 items-center border-b border-border px-6">
          <Link
            href="/dashboard"
            className="flex items-center space-x-2"
            onClick={() => setIsOpen(false)}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <span className="text-sm font-bold text-primary-foreground">FM</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-foreground">Admin Dashboard</span>
              <span className="text-xs text-muted-foreground">Fleet Management</span>
            </div>
          </Link>
        </div>

        {/* Navigation - Touch-optimized */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-6">
          {navLinks.map((link) => (
            <div key={link.href} onClick={() => setIsOpen(false)}>
              <DashboardNavLink
                href={link.href}
                icon={link.icon}
                className="min-h-[44px] touch-manipulation" // Touch-optimized
              >
                {link.label}
              </DashboardNavLink>
            </div>
          ))}
        </nav>

        {/* User Info - Touch-optimized */}
        <div className="border-t border-border p-4">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              <span className="text-sm font-medium text-card-foreground">
                {user.email?.[0].toUpperCase()}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{user.email}</p>
              <form action="/api/auth/signout" method="POST">
                <Button
                  type="submit"
                  variant="ghost"
                  size="sm"
                  className="h-8 px-0 text-xs text-muted-foreground hover:text-card-foreground touch-manipulation"
                >
                  Sign out
                </Button>
              </form>
            </div>
          </div>
        </div>

        {/* Swipe indicator (visual hint) */}
        <div className="absolute right-0 top-1/2 h-12 w-1 -translate-y-1/2 rounded-l-full bg-muted-foreground/20" />
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
