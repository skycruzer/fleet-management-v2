/**
 * Focus Management Utilities
 * Helpers for managing focus in modals, dialogs, and complex components
 */

'use client'

import { useEffect, useRef } from 'react'

interface FocusTrapProps {
  children: React.ReactNode
  enabled?: boolean
  /**
   * Element to focus when trap is enabled
   */
  initialFocus?: React.RefObject<HTMLElement>
}

/**
 * Focus Trap Component
 * Traps keyboard focus within a container (useful for modals/dialogs)
 *
 * @example
 * ```tsx
 * <FocusTrap enabled={isOpen}>
 *   <Dialog>...</Dialog>
 * </FocusTrap>
 * ```
 */
export function FocusTrap({ children, enabled = true, initialFocus }: FocusTrapProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!enabled || !containerRef.current) return

    const container = containerRef.current
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )

    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    // Focus initial element or first focusable element
    if (initialFocus?.current) {
      initialFocus.current.focus()
    } else if (firstElement) {
      firstElement.focus()
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement?.focus()
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement?.focus()
        }
      }
    }

    container.addEventListener('keydown', handleKeyDown)

    return () => {
      container.removeEventListener('keydown', handleKeyDown)
    }
  }, [enabled, initialFocus])

  return <div ref={containerRef}>{children}</div>
}

/**
 * Hook to restore focus to previous element
 * Useful when closing modals/dialogs
 */
export function useRestoreFocus() {
  const previousActiveElement = useRef<HTMLElement | null>(null)

  useEffect(() => {
    previousActiveElement.current = document.activeElement as HTMLElement

    return () => {
      // Restore focus on unmount
      if (previousActiveElement.current) {
        previousActiveElement.current.focus()
      }
    }
  }, [])
}

/**
 * Hook to manage focus when component mounts
 */
export function useAutoFocus(ref: React.RefObject<HTMLElement>, enabled = true) {
  useEffect(() => {
    if (enabled && ref.current) {
      ref.current.focus()
    }
  }, [ref, enabled])
}
