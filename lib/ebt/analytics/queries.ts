import { createClient } from '@/lib/ebt/supabase/server'
import { type StandingSignals } from './standing'

// ── Per-pilot row shapes (all camelCase) ─────────────────────────────────────
export interface LatestEvalCell {
  competencyCode: string
  grade: number | null
  moduleNo: number | null
  trainingDate: string | null
}

/** One FLAT trend row per assessed-EVAL grade (NOT pivoted — Phase 3 pivots these). */
export interface TrendPoint {
  competencyCode: string
  reportId: string
  grade: number | null
  moduleNo: number | null
  trainingDate: string | null
}

/** sourceModuleNo maps the view column source_module_no (NOT previous_module_no). */
export interface CarryoverRow {
  competencyCode: string
  previousGrade: number
  sourceModuleNo: number | null
}

export interface ObFrequencyRow {
  competencyCode: string
  observableBehaviourId: string
  n: number
  direction: 'development' | 'exemplary'
}

// ── Per-pilot fetchers ───────────────────────────────────────────────────────

/** Latest assessed-EVAL grade per competency for one pilot. */
export async function getPilotLatestEval(pilotId: string): Promise<LatestEvalCell[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('v_pilot_latest_eval')
    .select('competency_code, grade, module_no, training_date')
    .eq('pilot_id', pilotId)
  if (error) throw new Error('getPilotLatestEval: ' + error.message)
  return (data ?? []).map((r) => ({
    competencyCode: r.competency_code as string,
    grade: (r.grade as number | null) ?? null,
    moduleNo: (r.module_no as number | null) ?? null,
    trainingDate: (r.training_date as string | null) ?? null,
  }))
}

/** Full assessed-EVAL grade trend for one pilot, newest first — FLAT rows (NOT pivoted). */
export async function getPilotCompetencyTrend(pilotId: string): Promise<TrendPoint[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('v_pilot_competency_trend')
    .select('competency_code, report_id, grade, module_no, training_date')
    .eq('pilot_id', pilotId)
    .order('training_date', { ascending: false, nullsFirst: false })
  if (error) throw new Error('getPilotCompetencyTrend: ' + error.message)
  return (data ?? []).map((r) => ({
    competencyCode: r.competency_code as string,
    reportId: r.report_id as string,
    grade: (r.grade as number | null) ?? null,
    moduleNo: (r.module_no as number | null) ?? null,
    trainingDate: (r.training_date as string | null) ?? null,
  }))
}

/** One pilot's standing: the classifier inputs PLUS the headline counts, both read
 *  from v_pilot_standing_signals (the SAME module-ranked source the fleet table uses),
 *  so the per-pilot Standards tab and the fleet below-standard table can never disagree. */
export interface PilotStandingSignals {
  signals: StandingSignals
  notCompetentCount: number
  belowEffectiveCount: number
}

/**
 * Standing signals + headline counts for one pilot. NON-NULL: when the pilot has no
 * assessed module the view yields no row and we return an all-false / zero default, so
 * callers never have to null-check before classifyStanding(result.signals).
 *
 * FIX #1: notCompetentCount / belowEffectiveCount come straight from the view columns
 * (not_competent_count / below_effective_count), the SAME source getAllStandingSignals
 * reads for the fleet table. They are NO LONGER recomputed from v_pilot_latest_eval
 * (which ranks by latest training_date, whereas this view ranks by highest module_no),
 * so a pilot's counts and standing tier are mutually consistent and match the fleet view.
 */
export async function getPilotStandingSignals(pilotId: string): Promise<PilotStandingSignals> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('v_pilot_standing_signals')
    .select(
      'any_grade_one, any_grade_two, recurring_twos, not_competent_count, below_effective_count'
    )
    .eq('pilot_id', pilotId)
    .maybeSingle()
  if (error) throw new Error('getPilotStandingSignals: ' + error.message)
  if (!data) {
    return {
      signals: { anyGradeOne: false, anyGradeTwo: false, recurringTwos: [] },
      notCompetentCount: 0,
      belowEffectiveCount: 0,
    }
  }
  return {
    signals: {
      anyGradeOne: Boolean(data.any_grade_one),
      anyGradeTwo: Boolean(data.any_grade_two),
      recurringTwos: (data.recurring_twos as string[] | null) ?? [],
    },
    // Read directly from the view columns (mirrors getAllStandingSignals), NOT anyGradeOne?1:0.
    notCompetentCount: (data.not_competent_count as number | null) ?? 0,
    belowEffectiveCount: (data.below_effective_count as number | null) ?? 0,
  }
}

