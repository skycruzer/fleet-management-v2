/**
 * Route Change Focus Manager
 *
 * Manages focus on route changes in Next.js applications
 * Ensures users don't lose their place when navigating between pages
 */

'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

/**
 * Component to manage focus on route changes
 * Place this in your root layout
 */
export function RouteChangeFocusManager() {
  const pathname = usePathname()

  useEffect(() => {
    // Focus management on route change
    const handleRouteChange = () => {
      // Try to focus the main content area
      const mainContent = document.querySelector('main')
      const h1 = document.querySelector('h1')

      // Priority: h1 > main > body
      const targetElement = h1 || mainContent || document.body

      // Don't steal focus if the user is actively typing in a field.
      const active = document.activeElement
      const isTyping =
        active instanceof HTMLElement &&
        (active.tagName === 'INPUT' ||
          active.tagName === 'TEXTAREA' ||
          active.tagName === 'SELECT' ||
          active.isContentEditable)

      if (targetElement instanceof HTMLElement && !isTyping) {
        // Set tabindex temporarily to make it focusable
        const originalTabIndex = targetElement.getAttribute('tabindex')
        targetElement.setAttribute('tabindex', '-1')
        // preventScroll: true — the explicit scrollTo below handles scrolling with the motion preference
        targetElement.focus({ preventScroll: true })

        // Restore or remove tabindex after focus
        targetElement.addEventListener(
          'blur',
          () => {
            if (originalTabIndex !== null) {
              targetElement.setAttribute('tabindex', originalTabIndex)
            } else {
              targetElement.removeAttribute('tabindex')
            }
          },
          { once: true }
        )
      }

      // Announce page change to screen readers (even when focus was not moved)
      announcePageChange()

      // Scroll to top of page, respecting the user's motion preference (WCAG 2.3.3)
      const prefersReducedMotion =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
      window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' })
    }

    handleRouteChange()
  }, [pathname])

  return null // This component doesn't render anything
}

/**
 * Announce page change to screen readers
 */
function announcePageChange() {
  // Create or update the live region
  let liveRegion = document.getElementById('route-change-announcer')

  if (!liveRegion) {
    liveRegion = document.createElement('div')
    liveRegion.id = 'route-change-announcer'
    liveRegion.setAttribute('role', 'status')
    liveRegion.setAttribute('aria-live', 'polite')
    liveRegion.setAttribute('aria-atomic', 'true')
    liveRegion.className = 'sr-only'
    document.body.appendChild(liveRegion)
  }

  // Get page title
  const pageTitle = document.title || 'Page'

  // Announce the change
  liveRegion.textContent = `Navigated to ${pageTitle}`

  // Clear the announcement after a delay
  setTimeout(() => {
    liveRegion.textContent = ''
  }, 1000)
}

/**
 * Hook for programmatic focus management on route changes
 */
export function useRouteChangeFocus(options?: {
  focusTarget?: string // CSS selector for the element to focus
  announceChange?: boolean // Whether to announce the route change
}) {
  const pathname = usePathname()
  const { focusTarget = 'main', announceChange = true } = options || {}

  useEffect(() => {
    const targetElement = document.querySelector(focusTarget)

    if (targetElement instanceof HTMLElement) {
      const originalTabIndex = targetElement.getAttribute('tabindex')
      targetElement.setAttribute('tabindex', '-1')
      targetElement.focus({ preventScroll: false })

      targetElement.addEventListener(
        'blur',
        () => {
          if (originalTabIndex !== null) {
            targetElement.setAttribute('tabindex', originalTabIndex)
          } else {
            targetElement.removeAttribute('tabindex')
          }
        },
        { once: true }
      )
    }

    if (announceChange) {
      announcePageChange()
    }
  }, [pathname, focusTarget, announceChange])
}
