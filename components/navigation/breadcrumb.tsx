/**
 * Breadcrumb Navigation Component
 * Displays hierarchical navigation path for current page
 */

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight, Home } from 'lucide-react'

interface BreadcrumbItem {
  label: string
  href: string
}

// Map of paths to readable labels
const pathLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  pilots: 'Pilots',
  certifications: 'Certifications',
  leave: 'Leave Requests',
  'flight-requests': 'Flight Requests',
  'renewal-planning': 'Renewal Planning',
  calendar: 'Calendar',
  analytics: 'Analytics',
  admin: 'Admin Dashboard',
  tasks: 'Tasks',
  disciplinary: 'Disciplinary',
  'audit-logs': 'Audit Logs',
  'check-types': 'Check Types',
  settings: 'My Settings',
  new: 'New',
  edit: 'Edit',
  users: 'Users',
  support: 'Support',
  faqs: 'FAQs',
  'roster-period': 'Roster Period',
  generate: 'Generate',
}

export function Breadcrumb() {
  const pathname = usePathname()

  // Don't show breadcrumb on homepage or login pages
  if (pathname === '/' || pathname.startsWith('/auth/') || pathname.startsWith('/portal/')) {
    return null
  }

  // Generate breadcrumb items from path
  const pathSegments = pathname.split('/').filter(Boolean)
  const breadcrumbItems: BreadcrumbItem[] = []

  // Build cumulative path for each segment
  pathSegments.forEach((segment, index) => {
    const href = '/' + pathSegments.slice(0, index + 1).join('/')
    const label = pathLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1)

    breadcrumbItems.push({ label, href })
  })

  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex items-center space-x-2 text-sm">
        {/* Home link */}
        <li>
          <Link
            href="/"
            className="text-muted-foreground hover:text-foreground flex items-center transition-colors"
          >
            <Home className="h-4 w-4" />
            <span className="sr-only">Home</span>
          </Link>
        </li>

        {breadcrumbItems.map((item, index) => {
          const isLast = index === breadcrumbItems.length - 1

          return (
            <li key={item.href} className="flex items-center space-x-2">
              <ChevronRight className="text-muted-foreground h-4 w-4" aria-hidden="true" />

              {isLast ? (
                <span
                  className="text-foreground font-medium"
                  aria-current="page"
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {item.label}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

/**
 * Compact Breadcrumb for mobile/tight spaces
 */
export function BreadcrumbCompact() {
  const pathname = usePathname()

  if (pathname === '/' || pathname.startsWith('/auth/') || pathname.startsWith('/portal/')) {
    return null
  }

  const pathSegments = pathname.split('/').filter(Boolean)
  const currentPage = pathSegments[pathSegments.length - 1]
  const label = pathLabels[currentPage] || currentPage.charAt(0).toUpperCase() + currentPage.slice(1)

  // Get parent path
  const parentPath = pathSegments.length > 1
    ? '/' + pathSegments.slice(0, -1).join('/')
    : '/'
  const parentLabel = pathSegments.length > 1
    ? pathLabels[pathSegments[pathSegments.length - 2]] || 'Back'
    : 'Home'

  return (
    <nav aria-label="Breadcrumb" className="mb-4 md:hidden">
      <Link
        href={parentPath}
        className="text-muted-foreground hover:text-foreground flex items-center text-sm transition-colors"
      >
        <ChevronRight className="mr-1 h-4 w-4 rotate-180" aria-hidden="true" />
        <span>{parentLabel}</span>
      </Link>
      <h1 className="text-foreground mt-2 text-2xl font-bold">{label}</h1>
    </nav>
  )
}
