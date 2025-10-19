/**
 * Admin Settings Page
 * System configuration and administrative settings
 */

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
          <p className="text-gray-600 mt-1">System configuration and user management</p>
        </div>
        <Link href="/dashboard/admin/users/new">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">Add User</Button>
        </Link>
      </div>

      {/* System Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6 bg-green-50 border-green-200">
          <div className="flex items-center space-x-3">
            <span className="text-3xl">✅</span>
            <div>
              <p className="text-sm font-medium text-gray-600">System Status</p>
              <p className="text-lg font-bold text-gray-900 mt-1">All Systems Operational</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-blue-50 border-blue-200">
          <div className="flex items-center space-x-3">
            <span className="text-3xl">👥</span>
            <div>
              <p className="text-sm font-medium text-gray-600">Active Users</p>
              <p className="text-lg font-bold text-gray-900 mt-1">
                {stats.totalAdmins + stats.totalManagers} Admin, {stats.totalPilots} Pilots
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-purple-50 border-purple-200">
          <div className="flex items-center space-x-3">
            <span className="text-3xl">📋</span>
            <div>
              <p className="text-sm font-medium text-gray-600">Check Types</p>
              <p className="text-lg font-bold text-gray-900 mt-1">{stats.totalCheckTypes} Types</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-orange-50 border-orange-200">
          <div className="flex items-center space-x-3">
            <span className="text-3xl">📊</span>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Records</p>
              <p className="text-lg font-bold text-gray-900 mt-1">
                {stats.totalCertifications} Certs
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Admin Users Section */}
      <Card className="p-6 bg-white">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Admin & Manager Users</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {user.name}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                    {user.email}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.role === 'admin'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {user.role.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(user.created_at), 'MMM dd, yyyy')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 text-sm text-gray-600">Showing {users.length} users</div>
      </Card>

      {/* Check Types by Category */}
      <Card className="p-6 bg-white">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Check Types Configuration ({checkTypes.length} total)
        </h3>

        {/* Category Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {categories.map((category) => {
            const count = checkTypes.filter((ct) => ct.category === category).length
            return (
              <Card key={category} className="p-4 bg-gray-50">
                <p className="text-sm font-medium text-gray-600">{category}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{count}</p>
              </Card>
            )
          })}
        </div>

        {/* Check Types Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Code
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Updated
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {checkTypes.slice(0, 15).map((checkType) => (
                <tr key={checkType.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {checkType.check_code}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900">{checkType.check_description}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                    {checkType.category || 'N/A'}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
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
      <Card className="p-6 bg-white">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">System Settings</h3>
        <div className="space-y-4">
          {settings.map((setting) => (
            <Card key={setting.id} className="p-4 bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{setting.key}</p>
                  {setting.description && (
                    <p className="text-sm text-gray-600 mt-1">{setting.description}</p>
                  )}
                  <div className="mt-2">
                    <pre className="text-xs text-gray-700 bg-white p-2 rounded border border-gray-200 overflow-x-auto">
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
          <p className="text-center text-gray-500 py-8">No system settings configured</p>
        )}
      </Card>

      {/* Contract Types */}
      <Card className="p-6 bg-white">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Contract Types</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {contractTypes.map((contract) => (
                <tr key={contract.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {contract.name}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600">
                    {contract.description || 'N/A'}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        contract.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {contract.is_active ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(contract.created_at), 'MMM dd, yyyy')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 text-sm text-gray-600">Showing {contractTypes.length} contract types</div>
      </Card>

      {/* Quick Actions */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button variant="outline" className="h-auto py-4 flex flex-col items-start">
            <span className="text-2xl mb-2">👤</span>
            <span className="font-semibold">Add New User</span>
            <span className="text-xs text-gray-600">Create admin or manager account</span>
          </Button>
          <Button variant="outline" className="h-auto py-4 flex flex-col items-start">
            <span className="text-2xl mb-2">📋</span>
            <span className="font-semibold">Manage Check Types</span>
            <span className="text-xs text-gray-600">Add or edit certification types</span>
          </Button>
          <Button variant="outline" className="h-auto py-4 flex flex-col items-start">
            <span className="text-2xl mb-2">⚙️</span>
            <span className="font-semibold">System Settings</span>
            <span className="text-xs text-gray-600">Configure system preferences</span>
          </Button>
        </div>
      </Card>
    </div>
  )
}
