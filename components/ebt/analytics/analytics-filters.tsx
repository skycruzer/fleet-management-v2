'use client'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { parseFilters, toSearchParams, type AnalyticsWindow } from '@/lib/ebt/analytics/filters'

export interface AircraftOption {
  id: string
  code: string
}

export function AnalyticsFilters({
  aircraftOptions,
  rankOptions,
}: {
  aircraftOptions: AircraftOption[]
  rankOptions: string[]
}) {
  const router = useRouter()
  const pathname = usePathname()
  const sp = useSearchParams()
  const current = parseFilters(new URLSearchParams(sp.toString()))

  function update(patch: Partial<typeof current>) {
    const next = { ...current, ...patch }
    const qs = toSearchParams(next).toString()
    router.push(qs ? `${pathname}?${qs}` : pathname)
  }

  return (
    <div className="ax-filters">
      <select
        aria-label="Aircraft"
        value={current.aircraftTypeId ?? ''}
        onChange={(e) => update({ aircraftTypeId: e.target.value || null })}
      >
        <option value="">All aircraft</option>
        {aircraftOptions.map((a) => (
          <option key={a.id} value={a.id}>
            {a.code}
          </option>
        ))}
      </select>
      <select
        aria-label="Rank"
        value={current.rank ?? ''}
        onChange={(e) => update({ rank: e.target.value || null })}
      >
        <option value="">All ranks</option>
        {rankOptions.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>
      <select
        aria-label="Window"
        value={current.window}
        onChange={(e) => update({ window: e.target.value as AnalyticsWindow })}
      >
        <option value="90">Last 90 days</option>
        <option value="180">Last 180 days</option>
        <option value="365">Last 365 days</option>
      </select>
    </div>
  )
}
