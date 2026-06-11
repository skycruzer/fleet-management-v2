/**
 * Pilots View Toggle Component
 * Client component for switching between card, table, and grouped views
 * Includes unified filter bar for all view modes
 *
 * Developer: Maurice Rondeau
 */

'use client'

import { useMemo } from 'react'
import { useQueryState, parseAsString, parseAsStringLiteral } from 'nuqs'
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

const VIEW_MODES = ['cards', 'table', 'grouped'] as const
const RANK_FILTERS = ['all', 'Captain', 'First Officer'] as const
const STATUS_FILTERS = ['all', 'active', 'inactive'] as const

interface PilotsViewToggleProps {
  allPilots: any[]
  contractTypes: string[]
}

export function PilotsViewToggle({ allPilots, contractTypes }: PilotsViewToggleProps) {
  // URL-synced state so back/forward navigation and deep links work
  const [viewMode, setViewMode] = useQueryState(
    'view',
    parseAsStringLiteral(VIEW_MODES).withDefault('cards')
  )
  const [search, setSearch] = useQueryState('search', parseAsString.withDefault(''))
  const [rank, setRank] = useQueryState(
    'rank',
    parseAsStringLiteral(RANK_FILTERS).withDefault('all')
  )
  const [status, setStatus] = useQueryState(
    'status',
    parseAsStringLiteral(STATUS_FILTERS).withDefault('all')
  )
  const [contractType, setContractType] = useQueryState('contract', parseAsString.withDefault(''))

  const filters = useMemo<PilotFilters>(
    () => ({ search, rank, status, contractType }),
    [search, rank, status, contractType]
  )

  const handleFiltersChange = (next: PilotFilters) => {
    setSearch(next.search)
    setRank(next.rank)
    setStatus(next.status)
    setContractType(next.contractType)
  }
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
      {/* Filter Bar — table view owns its own filtering via the data-table toolbar */}
      {viewMode !== 'table' && (
        <PilotFilterBar
          filters={filters}
          onFiltersChange={handleFiltersChange}
          contractTypes={contractTypes}
          resultCount={filteredPilots.length}
          totalCount={allPilots.length}
        />
      )}

      {/* View Toggle — aria-pressed toggle buttons (same pattern as ViewModeToggle) */}
      <div
        role="group"
        aria-label="Pilots view mode"
        className="border-input bg-background flex items-center rounded-lg border p-1"
      >
        <Button
          aria-pressed={viewMode === 'cards'}
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
          aria-pressed={viewMode === 'table'}
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
          aria-pressed={viewMode === 'grouped'}
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
      <div>
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
          <PilotsTable pilots={allPilots} contractTypes={contractTypes} />
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
