/**
 * Analytics Charts Component
 * Recharts-based chart visualizations for the analytics dashboard
 * Dynamically imported to reduce initial bundle size
 * Author: Maurice Rondeau
 * Date: February 2026
 */

'use client'

import { useEffect, useState } from 'react'
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

function useChartColors() {
  const [colors, setColors] = useState({
    chart1: '#60a5fa',
    chart2: '#34d399',
    chart3: '#fbbf24',
    chart4: '#c084fc',
    chart5: '#22d3ee',
    grid: 'rgba(255,255,255,0.06)',
    axis: '#a1a1aa',
    tooltipBg: '#1c1c1e',
    tooltipText: '#e4e4e7',
    tooltipBorder: 'rgba(255,255,255,0.1)',
  })

  useEffect(() => {
    const root = document.documentElement
    const style = getComputedStyle(root)
    const get = (name: string, fallback: string) => style.getPropertyValue(name).trim() || fallback

    setColors({
      chart1: get('--color-chart-1', '#60a5fa'),
      chart2: get('--color-chart-2', '#34d399'),
      chart3: get('--color-chart-3', '#fbbf24'),
      chart4: get('--color-chart-4', '#c084fc'),
      chart5: get('--color-chart-5', '#22d3ee'),
      grid: get('--color-chart-grid', 'rgba(255,255,255,0.06)'),
      axis: get('--color-chart-axis', '#a1a1aa'),
      tooltipBg: get('--color-chart-tooltip-bg', '#1c1c1e'),
      tooltipText: get('--color-chart-tooltip-text', '#e4e4e7'),
      tooltipBorder: get('--color-chart-tooltip-border', 'rgba(255,255,255,0.1)'),
    })

    // Re-read on theme change
    const observer = new MutationObserver(() => {
      const s = getComputedStyle(document.documentElement)
      setColors({
        chart1: s.getPropertyValue('--color-chart-1').trim() || '#60a5fa',
        chart2: s.getPropertyValue('--color-chart-2').trim() || '#34d399',
        chart3: s.getPropertyValue('--color-chart-3').trim() || '#fbbf24',
        chart4: s.getPropertyValue('--color-chart-4').trim() || '#c084fc',
        chart5: s.getPropertyValue('--color-chart-5').trim() || '#22d3ee',
        grid: s.getPropertyValue('--color-chart-grid').trim() || 'rgba(255,255,255,0.06)',
        axis: s.getPropertyValue('--color-chart-axis').trim() || '#a1a1aa',
        tooltipBg: s.getPropertyValue('--color-chart-tooltip-bg').trim() || '#1c1c1e',
        tooltipText: s.getPropertyValue('--color-chart-tooltip-text').trim() || '#e4e4e7',
        tooltipBorder: s.getPropertyValue('--color-chart-tooltip-border').trim() || 'rgba(255,255,255,0.1)',
      })
    })
    observer.observe(root, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  return colors
}

interface PilotRankChartProps {
  captains: number
  firstOfficers: number
  inactive: number
}

export function PilotRankChart({ captains, firstOfficers, inactive }: PilotRankChartProps) {
  const colors = useChartColors()
  const tooltipStyle = {
    backgroundColor: colors.tooltipBg,
    border: `1px solid ${colors.tooltipBorder}`,
    borderRadius: '8px',
    color: colors.tooltipText,
  }
  const axisTick = { fill: colors.axis, fontSize: 11 }

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
        <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
        <XAxis dataKey="name" tick={axisTick} />
        <YAxis tick={axisTick} />
        <Tooltip contentStyle={tooltipStyle} />
        <Bar dataKey="count" fill={colors.chart1} radius={[4, 4, 0, 0]} />
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
  const colors = useChartColors()
  const tooltipStyle = {
    backgroundColor: colors.tooltipBg,
    border: `1px solid ${colors.tooltipBorder}`,
    borderRadius: '8px',
    color: colors.tooltipText,
  }

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
          <Cell fill={colors.chart2} />
          <Cell fill={colors.chart3} />
          <Cell fill="var(--color-destructive)" />
        </Pie>
        <Legend wrapperStyle={{ fontSize: '11px', color: colors.axis }} />
        <Tooltip contentStyle={tooltipStyle} />
      </PieChart>
    </ResponsiveContainer>
  )
}

interface LeaveTypeChartProps {
  data: Array<{ type: string; count: number; totalDays: number }>
}

export function LeaveTypeChart({ data }: LeaveTypeChartProps) {
  const colors = useChartColors()
  const tooltipStyle = {
    backgroundColor: colors.tooltipBg,
    border: `1px solid ${colors.tooltipBorder}`,
    borderRadius: '8px',
    color: colors.tooltipText,
  }
  const axisTick = { fill: colors.axis, fontSize: 11 }

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
        <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
        <XAxis dataKey="name" tick={axisTick} />
        <YAxis tick={axisTick} />
        <Tooltip contentStyle={tooltipStyle} />
        <Legend wrapperStyle={{ fontSize: '11px', color: colors.axis }} />
        <Bar dataKey="requests" fill={colors.chart4} radius={[4, 4, 0, 0]} name="Requests" />
        <Bar dataKey="days" fill={colors.chart2} radius={[4, 4, 0, 0]} name="Total Days" />
      </BarChart>
    </ResponsiveContainer>
  )
}
