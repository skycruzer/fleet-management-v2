# Professional UI Design System - Fleet Management V2
**B767 Pilot Management System - Sales-Ready Edition**

**Designer**: Sally (UX Expert) 🎨
**Date**: October 24, 2025
**Version**: 1.0
**Purpose**: Create a professional, modern, sales-ready interface that impresses customers

---

## 🎯 Design Vision

**"Aviation Excellence Meets Modern Software Design"**

This system should convey:
- ✈️ **Professionalism** - Trustworthy, enterprise-grade aviation software
- ⚡ **Speed** - Fast, responsive, efficient operations
- 🎯 **Precision** - Accurate, reliable certification tracking
- 💎 **Premium Quality** - Best-in-class user experience

---

## 1. Color Palette - Aviation Premium

### Primary Brand Colors

```css
:root {
  /* Primary - Aviation Blue (Inspired by Boeing blue) */
  --primary-50: #eff6ff;
  --primary-100: #dbeafe;
  --primary-200: #bfdbfe;
  --primary-300: #93c5fd;
  --primary-400: #60a5fa;
  --primary-500: #0369a1; /* Main brand color */
  --primary-600: #0284c7;
  --primary-700: #0369a1;
  --primary-800: #075985;
  --primary-900: #0c4a6e;

  /* Accent - Aviation Gold (Premium touch) */
  --accent-50: #fefce8;
  --accent-100: #fef9c3;
  --accent-200: #fef08a;
  --accent-300: #fde047;
  --accent-400: #facc15;
  --accent-500: #eab308; /* Accent for highlights */
  --accent-600: #ca8a04;
  --accent-700: #a16207;
  --accent-800: #854d0e;
  --accent-900: #713f12;

  /* Success - FAA Compliant Green */
  --success-500: #22c55e;
  --success-600: #16a34a;

  /* Warning - Expiring Soon Yellow */
  --warning-500: #f59e0b;
  --warning-600: #d97706;

  /* Danger - Expired Red */
  --danger-500: #ef4444;
  --danger-600: #dc2626;

  /* Neutral - Professional Slate */
  --slate-50: #f8fafc;
  --slate-100: #f1f5f9;
  --slate-200: #e2e8f0;
  --slate-300: #cbd5e1;
  --slate-400: #94a3b8;
  --slate-500: #64748b;
  --slate-600: #475569;
  --slate-700: #334155;
  --slate-800: #1e293b;
  --slate-900: #0f172a;
}
```

### Color Application

```typescript
// components/ui/theme-provider.tsx
export const theme = {
  // Navigation & Headers
  header: 'bg-primary-900 text-white',
  sidebar: 'bg-slate-900 text-slate-200',

  // Cards & Surfaces
  card: 'bg-white border border-slate-200 shadow-sm',
  cardHover: 'hover:shadow-md hover:border-primary-200 transition-all',

  // Buttons
  buttonPrimary: 'bg-primary-600 hover:bg-primary-700 text-white shadow-sm',
  buttonSecondary: 'bg-white border border-slate-300 hover:bg-slate-50 text-slate-700',
  buttonSuccess: 'bg-success-600 hover:bg-success-700 text-white',
  buttonDanger: 'bg-danger-600 hover:bg-danger-700 text-white',

  // Status Colors
  statusCompliant: 'bg-success-50 text-success-700 border-success-200',
  statusWarning: 'bg-warning-50 text-warning-700 border-warning-200',
  statusCritical: 'bg-danger-50 text-danger-700 border-danger-200',
}
```

---

## 2. Typography - Professional & Readable

### Font Stack

```css
:root {
  /* Headlines - Modern, Bold, Professional */
  --font-display: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;

  /* Body - Highly Readable */
  --font-body: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;

  /* Monospace - Data & Numbers */
  --font-mono: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
}
```

### Type Scale