/** Carryover deficiencies for one pilot. */
export async function getPilotCarryover(pilotId: string): Promise<CarryoverRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('v_pilot_carryover_deficiencies')
    .select('competency_code, previous_grade, source_module_no')
    .eq('pilot_id', pilotId)
  if (error) throw new Error('getPilotCarryover: ' + error.message)
  return (data ?? []).map((r) => ({
    competencyCode: r.competency_code as string,
    previousGrade: Number(r.previous_grade),
    sourceModuleNo: (r.source_module_no as number | null) ?? null,
  }))
}

/** Per-pilot OB frequency. Tolerates the OB view being absent (42P01) → []. */
export async function getPilotObFrequency(pilotId: string): Promise<ObFrequencyRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('v_pilot_ob_frequency')
    .select('competency_code, observable_behaviour_id, n, direction')
    .eq('pilot_id', pilotId)
  if (error) {
    if (error.code === '42P01') return [] // OB view not shipped yet
    throw new Error('getPilotObFrequency: ' + error.message)
  }
  return (data ?? []).map((r) => ({
    competencyCode: r.competency_code as string,
    observableBehaviourId: r.observable_behaviour_id as string,
    n: Number(r.n),
    direction: r.direction as 'development' | 'exemplary',
  }))
}

// ── Fleet layer (Phase 4 — sole author) ─────────────────────────────────────
// StandingSignals already imported at top of file; add classifyStanding + StandingTier.
import { classifyStanding, type StandingTier } from '@/lib/ebt/analytics/standing'
import { windowToInterval, type AnalyticsFilters } from '@/lib/ebt/analytics/filters'

export interface HeatmapRow {
  competencyCode: string
  aircraftTypeId: string | null
  rank: string | null
  avgGrade: number
  pctBelow3: number
  pctNotCompetent: number
  nGraded: number
}

export interface ModuleOutcomeRow {
  moduleNo: number | null
  aircraftTypeId: string | null
  rank: string | null
  pass: number
  fail: number
  incomplete: number
  resit: number
  total: number
}

export interface TrendRow {
  competencyCode: string
  month: string // ISO date (first of month)
  aircraftTypeId: string | null
  rank: string | null
  avgGrade: number
  pctBelow3: number
  nGraded: number
}

export interface PilotStanding {
  pilotId: string
  fullName: string | null
  staffNo: string | null
  rank: string | null
  aircraftCode: string | null
  signals: StandingSignals
  tier: StandingTier
  notCompetentCount: number
  belowEffectiveCount: number
}

export interface FleetKpis {
  notCompetent: number
  additionalTraining: number
  competentMonitor: number
  effective: number
  totalPilots: number
  pctBelowEffective: number
  modulePassRate: number | null
}

export interface FleetObRow {
  competencyCode: string
  observableBehaviourId: string
  n: number
  share: number
}

/** NULL rank buckets as "Unspecified" (spec §5.2 / §8). */
export function rankLabel(rank: string | null): string {
  return rank ?? 'Unspecified'
}

