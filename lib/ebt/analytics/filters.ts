export type AnalyticsWindow = '90' | '180' | '365'

export interface AnalyticsFilters {
  aircraftTypeId: string | null
  rank: string | null
  window: AnalyticsWindow
}

const DEFAULT_WINDOW: AnalyticsWindow = '180'
const WINDOWS: readonly AnalyticsWindow[] = ['90', '180', '365']

function nonEmpty(v: string | null): string | null {
  const t = (v ?? '').trim()
  return t.length > 0 ? t : null
}

/** Parse URL search params into the canonical filter shape. Invalid window → default. */
export function parseFilters(params: URLSearchParams): AnalyticsFilters {
  const raw = params.get('window')
  const window = (WINDOWS as readonly string[]).includes(raw ?? '')
    ? (raw as AnalyticsWindow)
    : DEFAULT_WINDOW
  return {
    aircraftTypeId: nonEmpty(params.get('aircraft')),
    rank: nonEmpty(params.get('rank')),
    window,
  }
}

/** Serialize filters to URL search params, omitting nulls and the default window. */
export function toSearchParams(f: AnalyticsFilters): URLSearchParams {
  const p = new URLSearchParams()
  if (f.aircraftTypeId) p.set('aircraft', f.aircraftTypeId)
  if (f.rank) p.set('rank', f.rank)
  if (f.window !== DEFAULT_WINDOW) p.set('window', f.window)
  return p
}

/** Postgres interval string for the rolling-window filter on v_fleet_trend_monthly. */
export function windowToInterval(w: AnalyticsWindow): string {
  return `${w} days`
}
