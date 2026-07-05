import { createClient } from '@/lib/ebt/supabase/server'

export interface FilterOptions {
  aircraft: { id: string; code: string }[]
  ranks: string[]
}

export async function getFilterOptions(): Promise<FilterOptions> {
  const supabase = await createClient()
  const [ac, pilots] = await Promise.all([
    supabase.from('aircraft_types').select('id, code').order('code'),
    supabase.from('pilots').select('rank').not('rank', 'is', null),
  ])
  if (ac.error) throw new Error('getFilterOptions(aircraft): ' + ac.error.message)
  if (pilots.error) throw new Error('getFilterOptions(ranks): ' + pilots.error.message)
  const ranks = [...new Set((pilots.data ?? []).map((p) => p.rank as string))].sort()
  return {
    aircraft: (ac.data ?? []).map((a) => ({ id: a.id as string, code: a.code as string })),
    ranks,
  }
}