/** Pure: fold per-pilot standings + module outcomes into the fleet KPI tiles. */
export function deriveFleetKpis(
  standings: PilotStanding[],
  moduleOutcomes: ModuleOutcomeRow[]
): FleetKpis {
  let notCompetent = 0
  let additionalTraining = 0
  let competentMonitor = 0
  let effective = 0
  for (const s of standings) {
    if (s.tier === 'not_competent') notCompetent++
    else if (s.tier === 'additional_training') additionalTraining++
    else if (s.tier === 'competent_monitor') competentMonitor++
    else effective++
  }
  const totalPilots = standings.length
  const pctBelowEffective =
    totalPilots > 0 ? (notCompetent + additionalTraining + competentMonitor) / totalPilots : 0
  // Pass rate is over DECIDED outcomes (pass + fail + incomplete). A null/blank result
  // is a data gap, not a non-pass, so it must not dilute the denominator — v_module_outcomes
  // .total counts every EVAL phase including result-less ones.
  const decidedModules = moduleOutcomes.reduce((a, r) => a + r.pass + r.fail + r.incomplete, 0)
  const passModules = moduleOutcomes.reduce((a, r) => a + r.pass, 0)
  const modulePassRate = decidedModules > 0 ? passModules / decidedModules : null
  return {
    notCompetent,
    additionalTraining,
    competentMonitor,
    effective,
    totalPilots,
    pctBelowEffective,
    modulePassRate,
  }
}

/** Apply aircraft + rank equality filters to a grouped-view query builder. */
function applySlice<T extends { eq: (c: string, v: string) => T }>(q: T, f: AnalyticsFilters): T {
  let out = q
  if (f.aircraftTypeId) out = out.eq('aircraft_type_id', f.aircraftTypeId)
  if (f.rank) out = out.eq('rank', f.rank)
  return out
}

/** Heatmap data: only groups with assessed EVALs render (n_graded > 0). */
export async function getHeatmap(f: AnalyticsFilters): Promise<HeatmapRow[]> {
  const supabase = await createClient()
  const base = supabase
    .from('v_fleet_competency_health_grouped')
    .select(
      'competency_code, aircraft_type_id, rank, avg_grade, pct_below_3, pct_not_competent, n_graded'
    )
    .gt('n_graded', 0)
  const { data, error } = await applySlice(base, f)
  if (error) throw new Error('getHeatmap: ' + error.message)
  return (data ?? []).map((r) => ({
    competencyCode: r.competency_code as string,
    aircraftTypeId: (r.aircraft_type_id as string | null) ?? null,
    rank: (r.rank as string | null) ?? null,
    avgGrade: r.avg_grade as number,
    // DB view emits 0–100; normalize to 0–1 fraction at the query boundary.
    pctBelow3: ((r.pct_below_3 as number) ?? 0) / 100,
    pctNotCompetent: ((r.pct_not_competent as number) ?? 0) / 100,
    nGraded: r.n_graded as number,
  }))
}

export async function getModuleOutcomes(f: AnalyticsFilters): Promise<ModuleOutcomeRow[]> {
  const supabase = await createClient()
  const base = supabase
    .from('v_module_outcomes_grouped')
    .select('module_no, aircraft_type_id, rank, pass, fail, incomplete, resit, total')
    .order('module_no')
  const { data, error } = await applySlice(base, f)
  if (error) throw new Error('getModuleOutcomes: ' + error.message)
  return (data ?? []).map((r) => ({
    moduleNo: (r.module_no as number | null) ?? null,
    aircraftTypeId: (r.aircraft_type_id as string | null) ?? null,
    rank: (r.rank as string | null) ?? null,
    // count(*) FILTER aggregates can't be null per emitted row today, but the declared type is
    // number|null — guard so a future view change can't turn a null into NaN in the pass-rate KPI.
    pass: (r.pass as number | null) ?? 0,
    fail: (r.fail as number | null) ?? 0,
    incomplete: (r.incomplete as number | null) ?? 0,
    resit: (r.resit as number | null) ?? 0,
    total: (r.total as number | null) ?? 0,
  }))
}

/** First-of-month cutoff for the monthly trend window. v_fleet_trend_monthly buckets to
 *  month-start, so comparing against a mid-month day (e.g. 2026-03-09) would drop the ENTIRE
 *  boundary month's bucket (2026-03-01). Truncate to the first of that month so the boundary
 *  month is included. */
export function fleetTrendCutoff(windowDays: number, nowMs: number): string {
  return new Date(nowMs - windowDays * 86_400_000).toISOString().slice(0, 7) + '-01'
}

