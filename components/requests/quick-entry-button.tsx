/**
 * Quick Entry Button Component
 *
 * Button component that opens the quick entry form modal for creating pilot requests
 * from alternative submission channels (email, phone, Oracle).
 *
 * @author Maurice Rondeau
 * @date November 11, 2025
 */

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Plus, Mail, Phone, Globe } from 'lucide-react'
import { QuickEntryForm } from './quick-entry-form'

// ============================================================================
// Type Definitions
// ============================================================================

export interface QuickEntryButtonProps {
  /**
   * List of pilots for selection
   */
  pilots: Array<{
    id: string
    first_name: string
    last_name: string
    employee_id: string
    role: 'Captain' | 'First Officer' | 'Training Captain' | 'Relief Pilot'
    seniority_number: number | null
  }>

  /**
   * Callback when request is successfully created
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
  pilots,
  onSuccess,
  variant = 'default',
  size = 'default',
  compact = false,
  className = '',
}: QuickEntryButtonProps) {
  const [open, setOpen] = useState(false)

  // ============================================================================
  // Data Normalization
  // ============================================================================

  // Normalize pilots to match QuickEntryForm's expected type
  // Convert Training Captain, Relief Pilot, etc. to Captain or First Officer
  const normalizedPilots = pilots.map((p) => {
    let normalizedRole: 'Captain' | 'First Officer' = 'First Officer'
    if (p.role === 'Captain' || (p.role as string).includes('Captain')) {
      normalizedRole = 'Captain'
    }

    return {
      id: p.id,
      first_name: p.first_name,
      last_name: p.last_name,
      employee_id: p.employee_id,
      role: normalizedRole,
    }
  })

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleSuccess = () => {
    setOpen(false)
    // Note: QuickEntryForm doesn't pass the created request back
    onSuccess?.(undefined as any)
  }

  const handleCancel = () => {
    setOpen(false)
  }

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <>
      {/* Trigger Button */}
      <Button variant={variant} size={size} onClick={() => setOpen(true)} className={className}>
        <Plus className="h-4 w-4" />
        {!compact && <span className="ml-2">Quick Entry</span>}
      </Button>

      {/* Modal Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Quick Entry - Manual Request Creation</DialogTitle>
            <DialogDescription>
              Create pilot requests received through alternative channels (email, phone, Oracle
              system).
            </DialogDescription>
            <div className="text-muted-foreground flex gap-4 pt-2 text-sm">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-blue-600" />
                <span>Email</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-green-600" />
                <span>Phone</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-purple-600" />
                <span>Oracle System</span>
              </div>
            </div>
          </DialogHeader>

          {/* Quick Entry Form */}
          <div className="pt-4">
            <QuickEntryForm
              pilots={normalizedPilots}
              onSuccess={handleSuccess}
              onCancel={handleCancel}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

/**
 * Quick Entry Button with Icon Only (for compact layouts)
 */
export function QuickEntryButtonCompact(props: Omit<QuickEntryButtonProps, 'compact'>) {
  return <QuickEntryButton {...props} compact={true} size="icon" />
}
