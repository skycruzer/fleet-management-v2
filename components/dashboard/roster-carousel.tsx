'use client'

/**
 * Roster Carousel Component
 *
 * Auto-scrolling carousel showing upcoming roster periods
 * Uses CSS animations for smooth, reliable scrolling
 * Enhanced with modern design and better visual hierarchy
 */

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import {
  Calendar,
  ArrowRight,
  Users,
  ClipboardCheck,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
} from 'lucide-react'
import type { RosterPeriod } from '@/lib/utils/roster-utils'

// Extended RosterPeriod with leave request and certification check data
type RosterPeriodWithLeave = RosterPeriod & {
  leaveRequests?: {
    pending: number
    approved: number
    total: number
    byType: Record<string, number>
  }
  certChecks?: number
}

interface RosterCarouselProps {
  periods: RosterPeriodWithLeave[]
}

export function RosterCarousel({ periods }: RosterCarouselProps) {
  const [isPaused, setIsPaused] = useState(false)
  const [showScrollControls, setShowScrollControls] = useState(false)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Check if we have periods to display
  const hasPeriods = periods && periods.length > 0

  // Check scroll position and update button states
  const updateScrollButtons = () => {
    const container = scrollContainerRef.current
    if (!container) return

    const scrollableDiv = container.querySelector('.flex.gap-3') as HTMLDivElement
    if (!scrollableDiv) return

    const parentContainer = container.parentElement
    if (!parentContainer) return

    const { scrollLeft, scrollWidth } = container
    const { clientWidth } = parentContainer

    setCanScrollLeft(scrollLeft > 0)
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
  }

  // Set up scroll listener - must be called before any returns
  useEffect(() => {
    if (!hasPeriods) return

    const container = scrollContainerRef.current
    if (!container) return

    container.addEventListener('scroll', updateScrollButtons)
    updateScrollButtons()

    return () => {
      container.removeEventListener('scroll', updateScrollButtons)
    }
  }, [periods, hasPeriods])

  // Empty state when no periods are available
  if (!hasPeriods) {
    return (
      <div className="bg-muted/50 rounded-lg py-6">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="bg-muted mb-3 flex h-12 w-12 items-center justify-center rounded-full">
            <CalendarDays className="text-muted-foreground h-6 w-6" aria-hidden="true" />
          </div>
          <h4 className="text-foreground mb-1 text-sm font-semibold">No Roster Periods</h4>
          <p className="text-muted-foreground mb-3 max-w-[280px] text-xs">
            Roster periods will appear here once configured. Each period represents a 28-day
            scheduling cycle.
          </p>
          <Link
            href="/dashboard/roster-periods"
            className="bg-muted text-foreground hover:bg-muted/80 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
            aria-label="View roster period settings"
          >
            <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
            View Settings
          </Link>
        </div>
      </div>
    )
  }

  // Duplicate periods for seamless infinite scroll
  const duplicatedPeriods = [...periods, ...periods]

  // Scroll handlers
  const handleScrollLeft = () => {
    const container = scrollContainerRef.current
    if (!container) return

    const cardWidth = 196 // 180px + 16px gap
    container.scrollBy({ left: -cardWidth, behavior: 'smooth' })
  }

  const handleScrollRight = () => {
    const container = scrollContainerRef.current
    if (!container) return

    const cardWidth = 196 // 180px + 16px gap
    container.scrollBy({ left: cardWidth, behavior: 'smooth' })
  }

  return (
    <div
      className="relative"
      onMouseEnter={() => {
        setIsPaused(true)
        setShowScrollControls(true)
      }}
      onMouseLeave={() => {
        setIsPaused(false)
        setShowScrollControls(false)
      }}
    >
      {/* Enhanced Gradient Fade Edges with stronger effect */}
      <div className="from-background via-background/80 pointer-events-none absolute top-0 left-0 z-10 h-full w-16 bg-gradient-to-r to-transparent" />
      <div className="from-background via-background/80 pointer-events-none absolute top-0 right-0 z-10 h-full w-16 bg-gradient-to-l to-transparent" />

      {/* Left Navigation Button */}
      {showScrollControls && canScrollLeft && (
        <button
          onClick={handleScrollLeft}
          className="bg-card hover:bg-muted absolute top-1/2 left-2 z-20 -translate-y-1/2 rounded-full p-2 shadow-lg transition-all"
          aria-label="Scroll left"
        >
          <ChevronLeft className="text-foreground h-5 w-5" />
        </button>
      )}

      {/* Right Navigation Button */}
      {showScrollControls && canScrollRight && (
        <button
          onClick={handleScrollRight}
          className="bg-card hover:bg-muted absolute top-1/2 right-2 z-20 -translate-y-1/2 rounded-full p-2 shadow-lg transition-all"
          aria-label="Scroll right"
        >
          <ChevronRight className="text-foreground h-5 w-5" />
        </button>
      )}

      {/* Scrolling Container */}
      <div className="bg-muted/50 overflow-hidden rounded-lg py-3">
        <div
          ref={scrollContainerRef}
          className="animate-scroll flex gap-3 px-2"
          style={{
            width: 'max-content',
            pointerEvents: 'auto',
            animationPlayState: isPaused ? 'paused' : 'running',
          }}
        >
          {duplicatedPeriods.map((period, index) => {
            // First period in original array is "next"
            const isNext = index % periods.length === 0
            const periodKey = `${period.code}-${period.year}-${index}`

            return (
              <div
                key={periodKey}
                className={`group relative flex w-[180px] flex-shrink-0 flex-col overflow-hidden rounded-xl border-2 shadow-md transition-all ${
                  isNext
                    ? 'border-primary from-primary/10 via-primary/5 to-accent/10 bg-gradient-to-br'
                    : 'border-border bg-card'
                }`}
                style={{ pointerEvents: 'auto' }}
              >
                {/* Animated Background Glow */}
                {isNext && (
                  <div className="from-primary/20 to-accent/20 absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                )}

                {/* Header - Non-clickable */}
                <div className="relative z-10 p-3 pb-2">
                  <div className="mb-2 flex items-center justify-between">
                    {isNext ? (
                      <Badge className="bg-primary text-primary-foreground h-5 px-2 text-[9px] font-black shadow-lg">
                        NEXT UP
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="border-border h-5 border-2 px-2 text-[9px] font-bold"
                      >
                        UPCOMING
                      </Badge>
                    )}
                    <div
                      className={`flex h-6 w-6 items-center justify-center rounded-lg ${
                        isNext ? 'bg-primary shadow-md' : 'bg-muted'
                      }`}
                    >
                      <Calendar
                        className={`h-3.5 w-3.5 ${isNext ? 'text-primary-foreground' : 'text-muted-foreground'}`}
                      />
                    </div>
                  </div>

                  {/* Period Code */}
                  <div className="mb-2">
                    <h4
                      className={`mb-1 text-xl font-black tracking-tight ${
                        isNext ? 'text-primary' : 'text-foreground'
                      }`}
                    >
                      {period.code}
                    </h4>
                    <div
                      className={`h-0.5 w-10 rounded-full ${
                        isNext ? 'bg-primary' : 'bg-muted-foreground'
                      }`}
                    />
                  </div>

                  {/* Date Range */}
                  <p
                    className={`text-[10px] leading-tight font-semibold ${
                      isNext ? 'text-primary/80' : 'text-muted-foreground'
                    }`}
                  >
                    {new Date(period.startDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                    {' - '}
                    {new Date(period.endDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                </div>

                {/* Dual-Link Sections */}
                <div className="relative z-10 flex flex-col gap-px">
                  {/* Leave Requests Link */}
                  {period.leaveRequests && period.leaveRequests.total > 0 && (
                    <Link
                      href={`/dashboard/leave?period=${period.code}`}
                      className={`flex flex-col gap-0.5 px-3 py-2 transition-colors ${
                        isNext ? 'hover:bg-primary/10' : 'hover:bg-muted'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <Users
                          className={`h-3 w-3 flex-shrink-0 ${
                            isNext ? 'text-primary' : 'text-muted-foreground'
                          }`}
                        />
                        <span
                          className={`text-[10px] font-bold ${
                            isNext ? 'text-primary' : 'text-foreground'
                          }`}
                        >
                          {period.leaveRequests.total} leave
                          {period.leaveRequests.pending > 0 && (
                            <span className="text-warning ml-0.5">
                              ({period.leaveRequests.pending}p)
                            </span>
                          )}
                        </span>
                        <ArrowRight className="ml-auto h-2.5 w-2.5 opacity-50" />
                      </div>
                      {/* Request Type Breakdown */}
                      {period.leaveRequests.byType &&
                        Object.keys(period.leaveRequests.byType).length > 0 && (
                          <div className="ml-5 flex flex-wrap gap-1">
                            {Object.entries(period.leaveRequests.byType)
                              .sort((a, b) => b[1] - a[1]) // Sort by count descending
                              .slice(0, 3) // Show top 3 types
                              .map(([type, count]) => (
                                <span
                                  key={type}
                                  className={`text-[8px] font-medium ${
                                    isNext ? 'text-primary/80' : 'text-muted-foreground'
                                  }`}
                                >
                                  {type}:{count}
                                </span>
                              ))}
                            {Object.keys(period.leaveRequests.byType).length > 3 && (
                              <span className={`text-muted-foreground text-[8px] font-medium`}>
                                +{Object.keys(period.leaveRequests.byType).length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                    </Link>
                  )}

                  {/* Certification Checks Link */}
                  {period.certChecks && period.certChecks > 0 && (
                    <Link
                      href={`/dashboard/renewal-planning/roster-period/${period.code}`}
                      className={`flex items-center gap-1.5 px-3 py-2 transition-colors ${
                        isNext ? 'hover:bg-primary/10' : 'hover:bg-muted'
                      }`}
                    >
                      <ClipboardCheck
                        className={`h-3 w-3 flex-shrink-0 ${
                          isNext ? 'text-primary' : 'text-muted-foreground'
                        }`}
                      />
                      <span
                        className={`text-[10px] font-bold ${
                          isNext ? 'text-primary' : 'text-foreground'
                        }`}
                      >
                        {period.certChecks} cert{period.certChecks !== 1 ? 's' : ''}
                      </span>
                      <ArrowRight className="ml-auto h-2.5 w-2.5 opacity-50" />
                    </Link>
                  )}

                  {/* Fallback link if no data */}
                  {(!period.leaveRequests || period.leaveRequests.total === 0) &&
                    (!period.certChecks || period.certChecks === 0) && (
                      <Link
                        href={`/dashboard/renewal-planning/roster-period/${period.code}`}
                        className={`flex items-center gap-1.5 px-3 py-2 transition-colors ${
                          isNext ? 'hover:bg-primary/10' : 'hover:bg-muted'
                        }`}
                      >
                        <span
                          className={`text-[10px] font-semibold ${
                            isNext ? 'text-primary' : 'text-muted-foreground'
                          }`}
                        >
                          View Details
                        </span>
                        <ArrowRight className="ml-auto h-2.5 w-2.5 opacity-50" />
                      </Link>
                    )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Pause Indicator - More prominent */}
      {isPaused && (
        <div className="absolute bottom-4 left-1/2 z-20 -translate-x-1/2">
          <Badge className="bg-foreground/90 text-background px-3 py-1.5 text-xs font-semibold shadow-lg backdrop-blur-md">
            ⏸ Paused - Hover to interact
          </Badge>
        </div>
      )}
    </div>
  )
}