/** Monthly trend, rolling-window filtered. Window applied via windowToInterval — NOT sinceDays. */
export async function getFleetTrend(f: AnalyticsFilters): Promise<TrendRow[]> {
  const supabase = await createClient()
  const days = parseInt(windowToInterval(f.window), 10)
  const cutoff = fleetTrendCutoff(days, Date.now())
  const base = supabase
    .from('v_fleet_trend_monthly')
    .select('competency_code, month, aircraft_type_id, rank, avg_grade, pct_below_3, n_graded')
    .gte('month', cutoff)
    .order('month')
  const { data, error } = await applySlice(base, f)
  if (error) throw new Error('getFleetTrend: ' + error.message)
  return (data ?? []).map((r) => ({
    competencyCode: r.competency_code as string,
    month: r.month as string,
    aircraftTypeId: (r.aircraft_type_id as string | null) ?? null,
    rank: (r.rank as string | null) ?? null,
    avgGrade: r.avg_grade as number,
    // DB view emits 0–100; normalize to 0–1 fraction at the query boundary.
    pctBelow3: ((r.pct_below_3 as number) ?? 0) / 100,
    nGraded: r.n_graded as number,
  }))
}

/** All pilots with their classified standing. notCompetentCount/belowEffectiveCount
 *  come from v_pilot_standing_signals columns (not_competent_count/below_effective_count),
 *  NOT computed from grade signals. */
export async function getAllStandingSignals(
  f: AnalyticsFilters,
  activeOnly = false
): Promise<PilotStanding[]> {
  const supabase = await createClient()
  const sig = await supabase
    .from('v_pilot_standing_signals')
    .select(
      'pilot_id, any_grade_one, any_grade_two, recurring_twos, not_competent_count, below_effective_count'
    )
  if (sig.error) throw new Error('getAllStandingSignals(signals): ' + sig.error.message)

  const rowById = new Map<
    string,
    { signals: StandingSignals; notCompetentCount: number; belowEffectiveCount: number }
  >(
    (sig.data ?? []).map((s) => [
      s.pilot_id as string,
      {
        signals: {
          anyGradeOne: s.any_grade_one as boolean,
          recurringTwos: (s.recurring_twos as string[] | null) ?? [],
          anyGradeTwo: s.any_grade_two as boolean,
        },
        // Read directly from view columns, NOT anyGradeOne?1:0.
        notCompetentCount: (s.not_competent_count as number | null) ?? 0,
        belowEffectiveCount: (s.below_effective_count as number | null) ?? 0,
      },
    ])
  )

  let q = supabase
    .from('pilots')
    .select('id, full_name, staff_no, rank, aircraft_type_id, aircraft_types(code)')
    .in('id', [...rowById.keys()])
    .is('deleted_at', null) // never surface soft-deleted pilots (latent leak fix)
  if (activeOnly) q = q.eq('employment_status', 'active') // dashboard summary = active-only
  if (f.aircraftTypeId) q = q.eq('aircraft_type_id', f.aircraftTypeId)
  if (f.rank) q = q.eq('rank', f.rank)
  const { data, error } = await q
  if (error) throw new Error('getAllStandingSignals(pilots): ' + error.message)

  const EMPTY_SIGNALS: StandingSignals = {
    anyGradeOne: false,
    recurringTwos: [],
    anyGradeTwo: false,
  }
  return (data ?? []).map((p) => {
    const row = rowById.get(p.id as string) ?? {
      signals: EMPTY_SIGNALS,
      notCompetentCount: 0,
      belowEffectiveCount: 0,
    }
    const ac = p.aircraft_types as { code: string } | { code: string }[] | null
    const aircraftCode = Array.isArray(ac) ? (ac[0]?.code ?? null) : (ac?.code ?? null)
    const tier = classifyStanding(row.signals)
    return {
      pilotId: p.id as string,
      fullName: (p.full_name as string | null) ?? null,
      staffNo: (p.staff_no as string | null) ?? null,
      rank: (p.rank as string | null) ?? null,
      aircraftCode,
      signals: row.signals,
      tier,
      notCompetentCount: row.notCompetentCount,
      belowEffectiveCount: row.belowEffectiveCount,
    }
  })
}

