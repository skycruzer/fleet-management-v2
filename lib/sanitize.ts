/**
 * Input Sanitization Utilities
 *
 * Prevents XSS (Cross-Site Scripting) attacks by sanitizing user input
 * before storage or display. Uses DOMPurify for robust HTML sanitization.
 *
 * @module lib/sanitize
 */

import DOMPurify from 'isomorphic-dompurify'

/**
 * Sanitize HTML content while preserving safe formatting tags
 *
 * Allows basic formatting tags (bold, italic, links, paragraphs) while
 * removing dangerous elements like scripts, iframes, and event handlers.
 *
 * Use this for user content that may contain intentional HTML formatting
 * like feedback content, descriptions, or rich text fields.
 *
 * @param dirty - Untrusted HTML string from user input
 * @returns Sanitized HTML safe for display
 *
 * @example
 * ```typescript
 * const userContent = '<p>Hello <script>alert("XSS")</script> World</p>'
 * const clean = sanitizeHtml(userContent)
 * // Result: '<p>Hello  World</p>' (script removed)
 * ```
 */
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      'b', // Bold text
      'i', // Italic text
      'em', // Emphasis (italic)
      'strong', // Strong emphasis (bold)
      'a', // Links
      'p', // Paragraphs
      'br', // Line breaks
      'ul', // Unordered lists
      'ol', // Ordered lists
      'li', // List items
      'code', // Inline code
      'pre', // Preformatted text
    ],
    ALLOWED_ATTR: [
      'href', // Link URLs (for <a> tags)
      'target', // Link target (for opening in new tab)
      'rel', // Link relationship (for security)
    ],
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  })
}

/**
 * Sanitize plain text by removing all HTML tags
 *
 * Strips ALL HTML tags and returns only the text content. Use this for
 * fields that should never contain HTML formatting like titles, names,
 * reasons, or short text inputs.
 *
 * @param input - Untrusted text that may contain HTML
 * @returns Plain text with all HTML removed
 *
 * @example
 * ```typescript
 * const userInput = '<script>alert("XSS")</script>Important Title'
 * const clean = sanitizePlainText(userInput)
 * // Result: 'Important Title' (script completely removed)
 * ```
 */
export function sanitizePlainText(input: string): string {
  // Remove all HTML tags, keep only text content
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [], // No HTML tags allowed
    ALLOWED_ATTR: [], // No attributes allowed
    KEEP_CONTENT: true, // Keep text content
  })
}

/**
 * Sanitize a URL to prevent javascript: and data: URI attacks
 *
 * Validates that URLs are safe HTTP(S) protocols and removes any
 * dangerous URI schemes like javascript: or data:
 *
 * @param url - Untrusted URL from user input
 * @returns Sanitized URL or empty string if invalid
 *
 * @example
 * ```typescript
 * sanitizeUrl('javascript:alert("XSS")') // Returns: ''
 * sanitizeUrl('https://example.com')     // Returns: 'https://example.com'
 * ```
 */
export function sanitizeUrl(url: string): string {
  const cleaned = DOMPurify.sanitize(url, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  })

  // Additional validation for safe protocols
  if (!/^(?:https?:\/\/|mailto:|tel:)/i.test(cleaned)) {
    return ''
  }

  return cleaned
}

/**
 * Batch sanitize an object's string properties
 *
 * Recursively sanitizes all string values in an object using sanitizePlainText.
 * Useful for sanitizing entire form data objects at once.
 *
 * @param obj - Object containing potentially unsafe strings
 * @returns New object with all strings sanitized
 *
 * @example
 * ```typescript
 * const formData = {
 *   title: '<script>XSS</script>Title',
 *   description: 'Normal text',
 *   nested: { field: '<b>Bold</b>' }
 * }
 * const clean = sanitizeObject(formData)
 * // All string values are now sanitized
 * ```
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const sanitized: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizePlainText(value)
    } else if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      sanitized[key] = sanitizeObject(value as Record<string, unknown>)
    } else {
      sanitized[key] = value
    }
  }

  return sanitized as T
}
