'use server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireRole } from '@/lib/ebt/auth/roles'
import { createClient } from '@/lib/ebt/supabase/server'
import { consecutiveFailCompetencies } from '@/lib/ebt/reports/rule'
import type { EvalResult } from '@/lib/ebt/reports/queries'

export type ReportActionState = { ok: boolean; message: string }

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>

// Server Actions are public POST endpoints; their string args are not validated by TypeScript at
// runtime. Validate against allow-lists before any DB write so a crafted payload can't probe the
// schema (the DB constraints would reject it, but with a raw error we must not echo back).
const COMPETENCY_CODE = /^[A-Z]{2,8}$/
const EVAL_RESULTS = new Set(['pass', 'fail', 'incomplete'])
const PHASE_KEYS = new Set(['MV', 'SBT', 'ISI'])
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
const OPEN_REMEDIAL_STATUSES = ['required', 'scheduled', 'in_progress'] as const
// Only these statuses may be deleted. Signed-off and finalized reports are immutable compliance
// records — the DB enforce_lifecycle() trigger also rejects the deleted_at UPDATE on those, so this
// is the friendly web-tier guard mirroring assertDraft.
const DELETABLE_REPORT_STATUSES = new Set(['draft', 'submitted'])

/** Log the technical DB error server-side (code + message) and keep it OUT of the user-facing
 *  string — raw Postgres/PostgREST messages leak table, column, and constraint names. */
function logDbError(where: string, error: { code?: string | null; message?: string } | null): void {
  console.error(`[report-actions] ${where}`, { code: error?.code, message: error?.message })
}

/** Reject content mutations to a report that is no longer a draft. Server Actions are public POST
 *  endpoints, so the page's `locked` flag only disables inputs client-side; RLS scopes writes by
 *  ownership, not status. This is the web-tier lifecycle guard (mirrors saveSignature's check).
 *  Returns null when the report is an editable draft, else a user-facing message. */
async function assertDraft(
  supabase: SupabaseServerClient,
  reportId: string
): Promise<string | null> {
  // Choke-point UUID validation for every mutating action: a malformed id would otherwise reach
  // PostgREST and bounce back as a raw type error that leaks schema details.
  if (!UUID_RE.test(reportId)) return 'Invalid report id.'
  const { data, error } = await supabase
    .from('training_reports')
    .select('status')
    .eq('id', reportId)
    .maybeSingle()
  if (error) return 'Could not verify report status.'
  if (!data) return 'Report not found.'
  if ((data as { status: string }).status !== 'draft') return 'Report is no longer a draft.'
  return null
}

export async function createReport(
  _prev: ReportActionState,
  formData: FormData
): Promise<ReportActionState> {
  const user = await requireRole('examiner')
  const pilot_id = String(formData.get('pilot_id') ?? '').trim()
  const check_type_id = String(formData.get('check_type_id') ?? '').trim() || null
  const training_date = String(formData.get('training_date') ?? '').trim() || null
  const moduleRaw = String(formData.get('module_no') ?? '').trim()
  const module_no = moduleRaw ? Number.parseInt(moduleRaw, 10) : null
  const is_resit = formData.get('is_resit') === 'on'
  if (!pilot_id || !UUID_RE.test(pilot_id)) return { ok: false, message: 'Choose a pilot.' }
  // The DB has no CHECK on module_no range; validate here so a bad value can't silently become NULL.
  if (module_no !== null && (!Number.isInteger(module_no) || module_no < 1 || module_no > 6)) {
    return { ok: false, message: 'Module must be a number between 1 and 6.' }
  }

  const supabase = await createClient() // RLS: insert requires examiner_id = auth.uid()
  const { data, error } = await supabase
    .from('training_reports')
    .insert({ pilot_id, check_type_id, training_date, module_no, is_resit, examiner_id: user.id })
    .select('id')
    .single()
  if (error) {
    if (error.code === '42501')
      return { ok: false, message: "You don't have permission to create reports." }
    logDbError('createReport.insert', error)
    return { ok: false, message: 'Could not create the report. Please try again.' }
  }
  // The EVAL phase row must exist before grading so evaluate_eval_result can set its result.
  const { error: phaseErr } = await supabase
    .from('report_phases')
    .insert({ report_id: data.id, phase: 'EVAL' })
  if (phaseErr) {
    logDbError('createReport.phaseInit', phaseErr)
    return {
      ok: false,
      message:
        'The report was created but its evaluation could not be initialised. Open it and try again.',
    }
  }

  revalidatePath('/dashboard/ebt/reports')
  redirect(`/dashboard/ebt/reports/${data.id}`)
}

