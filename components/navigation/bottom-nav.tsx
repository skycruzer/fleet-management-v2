'use client'

/**
 * Bottom Navigation Component
 * Mobile-first navigation bar with quick access to key pages
 * Hidden on desktop (md+), visible on mobile
 *
 * @author Maurice (Skycruzer)
 * @version 1.0.0
 */

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  Users,
  ClipboardList,
  FileCheck,
  Menu,
  Calendar,
  User,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface BottomNavItem {
  href: string
  icon: LucideIcon
  label: string
  badge?: number
}

interface BottomNavProps {
  variant?: 'admin' | 'pilot'
  pendingRequestsCount?: number
  onMoreClick?: () => void
  className?: string
}

const adminNavItems: BottomNavItem[] = [
  { href: '/dashboard', icon: Home, label: 'Home' },
  { href: '/dashboard/pilots', icon: Users, label: 'Pilots' },
  { href: '/dashboard/requests', icon: ClipboardList, label: 'Requests' },
  { href: '/dashboard/certifications', icon: FileCheck, label: 'Certs' },
]

const pilotNavItems: BottomNavItem[] = [
  { href: '/portal/dashboard', icon: Home, label: 'Home' },
  { href: '/portal/leave', icon: Calendar, label: 'Leave' },
  { href: '/portal/certifications', icon: FileCheck, label: 'Certs' },
  { href: '/portal/profile', icon: User, label: 'Profile' },
]

function BottomNavItem({
  item,
  isActive,
  badge,
}: {
  item: BottomNavItem
  isActive: boolean
  badge?: number
}) {
  const Icon = item.icon

  return (
    <Link
      href={item.href}
      className={cn(
        'flex min-w-[64px] flex-col items-center justify-center gap-1 px-3 py-2 transition-all duration-200',
        isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
      )}
      aria-current={isActive ? 'page' : undefined}
    >
      <div className="relative">
        <Icon
          className={cn('h-5 w-5 transition-transform duration-200', isActive && 'scale-110')}
        />
        {badge !== undefined && badge > 0 && (
          <span className="bg-destructive text-destructive-foreground absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-medium">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </div>
      <span
        className={cn(
          'text-[10px] font-medium transition-all duration-200',
          isActive && 'font-semibold'
        )}
      >
        {item.label}
      </span>
      {/* Active indicator */}
      {isActive && (
        <span className="bg-primary absolute bottom-0 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full" />
      )}
    </Link>
  )
}

export function BottomNav({
  variant = 'admin',
  pendingRequestsCount,
  onMoreClick,
  className,
}: BottomNavProps) {
  const pathname = usePathname()
  const navItems = variant === 'admin' ? adminNavItems : pilotNavItems

  // Check if current path is active
  const isActive = (href: string) => {
    if (href === '/dashboard' || href === '/portal/dashboard') {
      return pathname === href
    }
    return pathname.startsWith(href)
  }

  return (
    <nav
      className={cn(
        'fixed right-0 bottom-0 left-0 z-50 md:hidden',
        'bg-background/95 border-border border-t backdrop-blur-md',
        'pb-[env(safe-area-inset-bottom)]',
        className
      )}
      role="navigation"
      aria-label={variant === 'admin' ? 'Admin navigation' : 'Pilot navigation'}
    >
      <div className="flex h-16 items-center justify-around">
        {navItems.map((item) => (
          <BottomNavItem
            key={item.href}
            item={item}
            isActive={isActive(item.href)}
            badge={item.href.includes('requests') ? pendingRequestsCount : undefined}
          />
        ))}
        {/* More button for full navigation drawer */}
        <button
          onClick={onMoreClick}
          className={cn(
            'flex min-w-[64px] flex-col items-center justify-center gap-1 px-3 py-2',
            'text-muted-foreground hover:text-foreground transition-colors duration-200'
          )}
          aria-label="Open navigation menu"
          aria-haspopup="true"
        >
          <Menu className="h-5 w-5" />
          <span className="text-[10px] font-medium">More</span>
        </button>
      </div>
    </nav>
  )
}

export { type BottomNavItem, type BottomNavProps }
