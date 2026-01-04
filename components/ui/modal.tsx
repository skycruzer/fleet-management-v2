/**
 * Accessible Modal Component
 *
 * Modal dialog with built-in focus trap and keyboard navigation
 * Complies with ARIA Authoring Practices for modal dialogs
 *
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
 */

'use client'

import * as React from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useFocusManagement } from '@/lib/hooks/use-focus-management'
import { Button } from '@/components/ui/button'

interface ModalProps {
  /**
   * Whether the modal is open
   */
  open: boolean

  /**
   * Callback when the modal should close
   */
  onClose: () => void

  /**
   * Modal title (required for accessibility)
   */
  title: string

  /**
   * Modal description (optional, for additional context)
   */
  description?: string

  /**
   * Modal content
   */
  children: React.ReactNode

  /**
   * Size of the modal
   */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'

  /**
   * Whether to show the close button
   */
  showCloseButton?: boolean

  /**
   * Whether clicking the backdrop closes the modal
   */
  closeOnBackdropClick?: boolean

  /**
   * Whether pressing Escape closes the modal
   */
  closeOnEscape?: boolean

  /**
   * Additional CSS classes for the modal content
   */
  className?: string
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-full mx-4',
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnBackdropClick = true,
  closeOnEscape = true,
  className,
}: ModalProps) {
  const modalRef = React.useRef<HTMLDivElement>(null)
  const triggerElementRef = React.useRef<HTMLElement | null>(null)
  const titleId = React.useId()
  const descriptionId = React.useId()

  // Focus management
  useFocusManagement({
    trapFocus: true,
    containerRef: modalRef,
    focusOnMount: true,
  })

  // Store the element that triggered the modal
  React.useEffect(() => {
    if (open) {
      triggerElementRef.current = document.activeElement as HTMLElement
    }
  }, [open])

  // Handle Escape key
  React.useEffect(() => {
    if (!open || !closeOnEscape) return

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [open, closeOnEscape, onClose])

  // Return focus when modal closes
  React.useEffect(() => {
    if (!open && triggerElementRef.current) {
      triggerElementRef.current.focus()
    }
  }, [open])

  // Prevent body scroll when modal is open
  React.useEffect(() => {
    if (open) {
      const originalOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = originalOverflow
      }
    }
    return undefined
  }, [open])

  if (!open) return null

  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (closeOnBackdropClick && event.target === event.currentTarget) {
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={handleBackdropClick}
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div className="flex min-h-full items-center justify-center p-4">
        {/* Modal Content */}
        <div
          ref={modalRef}
          className={cn(
            'relative w-full rounded-lg bg-white shadow-xl transition-all',
            sizeClasses[size],
            className
          )}
        >
          {/* Header */}
          <div className="flex items-start justify-between border-b border-gray-200 px-6 py-4">
            <div className="flex-1">
              <h2 id={titleId} className="text-xl font-semibold text-gray-900">
                {title}
              </h2>
              {description && (
                <p id={descriptionId} className="mt-1 text-sm text-gray-600">
                  {description}
                </p>
              )}
            </div>

            {/* Close Button */}
            {showCloseButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                aria-label="Close dialog"
                className="ml-4 text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </Button>
            )}
          </div>

          {/* Body */}
          <div className="px-6 py-4">{children}</div>
        </div>
      </div>
    </div>
  )
}

/**
 * Modal Footer component for action buttons
 */
interface ModalFooterProps {
  children: React.ReactNode
  className?: string
}

export function ModalFooter({ children, className }: ModalFooterProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4',
        className
      )}
    >
      {children}
    </div>
  )
}
