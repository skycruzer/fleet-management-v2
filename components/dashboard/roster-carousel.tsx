'use client'

/**
 * Roster Carousel Component
 *
 * Horizontally-scrollable list of upcoming roster periods.
 * Native overflow-x scroll keeps periods in strict chronological order;
 * arrow buttons appear on hover for click-to-scroll convenience.
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
  const [showScrollControls, setShowScrollControls] = useState(false)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const hasPeriods = periods && periods.length > 0

  const updateScrollButtons = () => {
    const container = scrollContainerRef.current
    if (!container) return
    const { scrollLeft, scrollWidth, clientWidth } = container
    setCanScrollLeft(scrollLeft > 0)
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
  }

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

  const cardWidth = 196 // 180px + 16px gap
  const handleScrollLeft = () => {
    scrollContainerRef.current?.scrollBy({ left: -cardWidth, behavior: 'smooth' })
  }
  const handleScrollRight = () => {
    scrollContainerRef.current?.scrollBy({ left: cardWidth, behavior: 'smooth' })
  }

  return (
    <div
      className="relative"
      onMouseEnter={() => setShowScrollControls(true)}
      onMouseLeave={() => setShowScrollControls(false)}
    >
      {/* Solid Fade Edges */}
      <div className="bg-background pointer-events-none absolute top-0 left-0 z-10 h-full w-4 opacity-80" />
      <div className="bg-background pointer-events-none absolute top-0 right-0 z-10 h-full w-4 opacity-80" />

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
      <div className="bg-muted/50 rounded-lg py-3">
        <div
          ref={scrollContainerRef}
          className="scrollbar-thin flex gap-3 overflow-x-auto px-2"
          style={{ pointerEvents: 'auto' }}
        >
          {periods.map((period) => (
            <div
              key={`${period.code}-${period.year}`}
              className="group border-border bg-card relative flex w-[180px] flex-shrink-0 flex-col overflow-hidden rounded-xl border-2 shadow-md transition-all"
              style={{ pointerEvents: 'auto' }}
            >
              {/* Header */}
              <div className="relative z-10 p-3 pb-2">
                <div className="mb-2 flex items-center justify-between">
                  <Badge
                    variant="outline"
                    className="border-border h-5 border-2 px-2 text-[9px] font-bold"
                  >
                    UPCOMING
                  </Badge>
                  <div className="bg-muted flex h-6 w-6 items-center justify-center rounded-lg">
                    <Calendar className="text-muted-foreground h-3.5 w-3.5" />
                  </div>
                </div>

                {/* Period Code */}
                <div className="mb-2">
                  <h4 className="text-foreground mb-1 text-xl font-black tracking-tight">
                    {period.code}
                  </h4>
                  <div className="bg-muted-foreground h-0.5 w-10 rounded-full" />
                </div>

                {/* Date Range */}
                <p className="text-muted-foreground text-[10px] leading-tight font-semibold">
                  {new Date(period.startDate).toLocaleDateString('en-AU', {
                    month: 'short',
                    day: 'numeric',
                  })}
                  {' - '}
                  {new Date(period.endDate).toLocaleDateString('en-AU', {
                    month: 'short',
                    day: 'numeric',
                    year: '2-digit',
                  })}
                </p>
              </div>

              {/* Dual-Link Sections */}
              <div className="relative z-10 flex flex-col gap-px">
                {/* Leave Requests Link */}
                {period.leaveRequests && period.leaveRequests.total > 0 && (
                  <Link
                    href={`/dashboard/leave?period=${period.code}`}
                    className="hover:bg-muted flex flex-col gap-0.5 px-3 py-2 transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <Users className="text-muted-foreground h-3 w-3 flex-shrink-0" />
                      <span className="text-foreground text-[10px] font-bold">
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
                            .sort((a, b) => b[1] - a[1])
                            .slice(0, 3)
                            .map(([type, count]) => (
                              <span
                                key={type}
                                className="text-muted-foreground text-[8px] font-medium"
                              >
                                {type}:{count}
                              </span>
                            ))}
                          {Object.keys(period.leaveRequests.byType).length > 3 && (
                            <span className="text-muted-foreground text-[8px] font-medium">
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
                    className="hover:bg-muted flex items-center gap-1.5 px-3 py-2 transition-colors"
                  >
                    <ClipboardCheck className="text-muted-foreground h-3 w-3 flex-shrink-0" />
                    <span className="text-foreground text-[10px] font-bold">
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
                      className="hover:bg-muted flex items-center gap-1.5 px-3 py-2 transition-colors"
                    >
                      <span className="text-muted-foreground text-[10px] font-semibold">
                        View Details
                      </span>
                      <ArrowRight className="ml-auto h-2.5 w-2.5 opacity-50" />
                    </Link>
                  )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
