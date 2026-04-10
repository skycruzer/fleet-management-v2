/**
 * Pilots Page Content Component
 * Server component that fetches pilot data and renders stats + view toggle
 *
 * Developer: Maurice Rondeau
 */

import { getPilotsGroupedByRank } from '@/lib/services/pilot-service'
import { PilotStatsBar } from '@/components/pilots/pilot-stats-bar'
import { PilotsViewToggle } from '@/components/pilots/pilots-view-toggle'

export async function PilotsPageContent() {
  // Fetch pilots grouped by rank on the server
  const groupedPilots = await getPilotsGroupedByRank()

  // Calculate overall stats
  const allPilots = Object.values(groupedPilots).flat()
  const totalPilots = allPilots.length
  const captains = allPilots.filter((p) => p.role === 'Captain').length
  const firstOfficers = allPilots.filter((p) => p.role === 'First Officer').length
  const activePilots = allPilots.filter((p) => p.is_active).length

  // Extract unique contract types for filter bar
  const contractTypes = [
    ...new Set(allPilots.map((p) => p.contract_type).filter(Boolean)),
  ] as string[]

  return (
    <>
      {/* Stats Bar */}
      <PilotStatsBar
        totalPilots={totalPilots}
        captains={captains}
        firstOfficers={firstOfficers}
        activePilots={activePilots}
      />

      {/* View Toggle and Content (Client Component) */}
      <PilotsViewToggle allPilots={allPilots} contractTypes={contractTypes} />
    </>
  )
}
