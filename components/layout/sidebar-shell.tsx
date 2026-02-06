/**
 * Shared Sidebar Shell
 * Developer: Maurice Rondeau
 *
 * Provides the common layout structure for both admin and pilot portal sidebars.
 * Extracts the shared flex-column, fixed-width, scrollable-nav pattern.
 */

'use client'

import { cn } from '@/lib/utils'

interface SidebarShellProps {
  /** Content for the top logo/header area */
  header: React.ReactNode
  /** Main navigation content (scrollable) */
  children: React.ReactNode
  /** Content for the bottom footer area (e.g. logout button) */
  footer: React.ReactNode
  /** Additional className for the aside element */
  className?: string
}

export function SidebarShell({ header, children, footer, className }: SidebarShellProps) {
  return (
    <div className={cn('flex h-full flex-col', className)}>
      {/* Header / Logo Area */}
      <div className="flex-shrink-0">{header}</div>

      {/* Scrollable Navigation Area */}
      <div className="flex-1 overflow-y-auto">{children}</div>

      {/* Footer Area */}
      <div className="flex-shrink-0">{footer}</div>
    </div>
  )
}
