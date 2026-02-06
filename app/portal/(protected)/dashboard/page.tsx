/**
 * Pilot Dashboard Page
 * Developer: Maurice Rondeau
 *
 * Personal stats, quick actions, and activity overview for pilots.
 * Includes: Stats overview, leave bids, roster period info, retirement card.
 *
 * Future enhancements (P3):
 * - Certifications expiry timeline
 * - Recent leave/flight requests summary
 */

export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { portalMetadata } from '@/lib/utils/metadata'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const metadata: Metadata = portalMetadata.dashboard
import { getCurrentPilot as getAuthPilot } from '@/lib/auth/pilot-helpers'
import { getPilotPortalStats } from '@/lib/services/pilot-portal-service'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Clock, AlertTriangle, XCircle, Calendar, Plane } from 'lucide-react'
import { RetirementInformationCard } from '@/components/pilots/RetirementInformationCard'
import { LeaveBidStatusCard } from '@/components/portal/leave-bid-status-card'
import { RosterPeriodCard } from '@/components/portal/roster-period-card'

export default async function PilotDashboardPage() {
  // Get pilot user data (layout already handles authentication, this is just for data)
  const pilotUser = await getAuthPilot()

  // This should never happen because layout redirects, but keep as safeguard
  if (!pilotUser) {
    redirect('/portal/login')
  }

  if (!pilotUser.registration_approved) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white/[0.03] p-6">
        <Card className="max-w-md p-8 text-center">
          <div className="mb-4 flex justify-center">
            <Clock className="text-primary h-16 w-16" aria-hidden="true" />
          </div>
          <h2 className="text-foreground mb-2 text-2xl font-bold">Registration Pending</h2>
          <p className="text-muted-foreground mb-4">
            Your pilot portal registration is pending approval by fleet management. You will receive
            an email once your account is activated.
          </p>
          <Link href="/portal">
            <Button variant="outline">Back to Home</Button>
          </Link>
        </Card>
      </div>
    )
  }

  // Fetch pilot portal stats using the pilots table ID
  const statsResult = await getPilotPortalStats(pilotUser.pilot_id || pilotUser.id)
  const stats = statsResult.success && statsResult.data ? statsResult.data : null

  // Fetch complete pilot data from pilots table for retirement info using service layer
  let pilotData = null
  if (pilotUser.pilot_id) {
    const { getPilotDetailsWithRetirement } = await import('@/lib/services/pilot-portal-service')
    const pilotResult = await getPilotDetailsWithRetirement(pilotUser.pilot_id)
    pilotData = pilotResult.success ? pilotResult.data : null
  }

  // Use default retirement age (system_settings table doesn't exist yet)
  const retirementAge = 65
  const fullName = pilotData
    ? [pilotData.first_name, pilotData.middle_name, pilotData.last_name].filter(Boolean).join(' ')
    : [pilotUser.first_name, pilotUser.middle_name, pilotUser.last_name].filter(Boolean).join(' ')

  // Fetch leave bids for this pilot using service layer
  const { getPilotLeaveBids } = await import('@/lib/services/pilot-portal-service')
  const leaveBidsResult = await getPilotLeaveBids(pilotUser.pilot_id || pilotUser.id, 5)
  const leaveBids = leaveBidsResult.success ? leaveBidsResult.data : []

  return (
    <div className="min-h-screen">
      {/* Page Header - Linear-inspired: clean, minimal border */}
      <div className="border-border bg-background border-b px-8 py-6">
        <div>
          <h1 className="text-foreground text-xl font-semibold tracking-tight lg:text-2xl">
            Welcome, {pilotUser.rank} {pilotUser.first_name} {pilotUser.last_name}
          </h1>
        </div>
      </div>

      <main className="px-8 py-8">
        {/* Roster Period Display */}
        <div className="mb-8">
          <RosterPeriodCard />
        </div>

        {/* Retirement Information Card - Moved from Profile */}
        {pilotData && (
          <div className="mb-8">
            <RetirementInformationCard
              dateOfBirth={pilotData.date_of_birth}
              commencementDate={pilotData.commencement_date}
              retirementAge={retirementAge}
              pilotName={fullName}
            />
          </div>
        )}

        {/* Leave Bid Status */}
        <div className="mb-8">
          <LeaveBidStatusCard bids={(leaveBids as any) || []} />
        </div>

        {/* Certification Summary - Always show if there are any warnings */}
        {((stats?.expired_certifications || 0) > 0 ||
          (stats?.critical_certifications || 0) > 0 ||
          (stats?.upcoming_checks || 0) > 0) && (
          <div className="mb-8 space-y-4">
            <h2 className="text-foreground text-lg font-semibold tracking-tight">
              Certification Status
            </h2>
            {/* Expired Certifications Alert */}
            {(stats?.expired_certifications || 0) > 0 && (
              <Card className="border-[var(--color-danger-500)]/20 bg-[var(--color-danger-500)]/10 p-6">
                <div className="flex items-start space-x-4">
                  <XCircle className="h-8 w-8 text-[var(--color-danger-400)]" aria-hidden="true" />
                  <div className="flex-1">
                    <h3 className="text-foreground mb-2 text-lg font-semibold text-[var(--color-danger-400)]">
                      Expired Certifications
                    </h3>
                    <p className="mb-4 text-[var(--color-danger-400)]/80">
                      You have {stats?.expired_certifications || 0} expired certification
                      {(stats?.expired_certifications || 0) !== 1 ? 's' : ''}. Please renew
                      immediately.
                    </p>
                    {stats?.expired_certifications_details &&
                      stats.expired_certifications_details.length > 0 && (
                        <div className="space-y-2">
                          {stats.expired_certifications_details.map((check) => {
                            const expiryDate = new Date(check.expiry_date)
                            const today = new Date()
                            const daysExpired = Math.abs(
                              Math.ceil(
                                (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
                              )
                            )

                            return (
                              <div
                                key={check.id}
                                className="bg-card flex items-start justify-between rounded border border-[var(--color-danger-500)]/20 p-3"
                              >
                                <div className="flex-1">
                                  <p className="font-semibold text-[var(--color-danger-400)]">
                                    {check.check_code}
                                  </p>
                                  <p className="text-sm text-[var(--color-danger-400)]/80">
                                    {check.check_description}
                                  </p>
                                </div>
                                <div className="ml-2 text-right">
                                  <p className="font-bold text-[var(--color-danger-400)]">
                                    Expired {daysExpired} days ago
                                  </p>
                                  <p className="text-sm text-[var(--color-danger-400)]/70">
                                    {expiryDate.toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric',
                                    })}
                                  </p>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                  </div>
                </div>
              </Card>
            )}

            {/* Critical Certifications Alert (< 2 weeks) */}
            {(stats?.critical_certifications || 0) > 0 && (
              <Card className="border-[var(--color-badge-orange)]/20 bg-[var(--color-badge-orange)]/10 p-6">
                <div className="flex items-start space-x-4">
                  <AlertTriangle
                    className="h-8 w-8 text-[var(--color-badge-orange)]"
                    aria-hidden="true"
                  />
                  <div className="flex-1">
                    <h3 className="text-foreground mb-2 text-lg font-semibold text-[var(--color-badge-orange)]">
                      Critical: Certifications Expiring Soon
                    </h3>
                    <p className="mb-4 text-[var(--color-badge-orange)]/80">
                      You have {stats?.critical_certifications || 0} certification
                      {(stats?.critical_certifications || 0) !== 1 ? 's' : ''} expiring within the
                      next 2 weeks. Action required.
                    </p>
                    {stats?.critical_certifications_details &&
                      stats.critical_certifications_details.length > 0 && (
                        <div className="space-y-2">
                          {stats.critical_certifications_details.map((check) => {
                            const expiryDate = new Date(check.expiry_date)
                            const today = new Date()
                            const daysUntil = Math.ceil(
                              (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
                            )

                            return (
                              <div
                                key={check.id}
                                className="bg-card flex items-start justify-between rounded border border-[var(--color-badge-orange)]/20 p-3"
                              >
                                <div className="flex-1">
                                  <p className="font-semibold text-[var(--color-badge-orange)]">
                                    {check.check_code}
                                  </p>
                                  <p className="text-sm text-[var(--color-badge-orange)]/80">
                                    {check.check_description}
                                  </p>
                                </div>
                                <div className="ml-2 text-right">
                                  <p className="font-bold text-[var(--color-badge-orange)]">
                                    {daysUntil} days remaining
                                  </p>
                                  <p className="text-sm text-[var(--color-badge-orange)]/70">
                                    {expiryDate.toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric',
                                    })}
                                  </p>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                  </div>
                </div>
              </Card>
            )}

            {/* Warning Certifications Alert (upcoming checks within 60 days) */}
            {(stats?.upcoming_checks || 0) > 0 && (
              <Card className="border-[var(--color-warning-500)]/20 bg-[var(--color-warning-500)]/10 p-6">
                <div className="flex items-start space-x-3">
                  <AlertTriangle
                    className="h-8 w-8 text-[var(--color-warning-400)]"
                    aria-hidden="true"
                  />
                  <div className="flex-1">
                    <h3 className="text-foreground mb-2 text-lg font-semibold text-[var(--color-warning-400)]">
                      Warning: Upcoming Certifications
                    </h3>
                    <p className="mb-4 text-[var(--color-warning-400)]/80">
                      You have {stats?.upcoming_checks || 0} certification
                      {(stats?.upcoming_checks || 0) !== 1 ? 's' : ''} expiring within the next 60
                      days. Plan renewals accordingly.
                    </p>
                    {stats?.upcoming_checks_details && stats.upcoming_checks_details.length > 0 && (
                      <div className="space-y-2">
                        {stats.upcoming_checks_details.map((check) => {
                          const expiryDate = new Date(check.expiry_date)
                          const today = new Date()
                          const daysUntil = Math.ceil(
                            (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
                          )

                          return (
                            <div
                              key={check.id}
                              className="bg-card flex items-start justify-between rounded border border-[var(--color-warning-500)]/20 p-3"
                            >
                              <div className="flex-1">
                                <p className="font-semibold text-[var(--color-warning-400)]">
                                  {check.check_code}
                                </p>
                                <p className="text-sm text-[var(--color-warning-400)]/80">
                                  {check.check_description}
                                </p>
                              </div>
                              <div className="ml-2 text-right">
                                <p className="font-bold text-[var(--color-warning-400)]">
                                  {daysUntil} days remaining
                                </p>
                                <p className="text-sm text-[var(--color-warning-400)]/70">
                                  {expiryDate.toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                  })}
                                </p>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Quick Actions */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Link href="/portal/leave-requests/new" className="group">
            <Card className="hover:border-primary/30 flex items-center gap-4 p-5 transition-all duration-200 hover:bg-white/[0.04]">
              <div className="bg-primary/10 flex h-12 w-12 shrink-0 items-center justify-center rounded-lg">
                <Calendar className="text-primary h-6 w-6" aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-foreground group-hover:text-primary font-semibold">
                  Submit Leave Request
                </h3>
                <p className="text-muted-foreground text-sm">Request time off</p>
              </div>
            </Card>
          </Link>
          <Link href="/portal/flight-requests/new" className="group">
            <Card className="hover:border-primary/30 flex items-center gap-4 p-5 transition-all duration-200 hover:bg-white/[0.04]">
              <div className="bg-primary/10 flex h-12 w-12 shrink-0 items-center justify-center rounded-lg">
                <Plane className="text-primary h-6 w-6" aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-foreground group-hover:text-primary font-semibold">
                  Submit RDO/SDO Request
                </h3>
                <p className="text-muted-foreground text-sm">Request rest day changes</p>
              </div>
            </Card>
          </Link>
        </div>

        {/* Statistics Cards - Linear-inspired: clean, minimal */}
        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Pending Leave Requests */}
          <Link href="/portal/requests?tab=leave">
            <Card className="hover:border-foreground/20 p-5 transition-all duration-200 hover:bg-white/[0.04]">
              <div className="mb-2 flex items-center justify-between">
                <Calendar className="text-accent h-6 w-6" aria-hidden="true" />
              </div>
              <h3 className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                Leave Requests
              </h3>
              <div className="mt-2 space-y-1">
                <p className="text-foreground text-2xl font-semibold">
                  {stats?.pending_leave_requests || 0}
                </p>
                <p className="text-muted-foreground text-xs">Pending requests</p>
              </div>
            </Card>
          </Link>

          {/* RDO/SDO Requests */}
          <Link href="/portal/requests?tab=rdo-sdo">
            <Card className="hover:border-foreground/20 p-5 transition-all duration-200 hover:bg-white/[0.04]">
              <div className="mb-2 flex items-center justify-between">
                <Plane className="text-accent h-6 w-6" aria-hidden="true" />
              </div>
              <h3 className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                RDO/SDO Requests
              </h3>
              <div className="mt-2 space-y-1">
                <p className="text-foreground text-2xl font-semibold">
                  {stats?.pending_flight_requests || 0}
                </p>
                <p className="text-muted-foreground text-xs">Pending requests</p>
              </div>
            </Card>
          </Link>
        </div>
      </main>
    </div>
  )
}