export interface ReportSetupPatch {
  check_type_id: string | null
  training_date: string | null
  is_resit: boolean
  module_no: number | null
}

/** Edit the Setup fields on an existing draft (createReport sets them once; the guided flow lets
 *  the examiner correct them later). Accepts a PARTIAL patch — only keys that are present in the
 *  object are validated and written; callers that own only a subset of Setup fields will not
 *  clobber unrelated columns. Key presence is checked with `in obj` (NOT truthiness) so that
 *  falsy-but-valid values like `is_resit:false` and `module_no:null` are correctly included. */
export async function saveReportSetup(
  reportId: string,
  patch: Partial<ReportSetupPatch>
): Promise<ReportActionState> {
  await requireRole('examiner')
  // Validate only the keys that are present. The `undefined` check is required because TypeScript
  // widens `Partial<T>[key]` to `T[key] | undefined` even after an `in` guard.
  if (
    'check_type_id' in patch &&
    patch.check_type_id != null &&
    !UUID_RE.test(patch.check_type_id)
  ) {
    return { ok: false, message: 'Invalid check type.' }
  }
  if (
    'training_date' in patch &&
    patch.training_date != null &&
    !ISO_DATE.test(patch.training_date)
  ) {
    return { ok: false, message: 'Invalid training date.' }
  }
  if (
    'module_no' in patch &&
    patch.module_no != null &&
    (!Number.isInteger(patch.module_no) || patch.module_no < 1 || patch.module_no > 6)
  ) {
    return { ok: false, message: 'Module must be a number between 1 and 6.' }
  }
  // Build the DB update object from only the keys that are present in the patch.
  const dbUpdate: Partial<ReportSetupPatch> = {}
  if ('check_type_id' in patch) dbUpdate.check_type_id = patch.check_type_id
  if ('training_date' in patch) dbUpdate.training_date = patch.training_date
  if ('is_resit' in patch) dbUpdate.is_resit = patch.is_resit
  if ('module_no' in patch) dbUpdate.module_no = patch.module_no
  if (Object.keys(dbUpdate).length === 0) {
    return { ok: false, message: 'Nothing to save.' }
  }
  const supabase = await createClient()
  const guard = await assertDraft(supabase, reportId)
  if (guard) return { ok: false, message: guard }
  const { error } = await supabase.from('training_reports').update(dbUpdate).eq('id', reportId)
  if (error) {
    if (error.code === '42501') return { ok: false, message: 'Not permitted.' }
    logDbError('saveReportSetup.update', error)
    return { ok: false, message: 'Could not save setup. Please try again.' }
  }
  revalidatePath(`/dashboard/ebt/reports/${reportId}`)
  return { ok: true, message: 'Setup saved.' }
}

export async function acknowledgeCarryover(reportId: string): Promise<void> {
  const user = await requireRole('examiner')
  const supabase = await createClient()
  const guard = await assertDraft(supabase, reportId)
  if (guard) throw new Error(guard)
  const { error } = await supabase
    .from('report_carryover_focus')
    .update({ acknowledged_at: new Date().toISOString(), acknowledged_by: user.id })
    .eq('report_id', reportId)
    .is('acknowledged_at', null)
  if (error) throw new Error('acknowledgeCarryover: ' + error.message)
  revalidatePath(`/dashboard/ebt/reports/${reportId}`)
}

export interface GradeSaveResult {
  ok: boolean
  /** Whether evalResult/failedCompetencies reflect a successful DB re-read. When false, the client
   *  must NOT trust those fields (but if ok is true the grade itself still persisted). */
  resultConfirmed: boolean
  evalResult: EvalResult | null
  failedCompetencies: string[]
  message?: string
}

