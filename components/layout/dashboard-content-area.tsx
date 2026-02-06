/**
 * Dashboard Content Area
 * Developer: Maurice Rondeau
 *
 * Client component that reads the sidebar collapse state to adjust
 * the left margin, creating a smooth transition when the sidebar toggles.
 */
'use client'

import { useSidebarCollapse } from '@/lib/hooks/use-sidebar-collapse'
import { cn } from '@/lib/utils'

export function DashboardContentArea({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebarCollapse()

  return (
    <div
      className={cn(
        'flex-1 overflow-x-hidden transition-[margin] duration-200',
        isCollapsed ? 'lg:ml-14' : 'lg:ml-60'
      )}
    >
      {children}
    </div>
  )
}
