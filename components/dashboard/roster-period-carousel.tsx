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
import { ChevronRight, ChevronLeft } from 'lucide-react'
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
  // Initialize roster data using lazy initialization
  const [currentRoster, setCurrentRoster] = useState<RosterPeriod | null>(() =>
    getCurrentRosterPeriodObject()
  )
  const [futureRosters, setFutureRosters] = useState<RosterPeriod[]>(() => {
    const future = getFutureRosterPeriods(13) // Get next 13 roster periods
    return future.slice(1, 14) // Skip current, take next 13
  })
  const [countdown, setCountdown] = useState<RosterCountdown | null>(null)
  const [showScrollControls, setShowScrollControls] = useState(false)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

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

  // Check scroll position and update button states
  const updateScrollButtons = () => {
    const container = scrollContainerRef.current
    if (!container) return

    const { scrollLeft, scrollWidth, clientWidth } = container
    setCanScrollLeft(scrollLeft > 0)
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10) // 10px threshold
  }

  // Auto-scroll functionality (right to left) - disabled to prevent width issues
  // User can manually scroll through the 13 roster periods
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current
    if (!scrollContainer || futureRosters.length === 0) return

    // Set up scroll listener to update button states
    scrollContainer.addEventListener('scroll', updateScrollButtons)

    // Initial check
    updateScrollButtons()

    return () => {
      scrollContainer.removeEventListener('scroll', updateScrollButtons)
    }
  }, [futureRosters])

  // Scroll left/right handlers
  const handleScrollLeft = () => {
    const container = scrollContainerRef.current
    if (!container) return

    const cardWidth = 272 // 256px + 16px gap
    container.scrollBy({ left: -cardWidth, behavior: 'smooth' })
  }

  const handleScrollRight = () => {
    const container = scrollContainerRef.current
    if (!container) return

    const cardWidth = 272 // 256px + 16px gap
    container.scrollBy({ left: cardWidth, behavior: 'smooth' })
  }

  if (!currentRoster || !countdown) {
    return null
  }

  return (
    <div className="w-full max-w-full space-y-6 overflow-hidden" style={{ minWidth: 0 }}>
      {/* Current Roster Period with Countdown */}
      <Card
        className="to-primary/10 w-full border-blue-200 bg-gradient-to-r from-blue-50 p-6"
        style={{ minWidth: 0 }}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex-1">
            <div className="mb-2 flex items-center gap-3">
              <Badge variant="default" className="bg-blue-600 text-sm font-semibold">
                CURRENT ROSTER
              </Badge>
              <h3 className="text-foreground text-2xl font-bold">{currentRoster.code}</h3>
            </div>
            <p className="text-muted-foreground mb-3 text-sm">
              {format(currentRoster.startDate, 'MMM dd')} -{' '}
              {format(currentRoster.endDate, 'MMM dd, yyyy')}
            </p>

            {/* Countdown Display */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-3xl">⏱️</span>
                <div>
                  <p className="text-muted-foreground text-xs font-medium uppercase">
                    Time Until Next Roster
                  </p>
                  <p className="text-lg font-bold text-blue-700">{formatCountdown(countdown)}</p>
                </div>
              </div>

              <div className="bg-border hidden h-12 w-px sm:block" />

              <div className="flex items-center gap-2">
                <span className="text-2xl">📅</span>
                <div>
                  <p className="text-muted-foreground text-xs font-medium uppercase">
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
          <div className="border-border flex items-center gap-3 border-t pt-4 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-6">
            <ChevronRight className="text-muted-foreground h-6 w-6" />
            <div>
              <p className="text-muted-foreground mb-1 text-xs font-medium uppercase">
                Next Roster
              </p>
              <p className="text-foreground text-xl font-bold">{countdown.nextRoster.code}</p>
              <p className="text-muted-foreground text-xs">
                Starts {format(countdown.nextRoster.startDate, 'MMM dd, yyyy')}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Upcoming Rosters Carousel */}
      <div className="w-full max-w-full overflow-hidden" style={{ minWidth: 0 }}>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-foreground flex items-center gap-2 text-sm font-semibold">
            <span className="text-lg">🗓️</span>
            Next 13 Roster Periods
          </h3>
          <Badge variant="outline" className="text-xs">
            Hover to scroll
          </Badge>
        </div>

        <div
          className="relative"
          onMouseEnter={() => setShowScrollControls(true)}
          onMouseLeave={() => setShowScrollControls(false)}
        >
          {/* Left Navigation Button */}
          {showScrollControls && canScrollLeft && (
            <button
              onClick={handleScrollLeft}
              className="absolute top-1/2 left-0 z-10 -translate-y-1/2 rounded-full bg-white p-2 shadow-lg transition-all hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700"
              aria-label="Scroll left"
            >
              <ChevronLeft className="h-5 w-5 text-slate-700 dark:text-slate-300" />
            </button>
          )}

          {/* Right Navigation Button */}
          {showScrollControls && canScrollRight && (
            <button
              onClick={handleScrollRight}
              className="absolute top-1/2 right-0 z-10 -translate-y-1/2 rounded-full bg-white p-2 shadow-lg transition-all hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700"
              aria-label="Scroll right"
            >
              <ChevronRight className="h-5 w-5 text-slate-700 dark:text-slate-300" />
            </button>
          )}

          <div
            ref={scrollContainerRef}
            className="scrollbar-thumb-border scrollbar-track-transparent scrollbar-thin relative w-full max-w-full overflow-x-auto overflow-y-hidden pb-2"
            style={{
              scrollBehavior: 'auto',
              minWidth: 0,
              maxWidth: '100%',
            }}
          >
            <div className="flex gap-3">
              {/* Render rosters once - removed duplication to prevent horizontal scroll */}
              {futureRosters.map((roster, index) => {
                return (
                  <Card
                    key={`${roster.code}-${index}`}
                    className={`w-64 flex-shrink-0 p-4 transition-all hover:shadow-md ${
                      index === 0
                        ? 'border-primary/20 bg-primary/5/50'
                        : 'border-border bg-background'
                    }`}
                  >
                    <div className="mb-2 flex items-start justify-between">
                      <div>
                        <Badge
                          variant={index === 0 ? 'default' : 'outline'}
                          className={`mb-1 text-xs ${
                            index === 0 ? 'bg-purple-600' : 'border-muted-foreground/30'
                          }`}
                        >
                          {index === 0 ? 'NEXT' : `+${index + 1}`}
                        </Badge>
                        <p className="text-foreground text-xl font-bold">{roster.code}</p>
                      </div>
                      <span className="text-2xl">{index === 0 ? '🎯' : '📆'}</span>
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
                      <div className="border-border flex items-center justify-between border-t pt-1">
                        <span className="text-muted-foreground">Year:</span>
                        <span className="text-foreground font-semibold">{roster.year}</span>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
