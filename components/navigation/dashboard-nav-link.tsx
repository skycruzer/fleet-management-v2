'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

interface DashboardNavLinkProps {
  href: string
  icon: React.ReactNode
  children: React.ReactNode
  className?: string
}

export function DashboardNavLink({ href, icon, children, className }: DashboardNavLinkProps) {
  const pathname = usePathname()

  // Check if current route is active
  // Exact match for '/dashboard', prefix match for sub-routes
  const isActive = href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href)

  return (
    <Link
      href={href}
      className={cn(
        'flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
        isActive
          ? 'bg-primary/10 text-primary'
          : 'text-card-foreground hover:bg-muted hover:text-foreground',
        className
      )}
    >
      <span className="flex h-5 w-5 items-center justify-center">{icon}</span>
      <span>{children}</span>
    </Link>
  )
}
