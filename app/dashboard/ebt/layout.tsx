import Link from 'next/link'
import { requireRole } from '@/lib/ebt/auth/roles'
import './ebt.css'

/**
 * EBT Training section layout.
 *
 * Mounted under the fleet admin dashboard, so the fleet sidebar/topbar chrome
 * already wraps this. We only add the EBT sub-navigation and gate the section to
 * users holding an EBT role (examiner/fleet_manager/admin) via requireRole.
 * The global sonner <Toaster/> is mounted by the fleet root layout — not here.
 */

const EBT_TABS = [
  { href: '/dashboard/ebt', label: 'Dashboard' },
  { href: '/dashboard/ebt/pilots', label: 'Pilots' },
  { href: '/dashboard/ebt/reports', label: 'Reports' },
  { href: '/dashboard/ebt/analytics', label: 'Analytics' },
  { href: '/dashboard/ebt/roles', label: 'Roles' },
]

export default async function EbtLayout({ children }: { children: React.ReactNode }) {
  await requireRole('examiner')
  return (
    <div className="ebt-scope space-y-6">
      <nav className="border-border flex flex-wrap gap-1 border-b" aria-label="EBT sections">
        {EBT_TABS.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className="text-muted-foreground hover:text-foreground rounded-md px-3 py-2 text-sm font-medium"
          >
            {tab.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  )
}