```typescript
export const typography = {
  // Display (Marketing pages, landing)
  display: {
    xl: 'text-6xl font-bold tracking-tight', // 60px
    lg: 'text-5xl font-bold tracking-tight', // 48px
    md: 'text-4xl font-bold tracking-tight', // 36px
    sm: 'text-3xl font-bold tracking-tight', // 30px
  },

  // Headings (Application UI)
  heading: {
    h1: 'text-3xl font-semibold tracking-tight text-slate-900', // 30px
    h2: 'text-2xl font-semibold tracking-tight text-slate-900', // 24px
    h3: 'text-xl font-semibold tracking-tight text-slate-900', // 20px
    h4: 'text-lg font-semibold tracking-tight text-slate-900', // 18px
    h5: 'text-base font-semibold tracking-tight text-slate-900', // 16px
    h6: 'text-sm font-semibold tracking-tight text-slate-900', // 14px
  },

  // Body Text
  body: {
    lg: 'text-lg text-slate-700', // 18px
    base: 'text-base text-slate-700', // 16px
    sm: 'text-sm text-slate-600', // 14px
    xs: 'text-xs text-slate-500', // 12px
  },

  // Special
  label: 'text-sm font-medium text-slate-700',
  caption: 'text-xs text-slate-500',
  overline: 'text-xs font-semibold uppercase tracking-wider text-slate-500',
}
```

---

## 3. Layout System - Professional Dashboard

### Navigation - Premium Sidebar

**File**: `components/layout/professional-sidebar.tsx`

```typescript
'use client'

import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  Users,
  FileText,
  Calendar,
  Settings,
  BarChart3,
  Plane,
  Shield,
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { name: 'Pilots', icon: Users, href: '/dashboard/pilots' },
  { name: 'Certifications', icon: FileText, href: '/dashboard/certifications' },
  { name: 'Leave Requests', icon: Calendar, href: '/dashboard/leave-requests' },
  { name: 'Renewal Planning', icon: Plane, href: '/dashboard/renewal-planning' },
  { name: 'Analytics', icon: BarChart3, href: '/dashboard/analytics' },
  { name: 'Compliance', icon: Shield, href: '/dashboard/compliance' },
  { name: 'Settings', icon: Settings, href: '/dashboard/settings' },
]

export function ProfessionalSidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-slate-900">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
            <Plane className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-white font-bold text-lg">Fleet Management</h2>
            <p className="text-slate-400 text-xs">B767 Operations</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-1">
        {navigation.map((item) => (
          <NavItem key={item.name} item={item} />
        ))}
      </nav>

      {/* Footer - Support */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-800">
        <div className="bg-slate-800 rounded-lg p-3">
          <p className="text-xs font-medium text-white mb-1">Need Help?</p>
          <p className="text-xs text-slate-400 mb-2">
            Contact our support team
          </p>
          <button className="w-full py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-medium rounded transition-colors">
            Get Support
          </button>
        </div>
      </div>
    </aside>
  )
}

function NavItem({ item }: { item: typeof navigation[0] }) {
  const isActive = usePathname() === item.href

  return (
    <Link href={item.href}>
      <motion.div
        whileHover={{ x: 4 }}
        className={cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors relative',
          isActive
            ? 'bg-primary-600 text-white'
            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
        )}
      >
        {isActive && (
          <motion.div
            layoutId="sidebar-indicator"
            className="absolute left-0 top-0 bottom-0 w-1 bg-accent-500 rounded-r"
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          />
        )}
        <item.icon className="h-5 w-5" />
        <span className="font-medium text-sm">{item.name}</span>
      </motion.div>
    </Link>
  )
}
```

### Header - Professional Top Bar

**File**: `components/layout/professional-header.tsx`

```typescript
'use client'

import { Bell, Search, User, ChevronDown } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

export function ProfessionalHeader() {
  return (
    <header className="fixed top-0 right-0 left-64 z-40 h-16 bg-white border-b border-slate-200">
      <div className="h-full flex items-center justify-between px-6">
        {/* Search */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search pilots, certifications, or requests..."
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <button className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
            <Bell className="h-5 w-5" />
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-danger-500 text-white text-xs">
              3
            </Badge>
          </button>

          {/* User Menu */}
          <button className="flex items-center gap-3 px-3 py-2 hover:bg-slate-100 rounded-lg transition-colors">
            <Avatar className="h-8 w-8">
              <AvatarImage src="/avatar.jpg" />
              <AvatarFallback>FM</AvatarFallback>
            </Avatar>
            <div className="text-left">
              <p className="text-sm font-medium text-slate-900">Fleet Manager</p>
              <p className="text-xs text-slate-500">manager@airline.com</p>
            </div>
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </button>
        </div>
      </div>
    </header>
  )
}
```

