import { unstable_cache } from 'next/cache'
import { createClient } from '@/lib/ebt/supabase/server'
import { createAdminClient } from '@/lib/ebt/supabase/admin'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import type { Database } from '@/lib/ebt/types'

export type ReportStatus = Database['ebt']['Enums']['report_status']
export type EvalResult = Database['ebt']['Enums']['eval_result']
export type RemedialStatus = Database['ebt']['Enums']['remedial_status']

export interface ReportListItem {
  id: string
  pilot_name: string | null
  staff_no: string | null
  module_no: number | null
  check_type: string | null
  training_date: string | null
  status: ReportStatus
  eval_result: EvalResult | null
}

/** Reports visible to the caller (RLS: examiner=own, fleet_manager/admin=all).
 *  Pass `limit` for surfaces that only show a slice (e.g. the dashboard's 6 recents) — the
 *  full unbounded history is only for the /reports list. */
export async function listReports(limit?: number): Promise<ReportListItem[]> {
  const supabase = await createClient()
  let query = supabase
    .from('training_reports')
    .select(
      'id, snap_name, snap_staff_no, module_no, training_date, status, check_types(name), report_phases(phase, result)'
    )
    .is('deleted_at', null)
    .order('training_date', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
  if (limit != null) query = query.limit(limit)
  const { data, error } = await query
  if (error) throw new Error('listReports: ' + error.message)
  return (data ?? []).map((r) => {
    const phases = (r.report_phases ?? []) as { phase: string; result: EvalResult | null }[]
    const evalPhase = phases.find((p) => p.phase === 'EVAL')
    return {
      id: r.id,
      pilot_name: r.snap_name,
      staff_no: r.snap_staff_no,
      module_no: r.module_no,
      check_type: (r.check_types as { name: string } | null)?.name ?? null,
      training_date: r.training_date,
      status: r.status,
      eval_result: evalPhase?.result ?? null,
    }
  })
}

/** Reference catalogs for the capture form (RLS: any authenticated user may read).
 *
 *  Cached across requests (1h TTL, tag "catalog"): these six tables are static reference
 *  data with no per-user variation and no PII, yet they were re-fetched on every capture-form
 *  render — 6 extra round-trips on the page examiners use most. The cached scope must not
 *  touch cookies, so it reads via the service-role client (equivalent rows: RLS grants every
 *  authenticated user read access to these catalogs). Call `revalidateTag("catalog")` from any
 *  future admin catalog mutation. */
export const getFormRefs = unstable_cache(async () => fetchFormRefs(), ['form-refs'], {
  revalidate: 3600,
  tags: ['catalog'],
})

async function fetchFormRefs() {
  const supabase = createAdminClient()
  const [comps, grades, checks, quals, specs, obs] = await Promise.all([
    supabase.from('competencies').select('code, display_name, sort_order').order('sort_order'),
    supabase.from('grade_descriptors').select('grade, label, is_pass_threshold').order('grade'),
    supabase.from('check_types').select('id, code, name').eq('active', true).order('name'),
    supabase
      .from('qualifications')
      .select('id, code, name')
      .eq('active', true)
      .order('sort_order', { nullsFirst: false })
      .order('name'),
    supabase
      .from('specialised_training')
      .select('id, code, name')
      .eq('active', true)
      .order('sort_order', { nullsFirst: false })
      .order('name'),
    supabase
      .from('observable_behaviours')
      .select('id, competency_code, code, description')
      .is('effective_to', null)
      .order('sort_order', { nullsFirst: false })
      .order('code'),
  ])
  for (const r of [comps, grades, checks, quals, specs, obs]) {
    if (r.error) throw new Error('getFormRefs: ' + r.error.message)
  }
  return {
    competencies: comps.data ?? [],
    gradeDescriptors: grades.data ?? [],
    checkTypes: checks.data ?? [],
    qualifications: quals.data ?? [],
    specialisedTraining: specs.data ?? [],
    observableBehaviours: obs.data ?? [],
  }
}

/** One report with all children, or null if not found / not visible / soft-deleted. */
export async function getReport(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('training_reports')
    .select(
      '*, ' +
        'report_phases(id, phase, progress, result, technical_events, non_technical_events, overall_comments), ' +
        'report_competency_grades(phase, competency_code, grade), ' +
        // report_carryover_focus has two FKs to training_reports (report_id + source_report_id);
        // hint the report_id FK so PostgREST can disambiguate the embed.
        'report_carryover_focus!report_carryover_focus_report_id_fkey(competency_code, previous_grade, previous_module_no, acknowledged_at), ' +
        'report_observed_behaviours(phase, competency_code, observable_behaviour_id), ' +
        'report_qualifications(qualification_id), ' +
        'report_specialised_training(specialised_training_id), ' +
        'report_signatures(kind, signed_at, signed_by)'
    )
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle()
  if (error) throw new Error('getReport: ' + error.message)
  return data
}

export interface OpenRemedial {
  id: string
  competency_code: string
  status: RemedialStatus
  previous_grade: number | null
  current_grade: number | null
  triggered_by_report_id: string
}

/** Open remedials for a pilot (drives the release-block note). */
export async function getOpenRemedials(pilotId: string): Promise<OpenRemedial[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('remedial_requirements')
    .select('id, competency_code, status, previous_grade, current_grade, triggered_by_report_id')
    .eq('pilot_id', pilotId)
    .in('status', ['required', 'scheduled', 'in_progress'])
  if (error) throw new Error('getOpenRemedials: ' + error.message)
  return (data ?? []) as OpenRemedial[]
}

/** Display name for the report's actual examiner by id.
 *
 *  In the fleet app, `training_reports.examiner_id` holds a fleet `an_users.id` (the admin-auth
 *  identity of whoever captured the report), so the name resolves from `public.an_users` — NOT
 *  from `ebt.profiles`, which has no row for fleet auth ids (that was the standalone-EBT identity
 *  store and left new reports rendering a blank examiner). Legacy reports migrated from the old
 *  standalone app may still carry an `auth.users` id that only exists in `ebt.profiles`, so we
 *  fall back to that.
 *
 *  Returns null when not found/visible — callers should render a dash, never fall back to an email.
 *  A missing examiner name must not throw and break the whole report. */
export async function getDisplayName(userId: string | null | undefined): Promise<string | null> {
  if (!userId) return null

  // Primary source: the fleet an_users record (new reports). Uses the fleet service-role client
  // (default public schema) rather than the ebt-scoped client.
  const fleet = createServiceRoleClient()
  const { data: fleetUser, error: fleetError } = await fleet
    .from('an_users')
    .select('name')
    .eq('id', userId)
    .maybeSingle()
  if (fleetError) {
    // Observable in server logs, but don't stop — a legacy report may still resolve via profiles.
    console.error('getDisplayName an_users(' + userId + '): ' + fleetError.message)
  } else if (fleetUser?.name) {
    return fleetUser.name
  }

  // Legacy fallback: examiner recorded under the old standalone-EBT profiles identity.
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', userId)
    .maybeSingle()
  if (error) {
    console.error('getDisplayName profiles(' + userId + '): ' + error.message)
    return null
  }
  return data?.full_name ?? null
}

/** Module number to suggest for a new report (last completed + 1). */
export async function getSuggestedModule(
  pilotId: string
): Promise<{ next: number; lastCompleted: number | null }> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('v_pilot_module_progress')
    .select('last_completed_module_no, next_module_suggested')
    .eq('pilot_id', pilotId)
    .maybeSingle()
  if (error) throw new Error('getSuggestedModule: ' + error.message)
  return {
    next: data?.next_module_suggested ?? 1,
    lastCompleted: data?.last_completed_module_no ?? null,
  }
}