/** Upsert one EVAL competency grade; the DB trigger re-evaluates the rule. Returns the
 *  DB-authoritative EVAL result + the competency codes the rule has flagged. */
export async function setGrade(
  reportId: string,
  competencyCode: string,
  grade: number | null
): Promise<GradeSaveResult> {
  await requireRole('examiner')
  if (!COMPETENCY_CODE.test(competencyCode)) {
    return {
      ok: false,
      resultConfirmed: false,
      evalResult: null,
      failedCompetencies: [],
      message: 'Invalid competency.',
    }
  }
  if (grade !== null && (!Number.isInteger(grade) || grade < 1 || grade > 5)) {
    return {
      ok: false,
      resultConfirmed: false,
      evalResult: null,
      failedCompetencies: [],
      message: 'Grade must be between 1 and 5.',
    }
  }
  const supabase = await createClient()
  const guard = await assertDraft(supabase, reportId)
  if (guard)
    return {
      ok: false,
      resultConfirmed: false,
      evalResult: null,
      failedCompetencies: [],
      message: guard,
    }
  const { error } = await supabase
    .from('report_competency_grades')
    .upsert(
      { report_id: reportId, phase: 'EVAL', competency_code: competencyCode, grade },
      { onConflict: 'report_id,phase,competency_code' }
    )
  if (error) {
    if (error.code === '42501')
      return {
        ok: false,
        resultConfirmed: false,
        evalResult: null,
        failedCompetencies: [],
        message: 'Not permitted.',
      }
    logDbError('setGrade.upsert', error)
    return {
      ok: false,
      resultConfirmed: false,
      evalResult: null,
      failedCompetencies: [],
      message: 'Could not save the grade. Please try again.',
    }
  }
  // The grade IS saved. Re-read the DB-authoritative result + raised remedials. If THIS read fails we
  // must neither (a) report a clean 'no-fail' state that masks a DB-mandated fail, nor (b) make the
  // client roll back a grade that did persist — so return ok:true (no rollback) + resultConfirmed:false.
  const [phaseRes, remedialRes] = await Promise.all([
    supabase
      .from('report_phases')
      .select('result')
      .eq('report_id', reportId)
      .eq('phase', 'EVAL')
      .maybeSingle(),
    supabase
      .from('remedial_requirements')
      .select('competency_code')
      .eq('triggered_by_report_id', reportId),
  ])
  revalidatePath(`/dashboard/ebt/reports/${reportId}`)
  if (phaseRes.error || remedialRes.error) {
    logDbError('setGrade.readback', phaseRes.error ?? remedialRes.error)
    return {
      ok: true,
      resultConfirmed: false,
      evalResult: null,
      failedCompetencies: [],
      message: "Grade saved, but the result couldn't be refreshed — reload to confirm.",
    }
  }
  return {
    ok: true,
    resultConfirmed: true,
    evalResult: (phaseRes.data?.result ?? null) as EvalResult | null,
    failedCompetencies: ((remedialRes.data ?? []) as { competency_code: string }[]).map(
      (r) => r.competency_code
    ),
  }
}

/** Save EVAL events + result. Re-validates the consecutive-fail rule server-side (spec §8):
 *  a locked report can never be passed, regardless of UI state or surface. */
