import { createClient } from '@/lib/ebt/supabase/server'
import { listReports, type ReportListItem } from '@/lib/ebt/reports/queries'

export interface CurrencyKind {
  expired: number
  expiring: number
  valid: number
  /** Active pilots with NO record on file for this track (not in v_pilot_currency). */
  noRecord: number
}

export interface DashboardData {
  currency: {
    medical: CurrencyKind
    ir: CurrencyKind
    proficiency: CurrencyKind
  }
  health: Array<{ code: string; avg: number; n: number }>
  /** True when the active-only competency-health view was unavailable and the figures fell
   *  back to the ALL-pilot view — the page header says "Active fleet", so the UI must show
   *  an explicit degraded banner rather than mislabel inactive pilots' numbers as active. */
  healthDegraded: boolean
  recent: ReportListItem[]
}

function emptyCurrency(): CurrencyKind {
  return { expired: 0, expiring: 0, valid: 0, noRecord: 0 }
}

/**
 * Fetches all data for the dashboard overview.
 *
 * - currency: counts per alert_bucket from v_pilot_currency, split by
 *   qualification_code ('MEDICAL', 'INSTRUMENT_RATING', 'PROFICIENCY'), plus
 *   noRecord = active pilots with no record on file for that track.
 * - health: avg_grade per competency_code from v_fleet_competency_health.
 * - recent: first 6 reports from listReports().
 *
 * Throws on Supabase error (matches the existing queries.ts style).
 * Returns zero-counts / empty arrays if views return no rows.
 */
export async function getDashboardData(): Promise<DashboardData> {
  const supabase = await createClient()

  // Active-only fleet health, with a graceful fallback to the all-pilot view if the
  // active view isn't deployed yet — keeps the preview working before the prod migration ships.
  const fetchHealth = async (): Promise<{ rows: DashboardData['health']; degraded: boolean }> => {
    const sel = 'competency_code, avg_grade, n_graded'
    type HealthRow = {
      competency_code: string | null
      avg_grade: number | null
      n_graded: number | null
    }
    let rows: HealthRow[]
    let degraded = false
    const active = await supabase
      .from('v_fleet_competency_health_active')
      .select(sel)
      .order('competency_code')
    if (!active.error) {
      rows = active.data as HealthRow[]
    } else {
      // Active view unavailable → fall back to the all-pilot view so the page still
      // renders. This is a DEGRADED state: the dashboard header says "Active fleet"
      // but the numbers (and the per-bar sample sizes) then include inactive pilots.
      // Warn loudly so this can't hide in prod the way it did before (missing migration
      // / dropped view / revoked grant all land here, not just a 42P01 "not deployed").
      console.warn(
        `[dashboard] v_fleet_competency_health_active unavailable (${active.error.code ?? '?'}: ${active.error.message}); ` +
          `falling back to all-pilot v_fleet_competency_health — competency-health figures now include inactive pilots.`
      )
      const base = await supabase
        .from('v_fleet_competency_health')
        .select(sel)
        .order('competency_code')
      if (base.error) throw new Error('getDashboardData: ' + base.error.message)
      rows = base.data as HealthRow[]
      // Surface the degradation to the UI — the console.warn above is invisible to users.
      degraded = true
    }
    return {
      rows: rows
        .filter((r) => r.competency_code != null && r.avg_grade != null)
        .map((r) => ({
          code: r.competency_code as string,
          avg: Number(r.avg_grade),
          n: Number(r.n_graded ?? 0),
        })),
      degraded,
    }
  }

  const [currencyResult, activePilotsResult, health, allReports] = await Promise.all([
    supabase.from('v_pilot_currency').select('qualification_code, alert_bucket, pilot_id'),
    supabase
      .from('pilots')
      .select('id', { count: 'exact', head: true })
      .eq('employment_status', 'active')
      .is('deleted_at', null),
    fetchHealth(),
    listReports(6), // dashboard shows 6 recents — don't fetch the whole history
  ])

  if (currencyResult.error) {
    throw new Error('getDashboardData: ' + currencyResult.error.message)
  }
  // Active-pilot total = denominator for "no record on file". A count error must THROW like
  // the currency error (page renders its explicit "unavailable" state) — falling back to 0
  // silently hid the "⚠ N no record on file" safety line during a fault.
  if (activePilotsResult.error) {
    throw new Error('getDashboardData: ' + activePilotsResult.error.message)
  }
  const activePilots = activePilotsResult.count ?? 0

  // Aggregate currency counts by qualification code and alert_bucket.
  const medical = emptyCurrency()
  const ir = emptyCurrency()
  const proficiency = emptyCurrency()
  // Distinct pilots that HAVE a record per track → lets us derive "no record on file".
  const medicalPilots = new Set<string>()
  const irPilots = new Set<string>()
  const profPilots = new Set<string>()

  for (const row of currencyResult.data ?? []) {
    const bucket = row.alert_bucket as string | null
    const code = row.qualification_code as string | null
    const pid = row.pilot_id as string | null
    if (!bucket || !code) continue

    let target: CurrencyKind | null = null
    let seen: Set<string> | null = null
    if (code === 'MEDICAL') {
      target = medical
      seen = medicalPilots
    } else if (code === 'INSTRUMENT_RATING') {
      target = ir
      seen = irPilots
    } else if (code === 'PROFICIENCY') {
      target = proficiency
      seen = profPilots
    }

    if (!target) continue
    if (pid && seen) seen.add(pid)
    if (bucket === 'expired') target.expired += 1
    else if (bucket === 'expiring') target.expiring += 1
    else if (bucket === 'valid') target.valid += 1
  }

  // No record on file = active pilots minus those with at least one record on the track.
  medical.noRecord = Math.max(0, activePilots - medicalPilots.size)
  ir.noRecord = Math.max(0, activePilots - irPilots.size)
  proficiency.noRecord = Math.max(0, activePilots - profPilots.size)

  const recent = allReports

  return {
    currency: { medical, ir, proficiency },
    health: health.rows,
    healthDegraded: health.degraded,
    recent,
  }
}
