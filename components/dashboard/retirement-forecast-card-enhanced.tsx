/**
 * Enhanced Retirement Forecast Card
 * Interactive retirement forecast with timeline visualization and export features
 * Server component with client interaction capabilities
 *
 * @version 2.0.0
 * @since 2025-10-25
 */

'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Clock, TrendingUp, Users, BarChart3 } from 'lucide-react'
import { TimelineVisualization } from '@/components/retirement/TimelineVisualization'
import { CrewImpactAnalysis } from '@/components/retirement/CrewImpactAnalysis'
import { ExportControls } from '@/components/retirement/ExportControls'
import { PilotRetirementDialog } from '@/components/retirement/PilotRetirementDialog'

interface RetirementForecastCardEnhancedProps {
  retirementAge: number
}

/**
 * Enhanced Client Component for interactive retirement forecast
 * Includes timeline visualization, crew impact analysis, and export features
 */
export function RetirementForecastCardEnhanced({
  retirementAge
}: RetirementForecastCardEnhancedProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPilotId, setSelectedPilotId] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const [forecastData, setForecastData] = useState<any>(null)
  const [timelineData, setTimelineData] = useState<any>(null)
  const [impactData, setImpactData] = useState<any>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        // Fetch all data in parallel
        const [forecastRes, timelineRes, impactRes] = await Promise.all([
          fetch(`/api/retirement/forecast?retirementAge=${retirementAge}`),
          fetch(`/api/retirement/timeline?retirementAge=${retirementAge}`),
          fetch(`/api/retirement/impact?retirementAge=${retirementAge}`)
        ])

        if (!forecastRes.ok || !timelineRes.ok || !impactRes.ok) {
          throw new Error('Failed to fetch retirement data')
        }

        const [forecast, timeline, impact] = await Promise.all([
          forecastRes.json(),
          timelineRes.json(),
          impactRes.json()
        ])

        setForecastData(forecast)
        setTimelineData(timeline)
        setImpactData(impact)
      } catch (err) {
        console.error('Error fetching retirement forecast data:', err)
        setError('Unable to load retirement forecast data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [retirementAge])

  const handleMonthClick = (month: string) => {
    // Find pilots retiring in this month
    const pilotsInMonth = timelineData?.timeline.find((t: any) => t.month === month)
    if (pilotsInMonth && pilotsInMonth.pilots.length > 0) {
      setSelectedPilotId(pilotsInMonth.pilots[0].id)
      setDialogOpen(true)
    }
  }

  if (loading) {
    return (
      <Card className="p-6">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-64 w-full" />
      </Card>
    )
  }

  if (error || !forecastData || !timelineData || !impactData) {
    return (
      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-orange-600" />
            <h3 className="text-lg font-semibold text-foreground">Retirement Forecast</h3>
          </div>
        </div>
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <p className="text-sm text-yellow-800">
            {error || 'Unable to load retirement forecast data. Please try refreshing the page.'}
          </p>
        </div>
      </Card>
    )
  }

  return (
    <>
      <Card className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-orange-600" />
            <h3 className="text-lg font-semibold text-foreground">Retirement Forecast</h3>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              Age {retirementAge}
            </Badge>
            <ExportControls />
          </div>
        </div>

        <Tabs defaultValue="summary" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="summary">
              <Users className="h-4 w-4 mr-2" />
              Summary
            </TabsTrigger>
            <TabsTrigger value="timeline">
              <BarChart3 className="h-4 w-4 mr-2" />
              Timeline
            </TabsTrigger>
            <TabsTrigger value="impact">
              <TrendingUp className="h-4 w-4 mr-2" />
              Impact Analysis
            </TabsTrigger>
          </TabsList>

          {/* Summary Tab - Original View */}
          <TabsContent value="summary" className="space-y-6">
            {/* 2 Year Forecast */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-orange-500" />
                  <h4 className="text-sm font-medium text-foreground">Next 2 Years</h4>
                </div>
                <span className="text-2xl font-bold text-orange-600">
                  {forecastData.twoYears.total}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-orange-200 bg-orange-50 p-3">
                  <div className="mb-1 flex items-center space-x-1">
                    <Users className="h-3 w-3 text-orange-700" />
                    <p className="text-xs font-medium text-orange-700">Captains</p>
                  </div>
                  <p className="text-xl font-bold text-orange-900">
                    {forecastData.twoYears.captains}
                  </p>
                </div>

                <div className="rounded-lg border border-orange-200 bg-orange-50 p-3">
                  <div className="mb-1 flex items-center space-x-1">
                    <Users className="h-3 w-3 text-orange-700" />
                    <p className="text-xs font-medium text-orange-700">First Officers</p>
                  </div>
                  <p className="text-xl font-bold text-orange-900">
                    {forecastData.twoYears.firstOfficers}
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-border" />

            {/* 5 Year Forecast */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-blue-500" />
                  <h4 className="text-sm font-medium text-foreground">Next 5 Years</h4>
                </div>
                <span className="text-2xl font-bold text-blue-600">
                  {forecastData.fiveYears.total}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                  <div className="mb-1 flex items-center space-x-1">
                    <Users className="h-3 w-3 text-blue-700" />
                    <p className="text-xs font-medium text-blue-700">Captains</p>
                  </div>
                  <p className="text-xl font-bold text-blue-900">
                    {forecastData.fiveYears.captains}
                  </p>
                </div>

                <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                  <div className="mb-1 flex items-center space-x-1">
                    <Users className="h-3 w-3 text-blue-700" />
                    <p className="text-xs font-medium text-blue-700">First Officers</p>
                  </div>
                  <p className="text-xl font-bold text-blue-900">
                    {forecastData.fiveYears.firstOfficers}
                  </p>
                </div>
              </div>
            </div>

            {/* Planning Recommendation */}
            {forecastData.fiveYears.total > 0 && (
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3">
                <p className="text-xs text-yellow-800">
                  <span className="font-semibold">Planning Recommendation:</span> Consider succession
                  planning and recruitment to maintain crew levels.
                </p>
              </div>
            )}
          </TabsContent>

          {/* Timeline Tab - Interactive Visualization */}
          <TabsContent value="timeline">
            <TimelineVisualization
              timeline={timelineData.timeline}
              onMonthClick={handleMonthClick}
            />
            <div className="mt-4 text-xs text-center text-muted-foreground">
              Click on a month to view detailed pilot retirement information
            </div>
          </TabsContent>

          {/* Impact Analysis Tab */}
          <TabsContent value="impact">
            <CrewImpactAnalysis impactData={impactData} />
          </TabsContent>
        </Tabs>
      </Card>

      {/* Pilot Details Dialog */}
      <PilotRetirementDialog
        pilotId={selectedPilotId}
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false)
          setSelectedPilotId(null)
        }}
      />
    </>
  )
}
