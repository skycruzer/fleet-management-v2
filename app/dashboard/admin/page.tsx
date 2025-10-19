/**
 * Admin Settings Page
 * System configuration and administrative settings
 */

export const dynamic = 'force-dynamic'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import {
  getAdminStats,
  getAdminUsers,
  getCheckTypes,
  getSystemSettings,
  getContractTypes,
  getCheckTypeCategories,
} from '@/lib/services/admin-service'
import { format } from 'date-fns'

export default async function AdminPage() {
  // Fetch all data in parallel
  const [stats, users, checkTypes, settings, contractTypes, categories] = await Promise.all([
    getAdminStats(),
    getAdminUsers(),
    getCheckTypes(),
    getSystemSettings(),
    getContractTypes(),
    getCheckTypeCategories(),
  ])

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-foreground text-2xl font-bold">Admin Settings</h2>
          <p className="text-muted-foreground mt-1">System configuration and user management</p>
        </div>
        <Link href="/dashboard/admin/users/new">
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
            Add User
          </Button>
        </Link>
      </div>

      {/* System Status Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <Card className="border-green-200 bg-green-50 p-6">
          <div className="flex items-center space-x-3">
            <span className="text-3xl">✅</span>
            <div>
              <p className="text-muted-foreground text-sm font-medium">System Status</p>
              <p className="text-foreground mt-1 text-lg font-bold">All Systems Operational</p>
            </div>
          </div>
        </Card>

        <Card className="border-primary/20 bg-primary/5 p-6">
          <div className="flex items-center space-x-3">
            <span className="text-3xl">👥</span>
            <div>
              <p className="text-muted-foreground text-sm font-medium">Active Users</p>
              <p className="text-foreground mt-1 text-lg font-bold">
                {stats.totalAdmins + stats.totalManagers} Admin, {stats.totalPilots} Pilots
              </p>
            </div>
          </div>
        </Card>

        <Card className="border-purple-200 bg-purple-50 p-6">
          <div className="flex items-center space-x-3">
            <span className="text-3xl">📋</span>
            <div>
              <p className="text-muted-foreground text-sm font-medium">Check Types</p>
              <p className="text-foreground mt-1 text-lg font-bold">
                {stats.totalCheckTypes} Types
              </p>
            </div>
          </div>
        </Card>

        <Card className="border-orange-200 bg-orange-50 p-6">
          <div className="flex items-center space-x-3">
            <span className="text-3xl">📊</span>
            <div>
              <p className="text-muted-foreground text-sm font-medium">Total Records</p>
              <p className="text-foreground mt-1 text-lg font-bold">
                {stats.totalCertifications} Certs
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Admin Users Section */}
      <Card className="p-6">
        <h3 className="text-foreground mb-4 text-lg font-semibold">Admin & Manager Users</h3>
        <div className="overflow-x-auto">
          <table className="divide-border min-w-full divide-y">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-muted-foreground px-4 py-3 text-left text-xs font-medium tracking-wider uppercase">
                  Name
                </th>
                <th className="text-muted-foreground px-4 py-3 text-left text-xs font-medium tracking-wider uppercase">
                  Email
                </th>
                <th className="text-muted-foreground px-4 py-3 text-left text-xs font-medium tracking-wider uppercase">
                  Role
                </th>
                <th className="text-muted-foreground px-4 py-3 text-left text-xs font-medium tracking-wider uppercase">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="divide-border divide-y">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-muted/50">
                  <td className="text-foreground px-4 py-4 text-sm font-medium whitespace-nowrap">
                    {user.name}
                  </td>
                  <td className="text-muted-foreground px-4 py-4 text-sm whitespace-nowrap">
                    {user.email}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        user.role === 'admin'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-primary/10 text-primary'
                      }`}
                    >
                      {user.role.toUpperCase()}
                    </span>
                  </td>
                  <td className="text-muted-foreground px-4 py-4 text-sm whitespace-nowrap">
                    {user.created_at ? format(new Date(user.created_at), 'MMM dd, yyyy') : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="text-muted-foreground mt-4 text-sm">Showing {users.length} users</div>
      </Card>

      {/* Check Types by Category */}
      <Card className="p-6">
        <h3 className="text-foreground mb-4 text-lg font-semibold">
          Check Types Configuration ({checkTypes.length} total)
        </h3>

        {/* Category Stats */}
        <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          {categories.map((category) => {
            const count = checkTypes.filter((ct) => ct.category === category).length
            return (
              <Card key={category} className="bg-muted/50 p-4">
                <p className="text-muted-foreground text-sm font-medium">{category}</p>
                <p className="text-foreground mt-1 text-2xl font-bold">{count}</p>
              </Card>
            )
          })}
        </div>

        {/* Check Types Table */}
        <div className="overflow-x-auto">
          <table className="divide-border min-w-full divide-y">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-muted-foreground px-4 py-3 text-left text-xs font-medium tracking-wider uppercase">
                  Code
                </th>
                <th className="text-muted-foreground px-4 py-3 text-left text-xs font-medium tracking-wider uppercase">
                  Description
                </th>
                <th className="text-muted-foreground px-4 py-3 text-left text-xs font-medium tracking-wider uppercase">
                  Category
                </th>
                <th className="text-muted-foreground px-4 py-3 text-left text-xs font-medium tracking-wider uppercase">
                  Updated
                </th>
              </tr>
            </thead>
            <tbody className="divide-border divide-y">
              {checkTypes.slice(0, 15).map((checkType) => (
                <tr key={checkType.id} className="hover:bg-muted/50">
                  <td className="text-foreground px-4 py-4 text-sm font-medium whitespace-nowrap">
                    {checkType.check_code}
                  </td>
                  <td className="text-foreground px-4 py-4 text-sm">
                    {checkType.check_description}
                  </td>
                  <td className="text-muted-foreground px-4 py-4 text-sm whitespace-nowrap">
                    {checkType.category || 'N/A'}
                  </td>
                  <td className="text-muted-foreground px-4 py-4 text-sm whitespace-nowrap">
                    {format(new Date(checkType.updated_at), 'MMM dd, yyyy')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="text-muted-foreground mt-4 text-sm">
          Showing {Math.min(15, checkTypes.length)} of {checkTypes.length} check types
        </div>
      </Card>

      {/* System Settings */}
      <Card className="p-6">
        <h3 className="text-foreground mb-4 text-lg font-semibold">System Settings</h3>
        <div className="space-y-4">
          {settings.map((setting) => (
            <Card key={setting.id} className="bg-muted/50 p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-foreground text-sm font-medium">{setting.key}</p>
                  {setting.description && (
                    <p className="text-muted-foreground mt-1 text-sm">{setting.description}</p>
                  )}
                  <div className="mt-2">
                    <pre className="border-border bg-muted text-card-foreground overflow-x-auto rounded border p-2 text-xs">
                      {JSON.stringify(setting.value, null, 2)}
                    </pre>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="ml-4">
                  Edit
                </Button>
              </div>
            </Card>
          ))}
        </div>
        {settings.length === 0 && (
          <p className="text-muted-foreground py-8 text-center">No system settings configured</p>
        )}
      </Card>

      {/* Contract Types */}
      <Card className="p-6">
        <h3 className="text-foreground mb-4 text-lg font-semibold">Contract Types</h3>
        <div className="overflow-x-auto">
          <table className="divide-border min-w-full divide-y">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-muted-foreground px-4 py-3 text-left text-xs font-medium tracking-wider uppercase">
                  Name
                </th>
                <th className="text-muted-foreground px-4 py-3 text-left text-xs font-medium tracking-wider uppercase">
                  Description
                </th>
                <th className="text-muted-foreground px-4 py-3 text-left text-xs font-medium tracking-wider uppercase">
                  Status
                </th>
                <th className="text-muted-foreground px-4 py-3 text-left text-xs font-medium tracking-wider uppercase">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="divide-border divide-y">
              {contractTypes.map((contract) => (
                <tr key={contract.id} className="hover:bg-muted/50">
                  <td className="text-foreground px-4 py-4 text-sm font-medium whitespace-nowrap">
                    {contract.name}
                  </td>
                  <td className="text-muted-foreground px-4 py-4 text-sm">
                    {contract.description || 'N/A'}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        contract.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-muted text-foreground'
                      }`}
                    >
                      {contract.is_active ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </td>
                  <td className="text-muted-foreground px-4 py-4 text-sm whitespace-nowrap">
                    {format(new Date(contract.created_at), 'MMM dd, yyyy')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="text-muted-foreground mt-4 text-sm">
          Showing {contractTypes.length} contract types
        </div>
      </Card>

      {/* Quick Actions */}
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-6">
        <h3 className="text-foreground mb-4 text-lg font-semibold">Quick Actions</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Button variant="outline" className="flex h-auto flex-col items-start py-4">
            <span className="mb-2 text-2xl">👤</span>
            <span className="font-semibold">Add New User</span>
            <span className="text-muted-foreground text-xs">Create admin or manager account</span>
          </Button>
          <Button variant="outline" className="flex h-auto flex-col items-start py-4">
            <span className="mb-2 text-2xl">📋</span>
            <span className="font-semibold">Manage Check Types</span>
            <span className="text-muted-foreground text-xs">Add or edit certification types</span>
          </Button>
          <Button variant="outline" className="flex h-auto flex-col items-start py-4">
            <span className="mb-2 text-2xl">⚙️</span>
            <span className="font-semibold">System Settings</span>
            <span className="text-muted-foreground text-xs">Configure system preferences</span>
          </Button>
        </div>
      </Card>
    </div>
  )
}
