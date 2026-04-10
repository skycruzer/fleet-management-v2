/**
 * Sidebar Collapse Provider
 * Developer: Maurice Rondeau
 *
 * Client component that wraps the dashboard layout to share sidebar collapse
 * state between the sidebar and the content area via React context.
 */
'use client'

import { SidebarCollapseContext, useSidebarCollapseState } from '@/lib/hooks/use-sidebar-collapse'

export function SidebarCollapseProvider({ children }: { children: React.ReactNode }) {
  const collapseState = useSidebarCollapseState()

  return (
    <SidebarCollapseContext.Provider value={collapseState}>
      {children}
    </SidebarCollapseContext.Provider>
  )
}
