/**
 * Pairing Visualization Panel Component
 *
 * Main panel for displaying Captain/First Officer pairing results.
 * Shows paired crews, unpaired pilots, and pairing statistics.
 */

'use client'

import { useState, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import {
  Users,
  UserX,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Plane,
  Monitor,
  Filter,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { PairedCrewCard } from './paired-crew-card'
import { UnpairedPilotCard } from './unpaired-pilot-card'
import type {
  PairedCrew,
  UnpairedPilot,
  PairingStatistics,
  PairingRequiredCategory,
} from '@/lib/types/pairing'

interface PairingVisualizationPanelProps {
  pairs: PairedCrew[]
  unpaired: UnpairedPilot[]
  statistics: PairingStatistics
  onUnpair?: (pairId: string) => void
  onFindPair?: (pilotId: string) => void
  onScheduleSolo?: (pilotId: string) => void
  showActions?: boolean
}

type FilterCategory = 'all' | PairingRequiredCategory

export function PairingVisualizationPanel({
  pairs,
  unpaired,
  statistics,
  onUnpair,
  onFindPair,
  onScheduleSolo,
  showActions = false,
}: PairingVisualizationPanelProps) {
  const [activeTab, setActiveTab] = useState<'paired' | 'unpaired'>('paired')
  const [categoryFilter, setCategoryFilter] = useState<FilterCategory>('all')
  const [expandedStats, setExpandedStats] = useState(false)

  // Filter data by category
  const filteredPairs = useMemo(() => {
    if (categoryFilter === 'all') return pairs
    return pairs.filter((p) => p.category === categoryFilter)
  }, [pairs, categoryFilter])

  const filteredUnpaired = useMemo(() => {
    if (categoryFilter === 'all') return unpaired
    return unpaired.filter((p) => p.category === categoryFilter)
  }, [unpaired, categoryFilter])

  // Group pairs by roster period
  const pairsByPeriod = useMemo(() => {
    const grouped: Record<string, PairedCrew[]> = {}
    filteredPairs.forEach((pair) => {
      if (!grouped[pair.plannedRosterPeriod]) {
        grouped[pair.plannedRosterPeriod] = []
      }
      grouped[pair.plannedRosterPeriod].push(pair)
    })
    return grouped
  }, [filteredPairs])

  // Group unpaired by urgency
  const unpairedByUrgency = useMemo(() => {
    const critical = filteredUnpaired.filter((p) => p.urgency === 'critical')
    const high = filteredUnpaired.filter((p) => p.urgency === 'high')
    const normal = filteredUnpaired.filter((p) => p.urgency === 'normal')
    return { critical, high, normal }
  }, [filteredUnpaired])

  const hasWarnings = statistics.urgentUnpaired > 0

  return (
    <div className="space-y-4">
      {/* Statistics Summary */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 rounded-lg p-2">
              <BarChart3 className="text-primary h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold">Pairing Statistics</h3>
              <p className="text-muted-foreground text-sm">
                Flight & Simulator check scheduling overview
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpandedStats(!expandedStats)}
            className="text-muted-foreground"
          >
            {expandedStats ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Quick stats row */}
        <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatItem
            icon={Users}
            label="Paired Crews"
            value={statistics.totalPairs}
            iconColor="text-[var(--color-status-low)]"
          />
          <StatItem
            icon={UserX}
            label="Unpaired Pilots"
            value={statistics.totalUnpaired}
            iconColor={
              statistics.totalUnpaired > 0
                ? 'text-[var(--color-status-medium)]'
                : 'text-[var(--color-status-low)]'
            }
          />
          <StatItem
            icon={AlertTriangle}
            label="Urgent Solo"
            value={statistics.urgentUnpaired}
            iconColor={
              statistics.urgentUnpaired > 0
                ? 'text-[var(--color-status-high)]'
                : 'text-[var(--color-status-low)]'
            }
          />
          <StatItem
            icon={CheckCircle}
            label="Avg Overlap"
            value={`${Math.round(statistics.averageOverlapDays)}d`}
            iconColor="text-[var(--color-category-flight)]"
          />
        </div>

        {/* Expanded category breakdown */}
        {expandedStats && (
          <>
            <Separator className="my-4" />
            <div className="space-y-3">
              <h4 className="text-muted-foreground text-sm font-medium">By Category</h4>
              <div className="grid gap-3 md:grid-cols-2">
                {statistics.byCategory.map((cat) => (
                  <Card key={cat.category} className="bg-muted/30 p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {cat.category === 'Flight Checks' ? (
                          <Plane className="h-4 w-4 text-[var(--color-category-flight)]" />
                        ) : (
                          <Monitor className="h-4 w-4 text-[var(--color-category-simulator)]" />
                        )}
                        <span className="text-sm font-medium">{cat.category}</span>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="secondary" className="text-xs">
                          <Users className="mr-1 h-3 w-3" />
                          {cat.pairsCount} pairs
                        </Badge>
                        {cat.unpairedCount > 0 && (
                          <Badge
                            variant="outline"
                            className="border-[var(--color-status-medium-border)] text-xs text-[var(--color-status-medium)]"
                          >
                            <UserX className="mr-1 h-3 w-3" />
                            {cat.unpairedCount} solo
                          </Badge>
                        )}
                      </div>
                    </div>
                    {cat.unpairedCount > 0 && (
                      <p className="text-muted-foreground mt-2 text-xs">
                        {cat.captainsUnpaired} Captain{cat.captainsUnpaired !== 1 ? 's' : ''},{' '}
                        {cat.firstOfficersUnpaired} FO{cat.firstOfficersUnpaired !== 1 ? 's' : ''}{' '}
                        scheduled solo
                      </p>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          </>
        )}
      </Card>

      {/* Warning banner for urgent unpaired */}
      {hasWarnings && (
        <Card className="border-[var(--color-status-high-border)] bg-[var(--color-status-high-bg)] p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-[var(--color-status-high)]" />
            <div>
              <h4 className="font-medium text-[var(--color-status-high-foreground)]">
                Urgent Attention Required
              </h4>
              <p className="mt-1 text-sm text-[var(--color-status-high-foreground)]">
                {statistics.urgentUnpaired} pilot{statistics.urgentUnpaired !== 1 ? 's' : ''}{' '}
                scheduled solo due to expiring certifications. Review the Unpaired tab to confirm
                scheduling or attempt manual pairing.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Filter and tabs */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'paired' | 'unpaired')}>
          <TabsList>
            <TabsTrigger value="paired" className="flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              Paired
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                {filteredPairs.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="unpaired" className="flex items-center gap-1.5">
              <UserX className="h-4 w-4" />
              Unpaired
              {filteredUnpaired.length > 0 && (
                <Badge
                  variant="outline"
                  className="ml-1 h-5 border-[var(--color-status-medium-border)] px-1.5 text-xs text-[var(--color-status-medium)]"
                >
                  {filteredUnpaired.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Category filter */}
        <div className="flex items-center gap-2">
          <Filter className="text-muted-foreground h-4 w-4" />
          <div className="flex gap-1">
            <FilterButton
              active={categoryFilter === 'all'}
              onClick={() => setCategoryFilter('all')}
            >
              All
            </FilterButton>
            <FilterButton
              active={categoryFilter === 'Flight Checks'}
              onClick={() => setCategoryFilter('Flight Checks')}
            >
              <Plane className="mr-1 h-3 w-3" />
              Flight
            </FilterButton>
            <FilterButton
              active={categoryFilter === 'Simulator Checks'}
              onClick={() => setCategoryFilter('Simulator Checks')}
            >
              <Monitor className="mr-1 h-3 w-3" />
              Simulator
            </FilterButton>
          </div>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'paired' ? (
        <div className="space-y-6">
          {Object.keys(pairsByPeriod).length === 0 ? (
            <Card className="p-8 text-center">
              <Users className="text-muted-foreground mx-auto h-12 w-12" />
              <h3 className="text-muted-foreground mt-4 font-medium">No Paired Crews</h3>
              <p className="text-muted-foreground mt-1 text-sm">
                {categoryFilter !== 'all'
                  ? `No paired crews for ${categoryFilter}`
                  : 'No crew pairings have been scheduled yet'}
              </p>
            </Card>
          ) : (
            Object.entries(pairsByPeriod)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([period, periodPairs]) => (
                <div key={period}>
                  <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                    <Badge variant="outline">{period}</Badge>
                    <span className="text-muted-foreground">
                      {periodPairs.length} pair{periodPairs.length !== 1 ? 's' : ''}
                    </span>
                  </h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    {periodPairs.map((pair) => (
                      <PairedCrewCard
                        key={pair.id}
                        pair={pair}
                        onUnpair={onUnpair}
                        showActions={showActions}
                      />
                    ))}
                  </div>
                </div>
              ))
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {filteredUnpaired.length === 0 ? (
            <Card className="border-[var(--color-status-low-border)] bg-[var(--color-status-low-bg)] p-8 text-center">
              <CheckCircle className="mx-auto h-12 w-12 text-[var(--color-status-low)]" />
              <h3 className="mt-4 font-medium text-[var(--color-status-low-foreground)]">
                All Pilots Paired
              </h3>
              <p className="mt-1 text-sm text-[var(--color-status-low-foreground)]">
                {categoryFilter !== 'all'
                  ? `All ${categoryFilter} pilots have been successfully paired`
                  : 'All Flight and Simulator check pilots have been successfully paired'}
              </p>
            </Card>
          ) : (
            <>
              {/* Critical urgency */}
              {unpairedByUrgency.critical.length > 0 && (
                <div>
                  <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--color-status-high)]">
                    <AlertTriangle className="h-4 w-4" />
                    Critical ({unpairedByUrgency.critical.length})
                  </h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    {unpairedByUrgency.critical.map((pilot) => (
                      <UnpairedPilotCard
                        key={pilot.pilotId}
                        pilot={pilot}
                        onFindPair={onFindPair}
                        onScheduleSolo={onScheduleSolo}
                        showActions={showActions}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* High urgency */}
              {unpairedByUrgency.high.length > 0 && (
                <div>
                  <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--color-status-medium)]">
                    <AlertTriangle className="h-4 w-4" />
                    High Priority ({unpairedByUrgency.high.length})
                  </h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    {unpairedByUrgency.high.map((pilot) => (
                      <UnpairedPilotCard
                        key={pilot.pilotId}
                        pilot={pilot}
                        onFindPair={onFindPair}
                        onScheduleSolo={onScheduleSolo}
                        showActions={showActions}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Normal urgency */}
              {unpairedByUrgency.normal.length > 0 && (
                <div>
                  <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--color-status-medium)]/80">
                    <UserX className="h-4 w-4" />
                    Pending Review ({unpairedByUrgency.normal.length})
                  </h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    {unpairedByUrgency.normal.map((pilot) => (
                      <UnpairedPilotCard
                        key={pilot.pilotId}
                        pilot={pilot}
                        onFindPair={onFindPair}
                        onScheduleSolo={onScheduleSolo}
                        showActions={showActions}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * Stat Item Component
 */
interface StatItemProps {
  icon: React.ElementType
  label: string
  value: string | number
  iconColor?: string
}

function StatItem({ icon: Icon, label, value, iconColor = 'text-primary' }: StatItemProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="bg-muted rounded-lg p-2">
        <Icon className={cn('h-4 w-4', iconColor)} />
      </div>
      <div>
        <p className="text-foreground text-lg font-bold">{value}</p>
        <p className="text-muted-foreground text-xs">{label}</p>
      </div>
    </div>
  )
}

/**
 * Filter Button Component
 */
interface FilterButtonProps {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}

function FilterButton({ active, onClick, children }: FilterButtonProps) {
  return (
    <Button
      variant={active ? 'secondary' : 'ghost'}
      size="sm"
      onClick={onClick}
      className={cn('h-7 text-xs', !active && 'text-muted-foreground')}
    >
      {children}
    </Button>
  )
}
