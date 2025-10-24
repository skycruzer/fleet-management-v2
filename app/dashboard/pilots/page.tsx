/**
 * Pilots Page
 * List and manage all pilots in the fleet with table and grouped views
 */

import { Suspense } from 'react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { PilotListSkeleton } from '@/components/skeletons'
import { PilotsPageContent } from '@/components/pilots/pilots-page-content'
import { Plus } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default function PilotsPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-foreground text-2xl font-bold">Pilots</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage pilot profiles with sortable table or grouped by rank
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Link href="/dashboard/pilots/new" className="w-full sm:w-auto">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
              Add Pilot
            </Button>
          </Link>
        </div>
      </div>

      {/* Pilots Content with Skeleton Loading */}
      <Suspense fallback={<PilotListSkeleton />}>
        <PilotsPageContent />
      </Suspense>
    </div>
  )
}
