/**
 * Pilots View Toggle Component
 * Client component for switching between card, table, and grouped views
 * Includes unified filter bar for all view modes
 *
 * Developer: Maurice Rondeau
 */

'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { PilotRankGroup } from '@/components/pilots/pilot-rank-group'
import { PilotsTable } from '@/components/pilots/pilots-table'
import { PilotCard } from '@/components/pilots/pilot-card'
import { PilotFilterBar, type PilotFilters } from '@/components/pilots/pilot-filter-bar'
import { useAnimationSettings } from '@/lib/hooks/use-reduced-motion'
import { staggerContainer } from '@/lib/animations/motion-variants'
import { Grid3x3, Table, LayoutGrid } from 'lucide-react'

type ViewMode = 'cards' | 'table' | 'grouped'

interface PilotsViewToggleProps {
  allPilots: any[]
  contractTypes: string[]
}

export function PilotsViewToggle({ allPilots, contractTypes }: PilotsViewToggleProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('cards')
  const [filters, setFilters] = useState<PilotFilters>({
    search: '',
    rank: 'all',
    status: 'all',
    contractType: '',
  })
  const { shouldAnimate } = useAnimationSettings()

  // Apply filters to all pilots
  const filteredPilots = useMemo(() => {
    return allPilots.filter((pilot) => {
      // Search filter
      if (filters.search) {
        const query = filters.search.toLowerCase()
        const matchesSearch =
          pilot.first_name?.toLowerCase().includes(query) ||
          pilot.last_name?.toLowerCase().includes(query) ||
          pilot.role?.toLowerCase().includes(query) ||
          (pilot.seniority_number?.toString() || '').includes(query)
        if (!matchesSearch) return false
      }

      // Rank filter
      if (filters.rank !== 'all' && pilot.role !== filters.rank) {
        return false
      }

      // Status filter
      if (filters.status !== 'all') {
        const isActive = filters.status === 'active'
        if (pilot.is_active !== isActive) return false
      }

      // Contract type filter
      if (filters.contractType && pilot.contract_type !== filters.contractType) {
        return false
      }

      return true
    })
  }, [allPilots, filters])

  // Re-group filtered pilots by rank for grouped view
  const filteredGroupedPilots = useMemo(() => {
    const grouped: Record<string, any[]> = {}
    for (const pilot of filteredPilots) {
      const rank = pilot.role || 'Unknown'
      if (!grouped[rank]) grouped[rank] = []
      grouped[rank].push(pilot)
    }
    return grouped
  }, [filteredPilots])

  // Sort ranks (Captain first, then First Officer, then others)
  const rankOrder = ['Captain', 'First Officer']
  const sortedRanks = Object.keys(filteredGroupedPilots).sort((a, b) => {
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
      {/* Filter Bar */}
      <PilotFilterBar
        filters={filters}
        onFiltersChange={setFilters}
        contractTypes={contractTypes}
        resultCount={filteredPilots.length}
        totalCount={allPilots.length}
      />

      {/* View Toggle */}
      <div
        role="tablist"
        aria-label="Pilots view mode"
        className="border-input bg-background flex items-center rounded-lg border p-1"
      >
        <Button
          role="tab"
          aria-selected={viewMode === 'cards'}
          variant={viewMode === 'cards' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setViewMode('cards')}
          aria-label="Card grid view"
          className="h-8 flex-1 sm:flex-none"
        >
          <Grid3x3 className="h-4 w-4 sm:mr-2" aria-hidden="true" />
          <span className="hidden sm:inline">Cards</span>
        </Button>
        <Button
          role="tab"
          aria-selected={viewMode === 'table'}
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
          role="tab"
          aria-selected={viewMode === 'grouped'}
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
      <div role="tabpanel" aria-label={`${viewMode} view`}>
        {viewMode === 'cards' ? (
          filteredPilots.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground text-lg">No pilots match your filters</p>
              <p className="text-muted-foreground mt-2 text-sm">
                Try adjusting your search or filter criteria
              </p>
            </Card>
          ) : (
            <motion.div
              variants={shouldAnimate ? staggerContainer : undefined}
              initial={shouldAnimate ? 'hidden' : undefined}
              animate={shouldAnimate ? 'visible' : undefined}
              className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            >
              {filteredPilots.map((pilot) => (
                <PilotCard key={pilot.id} pilot={pilot} />
              ))}
            </motion.div>
          )
        ) : viewMode === 'table' ? (
          <PilotsTable pilots={filteredPilots} />
        ) : (
          <>
            {/* Rank Overview */}
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-foreground text-lg font-semibold">Ranks</h3>
                <Badge variant="secondary">{rankCount} Ranks</Badge>
              </div>
              <p className="text-muted-foreground mt-2 text-sm">
                Pilots are organized by rank and sorted by seniority number. Click on a rank to
                expand and view details.
              </p>
            </Card>

            {/* Grouped Pilots by Rank */}
            <div className="space-y-4">
              {sortedRanks.map((rank) => (
                <PilotRankGroup
                  key={rank}
                  rank={rank}
                  pilots={filteredGroupedPilots[rank]}
                  defaultExpanded
                />
              ))}
            </div>

            {/* Empty State */}
            {rankCount === 0 && (
              <Card className="p-12 text-center">
                <p className="text-muted-foreground text-lg">No pilots match your filters</p>
                <p className="text-muted-foreground mt-2 text-sm">
                  Try adjusting your search or filter criteria
                </p>
              </Card>
            )}
          </>
        )}
      </div>
    </>
  )
}
