'use client'

/**
 * Pilot Portal Bottom Navigation
 * Developer: Maurice Rondeau
 *
 * Mobile-only bottom tab bar (hidden at lg and up) with the four primary
 * pilot destinations. Active tab matched by pathname prefix and announced
 * via aria-current="page". Respects iOS safe-area insets.
 */

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bell, Calendar, FileCheck, LayoutDashboard } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BottomNavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

const bottomNavItems: BottomNavItem[] = [
  { title: 'Dashboard', href: '/portal/dashboard', icon: LayoutDashboard },
  { title: 'Certifications', href: '/portal/certifications', icon: FileCheck },
  { title: 'Requests', href: '/portal/requests', icon: Calendar },
  { title: 'Notifications', href: '/portal/notifications', icon: Bell },
]

export function PilotBottomNav() {
  const pathname = usePathname()

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`)

  return (
    <nav
      aria-label="Primary"
      className="border-border bg-background fixed inset-x-0 bottom-0 z-[var(--z-sidebar)] border-t pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <div className="flex items-stretch">
        {bottomNavItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex min-h-[44px] flex-1 flex-col items-center justify-center gap-0.5 px-1 py-1.5 transition-colors motion-reduce:transition-none',
                active ? 'text-foreground' : 'text-muted-foreground'
              )}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              <span className="text-[10px] leading-tight font-medium">{item.title}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