/** Pilots below the effective standard (tier !== 'effective') for the drill-down table.
 *  activeOnly mirrors the /analytics screen (active pilots only); default false keeps
 *  the all-pilots behaviour for any other caller. */
export async function getBelowStandardPilots(
  f: AnalyticsFilters,
  activeOnly = false
): Promise<PilotStanding[]> {
  const all = await getAllStandingSignals(f, activeOnly)
  return all.filter((p) => p.tier !== 'effective')
}

/** Fleet-wide OB frequency. Tolerates missing view (42P01) → []. */
export async function getFleetTopBehaviours(f: AnalyticsFilters): Promise<FleetObRow[]> {
  const supabase = await createClient()
  const base = supabase
    .from('v_fleet_ob_frequency')
    .select('competency_code, observable_behaviour_id, n, share')
  const { data, error } = await applySlice(base, f)
  if (error) {
    if (error.code === '42P01') return [] // OB view not shipped yet
    throw new Error('getFleetTopBehaviours: ' + error.message)
  }
  return (data ?? []).map((r) => ({
    competencyCode: r.competency_code as string,
    observableBehaviourId: r.observable_behaviour_id as string,
    n: Number(r.n),
    share: Number(r.share),
  }))
}

// ── Dashboard summary (Task 10) ─────────────────────────────────────────────

const EMPTY_FILTERS: AnalyticsFilters = { aircraftTypeId: null, rank: null, window: '180' }

export interface FleetSummary {
  notCompetent: number
  additionalTraining: number
  belowEffectiveCount: number
  pctBelowEffective: number
}

/** Compact fleet standing counts for the dashboard summary card (no slice filters). */
export async function getFleetSummary(): Promise<FleetSummary> {
  const standings = await getAllStandingSignals(EMPTY_FILTERS, true) // dashboard = active pilots only
  const kpis = deriveFleetKpis(standings, [])
  return {
    notCompetent: kpis.notCompetent,
    additionalTraining: kpis.additionalTraining,
    belowEffectiveCount: kpis.notCompetent + kpis.additionalTraining + kpis.competentMonitor,
    pctBelowEffective: kpis.pctBelowEffective,
  }
}

// ── Chart-pivot helper (#10 — pure, no I/O) ──────────────────────────────────

/** Chart point: one training EVENT (report) in chronological order. seq is the unique X
 *  position; moduleNo/trainingDate label it; each competencyCode column carries that
 *  report's grade. */
export type TrendChartPoint = {
  seq: number
  moduleNo: number | null
  trainingDate: string | null
  [competencyCode: string]: number | string | null
}

/**
 * FIX #10: pivot the canonical FLAT TrendPoint[] into one chart point PER REPORT, ordered by
 * training_date ascending. The previous pivot keyed on moduleNo (1..6); because EBT modules
 * repeat in a cycle, two sittings of the same module collapsed onto one X position and the older
 * grade was silently dropped — so a pilot's history showed at most 6 points and mixed cycles.
 * Keying on the report (the actual training event) keeps every sitting as its own point.
 *
 * A report contributes a point only if it has at least one gradable (competency, grade) cell.
 * Equal training_dates break ties by reportId for a deterministic order.
 */
export function pivotTrend(rows: TrendPoint[]): {
  points: TrendChartPoint[]
  competencies: string[]
} {
  const byReport = new Map<
    string,
    { moduleNo: number | null; trainingDate: string | null; grades: Map<string, number> }
  >()
  const comps = new Set<string>()
  for (const r of rows) {
    if (r.competencyCode == null || r.grade == null) continue // skip ungradable cells
    const rep = byReport.get(r.reportId) ?? {
      moduleNo: r.moduleNo,
      trainingDate: r.trainingDate,
      grades: new Map<string, number>(),
    }
    if (!rep.grades.has(r.competencyCode)) rep.grades.set(r.competencyCode, r.grade)
    byReport.set(r.reportId, rep)
    comps.add(r.competencyCode)
  }
  const ordered = [...byReport.entries()].sort(([aId, a], [bId, b]) => {
    const ad = a.trainingDate ?? '' // ISO dates sort lexically; null ('') sorts first
    const bd = b.trainingDate ?? ''
    if (ad !== bd) return ad < bd ? -1 : 1
    return aId < bId ? -1 : aId > bId ? 1 : 0
  })
  const points: TrendChartPoint[] = ordered.map(([, rep], i) => {
    const pt: TrendChartPoint = {
      seq: i + 1,
      moduleNo: rep.moduleNo,
      trainingDate: rep.trainingDate,
    }
    for (const [code, g] of rep.grades) pt[code] = g
    return pt
  })
  return { points, competencies: [...comps].sort() }
}

