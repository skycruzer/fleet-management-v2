/**
 * Admin Dashboard Page
 * Clean, organized admin interface with better spacing and readability.
 *
 * Resilience: each data source is fetched with Promise.allSettled so a
 * single failing service degrades only its own section, never the page.
 * System Status reflects a live cache-health probe, not a constant.
 */

import { dashboardMetadata } from '@/lib/utils/metadata'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import {
  getAdminStats,
  getAdminUsers,
  getCheckTypes,
  getContractTypes,
  getCheckTypeCategories,
  type AdminStats,
  type AdminUser,
  type CheckType,
  type ContractType,
} from '@/lib/services/admin-service'
import { getCacheHealth } from '@/lib/services/dashboard-service-v4'
import { logError, ErrorSeverity } from '@/lib/error-logger'
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
import { Breadcrumb } from '@/components/navigation/breadcrumb'

export const metadata = dashboardMetadata.admin

const STATS_FALLBACK: AdminStats = {
  totalAdmins: 0,
  totalManagers: 0,
  totalPilots: 0,
  totalCheckTypes: 0,
  totalCertifications: 0,
  totalLeaveRequests: 0,
  systemStatus: 'operational',
}

type CacheHealth = Awaited<ReturnType<typeof getCacheHealth>>

/** Unwrap a settled result, logging rejections and falling back gracefully. */
function settled<T>(result: PromiseSettledResult<T>, fallback: T, operation: string): T {
  if (result.status === 'fulfilled') return result.value
  logError(result.reason instanceof Error ? result.reason : new Error(String(result.reason)), {
    source: 'AdminPage',
    severity: ErrorSeverity.MEDIUM,
    metadata: { operation },
  })
  return fallback
}

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

