/**
 * Admin Dashboard Page
 * System configuration and user management.
 *
 * Each data section is its own async component behind a Suspense
 * boundary, so the page shell and static actions render immediately
 * and each section streams in independently. A failing section
 * degrades only itself.
 */

import { Suspense } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import {
  Users,
  CheckCircle2,
  FileText,
  Database,
  UserPlus,
  Settings,
  List,
  UserCheck,
  Monitor,
  AlertTriangle,
  HelpCircle,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { dashboardMetadata } from '@/lib/utils/metadata'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Breadcrumb } from '@/components/navigation/breadcrumb'
import {
  getAdminStats,
  getAdminUsers,
  getCheckTypes,
  getContractTypes,
  getCheckTypeCategories,
} from '@/lib/services/admin-service'
import { getCacheHealth } from '@/lib/services/dashboard-service-v4'
import { logError, ErrorSeverity } from '@/lib/error-logger'

export const metadata = dashboardMetadata.admin

type CacheHealth = Awaited<ReturnType<typeof getCacheHealth>>

const SYSTEM_STATUS = {
  healthy: { label: 'Operational', className: 'text-success', Icon: CheckCircle2 },
  degraded: { label: 'Degraded', className: 'text-warning', Icon: AlertTriangle },
  down: { label: 'Down', className: 'text-destructive', Icon: AlertTriangle },
} as const

function resolveSystemStatus(health: CacheHealth | null) {
  if (!health) {
    return { label: 'Unknown', className: 'text-muted-foreground', Icon: HelpCircle }
  }
  return SYSTEM_STATUS[health.overall]
}

/** Log a section fetch failure without crashing the page. */
function logSectionError(operation: string, error: unknown) {
  logError(error instanceof Error ? error : new Error(String(error)), {
    source: 'AdminPage',
    severity: ErrorSeverity.MEDIUM,
    metadata: { operation },
  })
}

// ----------------------------------------------------------------------------
// Shared presentational pieces
// ----------------------------------------------------------------------------

interface StatCardProps {
  label: string
  value: string | number
  sublabel: string
  icon: LucideIcon
  href?: string
}

function StatCard({ label, value, sublabel, icon: Icon, href }: StatCardProps) {
  const card = (
    <Card className="h-full p-6 transition-shadow hover:shadow-[var(--shadow-interactive-hover)]">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <p className="text-muted-foreground text-sm font-medium">{label}</p>
          <p className="text-foreground text-2xl font-bold tabular-nums">{value}</p>
          <p className="text-muted-foreground text-sm">{sublabel}</p>
        </div>
        <div className="bg-muted/30 rounded-lg p-3">
          <Icon className="h-6 w-6 text-[var(--color-info)]" aria-hidden="true" />
        </div>
      </div>
    </Card>
  )

  if (!href) return card
  return (
    <Link
      href={href}
      className="focus-visible:ring-ring block rounded-xl focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
    >
      {card}
    </Link>
  )
}

function SectionCard({ children }: { children: React.ReactNode }) {
  return <Card className="p-6">{children}</Card>
}

function SectionHeading({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h2 className="text-foreground text-lg font-semibold">{title}</h2>
      <p className="text-muted-foreground mt-1 text-sm">{description}</p>
    </div>
  )
}

function Shimmer({ className }: { className: string }) {
  return <div className={`bg-muted animate-shimmer rounded-xl ${className}`} />
}

function StatCardsSkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {[0, 1, 2, 3].map((i) => (
        <Shimmer key={i} className="h-32" />
      ))}
    </div>
  )
}

function TableCardSkeleton() {
  return <Shimmer className="h-64" />
}

// ----------------------------------------------------------------------------
// Async data sections — each streams independently behind <Suspense>
// ----------------------------------------------------------------------------

