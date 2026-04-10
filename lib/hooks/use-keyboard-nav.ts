/**
 * Keyboard Navigation Hook
 * Provides utilities for implementing accessible keyboard navigation
 * WCAG 2.1 Level A compliant
 */

import { useEffect, useCallback, RefObject } from 'react'

export interface KeyboardShortcut {
  key: string
  ctrlKey?: boolean
  shiftKey?: boolean
  altKey?: boolean
  metaKey?: boolean
  handler: (event: KeyboardEvent) => void
  description?: string
}

/**
 * Hook for handling keyboard shortcuts
 * Registers global keyboard event listeners and cleans up on unmount
 */
export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const ctrlMatch = shortcut.ctrlKey === undefined || shortcut.ctrlKey === event.ctrlKey
        const shiftMatch = shortcut.shiftKey === undefined || shortcut.shiftKey === event.shiftKey
        const altMatch = shortcut.altKey === undefined || shortcut.altKey === event.altKey
        const metaMatch = shortcut.metaKey === undefined || shortcut.metaKey === event.metaKey
        const keyMatch = shortcut.key.toLowerCase() === event.key.toLowerCase()

        if (ctrlMatch && shiftMatch && altMatch && metaMatch && keyMatch) {
          event.preventDefault()
          shortcut.handler(event)
          break
        }
      }
    },
    [shortcuts]
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown])
}

/**
 * Hook for handling Escape key to close modals/dialogs
 */
export function useEscapeKey(callback: () => void, enabled = true) {
  useEffect(() => {
    if (!enabled) return

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        callback()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [callback, enabled])
}

/**
 * Hook for trapping focus within a container (for modals/dialogs)
 */
export function useFocusTrap(containerRef: RefObject<HTMLElement | null>, isActive = true) {
  useEffect(() => {
    if (!isActive || !containerRef.current) return

    const container = containerRef.current
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )

    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    // Focus first element on mount
    if (firstElement) {
      firstElement.focus()
    }

    const handleTabKey = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return

      // Shift + Tab (backwards)
      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault()
          lastElement?.focus()
        }
      }
      // Tab (forwards)
      else {
        if (document.activeElement === lastElement) {
          event.preventDefault()
          firstElement?.focus()
        }
      }
    }

    container.addEventListener('keydown', handleTabKey)
    return () => {
      container.removeEventListener('keydown', handleTabKey)
    }
  }, [containerRef, isActive])
}

/**
 * Hook for arrow key navigation in lists/menus
 */
export function useArrowKeyNavigation(
  itemsRef: RefObject<HTMLElement[]>,
  options: {
    orientation?: 'vertical' | 'horizontal'
    loop?: boolean
    onSelect?: (index: number) => void
  } = {}
) {
  const { orientation = 'vertical', loop = true, onSelect } = options

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const items = itemsRef.current
      if (!items || items.length === 0) return

      const currentIndex = items.findIndex((item) => item === document.activeElement)
      if (currentIndex === -1) return

      let nextIndex = currentIndex

      const upKey = orientation === 'vertical' ? 'ArrowUp' : 'ArrowLeft'
      const downKey = orientation === 'vertical' ? 'ArrowDown' : 'ArrowRight'

      if (event.key === upKey) {
        event.preventDefault()
        nextIndex = currentIndex - 1
        if (nextIndex < 0) {
          nextIndex = loop ? items.length - 1 : 0
        }
      } else if (event.key === downKey) {
        event.preventDefault()
        nextIndex = currentIndex + 1
        if (nextIndex >= items.length) {
          nextIndex = loop ? 0 : items.length - 1
        }
      } else if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        if (onSelect) {
          onSelect(currentIndex)
        } else {
          items[currentIndex]?.click()
        }
        return
      }

      if (nextIndex !== currentIndex) {
        items[nextIndex]?.focus()
      }
    },
    [itemsRef, orientation, loop, onSelect]
  )

  useEffect(() => {
    const items = itemsRef.current
    if (!items) return

    items.forEach((item) => {
      item.addEventListener('keydown', handleKeyDown)
    })

    return () => {
      items.forEach((item) => {
        item.removeEventListener('keydown', handleKeyDown)
      })
    }
  }, [itemsRef, handleKeyDown])
}

/**
 * Utility to check if an element is keyboard accessible
 */
export function isKeyboardAccessible(element: HTMLElement): boolean {
  const tagName = element.tagName.toLowerCase()
  const isInteractive = ['button', 'a', 'input', 'select', 'textarea'].includes(tagName)
  const hasTabIndex = element.hasAttribute('tabindex') && element.getAttribute('tabindex') !== '-1'
  const isDisabled = element.hasAttribute('disabled')

  return (isInteractive || hasTabIndex) && !isDisabled
}

/**
 * Get all keyboard-accessible elements within a container
 */
export function getKeyboardAccessibleElements(container: HTMLElement): HTMLElement[] {
  const selector =
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  return Array.from(container.querySelectorAll<HTMLElement>(selector))
}