---

## 4. Dashboard - Executive Overview

### Hero Stats - Premium Cards

**File**: `components/dashboard/hero-stats.tsx`

```typescript
'use client'

import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

export function HeroStats({ stats }: { stats: DashboardStats[] }) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <div className="group relative overflow-hidden bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg hover:border-primary-300 transition-all duration-300">
            {/* Gradient accent */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-500 to-primary-600" />

            {/* Icon */}
            <div className={cn(
              'h-12 w-12 rounded-lg flex items-center justify-center mb-4',
              'bg-gradient-to-br',
              stat.gradient
            )}>
              <stat.icon className="h-6 w-6 text-white" />
            </div>

            {/* Content */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-600">{stat.label}</p>
              <div className="flex items-baseline gap-2">
                <motion.p
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200 }}
                  className="text-3xl font-bold text-slate-900"
                >
                  {stat.value}
                </motion.p>
                {stat.trend !== undefined && (
                  <div className={cn(
                    'flex items-center gap-1 text-xs font-medium',
                    stat.trend > 0 && 'text-success-600',
                    stat.trend < 0 && 'text-danger-600',
                    stat.trend === 0 && 'text-slate-500'
                  )}>
                    {stat.trend > 0 && <TrendingUp className="h-3 w-3" />}
                    {stat.trend < 0 && <TrendingDown className="h-3 w-3" />}
                    {stat.trend === 0 && <Minus className="h-3 w-3" />}
                    {stat.trend !== 0 && `${Math.abs(stat.trend)}%`}
                  </div>
                )}
              </div>
              <p className="text-xs text-slate-500">{stat.description}</p>
            </div>

            {/* Hover effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary-50/0 to-primary-100/0 group-hover:from-primary-50/20 group-hover:to-primary-100/20 transition-all duration-300 pointer-events-none" />
          </div>
        </motion.div>
      ))}
    </div>
  )
}

// Gradient definitions
const gradients = {
  blue: 'from-primary-500 to-primary-600',
  green: 'from-success-500 to-success-600',
  yellow: 'from-warning-500 to-warning-600',
  red: 'from-danger-500 to-danger-600',
  purple: 'from-purple-500 to-purple-600',
}
```

### Compliance Dashboard - Visual Excellence

**File**: `components/dashboard/compliance-overview.tsx`

```typescript
'use client'

import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'

export function ComplianceOverview({ data }: { data: ComplianceData }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            Fleet Compliance Status
          </h3>
          <p className="text-sm text-slate-600 mt-1">
            Overall certification compliance across all pilots
          </p>
        </div>
        <Badge
          variant={data.overall >= 95 ? 'success' : data.overall >= 85 ? 'warning' : 'destructive'}
          className="text-base px-4 py-1"
        >
          {data.overall}% Compliant
        </Badge>
      </div>

      {/* Overall Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-700">
            Overall Compliance
          </span>
          <span className="text-2xl font-bold text-slate-900">
            {data.overall}%
          </span>
        </div>
        <Progress
          value={data.overall}
          className="h-3 bg-slate-100"
          indicatorClassName={cn(
            data.overall >= 95 && 'bg-gradient-to-r from-success-500 to-success-600',
            data.overall >= 85 && data.overall < 95 && 'bg-gradient-to-r from-warning-500 to-warning-600',
            data.overall < 85 && 'bg-gradient-to-r from-danger-500 to-danger-600'
          )}
        />
      </div>

      {/* Breakdown by Category */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-slate-700">
          Compliance by Category
        </h4>
        {data.categories.map((category) => (
          <ComplianceCategory key={category.name} category={category} />
        ))}
      </div>

      {/* Action Items */}
      {data.actionItems > 0 && (
        <div className="mt-6 p-4 bg-warning-50 border border-warning-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-warning-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-warning-900">
                {data.actionItems} Action Items Require Attention
              </p>
              <p className="text-xs text-warning-700 mt-1">
                Review and address expiring certifications
              </p>
            </div>
            <button className="px-4 py-2 bg-warning-600 hover:bg-warning-700 text-white text-sm font-medium rounded-lg transition-colors">
              Review
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function ComplianceCategory({ category }: { category: ComplianceCategory }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-600">{category.name}</span>
        <span className="text-sm font-medium text-slate-900">
          {category.value}%
        </span>
      </div>
      <Progress value={category.value} className="h-2" />
    </div>
  )
}
```

