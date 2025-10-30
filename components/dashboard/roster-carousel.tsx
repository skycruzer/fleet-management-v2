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
import { Calendar, ArrowRight, Users, ClipboardCheck, ChevronLeft, ChevronRight } from 'lucide-react'
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

  // Duplicate periods for seamless infinite scroll
  const duplicatedPeriods = [...periods, ...periods]

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

  // Set up scroll listener
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    container.addEventListener('scroll', updateScrollButtons)
    updateScrollButtons()

    return () => {
      container.removeEventListener('scroll', updateScrollButtons)
    }
  }, [periods])

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
      <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-16 bg-gradient-to-r from-white via-white/80 to-transparent dark:from-slate-900 dark:via-slate-900/80" />
      <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-16 bg-gradient-to-l from-white via-white/80 to-transparent dark:from-slate-900 dark:via-slate-900/80" />

      {/* Left Navigation Button */}
      {showScrollControls && canScrollLeft && (
        <button
          onClick={handleScrollLeft}
          className="absolute left-2 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white p-2 shadow-lg transition-all hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700"
          aria-label="Scroll left"
        >
          <ChevronLeft className="h-5 w-5 text-slate-700 dark:text-slate-300" />
        </button>
      )}

      {/* Right Navigation Button */}
      {showScrollControls && canScrollRight && (
        <button
          onClick={handleScrollRight}
          className="absolute right-2 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white p-2 shadow-lg transition-all hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700"
          aria-label="Scroll right"
        >
          <ChevronRight className="h-5 w-5 text-slate-700 dark:text-slate-300" />
        </button>
      )}

      {/* Scrolling Container */}
      <div
        className="overflow-hidden rounded-lg bg-slate-50/50 py-3 dark:bg-slate-800/50"
      >
        <div
          ref={scrollContainerRef}
          className="flex gap-3 px-2 animate-scroll"
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
                    ? 'border-blue-500 bg-gradient-to-br from-blue-100 via-blue-50 to-indigo-100 dark:border-blue-600 dark:from-blue-950 dark:via-blue-900 dark:to-indigo-950'
                    : 'border-slate-300 bg-gradient-to-br from-white via-slate-50 to-slate-100 dark:border-slate-600 dark:from-slate-800 dark:via-slate-800 dark:to-slate-900'
                }`}
                style={{ pointerEvents: 'auto' }}
              >
                {/* Animated Background Glow */}
                {isNext && (
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                )}

                {/* Header - Non-clickable */}
                <div className="relative z-10 p-3 pb-2">
                  <div className="mb-2 flex items-center justify-between">
                    {isNext ? (
                      <Badge className="h-5 bg-blue-600 px-2 text-[9px] font-black text-white shadow-lg">
                        NEXT UP
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="h-5 border-2 border-slate-400 px-2 text-[9px] font-bold dark:border-slate-500"
                      >
                        UPCOMING
                      </Badge>
                    )}
                    <div
                      className={`flex h-6 w-6 items-center justify-center rounded-lg ${
                        isNext
                          ? 'bg-blue-600 shadow-md'
                          : 'bg-slate-300 dark:bg-slate-600'
                      }`}
                    >
                      <Calendar
                        className={`h-3.5 w-3.5 ${isNext ? 'text-white' : 'text-slate-600 dark:text-slate-300'}`}
                      />
                    </div>
                  </div>

                  {/* Period Code */}
                  <div className="mb-2">
                    <h4
                      className={`mb-1 text-xl font-black tracking-tight ${
                        isNext
                          ? 'text-blue-900 dark:text-blue-100'
                          : 'text-slate-900 dark:text-white'
                      }`}
                    >
                      {period.code}
                    </h4>
                    <div
                      className={`h-0.5 w-10 rounded-full ${
                        isNext
                          ? 'bg-blue-600'
                          : 'bg-slate-400 dark:bg-slate-500'
                      }`}
                    />
                  </div>

                  {/* Date Range */}
                  <p
                    className={`text-[10px] font-semibold leading-tight ${
                      isNext
                        ? 'text-blue-800 dark:text-blue-200'
                        : 'text-slate-700 dark:text-slate-300'
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
                        isNext
                          ? 'hover:bg-blue-200/50 dark:hover:bg-blue-900/30'
                          : 'hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <Users
                          className={`h-3 w-3 flex-shrink-0 ${
                            isNext
                              ? 'text-blue-600 dark:text-blue-400'
                              : 'text-slate-600 dark:text-slate-400'
                          }`}
                        />
                        <span
                          className={`text-[10px] font-bold ${
                            isNext
                              ? 'text-blue-700 dark:text-blue-300'
                              : 'text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {period.leaveRequests.total} leave
                          {period.leaveRequests.pending > 0 && (
                            <span className="ml-0.5 text-orange-600 dark:text-orange-400">
                              ({period.leaveRequests.pending}p)
                            </span>
                          )}
                        </span>
                        <ArrowRight className="ml-auto h-2.5 w-2.5 opacity-50" />
                      </div>
                      {/* Request Type Breakdown */}
                      {period.leaveRequests.byType && Object.keys(period.leaveRequests.byType).length > 0 && (
                        <div className="ml-5 flex flex-wrap gap-1">
                          {Object.entries(period.leaveRequests.byType)
                            .sort((a, b) => b[1] - a[1]) // Sort by count descending
                            .slice(0, 3) // Show top 3 types
                            .map(([type, count]) => (
                              <span
                                key={type}
                                className={`text-[8px] font-medium ${
                                  isNext
                                    ? 'text-blue-600 dark:text-blue-400'
                                    : 'text-slate-600 dark:text-slate-400'
                                }`}
                              >
                                {type}:{count}
                              </span>
                            ))}
                          {Object.keys(period.leaveRequests.byType).length > 3 && (
                            <span
                              className={`text-[8px] font-medium ${
                                isNext
                                  ? 'text-blue-500 dark:text-blue-500'
                                  : 'text-slate-500 dark:text-slate-500'
                              }`}
                            >
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
                        isNext
                          ? 'hover:bg-blue-200/50 dark:hover:bg-blue-900/30'
                          : 'hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
                      }`}
                    >
                      <ClipboardCheck
                        className={`h-3 w-3 flex-shrink-0 ${
                          isNext
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-slate-600 dark:text-slate-400'
                        }`}
                      />
                      <span
                        className={`text-[10px] font-bold ${
                          isNext
                            ? 'text-blue-700 dark:text-blue-300'
                            : 'text-slate-700 dark:text-slate-300'
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
                          isNext
                            ? 'hover:bg-blue-200/50 dark:hover:bg-blue-900/30'
                            : 'hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
                        }`}
                      >
                        <span
                          className={`text-[10px] font-semibold ${
                            isNext
                              ? 'text-blue-700 dark:text-blue-300'
                              : 'text-slate-600 dark:text-slate-400'
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
          <Badge className="shadow-lg backdrop-blur-md bg-slate-900/90 px-3 py-1.5 text-xs font-semibold text-white dark:bg-white/90 dark:text-slate-900">
            ⏸ Paused - Hover to interact
          </Badge>
        </div>
      )}
    </div>
  )
}
