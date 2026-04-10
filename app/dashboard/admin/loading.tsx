/**
 * Admin Page Loading State
 * Skeleton loader for admin/settings page
 */

import { Card } from '@/components/ui/card'
import { CardGridSkeleton } from '@/components/ui/skeleton'

export default function AdminLoading() {
  return (
    <div className="space-y-6">
      {/* Page Header Skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <div className="bg-muted h-8 w-48 animate-pulse rounded"></div>
          <div className="bg-muted mt-2 h-4 w-96 animate-pulse rounded"></div>
        </div>
      </div>

      {/* Admin Sections Grid Skeleton */}
      <CardGridSkeleton count={6} />

      {/* System Info Card Skeleton */}
      <Card className="p-6">
        <div className="bg-muted mb-4 h-6 w-32 animate-pulse rounded"></div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="bg-muted h-4 w-32 animate-pulse rounded"></div>
              <div className="bg-muted h-4 w-48 animate-pulse rounded"></div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