export async function saveEvalPhase(
  reportId: string,
  _prev: ReportActionState,
  formData: FormData
): Promise<ReportActionState> {
  await requireRole('examiner')
  const technical_events = String(formData.get('technical_events') ?? '').trim() || null
  const non_technical_events = String(formData.get('non_technical_events') ?? '').trim() || null
  const overall_comments = String(formData.get('overall_comments') ?? '').trim() || null
  const requested = String(formData.get('result') ?? '').trim() // '', 'pass', 'fail', 'incomplete'
  if (requested !== '' && !EVAL_RESULTS.has(requested)) {
    return { ok: false, message: 'Invalid evaluation result.' }
  }

  const supabase = await createClient()
  const guard = await assertDraft(supabase, reportId)
  if (guard) return { ok: false, message: guard }

  // Re-validate the consecutive-fail rule server-side (spec §8). A locked EVAL can only ever be
  // 'fail': an explicit 'pass' is rejected (conflicting intent), while 'incomplete'/blank are coerced
  // to 'fail' so a follow-up save cannot mask the DB-mandated result. 'fail' itself needs no check.
  let result: EvalResult | null = requested === '' ? null : (requested as EvalResult)
  if (requested !== 'fail') {
    const [carryRes, gradesRes] = await Promise.all([
      supabase
        .from('report_carryover_focus')
        .select('competency_code, previous_grade')
        .eq('report_id', reportId),
      supabase
        .from('report_competency_grades')
        .select('competency_code, grade')
        .eq('report_id', reportId)
        .eq('phase', 'EVAL'),
    ])
    // Fail CLOSED: if we can't read the rule inputs, refuse the save rather than risk passing a
    // report the rule would lock to FAIL.
    if (carryRes.error || gradesRes.error) {
      logDbError('saveEvalPhase.ruleCheck', carryRes.error ?? gradesRes.error)
      return { ok: false, message: 'Could not verify the consecutive-fail rule. Please try again.' }
    }
    const gradeMap: Record<string, number | null> = {}
    for (const g of (gradesRes.data ?? []) as { competency_code: string; grade: number | null }[])
      gradeMap[g.competency_code] = g.grade
    const failed = consecutiveFailCompetencies(
      (carryRes.data ?? []) as { competency_code: string; previous_grade: number }[],
      gradeMap
    )
    if (failed.length > 0) {
      if (requested === 'pass') {
        return {
          ok: false,
          message: `Result is locked to FAIL by the consecutive-fail rule (${failed.join(', ')}).`,
        }
      }
      result = 'fail' // coerce 'incomplete'/blank → 'fail'
    }
  }
  const { error } = await supabase
    .from('report_phases')
    .update({ technical_events, non_technical_events, overall_comments, result })
    .eq('report_id', reportId)
    .eq('phase', 'EVAL')
  if (error) {
    if (error.code === 'P0001') return { ok: false, message: error.message }
    logDbError('saveEvalPhase.update', error)
    return { ok: false, message: 'Could not save the evaluation. Please try again.' }
  }
  revalidatePath(`/dashboard/ebt/reports/${reportId}`)
  return { ok: true, message: 'Evaluation saved.' }
}

type PhaseKey = 'MV' | 'SBT' | 'ISI'

/** Upsert one Day-2 phase (Manoeuvres Validation / SBT / In-Seat Instruction). */
export async function savePhase(
  reportId: string,
  phase: PhaseKey,
  _prev: ReportActionState,
  formData: FormData
): Promise<ReportActionState> {
  await requireRole('examiner')
  if (!PHASE_KEYS.has(phase)) return { ok: false, message: 'Invalid phase.' }
  const progress = String(formData.get('progress') ?? '').trim() || null
  const overall_comments = String(formData.get('overall_comments') ?? '').trim() || null
  const resultRaw = String(formData.get('result') ?? '').trim()
  if (resultRaw !== '' && !EVAL_RESULTS.has(resultRaw))
    return { ok: false, message: 'Invalid result.' }
  const result = resultRaw === '' ? null : (resultRaw as EvalResult)

  const supabase = await createClient()
  const guard = await assertDraft(supabase, reportId)
  if (guard) return { ok: false, message: guard }
  const { error } = await supabase
    .from('report_phases')
    .upsert(
      { report_id: reportId, phase, progress, overall_comments, result },
      { onConflict: 'report_id,phase' }
    )
  if (error) {
    if (error.code === 'P0001') return { ok: false, message: error.message }
    logDbError('savePhase.upsert', error)
    return { ok: false, message: 'Could not save this phase. Please try again.' }
  }
  revalidatePath(`/dashboard/ebt/reports/${reportId}`)
  return { ok: true, message: `${phase} saved.` }
}

export async function setDay2Deferred(reportId: string, deferred: boolean): Promise<void> {
  await requireRole('examiner')
  const supabase = await createClient()
  const guard = await assertDraft(supabase, reportId)
  if (guard) throw new Error(guard)
  const { error } = await supabase
    .from('training_reports')
    .update({ day2_deferred: deferred })
    .eq('id', reportId)
  if (error) throw new Error('setDay2Deferred: ' + error.message)
  revalidatePath(`/dashboard/ebt/reports/${reportId}`)
}

