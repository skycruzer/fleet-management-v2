// Maurice Rondeau — Published Rosters Client
'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarDays, Maximize2, Minimize2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { RosterPeriodNavigator } from '@/components/published-rosters/roster-period-navigator'
import { RosterToolbar, type RankFilter } from '@/components/published-rosters/roster-toolbar'
import { RosterGrid } from '@/components/published-rosters/roster-grid'
import { RosterPairingsView } from '@/components/published-rosters/roster-pairings-view'
import { DailyCrewSummary } from '@/components/published-rosters/daily-crew-summary'
import { ActivityCodeLegend } from '@/components/published-rosters/activity-code-legend'
import { RosterUploadDialog } from '@/components/published-rosters/roster-upload-dialog'
import { RosterPdfViewer } from '@/components/published-rosters/roster-pdf-viewer'
import type { Database } from '@/types/supabase'

type PublishedRoster = Database['public']['Tables']['published_rosters']['Row']
type RosterAssignment = Database['public']['Tables']['roster_assignments']['Row']
type ActivityCode = Database['public']['Tables']['activity_codes']['Row']

interface RosterWithAssignments extends PublishedRoster {
  assignments: RosterAssignment[]
}

interface PublishedRostersClientProps {
  initialPeriodCode: string
  initialRoster: RosterWithAssignments | null
  initialUploadedCodes: string[]
  activityCodes: ActivityCode[]
}

