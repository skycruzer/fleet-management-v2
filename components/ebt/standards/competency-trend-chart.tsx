'use client'

import { CartesianGrid, Line, LineChart, ReferenceLine, XAxis, YAxis } from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ebt/ui/chart'
import type { TrendChartPoint } from '@/lib/ebt/analytics/queries'

// 9 ICAO competencies → stable colors (chart-1..chart-5 tokens recycled).
const PALETTE = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
  '#7c1d3f',
  '#2563eb',
  '#16a34a',
  '#d97706',
]

export function CompetencyTrendChart({
  points,
  competencies,
}: {
  points: TrendChartPoint[]
  competencies: string[]
}) {
  if (points.length === 0) {
    return (
      <div className="ax-empty" data-testid="trend-empty">
        No assessed EVAL grades to chart yet.
      </div>
    )
  }
  const config: ChartConfig = Object.fromEntries(
    competencies.map((c, i) => [c, { label: c, color: PALETTE[i % PALETTE.length] }])
  )
  // FIX #10: X is the chronological event index (seq), NOT moduleNo — so two sittings of the same
  // module in different cycles render as distinct points instead of collapsing onto one. The tick
  // still LABELS each point by its module number.
  const labelBySeq = new Map(
    points.map((p) => [p.seq, p.moduleNo == null ? '?' : `M${p.moduleNo}`])
  )
  return (
    <>
      <ChartContainer
        config={config}
        className="aspect-[16/9] w-full"
        data-testid="competency-trend-chart"
        role="img"
        aria-label="Per-competency EVAL grades across this pilot's assessments in chronological order; grade 3 is the effective threshold"
      >
        <LineChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="seq"
            tickFormatter={(s) => labelBySeq.get(s as number) ?? ''}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            domain={[1, 5]}
            ticks={[1, 2, 3, 4, 5]}
            tickLine={false}
            axisLine={false}
            width={28}
          />
          <ReferenceLine
            y={3}
            stroke="var(--muted-foreground)"
            strokeDasharray="4 4"
            label={{ value: 'effective', position: 'right', fontSize: 10 }}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          {competencies.map((c, i) => (
            <Line
              key={c}
              type="monotone"
              dataKey={c}
              stroke={PALETTE[i % PALETTE.length]}
              strokeWidth={2}
              dot={{ r: 2 }}
              connectNulls
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ChartContainer>
      {/* Screen-reader data alternative (the heatmap's table pattern). */}
      <table className="sr-only">
        <caption>Per-competency EVAL grades per assessment, chronological</caption>
        <thead>
          <tr>
            <th scope="col">Assessment</th>
            {competencies.map((c) => (
              <th key={c} scope="col">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {points.map((p) => (
            <tr key={p.seq}>
              <th scope="row">{labelBySeq.get(p.seq) ?? '?'}</th>
              {competencies.map((c) => {
                const v = (p as unknown as Record<string, number | null | undefined>)[c]
                return <td key={c}>{v ?? 'not assessed'}</td>
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}
