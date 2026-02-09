/**
 * Quick Action Cards
 * Developer: Maurice Rondeau
 *
 * Vertical stack of 3 primary action cards for the dashboard.
 * Replaces the old 2x2 grid with larger, more descriptive cards.
 * Designed for the Video Buddy-inspired dashboard redesign (Phase 2).
 */

import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Plus, ClipboardCheck, FileBarChart, FileCheck } from 'lucide-react'

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
    <Card className="h-full p-4">
      <h3 className="text-muted-foreground mb-3 text-xs font-medium tracking-wider uppercase">
        Quick Actions
      </h3>
      <div className="flex flex-col gap-2">
        {actions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="group border-border flex items-center gap-3 rounded-xl border p-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-glow-accent)]"
            aria-label={`${action.title}: ${action.description}`}
          >
            <div className="bg-primary/10 group-hover:bg-primary/15 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg transition-colors">
              <action.icon className="text-primary h-5 w-5" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-foreground text-sm font-medium">{action.title}</h4>
              <p className="text-muted-foreground text-xs">{action.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </Card>
  )
}