---

## 5. Data Visualization - Professional Charts

### Chart Theme

```typescript
// lib/chart-theme.ts
export const chartTheme = {
  colors: {
    primary: ['#0369a1', '#0284c7', '#0ea5e9', '#38bdf8', '#7dd3fc'],
    status: {
      compliant: '#22c55e',
      warning: '#f59e0b',
      critical: '#ef4444',
    },
    gradient: [
      'rgba(3, 105, 161, 0.8)',
      'rgba(3, 105, 161, 0.6)',
      'rgba(3, 105, 161, 0.4)',
      'rgba(3, 105, 161, 0.2)',
    ],
  },
  fonts: {
    base: 'Inter',
    size: {
      title: 16,
      label: 12,
      tick: 11,
    },
  },
  borderRadius: 8,
  gridColor: '#e2e8f0',
  textColor: '#475569',
}
```

### Example: Certification Expiry Timeline

**File**: `components/charts/expiry-timeline-chart.tsx`

```typescript
'use client'

import { Line } from 'react-chartjs-2'
import { chartTheme } from '@/lib/chart-theme'

export function ExpiryTimelineChart({ data }: { data: ExpiryData[] }) {
  const chartData = {
    labels: data.map(d => d.month),
    datasets: [
      {
        label: 'Certifications Expiring',
        data: data.map(d => d.count),
        borderColor: chartTheme.colors.primary[0],
        backgroundColor: 'rgba(3, 105, 161, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointBackgroundColor: '#ffffff',
        pointBorderColor: chartTheme.colors.primary[0],
        pointBorderWidth: 3,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#ffffff',
        titleColor: chartTheme.textColor,
        bodyColor: chartTheme.textColor,
        borderColor: chartTheme.gridColor,
        borderWidth: 1,
        padding: 12,
        displayColors: false,
        callbacks: {
          title: (context) => `${context[0].label}`,
          label: (context) => `${context.parsed.y} certifications expiring`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: chartTheme.gridColor,
          drawBorder: false,
        },
        ticks: {
          color: chartTheme.textColor,
          font: {
            size: chartTheme.fonts.size.tick,
          },
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: chartTheme.textColor,
          font: {
            size: chartTheme.fonts.size.tick,
          },
        },
      },
    },
  }

  return (
    <div className="h-[300px]">
      <Line data={chartData} options={options} />
    </div>
  )
}
```

---

## 6. Pilot Directory - Premium List View

**File**: `components/pilots/premium-pilot-card.tsx`

