/**
 * Pilot Dashboard Page
 * Developer: Maurice Rondeau
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
import { PageHead } from '@/components/ui/page-head'
import { Clock, AlertTriangle, Calendar, Plane, ShieldCheck, ChevronRight } from 'lucide-react'
import { RetirementInformationCard } from '@/components/pilots/retirement-information-card'
import { LeaveBidStatusCard } from '@/components/portal/leave-bid-status-card'
import { RosterPeriodCard } from '@/components/portal/roster-period-card'
import { CertExpiryCard } from '@/components/portal/cert-expiry-card'

function DashboardSkeleton() {
  return (
    <div className="min-h-screen">
      <div className="border-border bg-background border-b px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
        <div className="animate-shimmer bg-muted h-8 w-64 rounded-lg" />
      </div>
      <main className="space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="animate-shimmer bg-muted h-24 rounded-lg" />
          <div className="animate-shimmer bg-muted h-24 rounded-lg" />
          <div className="animate-shimmer bg-muted h-24 rounded-lg" />
          <div className="animate-shimmer bg-muted h-24 rounded-lg" />
        </div>
        <div className="animate-shimmer bg-muted h-32 rounded-lg" />
        <div className="animate-shimmer bg-muted h-40 rounded-lg" />
      </main>
    </div>
  )
}

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  tone = 'default',
  href,
}: {
  label: string
  value: React.ReactNode
  sub?: React.ReactNode
  icon: React.ElementType
  tone?: 'default' | 'success' | 'warning' | 'danger'
  href?: string
}) {
  const toneClass =
    tone === 'success'
      ? 'text-success'
      : tone === 'warning'
        ? 'text-warning'
        : tone === 'danger'
          ? 'text-destructive'
          : 'text-foreground'

  const card = (
    <Card className="hover:border-foreground/20 hover:bg-muted/40 p-4 transition-colors duration-200">
      <div className="mb-2 flex items-center justify-between">
        <Icon className={`h-5 w-5 ${toneClass}`} aria-hidden="true" />
        {href && <ChevronRight className="text-muted-foreground h-4 w-4" aria-hidden="true" />}
      </div>
      <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${toneClass}`}>{value}</p>
      {sub && <p className="text-muted-foreground mt-0.5 text-xs">{sub}</p>}
    </Card>
  )

  return href ? <Link href={href}>{card}</Link> : card
}

async function PilotDashboardContent({ pilotUser }: { pilotUser: any }) {
  const statsResult = await getPilotPortalStats(pilotUser.pilot_id || pilotUser.id)
  const stats = statsResult.success && statsResult.data ? statsResult.data : null

  let pilotData = null
  if (pilotUser.pilot_id) {
    const { getPilotDetailsWithRetirement } = await import('@/lib/services/pilot-portal-service')
    const pilotResult = await getPilotDetailsWithRetirement(pilotUser.pilot_id)
    pilotData = pilotResult.success ? pilotResult.data : null
  }

  const retirementAge = 65
  const fullName = pilotData
    ? [pilotData.first_name, pilotData.middle_name, pilotData.last_name].filter(Boolean).join(' ')
    : [pilotUser.first_name, pilotUser.middle_name, pilotUser.last_name].filter(Boolean).join(' ')

  const { getPilotLeaveBids } = await import('@/lib/services/pilot-portal-service')
  const leaveBidsResult = await getPilotLeaveBids(pilotUser.pilot_id || pilotUser.id, 5)
  const leaveBids = leaveBidsResult.success ? leaveBidsResult.data : []

  const complianceTone =
    !stats || stats.compliance_rate >= 90
      ? 'success'
      : stats.compliance_rate >= 70
        ? 'warning'
        : 'danger'

  const hasExpired = (stats?.expired_certifications || 0) > 0
  const hasCritical = (stats?.critical_certifications || 0) > 0
  const hasUpcoming = (stats?.upcoming_checks || 0) > 0
  const hasAnyCertAttention = hasExpired || hasCritical || hasUpcoming

  return (
    <div className="min-h-screen">
      <PageHead
        title={`Welcome, ${pilotUser.rank} ${pilotUser.first_name} ${pilotUser.last_name}`}
        description={
          stats
            ? `${stats.compliance_rate}% compliance · ${stats.total_certifications} certifications tracked`
            : undefined
        }
      />

      <main className="space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {/* Overview KPIs */}
        {stats && (
          <section>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <StatCard
                label="Compliance"
                value={`${stats.compliance_rate}%`}
                sub={`${stats.active_certifications}/${stats.total_certifications} current`}
                icon={ShieldCheck}
                tone={complianceTone}
                href="/portal/certifications"
              />
              <StatCard
                label="Expiring · 30d"
                value={(stats.critical_certifications || 0) + (stats.caution_certifications || 0)}
                sub={hasExpired ? `${stats.expired_certifications} expired` : 'action required'}
                icon={AlertTriangle}
                tone={hasExpired || hasCritical ? 'danger' : hasUpcoming ? 'warning' : 'success'}
                href="/portal/certifications"
              />
              <StatCard
                label="Pending leave"
                value={stats.pending_leave_requests || 0}
                sub="awaiting review"
                icon={Calendar}
                href="/portal/requests?tab=leave"
              />
              <StatCard
                label="Pending RDO/SDO"
                value={stats.pending_flight_requests || 0}
                sub="awaiting review"
                icon={Plane}
                href="/portal/requests?tab=rdo-sdo"
              />
            </div>
          </section>
        )}

        {/* Roster period */}
        <section>
          <RosterPeriodCard />
        </section>

        {/* Certification attention — consolidated from prior duplicate sections */}
        {stats && hasAnyCertAttention && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-foreground text-base font-semibold tracking-tight">
                Certifications requiring attention
              </h2>
              <Link
                href="/portal/certifications"
                className="text-muted-foreground hover:text-foreground text-sm"
              >
                View all →
              </Link>
            </div>
            {hasExpired && (
              <CertExpiryCard
                variant="expired"
                title="Expired"
                description={`${stats.expired_certifications} certification${stats.expired_certifications !== 1 ? 's' : ''} expired — renew immediately.`}
                checks={stats.expired_certifications_details ?? []}
              />
            )}
            {hasCritical && (
              <CertExpiryCard
                variant="danger"
                title="Critical — within 14 days"
                description={`${stats.critical_certifications} certification${stats.critical_certifications !== 1 ? 's' : ''} expiring soon.`}
                checks={stats.critical_certifications_details ?? []}
              />
            )}
            {hasUpcoming && (
              <CertExpiryCard
                variant="warning"
                title="Upcoming — within 60 days"
                description={`${stats.upcoming_checks} certification${stats.upcoming_checks !== 1 ? 's' : ''} — plan renewals.`}
                checks={stats.upcoming_checks_details ?? []}
              />
            )}
          </section>
        )}

        {/* Leave bid status */}
        <section>
          <LeaveBidStatusCard bids={(leaveBids as any) || []} />
        </section>

        {/* Retirement */}
        {pilotData && (
          <section>
            <RetirementInformationCard
              dateOfBirth={pilotData.date_of_birth}
              commencementDate={pilotData.commencement_date}
              retirementAge={retirementAge}
              pilotName={fullName}
            />
          </section>
        )}

        {/* Quick actions */}
        <section className="space-y-3">
          <h2 className="text-foreground text-base font-semibold tracking-tight">Quick actions</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Link href="/portal/leave-requests/new" className="group">
              <Card className="hover:border-foreground/20 hover:bg-muted/40 flex items-center gap-4 p-4 transition-colors duration-200">
                <div className="bg-muted flex h-10 w-10 shrink-0 items-center justify-center rounded-md">
                  <Calendar className="text-foreground h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-foreground text-sm font-semibold">Submit leave request</h3>
                  <p className="text-muted-foreground text-xs">Annual, sick, LSL, LWOP, and more</p>
                </div>
              </Card>
            </Link>
            <Link href="/portal/flight-requests/new" className="group">
              <Card className="hover:border-foreground/20 hover:bg-muted/40 flex items-center gap-4 p-4 transition-colors duration-200">
                <div className="bg-muted flex h-10 w-10 shrink-0 items-center justify-center rounded-md">
                  <Plane className="text-foreground h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-foreground text-sm font-semibold">Submit RDO/SDO</h3>
                  <p className="text-muted-foreground text-xs">Request a rest-day change</p>
                </div>
              </Card>
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}

export default async function PilotDashboardPage() {
  const pilotUser = await getAuthPilot()

  if (!pilotUser) {
    redirect('/portal/login')
  }

  if (!pilotUser.registration_approved) {
    return (
      <div className="bg-muted/30 flex min-h-screen items-center justify-center p-6">
        <Card className="max-w-md p-8 text-center">
          <div className="mb-4 flex justify-center">
            <div className="rounded-full bg-[var(--color-info-bg)] p-4">
              <Clock className="h-12 w-12 text-[var(--color-info)]" aria-hidden="true" />
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
                className="text-[var(--color-info)] hover:underline"
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
