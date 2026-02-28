/**
 * Activity Code Service
 *
 * Manages activity code definitions and categories.
 * Provides legend data for roster display and code classification.
 *
 * Developer: Maurice Rondeau
 */

import { createClient } from '@/lib/supabase/server'
import { ServiceResponse } from '@/lib/types/service-response'

export type ActivityCodeCategory =
  | 'FLIGHT'
  | 'DAY_OFF'
  | 'TRAINING'
  | 'LEAVE'
  | 'RESERVE'
  | 'OTHER'

export interface ActivityCode {
  id: string
  code: string
  name: string
  description: string | null
  category: ActivityCodeCategory
  color: string
  created_at: string
}

// Predefined activity code mappings (B767 standard)
const STANDARD_CODES: Record<string, { name: string; category: ActivityCodeCategory }> = {
  // Flight operations
  'A': { name: 'Line Flying', category: 'FLIGHT' },
  'B': { name: 'Blank', category: 'FLIGHT' },
  'T': { name: 'Training Flight', category: 'TRAINING' },
  'SIM': { name: 'Simulator Training', category: 'TRAINING' },

  // Days off and leave
  'OF': { name: 'Off Day', category: 'DAY_OFF' },
  'V': { name: 'Vacation', category: 'LEAVE' },
  'SK': { name: 'Sick Leave', category: 'LEAVE' },
  'P': { name: 'Personal Leave', category: 'LEAVE' },
  'M': { name: 'Military Leave', category: 'LEAVE' },

  // Reserve and standby
  'R': { name: 'Reserve', category: 'RESERVE' },
  'SBY': { name: 'Standby', category: 'RESERVE' },

  // Other
  'HDAY': { name: 'Holiday', category: 'DAY_OFF' },
}

// Category colors (Tailwind)
const CATEGORY_COLORS: Record<ActivityCodeCategory, string> = {
  'FLIGHT': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  'DAY_OFF': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  'TRAINING': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  'LEAVE': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  'RESERVE': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  'OTHER': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
}

/**
 * Gets all activity codes with optional filters
 */
export async function getActivityCodes(
  category?: ActivityCodeCategory
): Promise<ServiceResponse<ActivityCode[]>> {
  try {
    const supabase = await createClient()

    let query = supabase
      .from('activity_codes')
      .select('*')
      .order('code', { ascending: true })

    if (category) {
      query = query.eq('category', category)
    }

    const result = await query

    if (result.error) {
      return ServiceResponse.error(`Failed to fetch activity codes: ${result.error.message}`)
    }

    return ServiceResponse.success((result.data || []) as ActivityCode[])
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    return ServiceResponse.error(`Fetch failed: ${errorMsg}`)
  }
}

/**
 * Gets activity code by code string
 */
export async function getActivityCodeByCode(
  code: string
): Promise<ServiceResponse<ActivityCode>> {
  try {
    const supabase = await createClient()

    const result = await supabase
      .from('activity_codes')
      .select('*')
      .eq('code', code.toUpperCase())
      .single()

    if (result.error) {
      // If not found, use standard mapping or return OTHER
      const standard = STANDARD_CODES[code.toUpperCase()]
      if (standard) {
        return ServiceResponse.success({
          id: `temp-${code}`,
          code: code.toUpperCase(),
          name: standard.name,
          category: standard.category,
          color: CATEGORY_COLORS[standard.category],
          created_at: new Date().toISOString(),
        } as ActivityCode)
      }

      return ServiceResponse.error(`Activity code not found: ${code}`)
    }

    return ServiceResponse.success(result.data as ActivityCode)
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    return ServiceResponse.error(`Fetch failed: ${errorMsg}`)
  }
}

/**
 * Creates or updates an activity code
 */
export async function upsertActivityCode(
  code: string,
  name: string,
  category: ActivityCodeCategory,
  description?: string
): Promise<ServiceResponse<ActivityCode>> {
  try {
    const supabase = await createClient()
    const color = CATEGORY_COLORS[category]

    const result = await supabase
      .from('activity_codes')
      .upsert(
        {
          code: code.toUpperCase(),
          name,
          description,
          category,
          color,
        },
        { onConflict: 'code' }
      )
      .select()
      .single()

    if (result.error) {
      return ServiceResponse.error(`Upsert failed: ${result.error.message}`)
    }

    return ServiceResponse.success(result.data as ActivityCode)
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    return ServiceResponse.error(`Upsert failed: ${errorMsg}`)
  }
}

/**
 * Gets activity code legend (grouped by category)
 */
export async function getActivityCodeLegend(): Promise<
  ServiceResponse<Record<ActivityCodeCategory, ActivityCode[]>>
> {
  try {
    const result = await getActivityCodes()
    if (!result.success) {
      return ServiceResponse.error(`Failed to fetch codes: ${result.error}`)
    }

    const legend: Record<ActivityCodeCategory, ActivityCode[]> = {
      FLIGHT: [],
      DAY_OFF: [],
      TRAINING: [],
      LEAVE: [],
      RESERVE: [],
      OTHER: [],
    }

    for (const code of result.data || []) {
      legend[code.category].push(code)
    }

    return ServiceResponse.success(legend)
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    return ServiceResponse.error(`Legend fetch failed: ${errorMsg}`)
  }
}

/**
 * Gets color for a specific activity code
 */
export function getActivityCodeColor(category: ActivityCodeCategory): string {
  return CATEGORY_COLORS[category] || CATEGORY_COLORS.OTHER
}
