/**
 * Quick Action Cards
 * Developer: Maurice Rondeau
 *
 * Vertical stack of primary action shortcuts for the dashboard.
 */

import Link from 'next/link'
import { Plus, ClipboardCheck, FileBarChart, FileCheck } from 'lucide-react'
import { DashboardCard } from './dashboard-card'

const actions = [
  {
    title: 'Add Pilot',
    description: 'Register a new pilot to the fleet',
    icon: Plus,
    href: '/dashboard/pilots/new',
  },
  {
    title: 'Update Certification',
    description: 'Record a new check or renewal',
    icon: FileCheck,
    href: '/dashboard/certifications/new',
  },
  {
    title: 'Approve Requests',
    description: 'Review pending leave and flight requests',
    icon: ClipboardCheck,
    href: '/dashboard/requests',
  },
  {
    title: 'Generate Report',
    description: 'Create and export fleet reports',
    icon: FileBarChart,
    href: '/dashboard/reports',
  },
] as const

export function QuickActionCards() {
  return (
    <DashboardCard title="Quick Actions">
      <div className="flex flex-col gap-2">
        {actions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="group border-border hover:bg-muted/50 flex items-center gap-3 rounded-xl border p-3 transition-colors"
            aria-label={`${action.title}: ${action.description}`}
          >
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--color-info-bg)] transition-colors group-hover:bg-[var(--color-info)]/15">
              <action.icon className="h-5 w-5 text-[var(--color-info)]" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-foreground text-sm font-medium">{action.title}</h4>
              <p className="text-muted-foreground text-xs">{action.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </DashboardCard>
  )
}
