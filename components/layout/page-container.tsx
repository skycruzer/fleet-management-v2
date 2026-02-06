/**
 * PageContainer Component
 * Developer: Maurice Rondeau
 *
 * Provides consistent page header + content spacing for dashboard pages.
 */

import { type ReactNode } from 'react'

interface PageContainerProps {
  title: string
  description?: string
  action?: ReactNode
  children: ReactNode
}

export function PageContainer({ title, description, action, children }: PageContainerProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-foreground text-2xl font-bold">{title}</h2>
          {description && <p className="text-muted-foreground mt-1">{description}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>
      {children}
    </div>
  )
}
