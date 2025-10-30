/**
 * Accessibility Helpers
 *
 * Utilities for improving screen reader support and WCAG 2.1 AA compliance
 * Provides ARIA patterns, focus management, and semantic HTML helpers
 *
 * @created 2025-10-29
 * @priority Priority 4 - Accessibility
 */

// ============================================================================
// ARIA LIVE REGION ANNOUNCEMENTS
// ============================================================================

/**
 * Announce message to screen readers using ARIA live region
 *
 * @param message - Message to announce
 * @param priority - Announcement priority (polite | assertive)
 *
 * @example
 * announceToScreenReader('Leave request submitted successfully', 'polite')
 * announceToScreenReader('Error: Unable to submit request', 'assertive')
 */
export function announceToScreenReader(
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
): void {
  const liveRegion = document.createElement('div')
  liveRegion.setAttribute('role', priority === 'assertive' ? 'alert' : 'status')
  liveRegion.setAttribute('aria-live', priority)
  liveRegion.setAttribute('aria-atomic', 'true')
  liveRegion.className = 'sr-only' // Screen reader only (visually hidden)
  liveRegion.textContent = message

  document.body.appendChild(liveRegion)

  // Remove after announcement (screen readers cache the message)
  setTimeout(() => {
    document.body.removeChild(liveRegion)
  }, 1000)
}

// ============================================================================
// FOCUS MANAGEMENT
// ============================================================================

/**
 * Trap focus within a modal/dialog
 *
 * @param container - Container element
 * @returns Cleanup function to remove trap
 *
 * @example
 * const cleanup = trapFocus(dialogRef.current)
 * // Later: cleanup()
 */
export function trapFocus(container: HTMLElement): () => void {
  const focusableElements = container.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
  )

  const firstElement = focusableElements[0]
  const lastElement = focusableElements[focusableElements.length - 1]

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key !== 'Tab') return

    if (e.shiftKey) {
      // Shift + Tab (backwards)
      if (document.activeElement === firstElement) {
        e.preventDefault()
        lastElement?.focus()
      }
    } else {
      // Tab (forwards)
      if (document.activeElement === lastElement) {
        e.preventDefault()
        firstElement?.focus()
      }
    }
  }

  // Focus first element
  firstElement?.focus()

  // Listen for Tab key
  container.addEventListener('keydown', handleKeyDown)

  // Cleanup function
  return () => {
    container.removeEventListener('keydown', handleKeyDown)
  }
}

/**
 * Move focus to element and announce to screen readers
 *
 * @param element - Element to focus
 * @param announcement - Optional message to announce
 *
 * @example
 * focusElement(errorMessageRef.current, 'Error: Invalid date')
 */
export function focusElement(element: HTMLElement | null, announcement?: string): void {
  if (!element) return

  element.focus()

  if (announcement) {
    announceToScreenReader(announcement, 'assertive')
  }
}

// ============================================================================
// ARIA LABEL GENERATORS
// ============================================================================

/**
 * Generate descriptive ARIA label for date input
 *
 * @example
 * getDateAriaLabel('start_date', '2025-10-15')
 * // Returns: "Start date, October 15, 2025"
 */
export function getDateAriaLabel(fieldName: string, value?: string): string {
  const formattedName = fieldName
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .trim()

  if (!value) {
    return `${formattedName}, no date selected`
  }

  const date = new Date(value)
  const formatted = date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return `${formattedName}, ${formatted}`
}

/**
 * Generate descriptive ARIA label for status badge
 *
 * @example
 * getStatusAriaLabel('pending')
 * // Returns: "Status: Pending, awaiting review"
 */
export function getStatusAriaLabel(status: string): string {
  const statusDescriptions: Record<string, string> = {
    pending: 'Pending, awaiting review',
    approved: 'Approved',
    rejected: 'Rejected',
    active: 'Active',
    inactive: 'Inactive',
    expired: 'Expired',
    expiring_soon: 'Expiring soon, requires attention',
  }

  return `Status: ${statusDescriptions[status] || status}`
}

/**
 * Generate descriptive ARIA label for action buttons
 *
 * @example
 * getActionAriaLabel('delete', 'Leave Request #123')
 * // Returns: "Delete Leave Request #123"
 */
export function getActionAriaLabel(action: string, itemName: string): string {
  const actionVerbs: Record<string, string> = {
    edit: 'Edit',
    delete: 'Delete',
    view: 'View details for',
    cancel: 'Cancel',
    approve: 'Approve',
    reject: 'Reject',
  }

  const verb = actionVerbs[action] || action
  return `${verb} ${itemName}`
}

// ============================================================================
// KEYBOARD NAVIGATION HELPERS
// ============================================================================

/**
 * Handle keyboard navigation for lists (Arrow Up/Down)
 *
 * @example
 * <ul onKeyDown={(e) => handleListNavigation(e, itemsRef.current)}>
 *   <li ref={el => itemsRef.current[0] = el}>Item 1</li>
 *   <li ref={el => itemsRef.current[1] = el}>Item 2</li>
 * </ul>
 */
