/**
 * Pilots Page
 * List and manage all pilots in the fleet with table and grouped views
 */

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { getPilotsGroupedByRank } from '@/lib/services/pilot-service'
import { PilotsViewToggle } from '@/components/pilots/pilots-view-toggle'
import { Users, Star, User, CheckCircle, Plus } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function PilotsPage() {
  // Fetch pilots grouped by rank on the server
  const groupedPilots = await getPilotsGroupedByRank()

  // Calculate overall stats
  const allPilots = Object.values(groupedPilots).flat()
  const totalPilots = allPilots.length
  const captains = allPilots.filter((p) => p.role === 'Captain').length
  const firstOfficers = allPilots.filter((p) => p.role === 'First Officer').length
  const activePilots = allPilots.filter((p) => p.is_active).length

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
              <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
              Add Pilot
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <Card className="border-primary/20 bg-primary/5 p-6">
          <div className="flex items-center space-x-3">
            <Users className="h-8 w-8 text-primary" aria-hidden="true" />
            <div>
              <p className="text-foreground text-2xl font-bold">{totalPilots}</p>
              <p className="text-muted-foreground text-sm font-medium">Total Pilots</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center space-x-3">
            <Star className="h-8 w-8 text-yellow-500" aria-hidden="true" />
            <div>
              <p className="text-foreground text-2xl font-bold">{captains}</p>
              <p className="text-muted-foreground text-sm font-medium">Captains</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center space-x-3">
            <User className="h-8 w-8 text-green-600" aria-hidden="true" />
            <div>
              <p className="text-foreground text-2xl font-bold">{firstOfficers}</p>
              <p className="text-muted-foreground text-sm font-medium">First Officers</p>
            </div>
          </div>
        </Card>
        <Card className="border-green-200 bg-green-50 p-6">
          <div className="flex items-center space-x-3">
            <CheckCircle className="h-8 w-8 text-green-600" aria-hidden="true" />
            <div>
              <p className="text-foreground text-2xl font-bold">{activePilots}</p>
              <p className="text-muted-foreground text-sm font-medium">Active</p>
            </div>
          </div>
        </Card>
      </div>

      {/* View Toggle and Content (Client Component) */}
      <PilotsViewToggle groupedPilots={groupedPilots} allPilots={allPilots} />
    </div>
  )
}
