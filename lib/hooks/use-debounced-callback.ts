/**
 * useDebouncedCallback
 * Returns a stable debounced wrapper around the latest callback.
 *
 * Pattern adapted from Kiranism/next-shadcn-dashboard-starter (MIT)
 */

'use client'

import * as React from 'react'

export function useDebouncedCallback<T extends (...args: never[]) => unknown>(
  callback: T,
  delay: number
) {
  const callbackRef = React.useRef(callback)
  React.useEffect(() => {
    callbackRef.current = callback
  })

  const timerRef = React.useRef(0)
  React.useEffect(() => () => window.clearTimeout(timerRef.current), [])

  return React.useCallback(
    (...args: Parameters<T>) => {
      window.clearTimeout(timerRef.current)
      timerRef.current = window.setTimeout(() => callbackRef.current(...args), delay)
    },
    [delay]
  )
}
