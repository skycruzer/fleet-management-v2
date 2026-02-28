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
      className="skip-to-main focus-visible:bg-primary focus-visible:text-primary-foreground focus-visible:ring-ring sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:top-4 focus-visible:left-4 focus-visible:z-[9999] focus-visible:rounded-md focus-visible:px-4 focus-visible:py-3 focus-visible:font-medium focus-visible:shadow-lg focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
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
      className="focus-visible:bg-primary focus-visible:text-primary-foreground focus-visible:ring-ring sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:top-16 focus-visible:left-4 focus-visible:z-[9999] focus-visible:rounded-md focus-visible:px-4 focus-visible:py-3 focus-visible:font-medium focus-visible:shadow-lg focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
    >
      Skip to navigation
    </a>
  )
}
