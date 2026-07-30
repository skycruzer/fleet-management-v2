/**
 * Regression coverage for bare-key keyboard shortcuts firing on modified keystrokes.
 *
 * `noExtraModifiers` began with `!shortcut.modifiers ||`, which short-circuited the entire
 * check to `true` in exactly the case it was meant to guard: a shortcut that omits `modifiers`.
 * A bare `{ key: 'a' }` therefore also matched Cmd+A, Ctrl+A and Shift+A, and because
 * `preventDefault()` runs on a match, the browser's native behaviour was suppressed too.
 *
 * On the Approvals Hub (`components/approvals/decision-actions.tsx`) the live bindings are bare
 * `a`, `d` and `n`. So Cmd+A — a reflex for "select all" — opened the approve-request dialog,
 * and Ctrl+N / Cmd+N fired `handleNeedsInfo`, which has NO confirmation step and immediately
 * flips a pilot's request to IN_REVIEW.
 *
 * `shift` was also absent from the modifier check entirely; it is included now. Shortcuts that
 * legitimately need a modifier declare it (e.g. `modifiers: ['meta', 'shift']`) and take the
 * other branch, so they are unaffected.
 */

import { describe, expect, it, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useKeyboardShortcuts } from '@/lib/hooks/use-keyboard-shortcuts'

type Mods = { metaKey?: boolean; ctrlKey?: boolean; altKey?: boolean; shiftKey?: boolean }

/** Mount a single bare-key shortcut and dispatch one keydown at the document. */
function fireKey(key: string, mods: Mods = {}, shortcut?: Record<string, unknown>) {
  const action = vi.fn()
  const { unmount } = renderHook(() =>
    useKeyboardShortcuts([{ key, action, ignoreInputs: true, ...shortcut }])
  )

  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...mods })
  document.dispatchEvent(event)
  unmount()

  return { action, defaultPrevented: event.defaultPrevented }
}

describe('useKeyboardShortcuts — bare-key shortcuts ignore modified keystrokes', () => {
  it('fires on the unmodified key', () => {
    const { action } = fireKey('a')
    expect(action).toHaveBeenCalledTimes(1)
  })

  it.each([
    ['Cmd', { metaKey: true }],
    ['Ctrl', { ctrlKey: true }],
    ['Alt', { altKey: true }],
    ['Shift', { shiftKey: true }],
  ])('does NOT fire on %s + key', (_label, mods) => {
    const { action } = fireKey('a', mods)
    expect(action).not.toHaveBeenCalled()
  })

  it('does not suppress native behaviour for a modified keystroke', () => {
    // Cmd+A must remain "select all" — preventDefault() should not run.
    const { defaultPrevented } = fireKey('a', { metaKey: true })
    expect(defaultPrevented).toBe(false)
  })

  it('does not fire the unconfirmed needs-info action on Ctrl+N or Cmd+N', () => {
    expect(fireKey('n', { ctrlKey: true }).action).not.toHaveBeenCalled()
    expect(fireKey('n', { metaKey: true }).action).not.toHaveBeenCalled()
  })

  it('treats an explicit empty modifiers array the same as omitting it', () => {
    expect(fireKey('a', {}, { modifiers: [] }).action).toHaveBeenCalledTimes(1)
    expect(fireKey('a', { metaKey: true }, { modifiers: [] }).action).not.toHaveBeenCalled()
  })
})

describe('useKeyboardShortcuts — declared modifiers still work', () => {
  it('fires Cmd+K when the shortcut declares meta', () => {
    const { action } = fireKey('k', { metaKey: true }, { modifiers: ['meta'] })
    expect(action).toHaveBeenCalledTimes(1)
  })

  it('does not fire Cmd+K when meta is not held', () => {
    const { action } = fireKey('k', {}, { modifiers: ['meta'] })
    expect(action).not.toHaveBeenCalled()
  })

  it('fires Cmd+Shift+D when the shortcut declares both', () => {
    const { action } = fireKey(
      'd',
      { metaKey: true, shiftKey: true },
      { modifiers: ['meta', 'shift'] }
    )
    expect(action).toHaveBeenCalledTimes(1)
  })
})
