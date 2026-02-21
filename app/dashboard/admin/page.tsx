/**
 * Admin Dashboard Page
 * Clean, organized admin interface with better spacing and readability
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
} from '@/lib/services/admin-service'
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
} from 'lucide-react'
import { Breadcrumb } from '@/components/navigation/breadcrumb'

export const metadata = dashboardMetadata.admin

export default async function AdminPage() {
  // Fetch all data in parallel
  const [stats, users, checkTypes, contractTypes, categories] = await Promise.all([
    getAdminStats(),
    getAdminUsers(),
    getCheckTypes(),
    getContractTypes(),
    getCheckTypeCategories(),
  ])

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <Breadcrumb />

      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-foreground text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-2">System configuration and user management</p>
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
              <p className="text-foreground text-2xl font-bold">Operational</p>
            </div>
            <div className="bg-muted/30 rounded-lg p-3">
              <CheckCircle2 className="text-success h-6 w-6" />
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
              <Users className="text-primary h-6 w-6" />
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
              <FileText className="text-primary h-6 w-6" />
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
              <Database className="text-primary h-6 w-6" />
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
                <UserPlus className="text-primary h-5 w-5" />
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
                <List className="text-primary h-5 w-5" />
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
                <Settings className="text-primary h-5 w-5" />
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
                <UserCheck className="text-primary h-5 w-5" />
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
                <Monitor className="text-primary h-5 w-5" />
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
            <thead>
              <tr className="border-b text-left">
                <th className="text-muted-foreground pb-3 text-sm font-medium">Name</th>
                <th className="text-muted-foreground pb-3 text-sm font-medium">Email</th>
                <th className="text-muted-foreground pb-3 text-sm font-medium">Role</th>
                <th className="text-muted-foreground pb-3 text-sm font-medium">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {users.map((user) => (
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
              ))}
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

        {/* Check Types Table - Showing first 10 for better readability */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b text-left">
                <th className="text-muted-foreground pb-3 text-sm font-medium">Code</th>
                <th className="text-muted-foreground pb-3 text-sm font-medium">Description</th>
                <th className="text-muted-foreground pb-3 text-sm font-medium">Category</th>
                <th className="text-muted-foreground pb-3 text-sm font-medium">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {checkTypes.slice(0, 10).map((checkType) => (
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
              ))}
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
            <thead>
              <tr className="border-b text-left">
                <th className="text-muted-foreground pb-3 text-sm font-medium">Name</th>
                <th className="text-muted-foreground pb-3 text-sm font-medium">Description</th>
                <th className="text-muted-foreground pb-3 text-sm font-medium">Status</th>
                <th className="text-muted-foreground pb-3 text-sm font-medium">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {contractTypes.map((contract) => (
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
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