async function AdminStatusCards() {
  const [statsR, healthR] = await Promise.allSettled([getAdminStats(), getCacheHealth()])

  if (statsR.status === 'rejected') logSectionError('getAdminStats', statsR.reason)
  if (healthR.status === 'rejected') logSectionError('getCacheHealth', healthR.reason)

  const stats = statsR.status === 'fulfilled' ? statsR.value : null
  const health = healthR.status === 'fulfilled' ? healthR.value : null
  const systemStatus = resolveSystemStatus(health)
  const totalUsers = stats ? stats.totalAdmins + stats.totalManagers + stats.totalPilots : 0
  const staffCount = stats ? stats.totalAdmins + stats.totalManagers : 0

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-muted-foreground text-sm font-medium">System Status</p>
            <p className={`text-2xl font-bold ${systemStatus.className}`}>{systemStatus.label}</p>
            {health ? (
              <p className="text-muted-foreground text-sm">
                Cache {health.redis ? 'up' : 'down'} · View{' '}
                {health.materializedView ? 'up' : 'down'}
              </p>
            ) : (
              <p className="text-muted-foreground text-sm">Health check unavailable</p>
            )}
          </div>
          <div className="bg-muted/30 rounded-lg p-3">
            <systemStatus.Icon className={`h-6 w-6 ${systemStatus.className}`} aria-hidden="true" />
          </div>
        </div>
      </Card>

      <StatCard
        label="Active Users"
        value={totalUsers}
        sublabel={`${staffCount} staff, ${stats?.totalPilots ?? 0} pilots`}
        icon={Users}
      />
      <StatCard
        label="Check Types"
        value={stats?.totalCheckTypes ?? 0}
        sublabel="certification types"
        icon={FileText}
        href="/dashboard/admin/check-types"
      />
      <StatCard
        label="Certifications"
        value={stats?.totalCertifications ?? 0}
        sublabel="total records"
        icon={Database}
        href="/dashboard/certifications"
      />
    </div>
  )
}

async function AdminUsersSection() {
  let users: Awaited<ReturnType<typeof getAdminUsers>> = []
  try {
    users = await getAdminUsers()
  } catch (error) {
    logSectionError('getAdminUsers', error)
  }

  return (
    <SectionCard>
      <div className="mb-6 flex items-center justify-between">
        <SectionHeading
          title="Admin & Manager Users"
          description="System administrators and managers"
        />
        <Badge variant="secondary">{users.length} users</Badge>
      </div>

      <Table>
        <TableCaption className="sr-only">Admin and manager user accounts</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-muted-foreground py-8 text-center">
                No admin or manager users found.
              </TableCell>
            </TableRow>
          ) : (
            users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="text-foreground font-medium">{user.name}</TableCell>
                <TableCell className="text-muted-foreground">{user.email}</TableCell>
                <TableCell>
                  <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                    {user.role.toUpperCase()}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {user.created_at ? format(new Date(user.created_at), 'MMM dd, yyyy') : 'N/A'}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </SectionCard>
  )
}