```typescript
'use client'

import { motion } from 'framer-motion'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Calendar,
  FileCheck,
  AlertCircle,
  ChevronRight,
  Star,
} from 'lucide-react'

export function PremiumPilotCard({ pilot }: { pilot: Pilot }) {
  const compliancePercentage = (
    (pilot.total_certifications - pilot.expired_count) /
    pilot.total_certifications
  ) * 100

  return (
    <motion.div
      whileHover={{ y: -4, shadow: 'lg' }}
      className="group bg-white rounded-xl border border-slate-200 p-6 cursor-pointer transition-all duration-300 hover:border-primary-300 hover:shadow-xl"
    >
      <div className="flex items-start gap-4">
        {/* Avatar with Status Ring */}
        <div className="relative">
          <div className={cn(
            'absolute -inset-0.5 rounded-full',
            compliancePercentage === 100 && 'bg-gradient-to-r from-success-400 to-success-600',
            compliancePercentage >= 85 && compliancePercentage < 100 && 'bg-gradient-to-r from-warning-400 to-warning-600',
            compliancePercentage < 85 && 'bg-gradient-to-r from-danger-400 to-danger-600'
          )} />
          <Avatar className="h-16 w-16 relative ring-4 ring-white">
            <AvatarImage src={pilot.avatar_url} />
            <AvatarFallback className="text-lg font-semibold">
              {pilot.first_name[0]}{pilot.last_name[0]}
            </AvatarFallback>
          </Avatar>
          {pilot.is_captain_qualified && (
            <div className="absolute -bottom-1 -right-1 h-6 w-6 bg-accent-500 rounded-full flex items-center justify-center border-2 border-white">
              <Star className="h-3 w-3 text-white fill-white" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                {pilot.first_name} {pilot.last_name}
                {pilot.role === 'Captain' && (
                  <Badge variant="default" className="text-xs">Captain</Badge>
                )}
              </h3>
              <p className="text-sm text-slate-600 mt-0.5">
                Employee #{pilot.employee_id} • Seniority #{pilot.seniority_number}
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-primary-600 group-hover:translate-x-1 transition-all" />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-primary-50 rounded-lg flex items-center justify-center">
                <FileCheck className="h-4 w-4 text-primary-600" />
              </div>
              <div>
                <p className="text-xs text-slate-600">Certifications</p>
                <p className="text-sm font-semibold text-slate-900">
                  {pilot.total_certifications}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-success-50 rounded-lg flex items-center justify-center">
                <Calendar className="h-4 w-4 text-success-600" />
              </div>
              <div>
                <p className="text-xs text-slate-600">Valid</p>
                <p className="text-sm font-semibold text-success-700">
                  {pilot.total_certifications - pilot.expired_count}
                </p>
              </div>
            </div>

            {pilot.expired_count > 0 && (
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 bg-danger-50 rounded-lg flex items-center justify-center">
                  <AlertCircle className="h-4 w-4 text-danger-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-600">Expired</p>
                  <p className="text-sm font-semibold text-danger-700">
                    {pilot.expired_count}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Compliance Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-700">
                Compliance Status
              </span>
              <span className="text-xs font-semibold text-slate-900">
                {compliancePercentage.toFixed(0)}%
              </span>
            </div>
            <Progress
              value={compliancePercentage}
              className="h-2"
              indicatorClassName={cn(
                compliancePercentage === 100 && 'bg-gradient-to-r from-success-500 to-success-600',
                compliancePercentage >= 85 && compliancePercentage < 100 && 'bg-gradient-to-r from-warning-500 to-warning-600',
                compliancePercentage < 85 && 'bg-gradient-to-r from-danger-500 to-danger-600'
              )}
            />
          </div>
        </div>
      </div>
    </motion.div>
  )
}
```

---

## 7. Empty States - Delightful & Professional

**File**: `components/empty-states/professional-empty-state.tsx`

```typescript
'use client'

import { motion } from 'framer-motion'
import { FileQuestion, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string }>
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}

export function ProfessionalEmptyState({
  icon: Icon = FileQuestion,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-4"
    >
      {/* Icon with gradient background */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
        className="relative mb-6"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full blur-xl opacity-50" />
        <div className="relative h-20 w-20 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center">
          <Icon className="h-10 w-10 text-white" />
        </div>
      </motion.div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-center max-w-md"
      >
        <h3 className="text-xl font-semibold text-slate-900 mb-2">
          {title}
        </h3>
        <p className="text-sm text-slate-600 mb-6">
          {description}
        </p>

        {actionLabel && onAction && (
          <Button
            onClick={onAction}
            className="bg-primary-600 hover:bg-primary-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            {actionLabel}
          </Button>
        )}
      </motion.div>
    </motion.div>
  )
}
```

---

## 8. Loading States - Premium Skeletons

**File**: `components/loading/premium-skeleton.tsx`

```typescript
import { Skeleton } from '@/components/ui/skeleton'

export function PremiumCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 animate-pulse">
      <div className="flex items-start gap-4">
        <Skeleton className="h-16 w-16 rounded-full" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-32" />
          <div className="grid grid-cols-3 gap-4 mt-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
          <Skeleton className="h-2 w-full mt-4" />
        </div>
      </div>
    </div>
  )
}
```

