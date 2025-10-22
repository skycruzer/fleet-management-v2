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
      className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
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
      className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-16 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
    >
      Skip to navigation
    </a>
  )
}