async function AdminCheckTypesSection() {
  let checkTypes: Awaited<ReturnType<typeof getCheckTypes>> = []
  let categories: string[] = []
  const [checkTypesR, categoriesR] = await Promise.allSettled([
    getCheckTypes(),
    getCheckTypeCategories(),
  ])
  if (checkTypesR.status === 'fulfilled') checkTypes = checkTypesR.value
  else logSectionError('getCheckTypes', checkTypesR.reason)
  if (categoriesR.status === 'fulfilled') categories = categoriesR.value
  else logSectionError('getCheckTypeCategories', categoriesR.reason)

  const sorted = [...checkTypes].sort((a, b) => a.check_code.localeCompare(b.check_code))

  return (
    <SectionCard>
      <div className="mb-6 flex items-center justify-between">
        <SectionHeading
          title="Check Types Configuration"
          description="Certification types by category"
        />
        <Badge variant="secondary">{checkTypes.length} types</Badge>
      </div>

      {/* Category stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {categories.map((category) => {
          const count = checkTypes.filter((ct) => ct.category === category).length
          return (
            <Card key={category} className="bg-muted/30 p-4">
              <p className="text-muted-foreground text-sm font-medium">{category}</p>
              <p className="text-foreground mt-2 text-3xl font-bold tabular-nums">{count}</p>
            </Card>
          )
        })}
      </div>

      {/* First 10 by code for stable, readable ordering */}
      <Table>
        <TableCaption className="sr-only">Certification check types, first 10 by code</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Code</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Updated</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-muted-foreground py-8 text-center">
                No check types configured.
              </TableCell>
            </TableRow>
          ) : (
            sorted.slice(0, 10).map((checkType) => (
              <TableRow key={checkType.id}>
                <TableCell className="text-foreground font-medium">
                  {checkType.check_code}
                </TableCell>
                <TableCell className="text-foreground">{checkType.check_description}</TableCell>
                <TableCell className="text-muted-foreground">
                  {checkType.category || 'N/A'}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {format(new Date(checkType.updated_at), 'MMM dd, yyyy')}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {checkTypes.length > 10 && (
        <div className="mt-4 text-center">
          <Link href="/dashboard/admin/check-types">
            <Button variant="outline" size="sm">
              View All {checkTypes.length} Check Types
            </Button>
          </Link>
        </div>
      )}
    </SectionCard>
  )
}

async function AdminContractsSection() {
  let contractTypes: Awaited<ReturnType<typeof getContractTypes>> = []
  try {
    contractTypes = await getContractTypes()
  } catch (error) {
    logSectionError('getContractTypes', error)
  }

  return (
    <SectionCard>
      <div className="mb-6 flex items-center justify-between">
        <SectionHeading title="Contract Types" description="Employment contract types" />
        <Badge variant="secondary">{contractTypes.length} types</Badge>
      </div>

      <Table>
        <TableCaption className="sr-only">Employment contract types</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contractTypes.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-muted-foreground py-8 text-center">
                No contract types found.
              </TableCell>
            </TableRow>
          ) : (
            contractTypes.map((contract) => (
              <TableRow key={contract.id}>
                <TableCell className="text-foreground font-medium">{contract.name}</TableCell>
                <TableCell className="text-muted-foreground">
                  {contract.description || 'N/A'}
                </TableCell>
                <TableCell>
                  <Badge variant={contract.is_active ? 'default' : 'secondary'}>
                    {contract.is_active ? 'ACTIVE' : 'INACTIVE'}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {format(new Date(contract.created_at), 'MMM dd, yyyy')}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </SectionCard>
  )
}

// ----------------------------------------------------------------------------
// Static Quick Actions
// ----------------------------------------------------------------------------

const QUICK_ACTIONS = [
  {
    href: '/dashboard/admin/users/new',
    icon: UserPlus,
    title: 'Add New User',
    description: 'Create admin or manager',
  },
  {
    href: '/dashboard/admin/check-types',
    icon: List,
    title: 'Manage Check Types',
    description: 'Edit certification types',
  },
  {
    href: '/dashboard/admin/settings',
    icon: Settings,
    title: 'System Settings',
    description: 'Configure preferences',
  },
  {
    href: '/dashboard/admin/pilot-registrations',
    icon: UserCheck,
    title: 'Pilot Registrations',
    description: 'Review pending approvals',
  },
  {
    href: '/dashboard/admin/portal-users',
    icon: Monitor,
    title: 'Portal Users',
    description: 'View pilot portal activity',
  },
] as const

function QuickActions() {
  return (
    <SectionCard>
      <h2 className="text-foreground mb-6 text-lg font-semibold">Quick Actions</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {QUICK_ACTIONS.map((action) => (
          <Link key={action.href} href={action.href}>
            <Button variant="outline" className="h-auto w-full justify-start gap-4 p-6 text-left">
              <div className="bg-muted/30 rounded-lg p-3">
                <action.icon className="h-5 w-5 text-[var(--color-info)]" aria-hidden="true" />
              </div>
              <div>
                <p className="font-semibold">{action.title}</p>
                <p className="text-muted-foreground text-sm">{action.description}</p>
              </div>
            </Button>
          </Link>
        ))}
      </div>
    </SectionCard>
  )
}

// ----------------------------------------------------------------------------
// Page
// ----------------------------------------------------------------------------

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <Breadcrumb />

      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-foreground text-2xl font-semibold">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            System configuration and user management
          </p>
        </div>
        <Link href="/dashboard/admin/users/new">
          <Button size="lg" className="gap-2">
            <UserPlus className="h-4 w-4" aria-hidden="true" />
            Add New User
          </Button>
        </Link>
      </div>

      <Suspense fallback={<StatCardsSkeleton />}>
        <AdminStatusCards />
      </Suspense>

      <QuickActions />

      <Suspense fallback={<TableCardSkeleton />}>
        <AdminUsersSection />
      </Suspense>

      <Suspense fallback={<TableCardSkeleton />}>
        <AdminCheckTypesSection />
      </Suspense>

      <Suspense fallback={<TableCardSkeleton />}>
        <AdminContractsSection />
      </Suspense>
    </div>
  )
}
