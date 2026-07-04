import { createClient } from '@/lib/ebt/supabase/server'
import type { Database } from '@/lib/ebt/types'

export type CurrencyRow = Database['ebt']['Views']['v_pilot_currency']['Row']
export type ModuleProgressRow = Database['ebt']['Views']['v_pilot_module_progress']['Row']

export type CurrencyBucket = 'valid' | 'expiring' | 'expired'
export interface PilotCurrency {
  medical: CurrencyBucket | null
  ir: CurrencyBucket | null
  proficiency: CurrencyBucket | null
}

/** One batched query: fetch all currency rows from v_pilot_currency and build a
 *  Map<pilot_id, PilotCurrency>. Never N+1. */
export async function listPilotCurrency(): Promise<Map<string, PilotCurrency>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('v_pilot_currency')
    .select('pilot_id, qualification_code, alert_bucket')
  if (error) throw new Error('listPilotCurrency: ' + error.message)
  const map = new Map<string, PilotCurrency>()
  for (const row of data ?? []) {
    const pid = row.pilot_id as string
    const code = row.qualification_code as string | null
    const bucket = row.alert_bucket as CurrencyBucket | null
    if (!pid || !code || !bucket) continue
    const entry = map.get(pid) ?? { medical: null, ir: null, proficiency: null }
    if (code === 'MEDICAL') entry.medical = bucket
    else if (code === 'INSTRUMENT_RATING') entry.ir = bucket
    else if (code === 'PROFICIENCY') entry.proficiency = bucket
    map.set(pid, entry)
  }
  return map
}

export interface CurrencyDetail {
  bucket: CurrencyBucket
  validTo: string | null
}
export interface PilotCurrencyDetail {
  medical: CurrencyDetail | null
  ir: CurrencyDetail | null
  proficiency: CurrencyDetail | null
}

/** Like listPilotCurrency but keeps the expiry date alongside the bucket — for surfaces
 *  that show "valid to <date>" rather than just a colour (e.g. the new-report pilot preview). */
export async function listPilotCurrencyDetail(): Promise<Map<string, PilotCurrencyDetail>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('v_pilot_currency')
    .select('pilot_id, qualification_code, alert_bucket, valid_to')
  if (error) throw new Error('listPilotCurrencyDetail: ' + error.message)
  const map = new Map<string, PilotCurrencyDetail>()
  for (const row of data ?? []) {
    const pid = row.pilot_id as string
    const code = row.qualification_code as string | null
    const bucket = row.alert_bucket as CurrencyBucket | null
    if (!pid || !code || !bucket) continue
    const entry = map.get(pid) ?? { medical: null, ir: null, proficiency: null }
    const detail: CurrencyDetail = { bucket, validTo: (row.valid_to as string | null) ?? null }
    if (code === 'MEDICAL') entry.medical = detail
    else if (code === 'INSTRUMENT_RATING') entry.ir = detail
    else if (code === 'PROFICIENCY') entry.proficiency = detail
    map.set(pid, entry)
  }
  return map
}

export interface PilotListItem {
  id: string
  staff_no: string
  full_name: string
  rank: string | null
  employment_status: string
  aircraft: string | null
}

/** All non-deleted pilots (RLS: any authenticated user may read). */
export async function listPilots(): Promise<PilotListItem[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('pilots')
    .select('id, staff_no, full_name, rank, employment_status, aircraft_types(code)')
    .is('deleted_at', null)
    .order('staff_no')
  if (error) throw new Error('listPilots: ' + error.message)
  return (data ?? []).map((p) => {
    const at = Array.isArray(p.aircraft_types) ? p.aircraft_types[0] : p.aircraft_types
    return {
      id: p.id,
      staff_no: p.staff_no,
      full_name: p.full_name,
      rank: p.rank,
      employment_status: p.employment_status,
      aircraft: (at as { code: string } | null)?.code ?? null,
    }
  })
}

/** One pilot with related sub-records, or null if not found / soft-deleted. */
export async function getPilot(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('pilots')
    .select(
      'id, staff_no, full_name, rank, employment_status, aircraft_type_id, ' +
        'aircraft_types(code, name), ' +
        'licences(id, licence_type, licence_no, issuing_authority, issue_date, expiry), ' +
        'medicals(id, medical_class, issue_date, expiry, limitations), ' +
        'pilot_qualifications(id, valid_from, valid_to, qualifications(code, name))'
    )
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle()
  if (error) throw new Error('getPilot: ' + error.message)
  return data
}

export async function getPilotCurrency(id: string): Promise<CurrencyRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('v_pilot_currency').select('*').eq('pilot_id', id)
  if (error) throw new Error('getPilotCurrency: ' + error.message)
  return data ?? []
}

export async function getPilotModuleProgress(id: string): Promise<ModuleProgressRow | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('v_pilot_module_progress')
    .select('*')
    .eq('pilot_id', id)
    .maybeSingle()
  if (error) throw new Error('getPilotModuleProgress: ' + error.message)
  return data
}

export async function listAircraftTypes() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('aircraft_types')
    .select('id, code, name')
    .eq('active', true)
    .order('name')
  if (error) throw new Error('listAircraftTypes: ' + error.message)
  return data ?? []
}
