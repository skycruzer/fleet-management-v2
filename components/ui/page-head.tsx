import * as React from 'react'
import { cn } from '@/lib/utils'

interface PageHeadProps extends Omit<React.HTMLAttributes<HTMLElement>, 'title'> {
  title: React.ReactNode
  description?: React.ReactNode
  breadcrumbs?: React.ReactNode
  action?: React.ReactNode
  tabs?: React.ReactNode
}

const PageHead = React.forwardRef<HTMLElement, PageHeadProps>(
  ({ className, title, description, breadcrumbs, action, tabs, ...props }, ref) => (
    <header ref={ref} className={cn('border-border bg-background border-b', className)} {...props}>
      <div className="px-4 pt-5 sm:px-6 sm:pt-6 lg:px-8">
        {breadcrumbs && <div className="mb-3 text-sm">{breadcrumbs}</div>}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-foreground truncate text-xl font-semibold tracking-tight lg:text-2xl">
              {title}
            </h1>
            {description && <p className="text-muted-foreground mt-1 text-sm">{description}</p>}
          </div>
          {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
        </div>
        <div className={cn(tabs ? 'mt-4' : 'pb-5 sm:pb-6')}>{tabs}</div>
      </div>
    </header>
  )
)
PageHead.displayName = 'PageHead'

export { PageHead }