/** Replace the report's qualification or specialised-training selections. */
export async function setReportLists(
  reportId: string,
  kind: 'qualifications' | 'specialised',
  ids: string[]
): Promise<void> {
  await requireRole('examiner')
  const supabase = await createClient()
  const guard = await assertDraft(supabase, reportId)
  if (guard) throw new Error(guard)
  if (kind === 'qualifications') {
    const { error: delErr } = await supabase
      .from('report_qualifications')
      .delete()
      .eq('report_id', reportId)
    if (delErr) throw new Error('setReportLists.delete: ' + delErr.message)
    if (ids.length > 0) {
      const { error: insErr } = await supabase
        .from('report_qualifications')
        .insert(ids.map((id) => ({ report_id: reportId, qualification_id: id })))
      if (insErr) throw new Error('setReportLists.insert: ' + insErr.message)
    }
  } else {
    const { error: delErr } = await supabase
      .from('report_specialised_training')
      .delete()
      .eq('report_id', reportId)
    if (delErr) throw new Error('setReportLists.delete: ' + delErr.message)
    if (ids.length > 0) {
      const { error: insErr } = await supabase
        .from('report_specialised_training')
        .insert(ids.map((id) => ({ report_id: reportId, specialised_training_id: id })))
      if (insErr) throw new Error('setReportLists.insert: ' + insErr.message)
    }
  }
  revalidatePath(`/dashboard/ebt/reports/${reportId}`)
}

/** Save the declaration section (declaration_released + additional_comments ONLY). The DB
 *  enforce_release_block trigger rejects declaration_released=true while any remedial is open
 *  (P0001). Examiner/sim fields are managed separately via saveExaminerDetails so the two PDF
 *  sections cannot clobber each other's columns. Extra FormData keys are simply ignored. */
export async function setDeclaration(
  reportId: string,
  _prev: ReportActionState,
  formData: FormData
): Promise<ReportActionState> {
  await requireRole('examiner')
  const releasedRaw = String(formData.get('declaration_released') ?? '').trim() // 'yes' | 'no' | ''
  const declaration_released = releasedRaw === 'yes' ? true : releasedRaw === 'no' ? false : null
  const patch = {
    declaration_released,
    additional_comments: String(formData.get('additional_comments') ?? '').trim() || null,
  }
  const supabase = await createClient()
  const guard = await assertDraft(supabase, reportId)
  if (guard) return { ok: false, message: guard }
  const { error } = await supabase.from('training_reports').update(patch).eq('id', reportId)
  if (error) {
    if (error.code === 'P0001') return { ok: false, message: error.message }
    logDbError('setDeclaration.update', error)
    return { ok: false, message: 'Could not save the declaration. Please try again.' }
  }
  revalidatePath(`/dashboard/ebt/reports/${reportId}`)
  return { ok: true, message: 'Declaration saved.' }
}

/** Examiner submits a complete draft: re-checks carryover ack, EVAL result, and both
 *  examiner+trainee signatures, then transitions draft -> submitted (DB validates the
 *  transition + re-asserts the rule via its triggers). */
