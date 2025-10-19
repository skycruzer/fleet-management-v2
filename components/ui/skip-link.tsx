/**
 * Skip Link Component
 *
 * Provides keyboard navigation shortcuts for screen reader and keyboard users
 * Complies with WCAG 2.4.1 Bypass Blocks (Level A)
 *
 * @see https://www.w3.org/WAI/WCAG21/Understanding/bypass-blocks.html
 */

'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface SkipLinkProps {
  /**
   * ID of the target element to skip to
   */
  href: string

  /**
   * Text to display in the skip link
   */
  children: React.ReactNode

  /**
   * Additional CSS classes
   */
  className?: string
}

/**
 * Skip link that appears on keyboard focus
 * Allows users to bypass navigation and jump to main content
 */
export function SkipLink({ href, children, className }: SkipLinkProps) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()

    const target = document.querySelector(href)
    if (target && target instanceof HTMLElement) {
      // Set tabindex to make it focusable
      target.setAttribute('tabindex', '-1')
      target.focus()

      // Remove tabindex after focus
      target.addEventListener('blur', () => {
        target.removeAttribute('tabindex')
      }, { once: true })

      // Scroll into view
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <a
      href={href}
      onClick={handleClick}
      className={cn(
        // Hidden by default
        'sr-only',
        // Visible on focus
        'focus:not-sr-only',
        'focus:absolute',
        'focus:top-4',
        'focus:left-4',
        'focus:z-50',
        // Styling
        'inline-block',
        'px-4',
        'py-2',
        'bg-blue-600',
        'text-white',
        'font-medium',
        'rounded-lg',
        'shadow-lg',
        // Focus visible ring
        'focus-visible:ring-2',
        'focus-visible:ring-offset-2',
        'focus-visible:ring-blue-500',
        'focus-visible:outline-none',
        className
      )}
    >
      {children}
    </a>
  )
}

/**
 * Container component for multiple skip links
 */
export function SkipLinks({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="skip-links"
      role="navigation"
      aria-label="Skip links"
    >
      {children}
    </div>
  )
}

/**
 * Pre-configured skip link for main content
 */
export function SkipToMainContent() {
  return (
    <SkipLink href="#main-content">
      Skip to main content
    </SkipLink>
  )
}

/**
 * Pre-configured skip link for navigation
 */
export function SkipToNavigation() {
  return (
    <SkipLink href="#navigation">
      Skip to navigation
    </SkipLink>
  )
}

/**
 * Pre-configured skip link for search
 */
export function SkipToSearch() {
  return (
    <SkipLink href="#search">
      Skip to search
    </SkipLink>
  )
}
