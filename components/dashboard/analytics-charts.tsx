/**
 * Analytics Charts Component
 * Recharts-based chart visualizations for the analytics dashboard
 * Dynamically imported to reduce initial bundle size
 * Author: Maurice Rondeau
 * Date: February 2026
 */

'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'

const TOOLTIP_STYLE = {
  backgroundColor: '#1c1c1e',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '8px',
  color: '#e4e4e7',
}

const AXIS_TICK = { fill: '#a1a1aa', fontSize: 11 }

interface PilotRankChartProps {
  captains: number
  firstOfficers: number
  inactive: number
}

export function PilotRankChart({ captains, firstOfficers, inactive }: PilotRankChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={[
          { name: 'Captains', count: captains },
          { name: 'First Officers', count: firstOfficers },
          { name: 'Inactive', count: inactive },
        ]}
        margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
        <XAxis dataKey="name" tick={AXIS_TICK} />
        <YAxis tick={AXIS_TICK} />
        <Tooltip contentStyle={TOOLTIP_STYLE} />
        <Bar dataKey="count" fill="#60a5fa" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

interface CertificationPieChartProps {
  current: number
  expiring: number
  expired: number
}

export function CertificationPieChart({ current, expiring, expired }: CertificationPieChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={[
            { name: 'Current', value: current },
            { name: 'Expiring', value: expiring },
            { name: 'Expired', value: expired },
          ]}
          cx="50%"
          cy="50%"
          innerRadius={40}
          outerRadius={70}
          paddingAngle={3}
          dataKey="value"
        >
          <Cell fill="#34d399" />
          <Cell fill="#fbbf24" />
          <Cell fill="#f87171" />
        </Pie>
        <Legend wrapperStyle={{ fontSize: '11px', color: '#a1a1aa' }} />
        <Tooltip contentStyle={TOOLTIP_STYLE} />
      </PieChart>
    </ResponsiveContainer>
  )
}

interface LeaveTypeChartProps {
  data: Array<{ type: string; count: number; totalDays: number }>
}

export function LeaveTypeChart({ data }: LeaveTypeChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data.map((t) => ({
          name: t.type,
          requests: t.count,
          days: t.totalDays,
        }))}
        margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
        <XAxis dataKey="name" tick={AXIS_TICK} />
        <YAxis tick={AXIS_TICK} />
        <Tooltip contentStyle={TOOLTIP_STYLE} />
        <Legend wrapperStyle={{ fontSize: '11px', color: '#a1a1aa' }} />
        <Bar dataKey="requests" fill="#818cf8" radius={[4, 4, 0, 0]} name="Requests" />
        <Bar dataKey="days" fill="#34d399" radius={[4, 4, 0, 0]} name="Total Days" />
      </BarChart>
    </ResponsiveContainer>
  )
}