export async function submitReport(reportId: string): Promise<ReportActionState> {
  await requireRole('examiner')
  if (!UUID_RE.test(reportId)) return { ok: false, message: 'Invalid report id.' }
  const supabase = await createClient()
  const { data: report, error } = await supabase
    .from('training_reports')
    // report_carryover_focus has two FKs to training_reports; hint report_id so the embed resolves.
    .select(
      'id, pilot_id, status, training_date, module_no, report_carryover_focus!report_carryover_focus_report_id_fkey(acknowledged_at), report_phases(phase, result), report_signatures(kind), report_competency_grades(phase, competency_code, grade), report_observed_behaviours(phase, competency_code, observable_behaviour_id)'
    )
    .eq('id', reportId)
    .maybeSingle()
  if (error || !report) return { ok: false, message: 'Report not found.' }
  const r = report as unknown as {
    pilot_id: string
    status: string
    training_date: string | null
    module_no: number | null
    report_carryover_focus?: { acknowledged_at: string | null }[]
    report_phases?: { phase: string; result: string | null }[]
    report_signatures?: { kind: string }[]
    report_competency_grades?: { phase: string; competency_code: string; grade: number | null }[]
    report_observed_behaviours?: { phase: string; competency_code: string }[]
  }
  if (r.status !== 'draft') return { ok: false, message: 'Only a draft can be submitted.' }

  // Mirrors the enforce_lifecycle DB guard (20260610090000): a submitted report missing either
  // field is silently EXCLUDED from every standing/trend view — block it here with a friendly
  // message instead of surfacing the trigger's P0001.
  if (r.training_date == null || r.module_no == null) {
    return { ok: false, message: 'Set the training date and module before submitting.' }
  }

  const carry = r.report_carryover_focus ?? []
  if (carry.some((c) => c.acknowledged_at == null)) {
    return { ok: false, message: 'Acknowledge the carryover banner before submitting.' }
  }

  // §15.4 OB submit gate (decision #13): every EVAL competency graded 1/2/5 needs ≥1 observed OB.
  const obByComp = new Set(
    (r.report_observed_behaviours ?? [])
      .filter((o) => o.phase === 'EVAL')
      .map((o) => o.competency_code)
  )
  const missingOb = (r.report_competency_grades ?? [])
    .filter(
      (g) =>
        g.phase === 'EVAL' &&
        g.grade != null &&
        [1, 2, 5].includes(g.grade) &&
        !obByComp.has(g.competency_code)
    )
    .map((g) => g.competency_code)
  if (missingOb.length > 0) {
    return {
      ok: false,
      message: `Record at least one observable behaviour for: ${missingOb.join(', ')}.`,
    }
  }

  const phases = r.report_phases ?? []
  const evalPhase = phases.find((p) => p.phase === 'EVAL')
  if (!evalPhase || evalPhase.result == null) {
    return { ok: false, message: 'Set the EVAL result before submitting.' }
  }
  // Defence-in-depth alongside the DB consecutive-fail + enforce_release_block triggers: a PASS must
  // not be submittable while the pilot has an open remedial requirement, or the submitted record
  // would assert a clean pass for someone under mandatory remedial training.
  if (evalPhase.result === 'pass') {
    const { data: openRem, error: remErr } = await supabase
      .from('remedial_requirements')
      .select('competency_code')
      .eq('pilot_id', r.pilot_id)
      .in('status', [...OPEN_REMEDIAL_STATUSES])
    if (remErr) {
      logDbError('submitReport.remedials', remErr)
      return { ok: false, message: 'Could not verify remedial status. Please try again.' }
    }
    if ((openRem ?? []).length > 0) {
      return {
        ok: false,
        message:
          'This pilot has an open remedial requirement — a PASS cannot be submitted until it is resolved.',
      }
    }
  }
  const sigKinds = new Set((r.report_signatures ?? []).map((s) => s.kind))
  if (!sigKinds.has('examiner') || !sigKinds.has('trainee')) {
    return { ok: false, message: 'Capture examiner and trainee signatures before submitting.' }
  }

  const { error: upErr } = await supabase
    .from('training_reports')
    .update({ status: 'submitted' })
    .eq('id', reportId)
  if (upErr) {
    if (upErr.code === 'P0001') return { ok: false, message: upErr.message }
    logDbError('submitReport.update', upErr)
    return { ok: false, message: 'Could not submit the report. Please try again.' }
  }
  revalidatePath(`/dashboard/ebt/reports/${reportId}`)
  revalidatePath('/dashboard/ebt/reports')
  return { ok: true, message: 'Report submitted.' }
}

const COMPETENCY_PHASES = new Set(['MV', 'SBT'])

/** Replace the competency SELECTION for a Day-2 manoeuvre phase. The PDF lists competencies as
 *  bullets (which objectives address), not 1–5 grades, so each selected code is a row with grade
 *  NULL. Mirrors setReportLists' delete-then-insert. EVAL is graded separately via setGrade. */
