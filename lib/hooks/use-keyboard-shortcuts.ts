/**
 * Keyboard Shortcuts Hook - 2026 Design System
 * Author: Maurice Rondeau
 *
 * Source: Vercel Web Interface Guidelines
 * "Keyboard works everywhere" - All flows are keyboard-operable
 *
 * Provides global keyboard shortcut handling following Vercel's guidelines
 */

import { useEffect, useCallback } from 'react'

export type ModifierKey = 'meta' | 'ctrl' | 'alt' | 'shift'
export type KeyboardShortcut = {
  key: string
  modifiers?: ModifierKey[]
  action: () => void
  description?: string
  /** Prevent default browser behavior */
  preventDefault?: boolean
  /** Only trigger when not in an input/textarea */
  ignoreInputs?: boolean
}

/**
 * Check if the current platform is macOS
 */
export function isMac(): boolean {
  if (typeof navigator === 'undefined') return false
  return navigator.platform.toUpperCase().indexOf('MAC') >= 0
}

/**
 * Get the modifier key for the current platform
 * Returns 'meta' on Mac, 'ctrl' on Windows/Linux
 */
export function getPlatformModifier(): ModifierKey {
  return isMac() ? 'meta' : 'ctrl'
}

/**
 * Format a shortcut for display
 * Example: { key: 'k', modifiers: ['meta'] } => '⌘K' on Mac, 'Ctrl+K' on Windows
 */
export function formatShortcut(shortcut: { key: string; modifiers?: ModifierKey[] }): string {
  const mac = isMac()
  const parts: string[] = []

  if (shortcut.modifiers) {
    for (const mod of shortcut.modifiers) {
      if (mod === 'meta') {
        parts.push(mac ? '⌘' : 'Ctrl')
      } else if (mod === 'ctrl') {
        parts.push(mac ? '⌃' : 'Ctrl')
      } else if (mod === 'alt') {
        parts.push(mac ? '⌥' : 'Alt')
      } else if (mod === 'shift') {
        parts.push(mac ? '⇧' : 'Shift')
      }
    }
  }

  // Capitalize single letter keys
  const keyDisplay =
    shortcut.key.length === 1 ? shortcut.key.toUpperCase() : shortcut.key.replace('Arrow', '')

  parts.push(keyDisplay)

  return mac ? parts.join('') : parts.join('+')
}

/**
 * Hook to register global keyboard shortcuts
 *
 * @example
 * useKeyboardShortcuts([
 *   {
 *     key: 'k',
 *     modifiers: ['meta'],
 *     action: () => setCommandPaletteOpen(true),
 *     description: 'Open command palette',
 *   },
 *   {
 *     key: 's',
 *     modifiers: ['meta'],
 *     action: handleSave,
 *     preventDefault: true,
 *     description: 'Save',
 *   },
 * ])
 */
export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Skip if in input/textarea and ignoreInputs is true
      const target = event.target as HTMLElement
      const isInput =
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable

      for (const shortcut of shortcuts) {
        // Check if we should ignore this shortcut in inputs
        if (shortcut.ignoreInputs && isInput) continue

        // Check modifiers
        const modifiersMatch =
          !shortcut.modifiers ||
          shortcut.modifiers.every((mod) => {
            if (mod === 'meta') return event.metaKey
            if (mod === 'ctrl') return event.ctrlKey
            if (mod === 'alt') return event.altKey
            if (mod === 'shift') return event.shiftKey
            return false
          })

        // Check if no extra modifiers are pressed (for simple key shortcuts)
        const noExtraModifiers =
          !shortcut.modifiers ||
          shortcut.modifiers.length > 0 ||
          (!event.metaKey && !event.ctrlKey && !event.altKey)

        // Check key (case-insensitive)
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase()

        if (modifiersMatch && keyMatch && noExtraModifiers) {
          if (shortcut.preventDefault !== false) {
            event.preventDefault()
          }
          shortcut.action()
          break // Only trigger one shortcut per keypress
        }
      }
    },
    [shortcuts]
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}

/**
 * Common keyboard shortcuts for the application
 */
export const commonShortcuts = {
  commandPalette: { key: 'k', modifiers: ['meta'] as ModifierKey[] },
  search: { key: '/', modifiers: [] as ModifierKey[] },
  save: { key: 's', modifiers: ['meta'] as ModifierKey[] },
  escape: { key: 'Escape', modifiers: [] as ModifierKey[] },
  newItem: { key: 'n', modifiers: ['meta'] as ModifierKey[] },
  goToDashboard: { key: 'd', modifiers: ['meta', 'shift'] as ModifierKey[] },
  goToPilots: { key: 'p', modifiers: ['meta', 'shift'] as ModifierKey[] },
  goToCertifications: { key: 'c', modifiers: ['meta', 'shift'] as ModifierKey[] },
}
