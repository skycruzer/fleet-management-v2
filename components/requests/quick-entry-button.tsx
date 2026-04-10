/**
 * Quick Entry Button Component
 *
 * Button component that navigates to the leave request form page.
 *
 * @author Maurice Rondeau
 * @date February 2, 2026 - Updated to use simple form navigation
 */

'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

// ============================================================================
// Type Definitions
// ============================================================================

export interface QuickEntryButtonProps {
  /**
   * List of pilots for selection (kept for backward compatibility)
   */
  pilots?: Array<{
    id: string
    first_name: string
    last_name: string
    employee_id: string
    role: 'Captain' | 'First Officer' | 'Training Captain' | 'Relief Pilot'
    seniority_number: number | null
  }>

  /**
   * Callback when request is successfully created (kept for backward compatibility)
   */
  onSuccess?: (request: any) => void

  /**
   * Button variant
   */
  variant?: 'default' | 'outline' | 'secondary' | 'ghost'

  /**
   * Button size
   */
  size?: 'default' | 'sm' | 'lg' | 'icon'

  /**
   * Show full button text or just icon
   */
  compact?: boolean

  /**
   * Custom className
   */
  className?: string
}

// ============================================================================
// Component
// ============================================================================

export function QuickEntryButton({
  variant = 'default',
  size = 'default',
  compact = false,
  className = '',
}: QuickEntryButtonProps) {
  return (
    <Link href="/dashboard/leave/new">
      <Button variant={variant} size={size} className={className}>
        <Plus className="h-4 w-4" />
        {!compact && <span className="ml-2">Quick Entry</span>}
      </Button>
    </Link>
  )
}

/**
 * Quick Entry Button with Icon Only (for compact layouts)
 */
export function QuickEntryButtonCompact(props: Omit<QuickEntryButtonProps, 'compact'>) {
  return <QuickEntryButton {...props} compact={true} size="icon" />
}