// ── Competency analytics A–D (pure aggregators + fetchers) ────────────────────

export interface CompetencyLabel {
  code: string
  displayName: string
  sortOrder: number
}

/** Competency display names + canonical order, for labeling analytics surfaces with names
 *  (e.g. "Knowledge") instead of codes (e.g. "KNO"). */
export async function getCompetencyLabels(): Promise<CompetencyLabel[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('competencies')
    .select('code, display_name, sort_order')
    .order('sort_order')
  if (error) throw new Error('getCompetencyLabels: ' + error.message)
  return (data ?? []).map((r) => ({
    code: r.code as string,
    displayName: r.display_name as string,
    sortOrder: r.sort_order as number,
  }))
}

// ── A: competency weakness ranking ────────────────────────────────────────────

export interface WeaknessRow {
  competencyCode: string
  avgGrade: number
  pctBelowEffective: number // 0–1
  pctNotCompetent: number // 0–1
  nGraded: number
}

/** Fleet-wide weakness per competency, nGraded-weighted across the heatmap's (aircraft, rank)
 *  groups, ranked weakest (lowest avg grade) first. Weighting by nGraded recovers true totals:
 *  Σ(avg·n)/Σn is the real mean, and Σ(pct·n)/Σn == Σbelow/Σgraded. Reuses getHeatmap output
 *  (v_fleet_competency_health_grouped) — no extra query. */
export function deriveCompetencyWeakness(rows: HeatmapRow[]): WeaknessRow[] {
  const acc = new Map<string, { gradeSum: number; belowSum: number; ncSum: number; n: number }>()
  for (const r of rows) {
    const a = acc.get(r.competencyCode) ?? { gradeSum: 0, belowSum: 0, ncSum: 0, n: 0 }
    a.gradeSum += r.avgGrade * r.nGraded
    a.belowSum += r.pctBelow3 * r.nGraded
    a.ncSum += r.pctNotCompetent * r.nGraded
    a.n += r.nGraded
    acc.set(r.competencyCode, a)
  }
  const out: WeaknessRow[] = []
  for (const [competencyCode, a] of acc) {
    if (a.n === 0) continue
    out.push({
      competencyCode,
      avgGrade: a.gradeSum / a.n,
      pctBelowEffective: a.belowSum / a.n,
      pctNotCompetent: a.ncSum / a.n,
      nGraded: a.n,
    })
  }
  out.sort((x, y) =>
    x.avgGrade !== y.avgGrade
      ? x.avgGrade - y.avgGrade
      : y.pctBelowEffective !== x.pctBelowEffective
        ? y.pctBelowEffective - x.pctBelowEffective
        : x.competencyCode < y.competencyCode
          ? -1
          : x.competencyCode > y.competencyCode
            ? 1
            : 0
  )
  return out
}

// ── B: grade distribution ─────────────────────────────────────────────────────

export interface GradeDistGroupRow {
  competencyCode: string
  aircraftTypeId: string | null
  rank: string | null
  g1: number
  g2: number
  g3: number
  g4: number
  g5: number
  total: number
}

export interface CompetencyGradeDist {
  competencyCode: string
  g1: number
  g2: number
  g3: number
  g4: number
  g5: number
  total: number
  shares: { g1: number; g2: number; g3: number; g4: number; g5: number }
}

