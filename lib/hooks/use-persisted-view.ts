'use client'

/**
 * View Persistence Hook
 * Stores and retrieves user view preferences from localStorage
 * SSR-safe with URL param sync support
 *
 * @author Maurice (Skycruzer)
 * @version 1.0.0
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'

const STORAGE_PREFIX = 'fleet-view-'

type ViewPreference = string

interface UsePersistedViewOptions {
  /** Sync with URL search params */
  syncWithUrl?: boolean
  /** URL param key name */
  urlParamKey?: string
}

/**
 * Hook to persist view preferences across sessions
 *
 * @param key - Unique key for this view preference
 * @param defaultValue - Default value if no stored preference
 * @param options - Configuration options
 * @returns Tuple of [value, setValue, isLoading]
 *
 * @example
 * const [viewMode, setViewMode] = usePersistedView('requests-view', 'table')
 */
export function usePersistedView<T extends ViewPreference>(
  key: string,
  defaultValue: T,
  options: UsePersistedViewOptions = {}
): [T, (value: T) => void, boolean] {
  const { syncWithUrl = false, urlParamKey = 'view' } = options

  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Storage key with prefix
  const storageKey = `${STORAGE_PREFIX}${key}`

  // Use lazy initialization to load from localStorage AND URL params
  const [value, setValue] = useState<T>(() => {
    if (typeof window === 'undefined') return defaultValue

    // Check URL params first if sync is enabled (URL takes priority)
    if (syncWithUrl) {
      const urlParams = new URLSearchParams(window.location.search)
      const urlValue = urlParams.get(urlParamKey)
      if (urlValue) {
        // Save URL value to localStorage for persistence
        try {
          localStorage.setItem(storageKey, urlValue)
        } catch {
          // localStorage not available
        }
        return urlValue as T
      }
    }

    // Then check localStorage
    try {
      const storedValue = localStorage.getItem(storageKey)
      if (storedValue) return storedValue as T
    } catch {
      // localStorage not available
    }
    return defaultValue
  })

  // Use lazy initialization for isLoading - starts false since we loaded synchronously
  const [isLoading] = useState(false)

  // Track previous URL params using state for React Compiler compliance
  const [prevUrlValue, setPrevUrlValue] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null
    if (syncWithUrl) {
      return new URLSearchParams(window.location.search).get(urlParamKey)
    }
    return null
  })

  // Sync with URL params during render (React Compiler-friendly pattern)
  if (syncWithUrl) {
    const urlValue = searchParams.get(urlParamKey)
    if (urlValue !== prevUrlValue) {
      setPrevUrlValue(urlValue)
      if (urlValue && urlValue !== value) {
        setValue(urlValue as T)
        // Also save to localStorage for persistence
        try {
          localStorage.setItem(storageKey, urlValue)
        } catch {
          // localStorage not available
        }
      }
    }
  }

  // Update value and persist
  const updateValue = useCallback(
    (newValue: T) => {
      setValue(newValue)

      // Save to localStorage
      try {
        localStorage.setItem(storageKey, newValue)
      } catch {
        // localStorage not available
      }

      // Update URL if sync is enabled
      if (syncWithUrl) {
        const params = new URLSearchParams(searchParams.toString())
        params.set(urlParamKey, newValue)
        router.replace(`${pathname}?${params.toString()}`, { scroll: false })
      }
    },
    [storageKey, syncWithUrl, urlParamKey, searchParams, router, pathname]
  )

  return [value, updateValue, isLoading]
}

/**
 * Hook to persist multiple view preferences
 */
export function usePersistedViewState<T extends Record<string, ViewPreference>>(
  key: string,
  defaultValue: T
): [T, (key: keyof T, value: ViewPreference) => void, boolean] {
  const storageKey = `${STORAGE_PREFIX}${key}`

  // Use lazy initialization to load from localStorage
  const [state, setState] = useState<T>(() => {
    if (typeof window === 'undefined') return defaultValue
    try {
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        return { ...defaultValue, ...JSON.parse(stored) }
      }
    } catch {
      // localStorage not available or invalid JSON
    }
    return defaultValue
  })

  // isLoading is always false since we load synchronously via lazy init
  const [isLoading] = useState(false)

  // Update a single preference
  const updatePreference = useCallback(
    (preferenceKey: keyof T, value: ViewPreference) => {
      setState((prev) => {
        const newState = { ...prev, [preferenceKey]: value }
        try {
          localStorage.setItem(storageKey, JSON.stringify(newState))
        } catch {
          // localStorage not available
        }
        return newState
      })
    },
    [storageKey]
  )

  return [state, updatePreference, isLoading]
}

/**
 * Clear all view preferences (useful for reset functionality)
 */
export function clearViewPreferences(): void {
  try {
    const keys = Object.keys(localStorage)
    keys.forEach((key) => {
      if (key.startsWith(STORAGE_PREFIX)) {
        localStorage.removeItem(key)
      }
    })
  } catch {
    // localStorage not available
  }
}