export function handleListNavigation(
  event: React.KeyboardEvent,
  items: (HTMLElement | null)[]
): void {
  if (!['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return

  const validItems = items.filter((item): item is HTMLElement => item !== null)
  const currentIndex = validItems.findIndex((item) => item === document.activeElement)

  event.preventDefault()

  switch (event.key) {
    case 'ArrowDown':
      {
        const nextIndex = (currentIndex + 1) % validItems.length
        validItems[nextIndex]?.focus()
      }
      break

    case 'ArrowUp':
      {
        const prevIndex = (currentIndex - 1 + validItems.length) % validItems.length
        validItems[prevIndex]?.focus()
      }
      break

    case 'Home':
      validItems[0]?.focus()
      break

    case 'End':
      validItems[validItems.length - 1]?.focus()
      break
  }
}

// ============================================================================
// SEMANTIC HTML HELPERS
// ============================================================================

/**
 * Get appropriate heading level for section
 * Ensures proper heading hierarchy (h1 → h2 → h3)
 *
 * @param level - Desired heading level (1-6)
 * @returns Heading element type ('h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6')
 *
 * @example
 * const Heading = getHeadingLevel(2)
 * <Heading>Section Title</Heading>
 */
export function getHeadingLevel(level: number): 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' {
  const validLevel = Math.max(1, Math.min(6, level))
  return `h${validLevel}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
}

/**
 * Check if element has proper ARIA labeling
 *
 * @param element - Element to check
 * @returns true if element has aria-label or aria-labelledby
 */
export function hasAriaLabel(element: HTMLElement): boolean {
  return !!(
    element.getAttribute('aria-label') ||
    element.getAttribute('aria-labelledby') ||
    element.textContent?.trim()
  )
}

// ============================================================================
// LOADING STATE ANNOUNCEMENTS
// ============================================================================

/**
 * Create loading announcement element
 * Announces loading state to screen readers
 *
 * @param loadingMessage - Message to announce (default: "Loading")
 * @returns Cleanup function
 *
 * @example
 * const cleanup = announceLoading('Loading certifications')
 * // Fetch data...
 * cleanup()
 * announceToScreenReader('Certifications loaded', 'polite')
 */
export function announceLoading(loadingMessage = 'Loading'): () => void {
  const liveRegion = document.createElement('div')
  liveRegion.setAttribute('role', 'status')
  liveRegion.setAttribute('aria-live', 'polite')
  liveRegion.setAttribute('aria-busy', 'true')
  liveRegion.className = 'sr-only'
  liveRegion.textContent = loadingMessage

  document.body.appendChild(liveRegion)

  return () => {
    liveRegion.setAttribute('aria-busy', 'false')
    document.body.removeChild(liveRegion)
  }
}

// ============================================================================
// ERROR HANDLING FOR SCREEN READERS
// ============================================================================

/**
 * Announce form validation errors to screen readers
 *
 * @param errors - Object with field names and error messages
 *
 * @example
 * announceFormErrors({
 *   start_date: 'Start date is required',
 *   end_date: 'End date must be after start date'
 * })
 */
export function announceFormErrors(errors: Record<string, string>): void {
  const errorCount = Object.keys(errors).length

  if (errorCount === 0) return

  const message = `Form has ${errorCount} error${errorCount === 1 ? '' : 's'}. ${Object.entries(errors)
    .map(([field, error]) => `${field.replace(/_/g, ' ')}: ${error}`)
    .join('. ')}`

  announceToScreenReader(message, 'assertive')
}

// ============================================================================
// VISIBILITY HELPERS
// ============================================================================

/**
 * CSS class for screen reader only content (visually hidden)
 * Add to Tailwind config or use as inline class
 */
export const SR_ONLY_CLASS =
  'absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0'

/**
 * Check if element is visible to user
 * (Not hidden, not display: none, not visibility: hidden)
 */
export function isVisible(element: HTMLElement): boolean {
  return !!(
    element.offsetWidth ||
    element.offsetHeight ||
    element.getClientRects().length
  )
}

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/**
 * Example 1: Announcing Successful Form Submission
 *
 * const handleSubmit = async () => {
 *   try {
 *     await submitLeaveRequest(data)
 *     announceToScreenReader('Leave request submitted successfully', 'polite')
 *   } catch (error) {
 *     announceToScreenReader('Error submitting request. Please try again.', 'assertive')
 *   }
 * }
 */

/**
 * Example 2: Modal Dialog Focus Management
 *
 * useEffect(() => {
 *   if (isOpen && dialogRef.current) {
 *     const cleanup = trapFocus(dialogRef.current)
 *     return cleanup
 *   }
 * }, [isOpen])
 */

/**
 * Example 3: Loading State Announcement
 *
 * useEffect(() => {
 *   if (isLoading) {
 *     const cleanup = announceLoading('Loading certifications')
 *     return cleanup
 *   } else {
 *     announceToScreenReader('Certifications loaded', 'polite')
 *   }
 * }, [isLoading])
 */

/**
 * Example 4: Enhanced Button with ARIA Labels
 *
 * <button
 *   aria-label={getActionAriaLabel('delete', 'Leave Request #123')}
 *   onClick={handleDelete}
 * >
 *   <TrashIcon />
 * </button>
 */

/**
 * Example 5: List Navigation
 *
 * const itemsRef = useRef<(HTMLLIElement | null)[]>([])
 *
 * <ul
 *   role="listbox"
 *   onKeyDown={(e) => handleListNavigation(e, itemsRef.current)}
 * >
 *   {items.map((item, index) => (
 *     <li
 *       key={item.id}
 *       ref={el => itemsRef.current[index] = el}
 *       role="option"
 *       tabIndex={0}
 *     >
 *       {item.name}
 *     </li>
 *   ))}
 * </ul>
 */