export async function setPhaseCompetencies(
  reportId: string,
  phase: 'MV' | 'SBT',
  codes: string[]
): Promise<ReportActionState> {
  await requireRole('examiner')
  if (!COMPETENCY_PHASES.has(phase)) return { ok: false, message: 'Invalid phase.' }
  const clean = Array.from(new Set(codes))
  if (clean.some((c) => !COMPETENCY_CODE.test(c)))
    return { ok: false, message: 'Invalid competency.' }

  const supabase = await createClient()
  const guard = await assertDraft(supabase, reportId)
  if (guard) return { ok: false, message: guard }

  const { error: delErr } = await supabase
    .from('report_competency_grades')
    .delete()
    .eq('report_id', reportId)
    .eq('phase', phase)
  if (delErr) {
    logDbError('setPhaseCompetencies.delete', delErr)
    return { ok: false, message: 'Could not save. Please try again.' }
  }

  if (clean.length > 0) {
    const { error: insErr } = await supabase.from('report_competency_grades').insert(
      clean.map((competency_code) => ({
        report_id: reportId,
        phase,
        competency_code,
        grade: null,
      }))
    )
    if (insErr) {
      logDbError('setPhaseCompetencies.insert', insErr)
      return { ok: false, message: 'Could not save. Please try again.' }
    }
  }
  revalidatePath(`/dashboard/ebt/reports/${reportId}`)
  return { ok: true, message: `${phase} competencies saved.` }
}

export interface ExaminerDetailsPatch {
  ioa_number: string | null
  sim_hours: string | null
  if_hours: string | null
  sim_location: string | null
  sim_level: string | null
}

/** Save the Examiner Details section (sim/IOA fields) — separate from the declaration so the two
 *  PDF sections don't clobber each other's columns. */
export async function saveExaminerDetails(
  reportId: string,
  patch: ExaminerDetailsPatch
): Promise<ReportActionState> {
  await requireRole('examiner')
  const supabase = await createClient()
  const guard = await assertDraft(supabase, reportId)
  if (guard) return { ok: false, message: guard }
  const { error } = await supabase
    .from('training_reports')
    .update({
      ioa_number: patch.ioa_number,
      sim_hours: patch.sim_hours,
      if_hours: patch.if_hours,
      sim_location: patch.sim_location,
      sim_level: patch.sim_level,
    })
    .eq('id', reportId)
  if (error) {
    if (error.code === '42501') return { ok: false, message: 'Not permitted.' }
    logDbError('saveExaminerDetails.update', error)
    return { ok: false, message: 'Could not save examiner details. Please try again.' }
  }
  revalidatePath(`/dashboard/ebt/reports/${reportId}`)
  return { ok: true, message: 'Examiner details saved.' }
}

/** Bounce a submitted report back to draft for correction (allowed transition). */
export async function returnToDraft(reportId: string): Promise<ReportActionState> {
  await requireRole('examiner')
  if (!UUID_RE.test(reportId)) return { ok: false, message: 'Invalid report id.' }
  const supabase = await createClient()
  const { error } = await supabase
    .from('training_reports')
    .update({ status: 'draft' })
    .eq('id', reportId)
  if (error) {
    if (error.code === 'P0001') return { ok: false, message: error.message }
    logDbError('returnToDraft.update', error)
    return { ok: false, message: 'Could not reopen the report. Please try again.' }
  }
  revalidatePath(`/dashboard/ebt/reports/${reportId}`)
  return { ok: true, message: 'Reopened as draft.' }
}

/** Toggle one EVAL Observable Behaviour for a competency (§15.3). Idempotent upsert: insert the
 *  (report, EVAL, competency, OB) row; if it already exists, remove it — mirroring setGrade's
 *  draft guard + optimistic-write contract. The composite FK in the DB enforces OB→competency
 *  membership, so a bad obId fails closed there even past the UUID check here. */
