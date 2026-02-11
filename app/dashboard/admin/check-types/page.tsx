/**
 * Check Types Management Page
 * Manage certification check types, categories, and reminder settings
 *
 * Developer: Maurice Rondeau
 */

import { dashboardMetadata } from '@/lib/utils/metadata'
import { Card } from '@/components/ui/card'

export const metadata = dashboardMetadata.adminCheckTypes
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { getCheckTypes, getCheckTypeCategories } from '@/lib/services/admin-service'
import { ClipboardList, Tag, CheckCircle2, Calendar, Lightbulb } from 'lucide-react'
import { CheckTypesTable } from '@/components/admin/check-types-table'

export default async function CheckTypesPage() {
  const [checkTypes, categories] = await Promise.all([getCheckTypes(), getCheckTypeCategories()])

  // Calculate stats - compute once before render for React Compiler compliance
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const recentlyUpdatedCount = checkTypes.filter(
    (ct) => new Date(ct.updated_at) > thirtyDaysAgo
  ).length

  const stats = categories.map((category) => ({
    category,
    count: checkTypes.filter((ct) => ct.category === category).length,
  }))

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-foreground text-xl font-semibold tracking-tight lg:text-2xl">
            Check Types Management
          </h2>
          <p className="text-muted-foreground mt-1">
            Manage certification check types and categories
          </p>
        </div>
        <Link href="/dashboard/admin">
          <Button variant="outline">← Back to Admin</Button>
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <Card className="border-primary/20 bg-primary/5 p-6">
          <div className="flex items-center space-x-3">
            <ClipboardList className="text-primary h-8 w-8" aria-hidden="true" />
            <div>
              <p className="text-foreground text-2xl font-bold">{checkTypes.length}</p>
              <p className="text-muted-foreground text-sm font-medium">Total Check Types</p>
            </div>
          </div>
        </Card>
        <Card className="border-primary/20 bg-primary/5 p-6">
          <div className="flex items-center space-x-3">
            <Tag className="text-primary h-8 w-8" aria-hidden="true" />
            <div>
              <p className="text-foreground text-2xl font-bold">{categories.length}</p>
              <p className="text-muted-foreground text-sm font-medium">Categories</p>
            </div>
          </div>
        </Card>
        <Card className="border-[var(--color-success-500)]/20 bg-[var(--color-success-muted)] p-6">
          <div className="flex items-center space-x-3">
            <CheckCircle2 className="h-8 w-8 text-[var(--color-success-500)]" aria-hidden="true" />
            <div>
              <p className="text-foreground text-2xl font-bold">{checkTypes.length}</p>
              <p className="text-muted-foreground text-sm font-medium">Active Types</p>
            </div>
          </div>
        </Card>
        <Card className="border-[var(--color-badge-orange)]/20 bg-[var(--color-badge-orange-bg)] p-6">
          <div className="flex items-center space-x-3">
            <Calendar className="h-8 w-8 text-[var(--color-badge-orange)]" aria-hidden="true" />
            <div>
              <p className="text-foreground text-2xl font-bold">{recentlyUpdatedCount}</p>
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
        </div>

        <CheckTypesTable checkTypes={checkTypes} />

        <div className="text-muted-foreground mt-4 text-sm">
          Showing {checkTypes.length} check types
        </div>
      </Card>

      {/* Help Text */}
      <Card className="border-[var(--color-info)]/20 bg-[var(--color-info-bg)] p-4">
        <div className="flex items-start space-x-3">
          <Lightbulb
            className="h-6 w-6 flex-shrink-0 text-[var(--color-info)]"
            aria-hidden="true"
          />
          <div className="space-y-1">
            <p className="text-foreground text-sm font-medium">About Check Types</p>
            <ul className="text-muted-foreground list-inside list-disc space-y-1 text-sm">
              <li>Check types define the different certification requirements for pilots</li>
              <li>Each check type has a code (e.g., PC, OPC, LPC) and descriptive name</li>
              <li>
                Categories help organize check types by their purpose or regulatory requirement
              </li>
              <li>
                Use the Reminders button to configure email notification schedules per check type
              </li>
              <li>Changes to check types affect all certifications using that type</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  )
}
