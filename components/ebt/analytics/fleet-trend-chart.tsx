'use client'
import { CartesianGrid, Line, LineChart, ReferenceLine, XAxis, YAxis } from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ebt/ui/chart'
import type { TrendRow } from '@/lib/ebt/analytics/queries'

export interface MonthlyPoint {
  month: string
  avgGrade: number
}

/** Pure: collapse per-competency rows into one VOLUME-WEIGHTED fleet point per month.
 *  Weighting by nGraded matters: an unweighted mean-of-means lets a competency sliced from
 *  1 graded EVAL move the fleet line as much as one backed by 50, systematically misstating
 *  the fleet level/trajectory — and disagreeing with deriveMovers/deriveCompetencyWeakness,
 *  which weight the SAME rows and render on the same page. */
export function toMonthlySeries(rows: TrendRow[]): MonthlyPoint[] {
  const byMonth = new Map<string, { sum: number; n: number }>()
  for (const r of rows) {
    if (r.nGraded <= 0) continue
    const m = byMonth.get(r.month) ?? { sum: 0, n: 0 }
    m.sum += r.avgGrade * r.nGraded
    m.n += r.nGraded
    byMonth.set(r.month, m)
  }
  return [...byMonth.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, agg]) => ({ month, avgGrade: agg.sum / agg.n }))
}

const config: ChartConfig = {
  avgGrade: { label: 'Avg grade', color: 'var(--chart-1)' },
}

export function FleetTrendChart({ rows }: { rows: TrendRow[] }) {
  const data = toMonthlySeries(rows)
  if (data.length === 0) return <div className="ax-empty">No trend data in this window.</div>
  return (
    <>
      <ChartContainer
        config={config}
        className="h-[240px] w-full"
        role="img"
        aria-label="Fleet average EVAL grade per month, weighted by graded volume; grade 3 is the effective threshold"
      >
        <LineChart data={data} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="month"
            tickFormatter={(m: string) => m.slice(0, 7)}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            domain={[1, 5]}
            ticks={[1, 2, 3, 4, 5]}
            width={24}
            tickLine={false}
            axisLine={false}
          />
          <ReferenceLine y={3} strokeDasharray="4 4" stroke="var(--ax-green)" />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Line
            type="monotone"
            dataKey="avgGrade"
            stroke="var(--color-avgGrade)"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ChartContainer>
      {/* Screen-reader data alternative (the heatmap's role=table pattern, applied here). */}
      <table className="sr-only">
        <caption>Fleet average EVAL grade per month</caption>
        <thead>
          <tr>
            <th scope="col">Month</th>
            <th scope="col">Average grade (1–5)</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.month}>
              <td>{d.month.slice(0, 7)}</td>
              <td>{d.avgGrade.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}
