/**
 * Pilots Page
 * List and manage all pilots in the fleet with table and grouped views
 */

import { Suspense } from 'react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { PageHeader } from '@/components/layout/page-header'
import { PilotListSkeleton } from '@/components/skeletons/pilot-list-skeleton'
import { PilotsPageContent } from '@/components/pilots/pilots-page-content'
import { Plus } from 'lucide-react'

export default function PilotsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Pilots"
        description="Manage pilot profiles with sortable table or grouped by rank"
        actions={
          <Button asChild>
            <Link href="/dashboard/pilots/new">
              <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
              Add Pilot
            </Link>
          </Button>
        }
      />

      {/* Pilots Content with Skeleton Loading */}
      <Suspense fallback={<PilotListSkeleton />}>
        <PilotsPageContent />
      </Suspense>
    </div>
  )
}
