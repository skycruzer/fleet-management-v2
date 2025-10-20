/**
 * Check Types Management Page
 * Manage certification check types and categories
 */

export const dynamic = 'force-dynamic'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { getCheckTypes, getCheckTypeCategories } from '@/lib/services/admin-service'
import { format } from 'date-fns'

export default async function CheckTypesPage() {
  const [checkTypes, categories] = await Promise.all([getCheckTypes(), getCheckTypeCategories()])

  // Calculate stats
  const stats = categories.map((category) => ({
    category,
    count: checkTypes.filter((ct) => ct.category === category).length,
  }))

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-foreground text-2xl font-bold">Check Types Management</h2>
          <p className="text-muted-foreground mt-1">
            Manage certification check types and categories
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Link href="/dashboard/admin">
            <Button variant="outline">← Back to Admin</Button>
          </Link>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
            Add Check Type
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <Card className="border-primary/20 bg-primary/5 p-6">
          <div className="flex items-center space-x-3">
            <span className="text-3xl">📋</span>
            <div>
              <p className="text-foreground text-2xl font-bold">{checkTypes.length}</p>
              <p className="text-muted-foreground text-sm font-medium">Total Check Types</p>
            </div>
          </div>
        </Card>
        <Card className="border-purple-200 bg-purple-50 p-6">
          <div className="flex items-center space-x-3">
            <span className="text-3xl">🏷️</span>
            <div>
              <p className="text-foreground text-2xl font-bold">{categories.length}</p>
              <p className="text-muted-foreground text-sm font-medium">Categories</p>
            </div>
          </div>
        </Card>
        <Card className="border-green-200 bg-green-50 p-6">
          <div className="flex items-center space-x-3">
            <span className="text-3xl">✅</span>
            <div>
              <p className="text-foreground text-2xl font-bold">{checkTypes.length}</p>
              <p className="text-muted-foreground text-sm font-medium">Active Types</p>
            </div>
          </div>
        </Card>
        <Card className="border-orange-200 bg-orange-50 p-6">
          <div className="flex items-center space-x-3">
            <span className="text-3xl">📅</span>
            <div>
              <p className="text-foreground text-2xl font-bold">
                {
                  checkTypes.filter(
                    (ct) =>
                      new Date(ct.updated_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                  ).length
                }
              </p>
              <p className="text-muted-foreground text-sm font-medium">Updated (30d)</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Category Breakdown */}
      <Card className="p-6">
        <h3 className="text-foreground mb-4 text-lg font-semibold">Category Breakdown</h3>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.category} className="bg-muted/50 p-4">
              <p className="text-foreground text-2xl font-bold">{stat.count}</p>
              <p className="text-muted-foreground mt-1 text-sm font-medium">{stat.category}</p>
            </Card>
          ))}
        </div>
      </Card>

      {/* Check Types Table */}
      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-foreground text-lg font-semibold">All Check Types</h3>
          <div className="flex items-center space-x-2">
            <select className="border-border rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none">
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <Button variant="outline" size="sm">
              Filter
            </Button>
          </div>
        </div>

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
                  Status
                </th>
                <th className="text-muted-foreground px-4 py-3 text-left text-xs font-medium tracking-wider uppercase">
                  Updated
                </th>
                <th className="text-muted-foreground px-4 py-3 text-left text-xs font-medium tracking-wider uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-border divide-y">
              {checkTypes.map((checkType) => (
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
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                      ACTIVE
                    </span>
                  </td>
                  <td className="text-muted-foreground px-4 py-4 text-sm whitespace-nowrap">
                    {format(new Date(checkType.updated_at), 'MMM dd, yyyy')}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="hover:bg-primary hover:text-primary-foreground"
                      >
                        Edit
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="text-muted-foreground mt-4 text-sm">
          Showing {checkTypes.length} check types
        </div>
      </Card>

      {/* Help Text */}
      <Card className="border-blue-200 bg-blue-50 p-4">
        <div className="flex items-start space-x-3">
          <span className="text-2xl">💡</span>
          <div className="space-y-1">
            <p className="text-foreground text-sm font-medium">About Check Types</p>
            <ul className="text-muted-foreground list-inside list-disc space-y-1 text-sm">
              <li>Check types define the different certification requirements for pilots</li>
              <li>Each check type has a code (e.g., PC, OPC, LPC) and descriptive name</li>
              <li>
                Categories help organize check types by their purpose or regulatory requirement
              </li>
              <li>Check types can be marked inactive if no longer in use</li>
              <li>Changes to check types affect all certifications using that type</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  )
}