export default async function AdminPage() {
  // Fetch all data in parallel — allSettled so one failure can't blank the page.
  const [statsR, usersR, checkTypesR, contractTypesR, categoriesR, healthR] =
    await Promise.allSettled([
      getAdminStats(),
      getAdminUsers(),
      getCheckTypes(),
      getContractTypes(),
      getCheckTypeCategories(),
      getCacheHealth(),
    ])

  const stats = settled<AdminStats>(statsR, STATS_FALLBACK, 'getAdminStats')
  const users = settled<AdminUser[]>(usersR, [], 'getAdminUsers')
  const checkTypes = settled<CheckType[]>(checkTypesR, [], 'getCheckTypes')
  const contractTypes = settled<ContractType[]>(contractTypesR, [], 'getContractTypes')
  const categories = settled<string[]>(categoriesR, [], 'getCheckTypeCategories')
  const health = settled<CacheHealth | null>(healthR, null, 'getCacheHealth')

  const systemStatus = resolveSystemStatus(health)
  const sortedCheckTypes = [...checkTypes].sort((a, b) => a.check_code.localeCompare(b.check_code))

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <Breadcrumb />

      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-foreground text-xl font-semibold">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            System configuration and user management
          </p>
        </div>
        <Link href="/dashboard/admin/users/new">
          <Button size="lg" className="gap-2">
            <UserPlus className="h-4 w-4" />
            Add New User
          </Button>
        </Link>
      </div>

      {/* System Status Cards */}
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
              ) : null}
            </div>
            <div className="bg-muted/30 rounded-lg p-3">
              <systemStatus.Icon className={`h-6 w-6 ${systemStatus.className}`} />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-muted-foreground text-sm font-medium">Active Users</p>
              <p className="text-foreground text-2xl font-bold">
                {stats.totalAdmins + stats.totalManagers + stats.totalPilots}
              </p>
              <p className="text-muted-foreground text-sm">
                {stats.totalAdmins + stats.totalManagers} staff, {stats.totalPilots} pilots
              </p>
            </div>
            <div className="bg-muted/30 rounded-lg p-3">
              <Users className="h-6 w-6 text-[var(--color-info)]" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-muted-foreground text-sm font-medium">Check Types</p>
              <p className="text-foreground text-2xl font-bold">{stats.totalCheckTypes}</p>
              <p className="text-muted-foreground text-sm">certification types</p>
            </div>
            <div className="bg-muted/30 rounded-lg p-3">
              <FileText className="h-6 w-6 text-[var(--color-info)]" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-muted-foreground text-sm font-medium">Certifications</p>
              <p className="text-foreground text-2xl font-bold">{stats.totalCertifications}</p>
              <p className="text-muted-foreground text-sm">total records</p>
            </div>
            <div className="bg-muted/30 rounded-lg p-3">
              <Database className="h-6 w-6 text-[var(--color-info)]" />
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="p-6">
        <h2 className="text-foreground mb-6 text-xl font-semibold">Quick Actions</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link href="/dashboard/admin/users/new">
            <Button variant="outline" className="h-auto w-full justify-start gap-4 p-6 text-left">
              <div className="bg-muted/30 rounded-lg p-3">
                <UserPlus className="h-5 w-5 text-[var(--color-info)]" />
              </div>
              <div>
                <p className="font-semibold">Add New User</p>
                <p className="text-muted-foreground text-sm">Create admin or manager</p>
              </div>
            </Button>
          </Link>

          <Link href="/dashboard/admin/check-types">
            <Button variant="outline" className="h-auto w-full justify-start gap-4 p-6 text-left">
              <div className="bg-muted/30 rounded-lg p-3">
                <List className="h-5 w-5 text-[var(--color-info)]" />
              </div>
              <div>
                <p className="font-semibold">Manage Check Types</p>
                <p className="text-muted-foreground text-sm">Edit certification types</p>
              </div>
            </Button>
          </Link>

          <Link href="/dashboard/admin/settings">
            <Button variant="outline" className="h-auto w-full justify-start gap-4 p-6 text-left">
              <div className="bg-muted/30 rounded-lg p-3">
                <Settings className="h-5 w-5 text-[var(--color-info)]" />
              </div>
              <div>
                <p className="font-semibold">System Settings</p>
                <p className="text-muted-foreground text-sm">Configure preferences</p>
              </div>
            </Button>
          </Link>

          <Link href="/dashboard/admin/pilot-registrations">
            <Button variant="outline" className="h-auto w-full justify-start gap-4 p-6 text-left">
              <div className="bg-muted/30 rounded-lg p-3">
                <UserCheck className="h-5 w-5 text-[var(--color-info)]" />
              </div>
              <div>
                <p className="font-semibold">Pilot Registrations</p>
                <p className="text-muted-foreground text-sm">Review pending approvals</p>
              </div>
            </Button>
          </Link>

          <Link href="/dashboard/admin/portal-users">
            <Button variant="outline" className="h-auto w-full justify-start gap-4 p-6 text-left">
              <div className="bg-muted/30 rounded-lg p-3">
                <Monitor className="h-5 w-5 text-[var(--color-info)]" />
              </div>
              <div>
                <p className="font-semibold">Portal Users</p>
                <p className="text-muted-foreground text-sm">View pilot portal activity</p>
              </div>
            </Button>
          </Link>
        </div>
      </Card>

      {/* Admin Users */}
      <Card className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-foreground text-xl font-semibold">Admin & Manager Users</h2>
            <p className="text-muted-foreground mt-1 text-sm">System administrators and managers</p>
          </div>
          <Badge variant="secondary">{users.length} users</Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <caption className="sr-only">Admin and manager user accounts</caption>
            <thead>
              <tr className="border-b text-left">
                <th scope="col" className="text-muted-foreground pb-3 text-sm font-medium">
                  Name
                </th>
                <th scope="col" className="text-muted-foreground pb-3 text-sm font-medium">
                  Email
                </th>
                <th scope="col" className="text-muted-foreground pb-3 text-sm font-medium">
                  Role
                </th>
                <th scope="col" className="text-muted-foreground pb-3 text-sm font-medium">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-muted-foreground py-8 text-center text-sm">
                    No admin or manager users found.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="group hover:bg-muted/50">
                    <td className="text-foreground py-4 text-sm font-medium">{user.name}</td>
                    <td className="text-muted-foreground py-4 text-sm">{user.email}</td>
                    <td className="py-4">
                      <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                        {user.role.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="text-muted-foreground py-4 text-sm">
                      {user.created_at ? format(new Date(user.created_at), 'MMM dd, yyyy') : 'N/A'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Check Types by Category */}
      <Card className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-foreground text-xl font-semibold">Check Types Configuration</h2>
            <p className="text-muted-foreground mt-1 text-sm">Certification types by category</p>
          </div>
          <Badge variant="secondary">{checkTypes.length} types</Badge>
        </div>

        {/* Category Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => {
            const count = checkTypes.filter((ct) => ct.category === category).length
            return (
              <Card key={category} className="bg-muted/30 p-4">
                <p className="text-muted-foreground text-sm font-medium">{category}</p>
                <p className="text-foreground mt-2 text-3xl font-bold">{count}</p>
              </Card>
            )
          })}
        </div>

        {/* Check Types Table — first 10 by code for stable, readable ordering */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <caption className="sr-only">Certification check types, first 10 by code</caption>
            <thead>
              <tr className="border-b text-left">
                <th scope="col" className="text-muted-foreground pb-3 text-sm font-medium">
                  Code
                </th>
                <th scope="col" className="text-muted-foreground pb-3 text-sm font-medium">
                  Description
                </th>
                <th scope="col" className="text-muted-foreground pb-3 text-sm font-medium">
                  Category
                </th>
                <th scope="col" className="text-muted-foreground pb-3 text-sm font-medium">
                  Updated
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {sortedCheckTypes.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-muted-foreground py-8 text-center text-sm">
                    No check types configured.
                  </td>
                </tr>
              ) : (
                sortedCheckTypes.slice(0, 10).map((checkType) => (
                  <tr key={checkType.id} className="group hover:bg-muted/50">
                    <td className="text-foreground py-4 text-sm font-medium">
                      {checkType.check_code}
                    </td>
                    <td className="text-foreground py-4 text-sm">{checkType.check_description}</td>
                    <td className="text-muted-foreground py-4 text-sm">
                      {checkType.category || 'N/A'}
                    </td>
                    <td className="text-muted-foreground py-4 text-sm">
                      {format(new Date(checkType.updated_at), 'MMM dd, yyyy')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {checkTypes.length > 10 && (
          <div className="mt-4 text-center">
            <Link href="/dashboard/admin/check-types">
              <Button variant="outline" size="sm">
                View All {checkTypes.length} Check Types
              </Button>
            </Link>
          </div>
        )}
      </Card>

      {/* Contract Types */}
      <Card className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-foreground text-xl font-semibold">Contract Types</h2>
            <p className="text-muted-foreground mt-1 text-sm">Employment contract types</p>
          </div>
          <Badge variant="secondary">{contractTypes.length} types</Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <caption className="sr-only">Employment contract types</caption>
            <thead>
              <tr className="border-b text-left">
                <th scope="col" className="text-muted-foreground pb-3 text-sm font-medium">
                  Name
                </th>
                <th scope="col" className="text-muted-foreground pb-3 text-sm font-medium">
                  Description
                </th>
                <th scope="col" className="text-muted-foreground pb-3 text-sm font-medium">
                  Status
                </th>
                <th scope="col" className="text-muted-foreground pb-3 text-sm font-medium">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {contractTypes.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-muted-foreground py-8 text-center text-sm">
                    No contract types found.
                  </td>
                </tr>
              ) : (
                contractTypes.map((contract) => (
                  <tr key={contract.id} className="group hover:bg-muted/50">
                    <td className="text-foreground py-4 text-sm font-medium">{contract.name}</td>
                    <td className="text-muted-foreground py-4 text-sm">
                      {contract.description || 'N/A'}
                    </td>
                    <td className="py-4">
                      <Badge variant={contract.is_active ? 'default' : 'secondary'}>
                        {contract.is_active ? 'ACTIVE' : 'INACTIVE'}
                      </Badge>
                    </td>
                    <td className="text-muted-foreground py-4 text-sm">
                      {format(new Date(contract.created_at), 'MMM dd, yyyy')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
