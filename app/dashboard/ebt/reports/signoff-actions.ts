'use server'
import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/ebt/auth/roles'
import { createClient } from '@/lib/ebt/supabase/server'
import type { ReportActionState } from './report-actions'

/** Fleet-manager signs off a submitted report (submitted → signed_off). Requires the fleet-manager
 *  signature; records sign_off_date + signed_off_by. The DB state-transition trigger + content lock
 *  enforce legality; this action gates on the signature and surfaces P0001 messages verbatim. */
export async function signOffReport(reportId: string): Promise<ReportActionState> {
  const user = await requireRole('fleet_manager')
  const supabase = await createClient()
  const { data: report, error } = await supabase
    .from('training_reports')
    .select('status, report_signatures(kind)')
    .eq('id', reportId)
    .maybeSingle()
  if (error || !report) return { ok: false, message: 'Report not found.' }
  if (report.status !== 'submitted')
    return { ok: false, message: 'Only a submitted report can be signed off.' }
  const kinds = new Set((report.report_signatures ?? []).map((s: { kind: string }) => s.kind))
  if (!kinds.has('fleet_manager'))
    return { ok: false, message: 'Capture the fleet-manager signature before sign-off.' }

  const { error: upErr } = await supabase
    .from('training_reports')
    .update({
      status: 'signed_off',
      sign_off_date: new Date().toISOString().slice(0, 10),
      signed_off_by: user.id,
    })
    .eq('id', reportId)
  if (upErr) {
    if (upErr.code === 'P0001') return { ok: false, message: upErr.message }
    return { ok: false, message: 'Could not sign off the report. Please try again.' }
  }
  revalidatePath(`/dashboard/ebt/reports/${reportId}`)
  revalidatePath('/dashboard/ebt/reports')
  return { ok: true, message: 'Report signed off.' }
}
