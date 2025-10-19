/**
 * Focus Management Hook
 *
 * Provides comprehensive focus management utilities for accessibility
 * Complies with WCAG 2.4.3 Focus Order (Level A)
 *
 * @see https://www.w3.org/WAI/WCAG21/Understanding/focus-order.html
 */

import { useEffect, useRef, useCallback } from 'react'

interface UseFocusManagementOptions {
  /**
   * Automatically focus the first field when component mounts
   */
  focusOnMount?: boolean

  /**
   * Element to focus when component mounts (overrides focusOnMount)
   */
  initialFocusRef?: React.RefObject<HTMLElement>

  /**
   * Element to return focus to when component unmounts
   */
  returnFocusRef?: React.RefObject<HTMLElement>

  /**
   * Trap focus within a container (useful for modals/dialogs)
   */
  trapFocus?: boolean

  /**
   * Container ref for focus trapping
   */
  containerRef?: React.RefObject<HTMLElement>
}

/**
 * Hook to manage focus for forms, modals, and other interactive components
 */
export function useFocusManagement(options: UseFocusManagementOptions = {}) {
  const {
    focusOnMount = false,
    initialFocusRef,
    returnFocusRef,
    trapFocus = false,
    containerRef,
  } = options

  // Store the element that had focus before this component mounted
  const previouslyFocusedElement = useRef<HTMLElement | null>(null)

  /**
   * Get all focusable elements within a container
   */
  const getFocusableElements = useCallback((container: HTMLElement): HTMLElement[] => {
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]',
    ].join(', ')

    const elements = container.querySelectorAll<HTMLElement>(focusableSelectors)
    return Array.from(elements).filter(
      (el) => !el.hasAttribute('disabled') && el.offsetParent !== null
    )
  }, [])

  /**
   * Focus the first focusable element in a container
   */
  const focusFirst = useCallback((container?: HTMLElement) => {
    const target = container || document.body
    const focusableElements = getFocusableElements(target)

    if (focusableElements.length > 0) {
      focusableElements[0].focus()
      return true
    }
    return false
  }, [getFocusableElements])

  /**
   * Focus a specific element with error handling
   */
  const focusElement = useCallback((element: HTMLElement | null) => {
    if (!element) return false

    try {
      element.focus()
      return document.activeElement === element
    } catch (error) {
      console.warn('Failed to focus element:', error)
      return false
    }
  }, [])

  /**
   * Return focus to the previously focused element
   */
  const returnFocus = useCallback(() => {
    const elementToFocus = returnFocusRef?.current || previouslyFocusedElement.current
    if (elementToFocus) {
      focusElement(elementToFocus)
    }
  }, [returnFocusRef, focusElement])

  /**
   * Handle focus trap for modals/dialogs
   */
  useEffect(() => {
    if (!trapFocus || !containerRef?.current) return

    const container = containerRef.current

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return

      const focusableElements = getFocusableElements(container)
      if (focusableElements.length === 0) return

      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]

      // Shift + Tab: move backwards
      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault()
          lastElement.focus()
        }
      }
      // Tab: move forwards
      else {
        if (document.activeElement === lastElement) {
          event.preventDefault()
          firstElement.focus()
        }
      }
    }

    container.addEventListener('keydown', handleKeyDown)
    return () => container.removeEventListener('keydown', handleKeyDown)
  }, [trapFocus, containerRef, getFocusableElements])

  /**
   * Handle initial focus and cleanup
   */
  useEffect(() => {
    // Store the currently focused element
    previouslyFocusedElement.current = document.activeElement as HTMLElement

    // Set initial focus
    if (initialFocusRef?.current) {
      focusElement(initialFocusRef.current)
    } else if (focusOnMount && containerRef?.current) {
      focusFirst(containerRef.current)
    }

    // Return focus on unmount
    return () => {
      if (returnFocusRef || previouslyFocusedElement.current) {
        returnFocus()
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    focusFirst,
    focusElement,
    returnFocus,
    getFocusableElements,
  }
}

/**
 * Hook for managing focus after form submission
 */
export function useFormFocusManagement() {
  const successMessageRef = useRef<HTMLDivElement>(null)
  const firstFieldRef = useRef<HTMLInputElement>(null)

  /**
   * Focus the success message after form submission
   */
  const focusSuccessMessage = useCallback(() => {
    if (successMessageRef.current) {
      successMessageRef.current.focus()
      // Announce to screen readers
      successMessageRef.current.setAttribute('role', 'status')
      successMessageRef.current.setAttribute('aria-live', 'polite')
    }
  }, [])

  /**
   * Focus the first form field (on mount or after error)
   */
  const focusFirstField = useCallback(() => {
    if (firstFieldRef.current) {
      firstFieldRef.current.focus()
    }
  }, [])

  /**
   * Auto-focus first field on mount
   */
  useEffect(() => {
    focusFirstField()
  }, [focusFirstField])

  return {
    successMessageRef,
    firstFieldRef,
    focusSuccessMessage,
    focusFirstField,
  }
}

/**
 * Hook for managing focus on route changes
 */
export function useRouteChangeFocus() {
  useEffect(() => {
    // Focus the main content area on route change
    const handleRouteChange = () => {
      const mainContent = document.querySelector('main')
      if (mainContent && mainContent instanceof HTMLElement) {
        // Set tabindex temporarily to make it focusable
        mainContent.setAttribute('tabindex', '-1')
        mainContent.focus()

        // Remove tabindex after focus
        mainContent.addEventListener('blur', () => {
          mainContent.removeAttribute('tabindex')
        }, { once: true })
      }
    }

    // In Next.js, we can listen for route changes
    handleRouteChange()
  }, []) // Run on mount (route change)
}
