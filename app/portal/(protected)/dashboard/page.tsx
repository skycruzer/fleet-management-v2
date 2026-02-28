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
import { Suspense } from 'react'
import { portalMetadata } from '@/lib/utils/metadata'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const metadata: Metadata = portalMetadata.dashboard
import { getCurrentPilot as getAuthPilot } from '@/lib/auth/pilot-helpers'
import { getPilotPortalStats } from '@/lib/services/pilot-portal-service'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Clock, AlertTriangle, XCircle, Calendar, Plane, ShieldCheck, ChevronRight } from 'lucide-react'
import { RetirementInformationCard } from '@/components/pilots/retirement-information-card'
import { LeaveBidStatusCard } from '@/components/portal/leave-bid-status-card'
import { RosterPeriodCard } from '@/components/portal/roster-period-card'
import { CertExpiryCard } from '@/components/portal/cert-expiry-card'

function DashboardSkeleton() {
  return (
    <div className="min-h-screen">
      {/* Page Header Skeleton */}
      <div className="border-border bg-background border-b px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
        <div className="space-y-2">
          <div className="animate-shimmer bg-muted h-8 w-64 rounded-lg" />
        </div>
      </div>

      <main className="px-4 py-6 sm:px-6 sm:py-8 lg:px-8 space-y-8">
        {/* Roster Period Skeleton */}
        <div className="animate-shimmer bg-muted h-32 rounded-lg" />

        {/* Certification Compliance Skeleton */}
        <div className="animate-shimmer bg-muted h-24 rounded-lg" />

        {/* Multiple Card Skeletons */}
        <div className="space-y-4">
          <div className="animate-shimmer bg-muted h-6 w-48 rounded-lg" />
          <div className="animate-shimmer bg-muted h-28 rounded-lg" />
        </div>

        {/* Quick Actions Skeleton */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="animate-shimmer bg-muted h-24 rounded-lg" />
          <div className="animate-shimmer bg-muted h-24 rounded-lg" />
        </div>

        {/* Statistics Cards Skeleton */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="animate-shimmer bg-muted h-28 rounded-lg" />
          <div className="animate-shimmer bg-muted h-28 rounded-lg" />
        </div>
      </main>
    </div>
  )
}

async function PilotDashboardContent({ pilotUser }: { pilotUser: any }) {
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
      <div className="border-border bg-background border-b px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
        <div>
          <h1 className="text-foreground text-xl font-semibold tracking-tight lg:text-2xl">
            Welcome, {pilotUser.rank} {pilotUser.first_name} {pilotUser.last_name}
          </h1>
        </div>
      </div>

      <main className="px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {/* Roster Period Display */}
        <div className="mb-8">
          <RosterPeriodCard />
        </div>

        {/* Certification Compliance */}
        {stats && (
          <div className="mb-8">
            <Link href="/portal/certifications">
              <Card className="hover:border-foreground/20 hover:bg-muted/40 p-5 transition-all duration-200">
                <div className="mb-2 flex items-center justify-between">
                  <ShieldCheck
                    className={`h-6 w-6 ${
                      stats.compliance_rate >= 90
                        ? 'text-success'
                        : stats.compliance_rate >= 70
                          ? 'text-warning'
                          : 'text-destructive'
                    }`}
                    aria-hidden="true"
                  />
                  <ChevronRight className="text-muted-foreground h-4 w-4" aria-hidden="true" />
                </div>
                <h3 className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                  Certification Compliance
                </h3>
                <div className="mt-2 space-y-1">
                  <p
                    className={`text-2xl font-semibold ${
                      stats.compliance_rate >= 90
                        ? 'text-success'
                        : stats.compliance_rate >= 70
                          ? 'text-warning'
                          : 'text-destructive'
                    }`}
                  >
                    {stats.compliance_rate}%
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {stats.active_certifications} of {stats.total_certifications} certifications
                    current
                  </p>
                </div>
              </Card>
            </Link>
          </div>
        )}

        {/* 30-Day Expiry Countdown */}
        {stats &&
          ((stats.critical_certifications || 0) > 0 || (stats.caution_certifications || 0) > 0) && (
            <div className="mb-8 space-y-4">
              <h2 className="text-foreground text-lg font-semibold tracking-tight">
                30-Day Expiry Countdown
              </h2>
              <CertExpiryCard
                variant="danger"
                title="Warning — Expiring within 14 days"
                description=""
                checks={stats.critical_certifications_details ?? []}
              />
              <CertExpiryCard
                variant="warning"
                title="Caution — Expiring within 15–30 days"
                description=""
                checks={stats.caution_certifications_details ?? []}
              />
            </div>
          )}

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

        {/* Certification Status Summary */}
        {((stats?.expired_certifications || 0) > 0 ||
          (stats?.critical_certifications || 0) > 0 ||
          (stats?.upcoming_checks || 0) > 0) && (
          <div className="mb-8 space-y-4">
            <h2 className="text-foreground text-lg font-semibold tracking-tight">
              Certification Status
            </h2>
            <CertExpiryCard
              variant="expired"
              title="Expired Certifications"
              description={`You have ${stats?.expired_certifications || 0} expired certification${(stats?.expired_certifications || 0) !== 1 ? 's' : ''}. Please renew immediately.`}
              checks={stats?.expired_certifications_details ?? []}
            />
            <CertExpiryCard
              variant="danger"
              title="Critical — Expiring Within 2 Weeks"
              description={`${stats?.critical_certifications || 0} certification${(stats?.critical_certifications || 0) !== 1 ? 's' : ''} expiring soon. Action required.`}
              checks={stats?.critical_certifications_details ?? []}
            />
            <CertExpiryCard
              variant="warning"
              title="Upcoming — Expiring Within 60 Days"
              description={`${stats?.upcoming_checks || 0} certification${(stats?.upcoming_checks || 0) !== 1 ? 's' : ''} expiring soon. Plan renewals accordingly.`}
              checks={stats?.upcoming_checks_details ?? []}
            />
          </div>
        )}

        {/* Quick Actions */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Link href="/portal/leave-requests/new" className="group">
            <Card className="hover:border-primary/30 hover:bg-muted/40 flex items-center gap-4 p-5 transition-all duration-200">
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
            <Card className="hover:border-primary/30 hover:bg-muted/40 flex items-center gap-4 p-5 transition-all duration-200">
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
            <Card className="hover:border-foreground/20 hover:bg-muted/40 p-5 transition-all duration-200">
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
            <Card className="hover:border-foreground/20 hover:bg-muted/40 p-5 transition-all duration-200">
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

export default async function PilotDashboardPage() {
  // Get pilot user data (layout already handles authentication, this is just for data)
  const pilotUser = await getAuthPilot()

  // This should never happen because layout redirects, but keep as safeguard
  if (!pilotUser) {
    redirect('/portal/login')
  }

  if (!pilotUser.registration_approved) {
    return (
      <div className="bg-muted/30 flex min-h-screen items-center justify-center p-6">
        <Card className="max-w-md p-8 text-center">
          <div className="mb-4 flex justify-center">
            <div className="bg-primary/10 rounded-full p-4">
              <Clock className="text-primary h-12 w-12" aria-hidden="true" />
            </div>
          </div>
          <h2 className="text-foreground mb-2 text-2xl font-bold">Registration Pending</h2>
          <p className="text-muted-foreground mb-6">
            Your pilot portal registration is pending approval by fleet management. You will receive
            an email once your account is activated.
          </p>
          <div className="border-border mb-6 rounded-lg border p-4 text-left">
            <p className="text-foreground mb-1 text-sm font-medium">Need urgent access?</p>
            <p className="text-muted-foreground text-sm">
              Contact your fleet management administrator or email{' '}
              <a
                href="mailto:support@pxb767office.app"
                className="text-primary hover:underline"
              >
                support@pxb767office.app
              </a>
            </p>
          </div>
          <Link href="/portal">
            <Button variant="outline">Back to Home</Button>
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <PilotDashboardContent pilotUser={pilotUser} />
    </Suspense>
  )
}
