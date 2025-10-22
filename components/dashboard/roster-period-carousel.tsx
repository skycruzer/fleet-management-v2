/**
 * Roster Period Carousel Component
 * Displays current roster period with countdown and next 6 roster periods
 *
 * Features:
 * - Real-time countdown to next roster period
 * - Horizontal scrolling carousel showing next 6 roster periods
 * - Auto-updating countdown (every second)
 *
 * @version 1.0.0
 * @since 2025-10-20
 */

'use client'

import { useState, useEffect, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ChevronRight } from 'lucide-react'
import { format } from 'date-fns'
import {
  getCurrentRosterPeriodObject,
  getFutureRosterPeriods,
  getNextRosterCountdown,
  formatCountdown,
  type RosterPeriod,
  type RosterCountdown,
} from '@/lib/utils/roster-utils'

export function RosterPeriodCarousel() {
  const [currentRoster, setCurrentRoster] = useState<RosterPeriod | null>(null)
  const [futureRosters, setFutureRosters] = useState<RosterPeriod[]>([])
  const [countdown, setCountdown] = useState<RosterCountdown | null>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Initialize roster data
  useEffect(() => {
    const current = getCurrentRosterPeriodObject()
    const future = getFutureRosterPeriods(13) // Get next 13 roster periods

    setCurrentRoster(current)
    setFutureRosters(future.slice(1, 14)) // Skip current, take next 13
  }, [])

  // Update countdown every second
  useEffect(() => {
    const updateCountdown = () => {
      const newCountdown = getNextRosterCountdown()
      setCountdown(newCountdown)
    }

    updateCountdown() // Initial update
    const interval = setInterval(updateCountdown, 1000) // Update every second

    return () => clearInterval(interval)
  }, [])

  // Auto-scroll functionality (right to left)
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current
    if (!scrollContainer || futureRosters.length === 0) return

    const scrollSpeed = 1 // Pixels per frame (increased for visibility)
    let isPaused = false
    let animationFrameId: number

    const autoScroll = () => {
      if (!isPaused && scrollContainer) {
        // Get the total scrollable width
        const maxScroll = scrollContainer.scrollWidth - scrollContainer.clientWidth

        // Only scroll if there's content to scroll
        if (maxScroll > 0) {
          scrollContainer.scrollLeft += scrollSpeed

          // Reset to beginning when reaching halfway (for seamless loop)
          // Since we duplicate the content, reset at halfway point
          const halfwayPoint = scrollContainer.scrollWidth / 2
          if (scrollContainer.scrollLeft >= halfwayPoint) {
            scrollContainer.scrollLeft = 0
          }
        }
      }

      animationFrameId = requestAnimationFrame(autoScroll)
    }

    // Start auto-scrolling after a brief delay
    const startDelay = setTimeout(() => {
      animationFrameId = requestAnimationFrame(autoScroll)
    }, 2000)

    // Pause on hover
    const handleMouseEnter = () => {
      isPaused = true
    }

    const handleMouseLeave = () => {
      isPaused = false
    }

    scrollContainer.addEventListener('mouseenter', handleMouseEnter)
    scrollContainer.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      clearTimeout(startDelay)
      cancelAnimationFrame(animationFrameId)
      scrollContainer.removeEventListener('mouseenter', handleMouseEnter)
      scrollContainer.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [futureRosters])

  if (!currentRoster || !countdown) {
    return null
  }

  return (
    <div className="space-y-4">
      {/* Current Roster Period with Countdown */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Badge variant="default" className="text-sm font-semibold bg-blue-600">
                CURRENT ROSTER
              </Badge>
              <h3 className="text-2xl font-bold text-foreground">
                {currentRoster.code}
              </h3>
            </div>
            <p className="text-muted-foreground text-sm mb-3">
              {format(currentRoster.startDate, 'MMM dd')} - {format(currentRoster.endDate, 'MMM dd, yyyy')}
            </p>

            {/* Countdown Display */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-3xl">⏱️</span>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-medium">
                    Time Until Next Roster
                  </p>
                  <p className="text-lg font-bold text-blue-700">
                    {formatCountdown(countdown)}
                  </p>
                </div>
              </div>

              <div className="h-12 w-px bg-border" />

              <div className="flex items-center gap-2">
                <span className="text-2xl">📅</span>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-medium">
                    Days Remaining
                  </p>
                  <p className="text-lg font-bold text-purple-700">
                    {currentRoster.daysRemaining} days
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Next Roster Preview */}
          <div className="hidden lg:flex items-center gap-3 pl-6 border-l border-border">
            <ChevronRight className="h-6 w-6 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground uppercase font-medium mb-1">
                Next Roster
              </p>
              <p className="text-xl font-bold text-foreground">
                {countdown.nextRoster.code}
              </p>
              <p className="text-xs text-muted-foreground">
                Starts {format(countdown.nextRoster.startDate, 'MMM dd, yyyy')}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Upcoming Rosters Carousel */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-foreground text-sm font-semibold flex items-center gap-2">
            <span className="text-lg">🗓️</span>
            Next 13 Roster Periods
          </h3>
          <Badge variant="outline" className="text-xs">
            Auto-scrolling • Hover to pause
          </Badge>
        </div>

        <div
          ref={scrollContainerRef}
          className="relative overflow-x-scroll overflow-y-hidden pb-2 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent"
          style={{
            scrollBehavior: 'auto',
          }}
        >
          <div className="flex gap-3 w-max">
            {/* Render rosters twice for seamless infinite scroll */}
            {[...futureRosters, ...futureRosters].map((roster, index) => {
              const displayIndex = index % futureRosters.length
              return (
                <Card
                  key={`${roster.code}-${index}`}
                  className={`flex-shrink-0 w-64 p-4 transition-all hover:shadow-md ${
                    displayIndex === 0
                      ? 'border-purple-200 bg-purple-50/50'
                      : 'border-border bg-background'
                  }`}
                >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <Badge
                      variant={displayIndex === 0 ? 'default' : 'outline'}
                      className={`text-xs mb-1 ${
                        displayIndex === 0
                          ? 'bg-purple-600'
                          : 'border-muted-foreground/30'
                      }`}
                    >
                      {displayIndex === 0 ? 'NEXT' : `+${displayIndex + 1}`}
                    </Badge>
                    <p className="text-xl font-bold text-foreground">
                      {roster.code}
                    </p>
                  </div>
                  <span className="text-2xl">
                    {displayIndex === 0 ? '🎯' : '📆'}
                  </span>
                </div>

                <div className="space-y-1 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Starts:</span>
                    <span className="text-foreground font-medium">
                      {format(roster.startDate, 'MMM dd')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Ends:</span>
                    <span className="text-foreground font-medium">
                      {format(roster.endDate, 'MMM dd')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-border">
                    <span className="text-muted-foreground">Year:</span>
                    <span className="text-foreground font-semibold">
                      {roster.year}
                    </span>
                  </div>
                </div>
              </Card>
            )})}
          </div>
        </div>
      </div>
    </div>
  )
}
