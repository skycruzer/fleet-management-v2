'use client'

import { useEffect, useState } from 'react'

/**
 * Debounce a value over `delayMs`. Returns the most recent value once the
 * caller has stopped updating it for `delayMs`. Used for search inputs that
 * trigger network fetches — without this, every keystroke fires a request.
 */
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const handle = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(handle)
  }, [value, delayMs])

  return debounced
}
