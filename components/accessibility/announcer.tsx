/**
 * Screen Reader Announcer
 * Announces dynamic content changes to screen readers
 * Uses ARIA live regions
 */

'use client'

import { useEffect, useState } from 'react'

interface AnnouncerProps {
  /**
   * Message to announce
   */
  message: string
  /**
   * Priority level
   * - polite: Waits for current speech to finish
   * - assertive: Interrupts current speech
   */
  priority?: 'polite' | 'assertive'
  /**
   * Auto-clear message after timeout (ms)
   */
  clearAfter?: number
}

/**
 * Announces messages to screen readers
 *
 * @example
 * ```tsx
 * const [announcement, setAnnouncement] = useState('')
 *
 * // When action completes
 * setAnnouncement('Pilot created successfully')
 *
 * <Announcer message={announcement} priority="polite" clearAfter={3000} />
 * ```
 */
export function Announcer({ message, priority = 'polite', clearAfter }: AnnouncerProps) {
  const [currentMessage, setCurrentMessage] = useState(message)

  useEffect(() => {
    setCurrentMessage(message)

    if (clearAfter && message) {
      const timeout = setTimeout(() => {
        setCurrentMessage('')
      }, clearAfter)

      return () => clearTimeout(timeout)
    }

    return undefined
  }, [message, clearAfter])

  return (
    <div
      role="status"
      aria-live={priority}
      aria-atomic="true"
      className="sr-only"
    >
      {currentMessage}
    </div>
  )
}

/**
 * Global announcer hook
 * Provides a function to announce messages from anywhere
 */
let globalAnnounce: ((message: string, priority?: 'polite' | 'assertive') => void) | null = null

export function GlobalAnnouncer() {
  const [message, setMessage] = useState('')
  const [priority, setPriority] = useState<'polite' | 'assertive'>('polite')

  useEffect(() => {
    globalAnnounce = (msg, pri = 'polite') => {
      setMessage(msg)
      setPriority(pri)
    }

    return () => {
      globalAnnounce = null
    }
  }, [])

  return <Announcer message={message} priority={priority} clearAfter={5000} />
}

/**
 * Announce a message to screen readers
 * Must be used with <GlobalAnnouncer /> component mounted
 */
export function announce(message: string, priority: 'polite' | 'assertive' = 'polite') {
  if (globalAnnounce) {
    globalAnnounce(message, priority)
  } else {
    console.warn('GlobalAnnouncer not mounted. Call announcements will not work.')
  }
}
