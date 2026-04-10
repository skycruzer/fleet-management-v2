/**
 * Card Density Toggle Hook
 * Stores compact/comfortable preference in localStorage
 *
 * Author: Maurice Rondeau
 */

'use client'

import { useState, useCallback } from 'react'

export type CardDensity = 'compact' | 'comfortable'

const STORAGE_KEY = 'card-density'

export function useCardDensity() {
  const [density, setDensity] = useState<CardDensity>(() => {
    if (typeof window === 'undefined') return 'comfortable'
    return (localStorage.getItem(STORAGE_KEY) as CardDensity) || 'comfortable'
  })

  const toggleDensity = useCallback(() => {
    const next = density === 'comfortable' ? 'compact' : 'comfortable'
    setDensity(next)
    localStorage.setItem(STORAGE_KEY, next)
  }, [density])

  return { density, toggleDensity }
}
