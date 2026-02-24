// Maurice Rondeau — Activity Code Service
// Manages the activity code reference table for roster display.

import { createServiceRoleClient } from '@/lib/supabase/service-role'
import type { Database } from '@/types/supabase'

type ActivityCode = Database['public']['Tables']['activity_codes']['Row']
type ActivityCodeInsert = Database['public']['Tables']['activity_codes']['Insert']

export type ActivityCodeCategory =
  | 'FLIGHT'
  | 'DAY_OFF'
  | 'TRAINING'
  | 'LEAVE'
  | 'RESERVE'
  | 'TRANSPORT'
  | 'ACCOMMODATION'
  | 'OFFICE'
  | 'MEDICAL'
  | 'OTHER'

export async function getActivityCodes(): Promise<ActivityCode[]> {
  const supabase = createServiceRoleClient()
  const { data, error } = await supabase
    .from('activity_codes')
    .select('*')
    .order('category')
    .order('code')

  if (error) throw new Error(`Failed to fetch activity codes: ${error.message}`)
  return data
}

export async function getActivityCodeMap(): Promise<Map<string, ActivityCode>> {
  const codes = await getActivityCodes()
  const map = new Map<string, ActivityCode>()
  for (const code of codes) {
    map.set(code.code, code)
  }
  return map
}

/**
 * Upsert activity codes — inserts new ones found during parsing with category 'OTHER'.
 * Returns the list of newly inserted codes (for admin review).
 */
export async function ensureActivityCodesExist(codes: string[]): Promise<{ newCodes: string[] }> {
  const supabase = createServiceRoleClient()
  const existing = await getActivityCodeMap()
  const newCodes: string[] = []

  const toInsert: ActivityCodeInsert[] = []
  for (const code of codes) {
    if (!existing.has(code)) {
      newCodes.push(code)
      toInsert.push({
        code,
        name: code,
        category: 'OTHER',
        color: 'bg-yellow-100',
      })
    }
  }

  if (toInsert.length > 0) {
    const { error } = await supabase
      .from('activity_codes')
      .upsert(toInsert, { onConflict: 'code', ignoreDuplicates: true })

    if (error) throw new Error(`Failed to insert activity codes: ${error.message}`)
  }

  return { newCodes }
}