export async function getGradeDistribution(f: AnalyticsFilters): Promise<GradeDistGroupRow[]> {
  const supabase = await createClient()
  const base = supabase
    .from('v_fleet_grade_distribution_grouped')
    .select('competency_code, aircraft_type_id, rank, g1, g2, g3, g4, g5, total')
  const { data, error } = await applySlice(base, f)
  // No 42P01 tolerance: the view shipped in 20260607190000. A missing/renamed view is an
  // infrastructure fault that must error loudly, not render an honest-looking "no data" panel.
  if (error) throw new Error('getGradeDistribution: ' + error.message)
  return (data ?? []).map((r) => ({
    competencyCode: r.competency_code as string,
    aircraftTypeId: (r.aircraft_type_id as string | null) ?? null,
    rank: (r.rank as string | null) ?? null,
    g1: Number(r.g1),
    g2: Number(r.g2),
    g3: Number(r.g3),
    g4: Number(r.g4),
    g5: Number(r.g5),
    total: Number(r.total),
  }))
}

/** Sum the per-(aircraft, rank) grade buckets into one fleet-wide distribution per competency,
 *  with 0–1 shares (guarded against divide-by-zero). Sorted by code; the page re-labels/orders. */
export function deriveGradeDistribution(rows: GradeDistGroupRow[]): CompetencyGradeDist[] {
  const acc = new Map<
    string,
    { g1: number; g2: number; g3: number; g4: number; g5: number; total: number }
  >()
  for (const r of rows) {
    const a = acc.get(r.competencyCode) ?? { g1: 0, g2: 0, g3: 0, g4: 0, g5: 0, total: 0 }
    a.g1 += r.g1
    a.g2 += r.g2
    a.g3 += r.g3
    a.g4 += r.g4
    a.g5 += r.g5
    a.total += r.total
    acc.set(r.competencyCode, a)
  }
  const out: CompetencyGradeDist[] = []
  for (const [competencyCode, a] of acc) {
    const share = (n: number) => (a.total > 0 ? n / a.total : 0)
    out.push({
      competencyCode,
      g1: a.g1,
      g2: a.g2,
      g3: a.g3,
      g4: a.g4,
      g5: a.g5,
      total: a.total,
      shares: {
        g1: share(a.g1),
        g2: share(a.g2),
        g3: share(a.g3),
        g4: share(a.g4),
        g5: share(a.g5),
      },
    })
  }
  out.sort((x, y) =>
    x.competencyCode < y.competencyCode ? -1 : x.competencyCode > y.competencyCode ? 1 : 0
  )
  return out
}

// ── C: movers (earliest vs latest month per competency) ───────────────────────

export interface MoverRow {
  competencyCode: string
  firstMonth: string
  lastMonth: string
  firstAvg: number
  lastAvg: number
  delta: number // lastAvg − firstAvg (negative = declining)
  nGraded: number
}

/** Per competency, compare the earliest vs latest month present in the trend window (each month
 *  nGraded-weighted across groups). Only competencies spanning ≥2 months qualify. Sorted biggest
 *  decline first. Reuses getFleetTrend output (v_fleet_trend_monthly) — no extra query. */
export function deriveMovers(rows: TrendRow[]): MoverRow[] {
  const byComp = new Map<string, Map<string, { sum: number; n: number }>>()
  for (const r of rows) {
    const months = byComp.get(r.competencyCode) ?? new Map<string, { sum: number; n: number }>()
    const m = months.get(r.month) ?? { sum: 0, n: 0 }
    m.sum += r.avgGrade * r.nGraded
    m.n += r.nGraded
    months.set(r.month, m)
    byComp.set(r.competencyCode, months)
  }
  const out: MoverRow[] = []
  for (const [competencyCode, months] of byComp) {
    const keys = [...months.keys()].filter((k) => months.get(k)!.n > 0).sort()
    if (keys.length < 2) continue // need a span to measure movement
    const firstMonth = keys[0]
    const lastMonth = keys[keys.length - 1]
    const f = months.get(firstMonth)!
    const l = months.get(lastMonth)!
    let nGraded = 0
    for (const m of months.values()) nGraded += m.n
    const firstAvg = f.sum / f.n
    const lastAvg = l.sum / l.n
    out.push({
      competencyCode,
      firstMonth,
      lastMonth,
      firstAvg,
      lastAvg,
      delta: lastAvg - firstAvg,
      nGraded,
    })
  }
  out.sort((x, y) =>
    x.delta !== y.delta ? x.delta - y.delta : x.competencyCode < y.competencyCode ? -1 : 1
  )
  return out
}

