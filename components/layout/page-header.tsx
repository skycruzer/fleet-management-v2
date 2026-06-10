/**
 * PageHeader — the canonical admin-dashboard page header.
 *
 * One pattern for every /dashboard page (the pilot portal uses
 * components/ui/page-head.tsx): h1 at text-xl/2xl font-semibold, optional
 * description, optional breadcrumbs above, optional actions on the right.
 *
 * Forms and detail pages must use this too — pages should always have a
 * real h1 (several forms previously used a bare h2 with no h1).
 */

import type { ReactNode } from 'react'
import { PageBreadcrumbs, type BreadcrumbItem } from '@/components/navigation/page-breadcrumbs'

interface PageHeaderProps {
  title: string
  /** One short utility sentence under the title. */
  description?: string
  /** Breadcrumb trail rendered above the title. */
  breadcrumbs?: BreadcrumbItem[]
  /** Right-aligned actions (buttons, links). */
  actions?: ReactNode
}

export function PageHeader({ title, description, breadcrumbs, actions }: PageHeaderProps) {
  return (
    <div className="space-y-2">
      {breadcrumbs && breadcrumbs.length > 0 && <PageBreadcrumbs items={breadcrumbs} />}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-foreground text-xl font-semibold tracking-tight lg:text-2xl">
            {title}
          </h1>
          {description && <p className="text-muted-foreground mt-1 text-sm">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
    </div>
  )
}
