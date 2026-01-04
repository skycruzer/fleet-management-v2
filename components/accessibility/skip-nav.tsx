/**
 * Skip Navigation Component
 * Allows keyboard users to skip directly to main content
 * Essential for accessibility - appears on Tab focus
 */

'use client'

export function SkipNav() {
  return (
    <a
      href="#main-content"
      className="focus:bg-primary focus:text-primary-foreground focus:ring-ring sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:px-4 focus:py-2 focus:ring-2 focus:ring-offset-2 focus:outline-none"
    >
      Skip to main content
    </a>
  )
}

/**
 * Skip to Navigation Component
 * For users who want to jump directly to navigation
 */
export function SkipToNav() {
  return (
    <a
      href="#main-navigation"
      className="focus:bg-primary focus:text-primary-foreground focus:ring-ring sr-only focus:not-sr-only focus:absolute focus:top-16 focus:left-4 focus:z-50 focus:rounded-md focus:px-4 focus:py-2 focus:ring-2 focus:ring-offset-2 focus:outline-none"
    >
      Skip to navigation
    </a>
  )
}
