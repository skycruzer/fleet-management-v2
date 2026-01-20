import { Card } from '@/components/ui/card'
import { getPilotsGroupedByRank } from '@/lib/services/pilot-service'
import { PilotsViewToggle } from '@/components/pilots/pilots-view-toggle'
import { Users, Star, User, CheckCircle } from 'lucide-react'

export async function PilotsPageContent() {
  // Fetch pilots grouped by rank on the server
  const groupedPilots = await getPilotsGroupedByRank()

  // Calculate overall stats
  const allPilots = Object.values(groupedPilots).flat()
  const totalPilots = allPilots.length
  const captains = allPilots.filter((p) => p.role === 'Captain').length
  const firstOfficers = allPilots.filter((p) => p.role === 'First Officer').length
  const activePilots = allPilots.filter((p) => p.is_active).length

  return (
    <>
      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <Card className="border-primary/20 bg-primary/5 dark:border-primary/30 dark:bg-primary/10 p-6">
          <div className="flex items-center space-x-3">
            <Users className="text-primary h-8 w-8" aria-hidden="true" />
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
            <User className="h-8 w-8 text-[var(--color-status-low)]" aria-hidden="true" />
            <div>
              <p className="text-foreground text-2xl font-bold">{firstOfficers}</p>
              <p className="text-muted-foreground text-sm font-medium">First Officers</p>
            </div>
          </div>
        </Card>
        <Card className="border-[var(--color-status-low-border)] bg-[var(--color-status-low-bg)] p-6">
          <div className="flex items-center space-x-3">
            <CheckCircle className="h-8 w-8 text-[var(--color-status-low)]" aria-hidden="true" />
            <div>
              <p className="text-foreground text-2xl font-bold">{activePilots}</p>
              <p className="text-muted-foreground text-sm font-medium">Active</p>
            </div>
          </div>
        </Card>
      </div>

      {/* View Toggle and Content (Client Component) */}
      <PilotsViewToggle groupedPilots={groupedPilots} allPilots={allPilots} />
    </>
  )
}
