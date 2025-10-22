'use client'

/**
 * Dynamic Page Breadcrumbs
 * Automatically generates breadcrumbs based on the current route
 */

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Fragment } from 'react'
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Home } from 'lucide-react'

interface BreadcrumbItem {
  label: string
  href?: string
}

interface PageBreadcrumbsProps {
  /**
   * Custom breadcrumb items to override automatic generation
   */
  items?: BreadcrumbItem[]
  /**
   * Whether to show the home icon for the dashboard
   */
  showHomeIcon?: boolean
  /**
   * Root path (dashboard or portal)
   */
  rootPath?: 'dashboard' | 'portal'
}

/**
 * Convert path segment to readable label
 */
function pathToLabel(segment: string): string {
  // Handle special cases
  const specialCases: Record<string, string> = {
    dashboard: 'Dashboard',
    portal: 'Portal',
    pilots: 'Pilots',
    certifications: 'Certifications',
    leave: 'Leave Requests',
    analytics: 'Analytics',
    admin: 'Admin',
    settings: 'Settings',
    'check-types': 'Check Types',
    users: 'Users',
    flights: 'Flight Requests',
    feedback: 'Feedback',
    new: 'New',
    edit: 'Edit',
  }

  if (specialCases[segment]) {
    return specialCases[segment]
  }

  // Convert kebab-case or snake_case to Title Case
  return segment
    .replace(/[-_]/g, ' ')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Generate breadcrumb items from pathname
 */
function generateBreadcrumbs(pathname: string, rootPath: 'dashboard' | 'portal'): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean)

  // Remove the root segment (dashboard or portal)
  const filteredSegments = segments.slice(1)

  const breadcrumbs: BreadcrumbItem[] = [
    {
      label: rootPath === 'dashboard' ? 'Admin Dashboard' : 'Pilot Portal',
      href: `/${rootPath}`,
    },
  ]

  let currentPath = `/${rootPath}`

  filteredSegments.forEach((segment, index) => {
    currentPath += `/${segment}`

    // Don't add link for the last segment (current page)
    const isLast = index === filteredSegments.length - 1

    // Skip IDs in breadcrumbs (UUIDs or numeric IDs)
    const isId =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment) ||
      /^\d+$/.test(segment)

    if (!isId) {
      breadcrumbs.push({
        label: pathToLabel(segment),
        href: isLast ? undefined : currentPath,
      })
    }
  })

  return breadcrumbs
}

/**
 * Page breadcrumbs component
 *
 * @example
 * ```tsx
 * // Automatic breadcrumbs
 * <PageBreadcrumbs />
 *
 * // Custom breadcrumbs
 * <PageBreadcrumbs items={[
 *   { label: 'Dashboard', href: '/dashboard' },
 *   { label: 'Pilots', href: '/dashboard/pilots' },
 *   { label: 'John Doe' }
 * ]} />
 * ```
 */
export function PageBreadcrumbs({
  items,
  showHomeIcon = true,
  rootPath,
}: PageBreadcrumbsProps) {
  const pathname = usePathname()

  // Determine root path from pathname if not provided
  const detectedRootPath = rootPath || (pathname.startsWith('/portal') ? 'portal' : 'dashboard')

  // Use custom items or generate from pathname
  const breadcrumbItems = items || generateBreadcrumbs(pathname, detectedRootPath)

  // Don't show breadcrumbs on root pages
  if (breadcrumbItems.length <= 1) {
    return null
  }

  return (
    <Breadcrumb className="mb-4">
      <BreadcrumbList>
        {breadcrumbItems.map((item, index) => {
          const isFirst = index === 0
          const isLast = index === breadcrumbItems.length - 1

          return (
            <Fragment key={item.href || item.label}>
              <BreadcrumbItem>
                {item.href ? (
                  <BreadcrumbLink asChild>
                    <Link href={item.href} className="flex items-center gap-1">
                      {isFirst && showHomeIcon && (
                        <Home className="h-3.5 w-3.5" aria-hidden="true" />
                      )}
                      <span>{item.label}</span>
                    </Link>
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbPage>{item.label}</BreadcrumbPage>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator />}
            </Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