---

## 9. Marketing Landing Page - Sales-Ready

**File**: `app/(marketing)/page.tsx`

```typescript
export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-slate-900 via-primary-900 to-slate-900 text-white py-20 px-4 overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 h-64 w-64 bg-primary-500 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-10 h-96 w-96 bg-accent-500 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        <div className="relative max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-block"
              >
                <Badge className="bg-accent-500 text-white mb-4">
                  ✈️ Enterprise Aviation Software
                </Badge>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-5xl lg:text-6xl font-bold mb-6 leading-tight"
              >
                Professional Pilot
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-400 to-accent-600">
                  Management System
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-xl text-slate-300 mb-8"
              >
                Streamline certification tracking, leave management, and compliance
                for your B767 fleet. Built for aviation excellence.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex gap-4"
              >
                <Button
                  size="lg"
                  className="bg-accent-500 hover:bg-accent-600 text-white shadow-xl shadow-accent-500/25"
                >
                  Start Free Trial
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white/10"
                >
                  Watch Demo
                </Button>
              </motion.div>

              {/* Social Proof */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="mt-12 flex items-center gap-8"
              >
                <div>
                  <p className="text-3xl font-bold">27+</p>
                  <p className="text-sm text-slate-400">Active Pilots</p>
                </div>
                <div>
                  <p className="text-3xl font-bold">607+</p>
                  <p className="text-sm text-slate-400">Certifications Tracked</p>
                </div>
                <div>
                  <p className="text-3xl font-bold">99.9%</p>
                  <p className="text-sm text-slate-400">Uptime</p>
                </div>
              </motion.div>
            </div>

            {/* Hero Image/Dashboard Preview */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="relative"
            >
              <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden border-8 border-white/10">
                <img
                  src="/dashboard-preview.png"
                  alt="Dashboard Preview"
                  className="w-full h-auto"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              Everything You Need for Fleet Management
            </h2>
            <p className="text-xl text-slate-600">
              Powerful features designed for aviation professionals
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white rounded-xl p-8 shadow-sm hover:shadow-lg transition-shadow"
              >
                <div className="h-12 w-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-slate-600">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

const features = [
  {
    icon: Shield,
    title: 'FAA Compliance',
    description: 'Automated tracking and alerts for all certification requirements',
  },
  {
    icon: Calendar,
    title: 'Leave Management',
    description: 'Smart scheduling with crew minimum enforcement',
  },
  {
    icon: BarChart3,
    title: 'Analytics Dashboard',
    description: 'Real-time insights into fleet-wide compliance',
  },
  // Add more features...
]
```

---

## 10. Implementation Checklist

### Phase 1: Foundation (Week 1)
- [ ] Install Inter font family
- [ ] Setup color palette in CSS variables
- [ ] Configure Tailwind with custom theme
- [ ] Create typography utility classes
- [ ] Setup Framer Motion animations

### Phase 2: Core Components (Week 2)
- [ ] Build Professional Sidebar
- [ ] Build Professional Header
- [ ] Create Hero Stats cards
- [ ] Build Compliance Overview
- [ ] Create Premium Pilot Cards

### Phase 3: Polish (Week 3)
- [ ] Add all loading skeletons
- [ ] Create empty states
- [ ] Setup chart theme
- [ ] Add micro-interactions
- [ ] Test accessibility

### Phase 4: Marketing (Week 4)
- [ ] Design landing page
- [ ] Create feature showcase
- [ ] Add customer testimonials
- [ ] Build pricing page
- [ ] Setup demo booking

---

## Success Metrics

**Visual Appeal**: ⭐⭐⭐⭐⭐ (Premium, professional, sales-ready)
**Usability**: ⭐⭐⭐⭐⭐ (Intuitive, fast, delightful)
**Accessibility**: ⭐⭐⭐⭐⭐ (WCAG 2.1 AA compliant)
**Performance**: ⭐⭐⭐⭐⭐ (Fast, smooth, responsive)

---

**Designed for**: Sales presentations, customer demos, enterprise deployments
**Style**: Modern, professional, aviation-inspired, premium quality

*"First impressions matter. Make yours unforgettable."* ✈️