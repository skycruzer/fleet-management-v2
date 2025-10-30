/**
 * Check Types Service for Fleet Management V2
 *
 * Handles all check type operations following the service layer pattern.
 * Check types define the various certification and training requirements for pilots.
 *
 * @version 1.0.0
 * @since 2025-10-22
 */

import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/supabase'
import { logError, logInfo, ErrorSeverity } from '@/lib/error-logger'

// Type aliases for convenience
type CheckType = Database['public']['Tables']['check_types']['Row']

// ===================================
// SERVICE FUNCTIONS
// ===================================

/**
 * Get all check types
 *
 * Retrieves all check types from the database, ordered by check_code.
 * Used in certification forms and check type management.
 *
 * @returns Promise<CheckType[]> - Array of check types
 * @throws Error if database query fails
 */
export async function getCheckTypes(): Promise<CheckType[]> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('check_types')
      .select('*')
      .order('check_code', { ascending: true })

    if (error) {
      logError(new Error(`Failed to fetch check types: ${error.message}`), {
        source: 'CheckTypesService',
        severity: ErrorSeverity.HIGH,
        metadata: { function: 'getCheckTypes' },
      })
      throw new Error(`Failed to fetch check types: ${error.message}`)
    }

    logInfo('Check types fetched successfully', {
      source: 'CheckTypesService',
      metadata: { count: data?.length || 0 },
    })

    return data || []
  } catch (error) {
    logError(error as Error, {
      source: 'CheckTypesService',
      severity: ErrorSeverity.HIGH,
      metadata: { function: 'getCheckTypes' },
    })
    throw error
  }
}

/**
 * Get check type by ID
 *
 * Retrieves a single check type by its ID.
 *
 * @param id - Check type UUID
 * @returns Promise<CheckType | null> - Check type or null if not found
 * @throws Error if database query fails
 */
export async function getCheckTypeById(id: string): Promise<CheckType | null> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('check_types')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found
        return null
      }
      logError(new Error(`Failed to fetch check type: ${error.message}`), {
        source: 'CheckTypesService',
        severity: ErrorSeverity.MEDIUM,
        metadata: { function: 'getCheckTypeById', id },
      })
      throw new Error(`Failed to fetch check type: ${error.message}`)
    }

    return data
  } catch (error) {
    logError(error as Error, {
      source: 'CheckTypesService',
      severity: ErrorSeverity.MEDIUM,
      metadata: { function: 'getCheckTypeById', id },
    })
    throw error
  }
}

/**
 * Get check types by category
 *
 * Retrieves all check types for a specific category.
 *
 * @param category - Category name
 * @returns Promise<CheckType[]> - Array of check types in category
 * @throws Error if database query fails
 */
export async function getCheckTypesByCategory(category: string): Promise<CheckType[]> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('check_types')
      .select('*')
      .eq('category', category)
      .order('check_code', { ascending: true })

    if (error) {
      logError(new Error(`Failed to fetch check types for category: ${error.message}`), {
        source: 'CheckTypesService',
        severity: ErrorSeverity.MEDIUM,
        metadata: { function: 'getCheckTypesByCategory', category },
      })
      throw new Error(`Failed to fetch check types for category: ${error.message}`)
    }

    return data || []
  } catch (error) {
    logError(error as Error, {
      source: 'CheckTypesService',
      severity: ErrorSeverity.MEDIUM,
      metadata: { function: 'getCheckTypesByCategory', category },
    })
    throw error
  }
}
