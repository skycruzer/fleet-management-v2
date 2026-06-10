/**
 * Check Types Management Page
 * Manage certification check types and categories
 *
 * Developer: Maurice Rondeau
 */

import { dashboardMetadata } from '@/lib/utils/metadata'
import { Card } from '@/components/ui/card'

export const metadata = dashboardMetadata.adminCheckTypes
import { PageHeader } from '@/components/layout/page-header'
import { getCheckTypes, getCheckTypeCategories } from '@/lib/services/admin-service'
import { CheckTypesTable } from '@/components/admin/check-types-table'

export default async function CheckTypesPage() {
  const [checkTypes, categories] = await Promise.all([getCheckTypes(), getCheckTypeCategories()])

  const stats = categories.map((category) => ({
    category,
    count: checkTypes.filter((ct) => ct.category === category).length,
  }))

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Check Types Management"
        description="Manage certification check types and categories"
        breadcrumbs={[{ label: 'Admin', href: '/dashboard/admin' }, { label: 'Check Types' }]}
      />

      {/* Quick Stats */}
      <p className="text-muted-foreground text-sm">
        {checkTypes.length} check types across {categories.length} categories
      </p>

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
        </div>

        <CheckTypesTable checkTypes={checkTypes} />

        <div className="text-muted-foreground mt-4 text-sm">
          Showing {checkTypes.length} check types
        </div>
      </Card>
    </div>
  )
}
