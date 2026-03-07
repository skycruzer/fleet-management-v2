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
  LabelList,
} from 'recharts'
import { motion, easeOut } from 'framer-motion'

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
    function readColors() {
      const s = getComputedStyle(document.documentElement)
      const get = (name: string, fallback: string) => s.getPropertyValue(name).trim() || fallback
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
    }

    readColors()

    // Re-read on theme change via matchMedia (more performant than MutationObserver)
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      // Small delay to let CSS custom properties update after class toggle
      requestAnimationFrame(readColors)
    }
    mq.addEventListener('change', handleChange)

    // Also watch for manual theme toggle (class attribute change on <html>)
    const observer = new MutationObserver(() => requestAnimationFrame(readColors))
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })

    return () => {
      mq.removeEventListener('change', handleChange)
      observer.disconnect()
    }
  }, [])

  return colors
}

// Custom accessible tooltip component
// Chart animation variants
const chartVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

// Chart animation transition
const chartTransition = {
  duration: 0.5,
  ease: easeOut,
}

function AccessibleTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-background border-border rounded-lg border p-3 shadow-lg"
        role="tooltip"
        aria-live="polite"
      >
        <p className="text-foreground font-medium">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={`tooltip-${index}`} className="text-muted-foreground text-sm">
            {entry.name}: {entry.value}
          </p>
        ))}
        <span className="sr-only">Chart data point</span>
      </motion.div>
    )
  }
  return null
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
    <motion.div
      role="img"
      aria-label={`Pilot distribution: ${captains} Captains, ${firstOfficers} First Officers, ${inactive} Inactive`}
      initial="hidden"
      animate="visible"
      variants={chartVariants}
      transition={chartTransition}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={[
            { name: 'Captains', count: captains },
            { name: 'First Officers', count: firstOfficers },
            { name: 'Inactive', count: inactive },
          ]}
          margin={{ top: 10, right: 20, left: 10, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
          <XAxis dataKey="name" tick={axisTick} />
          <YAxis tick={axisTick} />
          <Tooltip content={<AccessibleTooltip />} />
          <Bar dataKey="count" fill={colors.chart1} radius={[4, 4, 0, 0]}>
            <LabelList
              dataKey="count"
              position="top"
              className="fill-[var(--color-foreground)] text-xs"
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
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
    <motion.div
      role="img"
      aria-label={`Certification status: ${current} Current, ${expiring} Expiring, ${expired} Expired`}
      initial="hidden"
      animate="visible"
      variants={chartVariants}
      transition={chartTransition}
    >
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
            label
          >
            <Cell fill={colors.chart2} />
            <Cell fill={colors.chart3} />
            <Cell fill="var(--color-destructive)" />
          </Pie>
          <Legend wrapperStyle={{ fontSize: '12px', color: colors.axis }} />
          <Tooltip content={<AccessibleTooltip />} />
        </PieChart>
      </ResponsiveContainer>
    </motion.div>
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
    <motion.div
      role="img"
      aria-label={`Leave type breakdown: ${data.map((t) => `${t.type} (${t.count} requests, ${t.totalDays} days)`).join(', ')}`}
      initial="hidden"
      animate="visible"
      variants={chartVariants}
      transition={chartTransition}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data.map((t) => ({
            name: t.type,
            requests: t.count,
            days: t.totalDays,
          }))}
          margin={{ top: 10, right: 20, left: 10, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
          <XAxis dataKey="name" tick={axisTick} />
          <YAxis tick={axisTick} />
          <Tooltip content={<AccessibleTooltip />} />
          <Legend wrapperStyle={{ fontSize: '12px', color: colors.axis }} />
          <Bar dataKey="requests" fill={colors.chart4} radius={[4, 4, 0, 0]} name="Requests">
            <LabelList
              dataKey="requests"
              position="top"
              className="fill-[var(--color-foreground)] text-xs"
            />
          </Bar>
          <Bar dataKey="days" fill={colors.chart2} radius={[4, 4, 0, 0]} name="Total Days">
            <LabelList
              dataKey="days"
              position="top"
              className="fill-[var(--color-foreground)] text-xs"
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  )
}
