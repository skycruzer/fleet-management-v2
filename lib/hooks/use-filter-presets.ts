/**
 * Filter Presets Hook
 * Author: Maurice Rondeau
 * Date: November 4, 2025
 *
 * Phase 2.4: Custom hook for managing saved filter presets with local storage
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import type { ReportFilters } from '@/types/reports'

export interface FilterPreset {
  id: string
  name: string
  filters: ReportFilters
  createdAt: string
  reportType: 'leave' | 'flight-requests' | 'certifications' | 'leave-bids'
}

const STORAGE_KEY_PREFIX = 'report-filter-presets'

/**
 * Get storage key for specific report type
 */
function getStorageKey(reportType: string): string {
  return `${STORAGE_KEY_PREFIX}-${reportType}`
}

/**
 * Custom hook for managing filter presets
 */
export function useFilterPresets(
  reportType: 'leave' | 'flight-requests' | 'certifications' | 'leave-bids'
) {
  const [presets, setPresets] = useState<FilterPreset[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load presets from local storage on mount
  useEffect(() => {
    try {
      const storageKey = getStorageKey(reportType)
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        const parsed = JSON.parse(stored) as FilterPreset[]
        setPresets(parsed)
      }
    } catch (error) {
      console.error('Failed to load filter presets:', error)
    } finally {
      setIsLoading(false)
    }
  }, [reportType])

  // Save presets to local storage whenever they change
  useEffect(() => {
    if (!isLoading) {
      try {
        const storageKey = getStorageKey(reportType)
        localStorage.setItem(storageKey, JSON.stringify(presets))
      } catch (error) {
        console.error('Failed to save filter presets:', error)
      }
    }
  }, [presets, reportType, isLoading])

  /**
   * Save a new filter preset
   */
  const savePreset = useCallback(
    (name: string, filters: ReportFilters): FilterPreset => {
      const newPreset: FilterPreset = {
        id: `${Date.now()}-${Math.random().toString(36).substring(7)}`,
        name,
        filters,
        createdAt: new Date().toISOString(),
        reportType,
      }

      setPresets((prev) => [...prev, newPreset])
      return newPreset
    },
    [reportType]
  )

  /**
   * Delete a filter preset by ID
   */
  const deletePreset = useCallback((presetId: string) => {
    setPresets((prev) => prev.filter((p) => p.id !== presetId))
  }, [])

  /**
   * Update an existing preset
   */
  const updatePreset = useCallback((presetId: string, name: string, filters: ReportFilters) => {
    setPresets((prev) => prev.map((p) => (p.id === presetId ? { ...p, name, filters } : p)))
  }, [])

  /**
   * Get a specific preset by ID
   */
  const getPreset = useCallback(
    (presetId: string): FilterPreset | undefined => {
      return presets.find((p) => p.id === presetId)
    },
    [presets]
  )

  /**
   * Clear all presets
   */
  const clearAllPresets = useCallback(() => {
    setPresets([])
  }, [])

  return {
    presets,
    isLoading,
    savePreset,
    deletePreset,
    updatePreset,
    getPreset,
    clearAllPresets,
  }
}
