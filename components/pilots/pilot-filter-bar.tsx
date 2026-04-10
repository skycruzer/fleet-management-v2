/**
 * Pilot Filter Bar Component
 *
 * Unified search + filter bar for all pilot view modes (cards, table, grouped).
 * Includes search input, filter pills for rank/status/contract, dismissible badges,
 * and result count display.
 *
 * Developer: Maurice Rondeau
 * @date February 2026
 */

'use client'

import { useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'

type RankFilter = 'all' | 'Captain' | 'First Officer'
type StatusFilter = 'all' | 'active' | 'inactive'

export interface PilotFilters {
  search: string
  rank: RankFilter
  status: StatusFilter
  contractType: string
}

interface PilotFilterBarProps {
  filters: PilotFilters
  onFiltersChange: (filters: PilotFilters) => void
  contractTypes: string[]
  resultCount: number
  totalCount: number
}

interface FilterPillProps {
  label: string
  active: boolean
  onClick: () => void
}

function FilterPill({ label, active, onClick }: FilterPillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
        active
          ? 'bg-primary text-primary-foreground shadow-sm'
          : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
      )}
    >
      {label}
    </button>
  )
}

export function PilotFilterBar({
  filters,
  onFiltersChange,
  contractTypes,
  resultCount,
  totalCount,
}: PilotFilterBarProps) {
  const hasActiveFilters =
    filters.search !== '' ||
    filters.rank !== 'all' ||
    filters.status !== 'all' ||
    filters.contractType !== ''

  const update = useCallback(
    (partial: Partial<PilotFilters>) => {
      onFiltersChange({ ...filters, ...partial })
    },
    [filters, onFiltersChange]
  )

  const clearAll = useCallback(() => {
    onFiltersChange({ search: '', rank: 'all', status: 'all', contractType: '' })
  }, [onFiltersChange])

  return (
    <div className="space-y-3">
      {/* Search + Result Count */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <Search
            className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
            aria-hidden="true"
          />
          <Input
            placeholder="Search by name, rank, or seniority..."
            value={filters.search}
            onChange={(e) => update({ search: e.target.value })}
            className="pr-9 pl-9"
            aria-label="Search pilots"
          />
          {filters.search && (
            <button
              type="button"
              onClick={() => update({ search: '' })}
              className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <p className="text-muted-foreground text-sm">
          {resultCount === totalCount ? (
            <span>{totalCount} pilots</span>
          ) : (
            <span>
              {resultCount} of {totalCount} pilots
            </span>
          )}
        </p>
      </div>

      {/* Filter Pills */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Rank Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
            Rank
          </span>
          <div className="flex gap-1" role="group" aria-label="Filter by rank">
            <FilterPill
              label="All"
              active={filters.rank === 'all'}
              onClick={() => update({ rank: 'all' })}
            />
            <FilterPill
              label="Captain"
              active={filters.rank === 'Captain'}
              onClick={() => update({ rank: 'Captain' })}
            />
            <FilterPill
              label="FO"
              active={filters.rank === 'First Officer'}
              onClick={() => update({ rank: 'First Officer' })}
            />
          </div>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
            Status
          </span>
          <div className="flex gap-1" role="group" aria-label="Filter by status">
            <FilterPill
              label="All"
              active={filters.status === 'all'}
              onClick={() => update({ status: 'all' })}
            />
            <FilterPill
              label="Active"
              active={filters.status === 'active'}
              onClick={() => update({ status: 'active' })}
            />
            <FilterPill
              label="Inactive"
              active={filters.status === 'inactive'}
              onClick={() => update({ status: 'inactive' })}
            />
          </div>
        </div>

        {/* Contract Type Filter */}
        {contractTypes.length > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
              Contract
            </span>
            <div className="flex flex-wrap gap-1" role="group" aria-label="Filter by contract type">
              <FilterPill
                label="All"
                active={filters.contractType === ''}
                onClick={() => update({ contractType: '' })}
              />
              {contractTypes.map((ct) => (
                <FilterPill
                  key={ct}
                  label={ct}
                  active={filters.contractType === ct}
                  onClick={() => update({ contractType: ct })}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          {filters.rank !== 'all' && (
            <Badge variant="secondary" className="gap-1 text-xs">
              Rank: {filters.rank}
              <button
                type="button"
                onClick={() => update({ rank: 'all' })}
                aria-label="Remove rank filter"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.status !== 'all' && (
            <Badge variant="secondary" className="gap-1 text-xs">
              Status: {filters.status}
              <button
                type="button"
                onClick={() => update({ status: 'all' })}
                aria-label="Remove status filter"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.contractType && (
            <Badge variant="secondary" className="gap-1 text-xs">
              Contract: {filters.contractType}
              <button
                type="button"
                onClick={() => update({ contractType: '' })}
                aria-label="Remove contract filter"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          <Button variant="ghost" size="sm" onClick={clearAll} className="h-6 text-xs">
            Clear All
          </Button>
        </div>
      )}
    </div>
  )
}
