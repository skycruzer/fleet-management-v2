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
          <h2 className="text-2xl font-bold text-gray-900">Admin Settings</h2>
          <p className="mt-1 text-gray-600">System configuration and user management</p>
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
              <p className="text-sm font-medium text-gray-600">System Status</p>
              <p className="mt-1 text-lg font-bold text-gray-900">All Systems Operational</p>
            </div>
          </div>
        </Card>

        <Card className="border-primary/20 bg-primary/5 p-6">
          <div className="flex items-center space-x-3">
            <span className="text-3xl">👥</span>
            <div>
              <p className="text-sm font-medium text-gray-600">Active Users</p>
              <p className="mt-1 text-lg font-bold text-gray-900">
                {stats.totalAdmins + stats.totalManagers} Admin, {stats.totalPilots} Pilots
              </p>
            </div>
          </div>
        </Card>

        <Card className="border-purple-200 bg-purple-50 p-6">
          <div className="flex items-center space-x-3">
            <span className="text-3xl">📋</span>
            <div>
              <p className="text-sm font-medium text-gray-600">Check Types</p>
              <p className="mt-1 text-lg font-bold text-gray-900">{stats.totalCheckTypes} Types</p>
            </div>
          </div>
        </Card>

        <Card className="border-orange-200 bg-orange-50 p-6">
          <div className="flex items-center space-x-3">
            <span className="text-3xl">📊</span>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Records</p>
              <p className="mt-1 text-lg font-bold text-gray-900">
                {stats.totalCertifications} Certs
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Admin Users Section */}
      <Card className="bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Admin & Manager Users</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                  Role
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 text-sm font-medium whitespace-nowrap text-gray-900">
                    {user.name}
                  </td>
                  <td className="px-4 py-4 text-sm whitespace-nowrap text-gray-600">
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
                  <td className="px-4 py-4 text-sm whitespace-nowrap text-gray-500">
                    {user.created_at ? format(new Date(user.created_at), 'MMM dd, yyyy') : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 text-sm text-gray-600">Showing {users.length} users</div>
      </Card>

      {/* Check Types by Category */}
      <Card className="bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">
          Check Types Configuration ({checkTypes.length} total)
        </h3>

        {/* Category Stats */}
        <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          {categories.map((category) => {
            const count = checkTypes.filter((ct) => ct.category === category).length
            return (
              <Card key={category} className="bg-gray-50 p-4">
                <p className="text-sm font-medium text-gray-600">{category}</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">{count}</p>
              </Card>
            )
          })}
        </div>

        {/* Check Types Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                  Code
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                  Description
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                  Category
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                  Updated
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {checkTypes.slice(0, 15).map((checkType) => (
                <tr key={checkType.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 text-sm font-medium whitespace-nowrap text-gray-900">
                    {checkType.check_code}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900">{checkType.check_description}</td>
                  <td className="px-4 py-4 text-sm whitespace-nowrap text-gray-600">
                    {checkType.category || 'N/A'}
                  </td>
                  <td className="px-4 py-4 text-sm whitespace-nowrap text-gray-500">
                    {format(new Date(checkType.updated_at), 'MMM dd, yyyy')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 text-sm text-gray-600">
          Showing {Math.min(15, checkTypes.length)} of {checkTypes.length} check types
        </div>
      </Card>

      {/* System Settings */}
      <Card className="bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">System Settings</h3>
        <div className="space-y-4">
          {settings.map((setting) => (
            <Card key={setting.id} className="bg-gray-50 p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{setting.key}</p>
                  {setting.description && (
                    <p className="mt-1 text-sm text-gray-600">{setting.description}</p>
                  )}
                  <div className="mt-2">
                    <pre className="overflow-x-auto rounded border border-gray-200 bg-white p-2 text-xs text-gray-700">
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
          <p className="py-8 text-center text-gray-500">No system settings configured</p>
        )}
      </Card>

      {/* Contract Types */}
      <Card className="bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Contract Types</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                  Description
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {contractTypes.map((contract) => (
                <tr key={contract.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 text-sm font-medium whitespace-nowrap text-gray-900">
                    {contract.name}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600">
                    {contract.description || 'N/A'}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        contract.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {contract.is_active ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm whitespace-nowrap text-gray-500">
                    {format(new Date(contract.created_at), 'MMM dd, yyyy')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 text-sm text-gray-600">
          Showing {contractTypes.length} contract types
        </div>
      </Card>

      {/* Quick Actions */}
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Quick Actions</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Button variant="outline" className="flex h-auto flex-col items-start py-4">
            <span className="mb-2 text-2xl">👤</span>
            <span className="font-semibold">Add New User</span>
            <span className="text-xs text-gray-600">Create admin or manager account</span>
          </Button>
          <Button variant="outline" className="flex h-auto flex-col items-start py-4">
            <span className="mb-2 text-2xl">📋</span>
            <span className="font-semibold">Manage Check Types</span>
            <span className="text-xs text-gray-600">Add or edit certification types</span>
          </Button>
          <Button variant="outline" className="flex h-auto flex-col items-start py-4">
            <span className="mb-2 text-2xl">⚙️</span>
            <span className="font-semibold">System Settings</span>
            <span className="text-xs text-gray-600">Configure system preferences</span>
          </Button>
        </div>
      </Card>
    </div>
  )
}
