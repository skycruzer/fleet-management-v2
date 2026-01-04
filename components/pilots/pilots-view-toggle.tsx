/**
 * Pilots View Toggle Component
 * Client component for switching between table and grouped views
 */

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { PilotRankGroup } from '@/components/pilots/pilot-rank-group'
import { PilotsTable } from '@/components/pilots/pilots-table'
import { Table, LayoutGrid } from 'lucide-react'

interface PilotsViewToggleProps {
  groupedPilots: Record<string, any[]>
  allPilots: any[]
}

export function PilotsViewToggle({ groupedPilots, allPilots }: PilotsViewToggleProps) {
  const [viewMode, setViewMode] = useState<'grouped' | 'table'>('table')

  // Sort ranks (Captain first, then First Officer, then others)
  const rankOrder = ['Captain', 'First Officer']
  const sortedRanks = Object.keys(groupedPilots).sort((a, b) => {
    const indexA = rankOrder.indexOf(a)
    const indexB = rankOrder.indexOf(b)
    if (indexA !== -1 && indexB !== -1) return indexA - indexB
    if (indexA !== -1) return -1
    if (indexB !== -1) return 1
    return a.localeCompare(b)
  })

  const rankCount = sortedRanks.length

  return (
    <>
      {/* View Toggle */}
      <div className="border-input bg-background flex items-center rounded-lg border p-1">
        <Button
          variant={viewMode === 'table' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setViewMode('table')}
          aria-label="Table view"
          className="h-8 flex-1 sm:flex-none"
        >
          <Table className="h-4 w-4 sm:mr-2" aria-hidden="true" />
          <span className="hidden sm:inline">Table</span>
        </Button>
        <Button
          variant={viewMode === 'grouped' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setViewMode('grouped')}
          aria-label="Grouped view"
          className="h-8 flex-1 sm:flex-none"
        >
          <LayoutGrid className="h-4 w-4 sm:mr-2" aria-hidden="true" />
          <span className="hidden sm:inline">Grouped</span>
        </Button>
      </div>

      {/* View Content */}
      {viewMode === 'table' ? (
        <PilotsTable pilots={allPilots} />
      ) : (
        <>
          {/* Rank Overview */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-foreground text-lg font-semibold">Ranks</h3>
              <Badge variant="secondary">{rankCount} Ranks</Badge>
            </div>
            <p className="text-muted-foreground mt-2 text-sm">
              Pilots are organized by rank and sorted by seniority number. Click on a rank to expand
              and view details.
            </p>
          </Card>

          {/* Grouped Pilots by Rank */}
          <div className="space-y-4">
            {sortedRanks.map((rank) => (
              <PilotRankGroup key={rank} rank={rank} pilots={groupedPilots[rank]} defaultExpanded />
            ))}
          </div>

          {/* Empty State */}
          {rankCount === 0 && (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground text-lg">No pilots found</p>
              <p className="text-muted-foreground mt-2 text-sm">
                Add your first pilot to get started
              </p>
            </Card>
          )}
        </>
      )}
    </>
  )
}
