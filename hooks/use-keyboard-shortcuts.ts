/**
 * Keyboard Shortcuts Hook
 *
 * Provides keyboard shortcuts for common actions throughout the app
 * Improves accessibility and power user experience
 *
 * @created 2025-10-29
 * @priority Priority 4
 */

'use client'

import { useEffect, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'

export interface KeyboardShortcut {
  key: string
  ctrlKey?: boolean
  metaKey?: boolean
  shiftKey?: boolean
  altKey?: boolean
  action: () => void
  description: string
  category?: string
}

interface UseKeyboardShortcutsOptions {
  enabled?: boolean
  shortcuts?: KeyboardShortcut[]
}

const DEFAULT_SHORTCUTS: KeyboardShortcut[] = [
  // Navigation shortcuts (global)
  {
    key: 'h',
    altKey: true,
    action: () => {}, // Will be replaced with router.push('/dashboard')
    description: 'Go to Home/Dashboard',
    category: 'Navigation',
  },
  {
    key: 'p',
    altKey: true,
    action: () => {},
    description: 'Go to Pilots',
    category: 'Navigation',
  },
  {
    key: 'c',
    altKey: true,
    action: () => {},
    description: 'Go to Certifications',
    category: 'Navigation',
  },
  {
    key: 'l',
    altKey: true,
    action: () => {},
    description: 'Go to Pilot Requests',
    category: 'Navigation',
  },
  // Search shortcut
  {
    key: '/',
    ctrlKey: true,
    action: () => {},
    description: 'Focus search',
    category: 'Actions',
  },
  // Help shortcut
  {
    key: '?',
    shiftKey: true,
    action: () => {},
    description: 'Show keyboard shortcuts',
    category: 'Help',
  },
]

/**
 * Hook for managing keyboard shortcuts
 *
 * @example
 * // In a component
 * useKeyboardShortcuts({
 *   enabled: true,
 *   shortcuts: [
 *     {
 *       key: 'n',
 *       ctrlKey: true,
 *       action: () => openNewDialog(),
 *       description: 'Create new item',
 *     },
 *   ],
 * })
 */
export function useKeyboardShortcuts(options: UseKeyboardShortcutsOptions = {}) {
  const { enabled = true, shortcuts = [] } = options
  const router = useRouter()
  const pathname = usePathname()

  // Get all shortcuts (default + custom)
  const allShortcuts = useCallback(() => {
    const defaultWithActions = DEFAULT_SHORTCUTS.map((shortcut) => {
      // Inject router actions for navigation shortcuts
      if (shortcut.key === 'h' && shortcut.altKey) {
        return { ...shortcut, action: () => router.push('/dashboard') }
      }
      if (shortcut.key === 'p' && shortcut.altKey) {
        return { ...shortcut, action: () => router.push('/dashboard/pilots') }
      }
      if (shortcut.key === 'c' && shortcut.altKey) {
        return { ...shortcut, action: () => router.push('/dashboard/certifications') }
      }
      if (shortcut.key === 'l' && shortcut.altKey) {
        return { ...shortcut, action: () => router.push('/dashboard/requests') }
      }
      if (shortcut.key === '/') {
        return {
          ...shortcut,
          action: () => {
            const searchInput = document.querySelector<HTMLInputElement>(
              'input[type="search"], input[placeholder*="Search"]'
            )
            searchInput?.focus()
          },
        }
      }
      if (shortcut.key === '?') {
        return {
          ...shortcut,
          action: () => {
            // Dispatch custom event to show shortcuts dialog
            window.dispatchEvent(new CustomEvent('show-keyboard-shortcuts'))
          },
        }
      }
      return shortcut
    })

    return [...defaultWithActions, ...shortcuts]
  }, [router, shortcuts])

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return

      // Don't trigger shortcuts when typing in inputs
      const target = event.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.contentEditable === 'true'
      ) {
        // Exception: allow Ctrl+/ even in inputs to blur and focus search
        if (!(event.key === '/' && (event.ctrlKey || event.metaKey))) {
          return
        }
      }

      const matchingShortcut = allShortcuts().find((shortcut) => {
        const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase()
        const ctrlMatches = !!shortcut.ctrlKey === (event.ctrlKey || event.metaKey)
        const shiftMatches = !!shortcut.shiftKey === event.shiftKey
        const altMatches = !!shortcut.altKey === event.altKey

        return keyMatches && ctrlMatches && shiftMatches && altMatches
      })

      if (matchingShortcut) {
        event.preventDefault()
        matchingShortcut.action()
      }
    },
    [enabled, allShortcuts]
  )

  useEffect(() => {
    if (!enabled) return

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [enabled, handleKeyDown])

  return {
    shortcuts: allShortcuts(),
  }
}

/**
 * Get shortcut display string
 * E.g., "Ctrl+N" or "Alt+Shift+P"
 */
export function getShortcutString(shortcut: KeyboardShortcut): string {
  const parts: string[] = []

  if (shortcut.ctrlKey || shortcut.metaKey) {
    parts.push(navigator.platform.includes('Mac') ? '⌘' : 'Ctrl')
  }
  if (shortcut.altKey) {
    parts.push(navigator.platform.includes('Mac') ? '⌥' : 'Alt')
  }
  if (shortcut.shiftKey) {
    parts.push(navigator.platform.includes('Mac') ? '⇧' : 'Shift')
  }

  parts.push(shortcut.key.toUpperCase())

  return parts.join('+')
}