export async function toggleObservedBehaviour(
  reportId: string,
  competencyCode: string,
  obId: string
): Promise<ReportActionState> {
  await requireRole('examiner')
  if (!COMPETENCY_CODE.test(competencyCode)) return { ok: false, message: 'Invalid competency.' }
  if (!UUID_RE.test(obId)) return { ok: false, message: 'Invalid observable behaviour.' }
  const supabase = await createClient()
  const guard = await assertDraft(supabase, reportId)
  if (guard) return { ok: false, message: guard }

  const { error: delErr, count } = await supabase
    .from('report_observed_behaviours')
    .delete({ count: 'exact' })
    .eq('report_id', reportId)
    .eq('phase', 'EVAL')
    .eq('competency_code', competencyCode)
    .eq('observable_behaviour_id', obId)
  if (delErr) {
    logDbError('toggleObservedBehaviour.delete', delErr)
    return { ok: false, message: 'Could not save. Please try again.' }
  }

  if ((count ?? 0) === 0) {
    const { error: insErr } = await supabase.from('report_observed_behaviours').insert({
      report_id: reportId,
      phase: 'EVAL',
      competency_code: competencyCode,
      observable_behaviour_id: obId,
    })
    if (insErr) {
      if (insErr.code === '42501') return { ok: false, message: 'Not permitted.' }
      if (insErr.code === '23503')
        return { ok: false, message: 'That behaviour does not belong to this competency.' }
      logDbError('toggleObservedBehaviour.insert', insErr)
      return { ok: false, message: 'Could not save. Please try again.' }
    }
  }
  revalidatePath(`/dashboard/ebt/reports/${reportId}`)
  return { ok: true, message: 'Behaviours saved.' }
}

/** Clear ALL OBs recorded for one EVAL competency (§15.3 — fired when the grade moves to 3/4/null,
 *  which carry no OB evidence). Draft-guarded. */
export async function clearObservedBehaviours(
  reportId: string,
  competencyCode: string
): Promise<ReportActionState> {
  await requireRole('examiner')
  if (!COMPETENCY_CODE.test(competencyCode)) return { ok: false, message: 'Invalid competency.' }
  const supabase = await createClient()
  const guard = await assertDraft(supabase, reportId)
  if (guard) return { ok: false, message: guard }
  const { error } = await supabase
    .from('report_observed_behaviours')
    .delete()
    .eq('report_id', reportId)
    .eq('phase', 'EVAL')
    .eq('competency_code', competencyCode)
  if (error) {
    logDbError('clearObservedBehaviours.delete', error)
    return { ok: false, message: 'Could not save. Please try again.' }
  }
  revalidatePath(`/dashboard/ebt/reports/${reportId}`)
  return { ok: true, message: 'Behaviours cleared.' }
}

/** Soft-delete (archive) a report — admin + fleet manager only (examiners excluded). Only draft or
 *  submitted reports may be deleted; signed-off and finalized reports are immutable compliance
 *  records. Recoverable: queries filter deleted_at, and the audit hash chain records the change.
 *  Redirects to the list on success (mirrors createReport). */
export async function softDeleteReport(reportId: string): Promise<ReportActionState> {
  await requireRole('fleet_manager')
  if (!UUID_RE.test(reportId)) return { ok: false, message: 'Invalid report id.' }
  const supabase = await createClient()
  const { data, error: readErr } = await supabase
    .from('training_reports')
    .select('status')
    .eq('id', reportId)
    .maybeSingle()
  if (readErr) {
    logDbError('softDeleteReport.read', readErr)
    return { ok: false, message: 'Could not verify report status.' }
  }
  if (!data) return { ok: false, message: 'Report not found.' }
  if (!DELETABLE_REPORT_STATUSES.has((data as { status: string }).status)) {
    return {
      ok: false,
      message:
        'Only draft or submitted reports can be deleted. Signed-off and finalized reports are locked.',
    }
  }
  const { error } = await supabase
    .from('training_reports')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', reportId)
  if (error) {
    if (error.code === '42501')
      return { ok: false, message: "You don't have permission to delete this report." }
    if (error.code === 'P0001') return { ok: false, message: error.message }
    logDbError('softDeleteReport.update', error)
    return { ok: false, message: 'Could not delete the report. Please try again.' }
  }
  revalidatePath('/dashboard/ebt/reports')
  redirect('/dashboard/ebt/reports')
}
