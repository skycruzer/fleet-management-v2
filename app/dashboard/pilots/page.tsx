/**
 * Pilots Page
 * List and manage all pilots in the fleet with table and grouped views
 */

import { Suspense } from 'react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { PilotListSkeleton } from '@/components/skeletons/pilot-list-skeleton'
import { PilotsPageContent } from '@/components/pilots/pilots-page-content'
import { Plus } from 'lucide-react'

export default function PilotsPage() {
  return (
    <div className="space-y-6">
      {/* Page Header - Linear-inspired: compact, clean */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-foreground text-xl font-semibold tracking-tight lg:text-2xl">
            Pilots
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage pilot profiles with sortable table or grouped by rank
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button asChild className="w-full sm:w-auto">
            <Link href="/dashboard/pilots/new">
              <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
              Add Pilot
            </Link>
          </Button>
        </div>
      </div>

      {/* Pilots Content with Skeleton Loading */}
      <Suspense fallback={<PilotListSkeleton />}>
        <PilotsPageContent />
      </Suspense>
    </div>
  )
}