export function PublishedRostersClient({
  initialPeriodCode,
  initialRoster,
  initialUploadedCodes,
  activityCodes,
}: PublishedRostersClientProps) {
  const router = useRouter()

  // Period navigation state
  const [currentPeriodCode, setCurrentPeriodCode] = useState(initialPeriodCode)
  const [roster, setRoster] = useState<RosterWithAssignments | null>(initialRoster)
  const [uploadedCodes, setUploadedCodes] = useState<string[]>(initialUploadedCodes)
  const [loading, setLoading] = useState(false)

  // Toolbar filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [activityFilter, setActivityFilter] = useState<string[]>([])
  const [rankFilter, setRankFilter] = useState<RankFilter>('ALL')

  // Dialog state
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [showPdfViewer, setShowPdfViewer] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Escape key exits fullscreen
  useEffect(() => {
    if (!isFullscreen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsFullscreen(false)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isFullscreen])

  // Build activity code map for the grid
  const activityCodeMap = useMemo(() => {
    const map = new Map<string, { code: string; name: string; category: string; color: string }>()
    for (const ac of activityCodes) {
      map.set(ac.code, {
        code: ac.code,
        name: ac.name,
        category: ac.category,
        color: ac.color,
      })
    }
    return map
  }, [activityCodes])

  // Pre-map assignments once instead of repeating .map() in each child component
  const mappedAssignments = useMemo(
    () =>
      roster?.assignments.map((a) => ({
        pilot_id: a.pilot_id,
        pilot_last_name: a.pilot_last_name,
        pilot_first_name: a.pilot_first_name,
        rank: a.rank,
        day_number: a.day_number,
        activity_code: a.activity_code,
      })) ?? [],
    [roster?.assignments]
  )

  // Fetch roster data when period changes
  const fetchRosterForPeriod = useCallback(async (periodCode: string) => {
    setLoading(true)
    setRoster(null)

    try {
      const res = await fetch(`/api/published-rosters?period=${encodeURIComponent(periodCode)}`)
      if (!res.ok) {
        if (res.status === 404) return // No roster for this period
        throw new Error('Failed to fetch roster')
      }
      const json = await res.json()

      if (json.success) {
        setRoster(json.data)
      } else {
        toast.error(json.error || 'Failed to load roster')
      }
    } catch {
      toast.error('Failed to load roster data')
    } finally {
      setLoading(false)
    }
  }, [])

  const handlePeriodChange = useCallback(
    (code: string) => {
      setCurrentPeriodCode(code)
      setSearchQuery('')
      setActivityFilter([])
      setRankFilter('ALL')

      if (uploadedCodes.includes(code)) {
        fetchRosterForPeriod(code)
      } else {
        setRoster(null)
      }
    },
    [uploadedCodes, fetchRosterForPeriod]
  )

  const handleUploadComplete = useCallback(() => {
    // Refresh the page data
    if (!uploadedCodes.includes(currentPeriodCode)) {
      setUploadedCodes((prev) => [...prev, currentPeriodCode])
    }
    fetchRosterForPeriod(currentPeriodCode)
    router.refresh()
  }, [currentPeriodCode, uploadedCodes, fetchRosterForPeriod, router])

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-foreground text-3xl font-bold tracking-tight">Published Rosters</h1>
          <p className="text-muted-foreground">View and manage B767 published crew rosters</p>
        </div>

        {/* Period Navigator */}
        <RosterPeriodNavigator
          currentPeriodCode={currentPeriodCode}
          onPeriodChange={handlePeriodChange}
          uploadedPeriodCodes={uploadedCodes}
          onUploadClick={() => setShowUploadDialog(true)}
          onViewPdfClick={roster ? () => setShowPdfViewer(true) : undefined}
          hasPdf={!!roster}
        />

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="border-primary mx-auto h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" />
              <p className="text-muted-foreground mt-3 text-sm">Loading roster data...</p>
            </div>
          </div>
        )}

        {/* Empty State — No roster uploaded for this period */}
        {!loading && !roster && (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-20">
            <CalendarDays className="text-muted-foreground/50 h-12 w-12" />
            <h3 className="text-foreground mt-4 text-lg font-medium">No roster uploaded</h3>
            <p className="text-muted-foreground mt-1 text-sm">
              Upload the published roster PDF for {currentPeriodCode} to view the crew schedule.
            </p>
          </div>
        )}

        {/* Roster Content */}
        {!loading && roster && roster.assignments.length > 0 && (
          <>
            {/* Toolbar */}
            <RosterToolbar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              activityFilter={activityFilter}
              onActivityFilterChange={setActivityFilter}
              rankFilter={rankFilter}
              onRankFilterChange={setRankFilter}
              activityCodes={activityCodes.map((ac) => ({
                code: ac.code,
                name: ac.name,
                category: ac.category,
              }))}
            />

            {rankFilter === 'PAIRINGS' ? (
              /* Pairings View */
              <RosterPairingsView
                assignments={mappedAssignments}
                activityCodeMap={activityCodeMap}
                periodStartDate={roster.period_start_date}
                searchQuery={searchQuery}
                activityFilter={activityFilter}
              />
            ) : (
              <>
                {/* Fullscreen toggle */}
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsFullscreen(true)}
                    className="gap-1.5"
                  >
                    <Maximize2 className="h-4 w-4" />
                    Fullscreen
                  </Button>
                </div>

                {/* Daily Crew Summary */}
                <DailyCrewSummary
                  assignments={mappedAssignments}
                  periodStartDate={roster.period_start_date}
                />

                {/* Roster Grid */}
                <RosterGrid
                  assignments={mappedAssignments}
                  activityCodeMap={activityCodeMap}
                  periodStartDate={roster.period_start_date}
                  searchQuery={searchQuery}
                  activityFilter={activityFilter}
                  rankFilter={rankFilter}
                />
              </>
            )}

            {/* Fullscreen Overlay */}
            {isFullscreen && (
              <div className="bg-background fixed inset-0 z-50 flex flex-col overflow-hidden">
                {/* Fullscreen header */}
                <div className="border-b px-4 py-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <h2 className="text-lg font-semibold">
                        {currentPeriodCode} — Published Roster
                      </h2>
                      <RosterToolbar
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                        activityFilter={activityFilter}
                        onActivityFilterChange={setActivityFilter}
                        rankFilter={rankFilter}
                        onRankFilterChange={setRankFilter}
                        activityCodes={activityCodes.map((ac) => ({
                          code: ac.code,
                          name: ac.name,
                          category: ac.category,
                        }))}
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsFullscreen(false)}
                      className="gap-1.5"
                    >
                      <Minimize2 className="h-4 w-4" />
                      Exit
                    </Button>
                  </div>
                </div>

                {/* Fullscreen content */}
                <div className="flex-1 overflow-auto p-2">
                  <DailyCrewSummary
                    assignments={mappedAssignments}
                    periodStartDate={roster.period_start_date}
                    compact
                  />
                  <div className="mt-2">
                    <RosterGrid
                      assignments={mappedAssignments}
                      activityCodeMap={activityCodeMap}
                      periodStartDate={roster.period_start_date}
                      searchQuery={searchQuery}
                      activityFilter={activityFilter}
                      rankFilter={rankFilter}
                      compact
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Activity Code Legend */}
            <ActivityCodeLegend
              codes={activityCodes.map((ac) => ({
                code: ac.code,
                name: ac.name,
                category: ac.category,
                color: ac.color,
              }))}
            />
          </>
        )}

        {/* Upload Dialog */}
        <RosterUploadDialog
          open={showUploadDialog}
          onOpenChange={setShowUploadDialog}
          periodCode={currentPeriodCode}
          onUploadComplete={handleUploadComplete}
        />

        {/* PDF Viewer */}
        {roster && (
          <RosterPdfViewer
            open={showPdfViewer}
            onOpenChange={setShowPdfViewer}
            rosterId={roster.id}
            periodCode={currentPeriodCode}
          />
        )}
      </div>
    </TooltipProvider>
  )
}
