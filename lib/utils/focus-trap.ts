/**
 * Focus Trap Utility
 *
 * Utilities for trapping focus within modal dialogs and other containers
 * Complies with ARIA Authoring Practices for modal dialogs
 *
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
 */

/**
 * Focusable element selectors
 */
export const FOCUSABLE_SELECTORS = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'iframe',
  'object',
  'embed',
  '[contenteditable="true"]',
  '[tabindex]:not([tabindex="-1"])',
].join(', ')

/**
 * Get all focusable elements within a container
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const elements = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS)
  return Array.from(elements).filter((el) => {
    // Check if element is visible and not disabled
    return (
      el.offsetParent !== null && !el.hasAttribute('disabled') && !el.getAttribute('aria-hidden')
    )
  })
}

/**
 * Get the first and last focusable elements in a container
 */
export function getFocusBoundaries(container: HTMLElement): {
  first: HTMLElement | null
  last: HTMLElement | null
} {
  const focusable = getFocusableElements(container)
  return {
    first: focusable[0] || null,
    last: focusable[focusable.length - 1] || null,
  }
}

/**
 * Focus the first element in a container
 */
export function focusFirstElement(container: HTMLElement): boolean {
  const { first } = getFocusBoundaries(container)
  if (first) {
    first.focus()
    return true
  }
  return false
}

/**
 * Focus the last element in a container
 */
export function focusLastElement(container: HTMLElement): boolean {
  const { last } = getFocusBoundaries(container)
  if (last) {
    last.focus()
    return true
  }
  return false
}

/**
 * Create a focus trap for a container
 * Returns a cleanup function
 */
export function createFocusTrap(container: HTMLElement): () => void {
  // Store the element that had focus before the trap was activated
  const previouslyFocusedElement = document.activeElement as HTMLElement

  // Focus the first element when trap is created
  focusFirstElement(container)

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Tab') return

    const { first, last } = getFocusBoundaries(container)
    if (!first || !last) return

    // Shift + Tab: move backwards
    if (event.shiftKey) {
      if (document.activeElement === first) {
        event.preventDefault()
        last.focus()
      }
    }
    // Tab: move forwards
    else {
      if (document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
  }

  const handleFocusIn = (event: FocusEvent) => {
    const target = event.target as Node
    // If focus moves outside the container, bring it back
    if (!container.contains(target)) {
      focusFirstElement(container)
    }
  }

  // Add event listeners
  container.addEventListener('keydown', handleKeyDown)
  document.addEventListener('focusin', handleFocusIn)

  // Return cleanup function
  return () => {
    container.removeEventListener('keydown', handleKeyDown)
    document.removeEventListener('focusin', handleFocusIn)

    // Return focus to the previously focused element
    if (previouslyFocusedElement && previouslyFocusedElement.focus) {
      previouslyFocusedElement.focus()
    }
  }
}

/**
 * Focus Trap Manager Class
 * Provides a more advanced API for managing focus traps
 */
export class FocusTrapManager {
  private container: HTMLElement
  private cleanup: (() => void) | null = null
  private previouslyFocusedElement: HTMLElement | null = null
  private active = false

  constructor(container: HTMLElement) {
    this.container = container
  }

  /**
   * Activate the focus trap
   */
  activate(): void {
    if (this.active) return

    // Store the currently focused element
    this.previouslyFocusedElement = document.activeElement as HTMLElement

    // Create the focus trap
    this.cleanup = createFocusTrap(this.container)
    this.active = true
  }

  /**
   * Deactivate the focus trap and return focus
   */
  deactivate(): void {
    if (!this.active) return

    // Run cleanup
    if (this.cleanup) {
      this.cleanup()
      this.cleanup = null
    }

    // Return focus
    if (this.previouslyFocusedElement && this.previouslyFocusedElement.focus) {
      this.previouslyFocusedElement.focus()
    }

    this.active = false
  }

  /**
   * Check if the trap is active
   */
  isActive(): boolean {
    return this.active
  }

  /**
   * Focus the first element in the container
   */
  focusFirst(): boolean {
    return focusFirstElement(this.container)
  }

  /**
   * Focus the last element in the container
   */
  focusLast(): boolean {
    return focusLastElement(this.container)
  }
}