// ── D: first-attempt vs resit ─────────────────────────────────────────────────

export interface FirstResitGroupRow {
  competencyCode: string
  aircraftTypeId: string | null
  rank: string | null
  firstN: number
  firstAvgGrade: number | null
  firstBelow: number
  resitN: number
  resitAvgGrade: number | null
  resitBelow: number
}

export interface CompetencyFirstResit {
  competencyCode: string
  firstN: number
  firstAvg: number | null
  firstPctBelow: number | null
  resitN: number
  resitAvg: number | null
  resitPctBelow: number | null
  delta: number | null // resitAvg − firstAvg, when both sides have data
}

export async function getFirstVsResit(f: AnalyticsFilters): Promise<FirstResitGroupRow[]> {
  const supabase = await createClient()
  const base = supabase
    .from('v_fleet_first_vs_resit_grouped')
    .select(
      'competency_code, aircraft_type_id, rank, first_n, first_avg_grade, first_below, resit_n, resit_avg_grade, resit_below'
    )
  const { data, error } = await applySlice(base, f)
  // No 42P01 tolerance (view shipped in 20260607190000) — see getGradeDistribution.
  if (error) throw new Error('getFirstVsResit: ' + error.message)
  return (data ?? []).map((r) => ({
    competencyCode: r.competency_code as string,
    aircraftTypeId: (r.aircraft_type_id as string | null) ?? null,
    rank: (r.rank as string | null) ?? null,
    firstN: Number(r.first_n),
    firstAvgGrade: r.first_avg_grade == null ? null : Number(r.first_avg_grade),
    firstBelow: Number(r.first_below),
    resitN: Number(r.resit_n),
    resitAvgGrade: r.resit_avg_grade == null ? null : Number(r.resit_avg_grade),
    resitBelow: Number(r.resit_below),
  }))
}

/** Fold the per-group first/resit split into one fleet-wide row per competency. Means are
 *  nGraded-weighted (null group means skipped, not counted as 0); delta is resit − first only
 *  when both sides have data. Reuses v_fleet_first_vs_resit_grouped. */
export function deriveFirstVsResit(rows: FirstResitGroupRow[]): CompetencyFirstResit[] {
  const acc = new Map<
    string,
    { fSum: number; fN: number; fBelow: number; rSum: number; rN: number; rBelow: number }
  >()
  for (const r of rows) {
    const a = acc.get(r.competencyCode) ?? { fSum: 0, fN: 0, fBelow: 0, rSum: 0, rN: 0, rBelow: 0 }
    if (r.firstAvgGrade != null) a.fSum += r.firstAvgGrade * r.firstN
    a.fN += r.firstN
    a.fBelow += r.firstBelow
    if (r.resitAvgGrade != null) a.rSum += r.resitAvgGrade * r.resitN
    a.rN += r.resitN
    a.rBelow += r.resitBelow
    acc.set(r.competencyCode, a)
  }
  const out: CompetencyFirstResit[] = []
  for (const [competencyCode, a] of acc) {
    const firstAvg = a.fN > 0 ? a.fSum / a.fN : null
    const resitAvg = a.rN > 0 ? a.rSum / a.rN : null
    out.push({
      competencyCode,
      firstN: a.fN,
      firstAvg,
      firstPctBelow: a.fN > 0 ? a.fBelow / a.fN : null,
      resitN: a.rN,
      resitAvg,
      resitPctBelow: a.rN > 0 ? a.rBelow / a.rN : null,
      delta: firstAvg != null && resitAvg != null ? resitAvg - firstAvg : null,
    })
  }
  out.sort((x, y) =>
    x.competencyCode < y.competencyCode ? -1 : x.competencyCode > y.competencyCode ? 1 : 0
  )
  return out
}
