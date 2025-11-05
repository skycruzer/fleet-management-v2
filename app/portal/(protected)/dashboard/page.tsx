/**
 * Pilot Dashboard Page
 * Personal stats, quick actions, and activity overview for pilots
 *
 * TEMPORARY SIMPLIFIED VERSION
 * TODO: Implement full dashboard with:
 * - getPilotDashboardStats()
 * - getPilotCertifications()
 * - getPilotLeaveRequests()
 * - getPilotFlightRequests()
 */

export const dynamic = 'force-dynamic'

import { portalMetadata } from '@/lib/utils/metadata'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const metadata = portalMetadata.dashboard
import { createClient } from '@/lib/supabase/server'
import { getCurrentPilot as getAuthPilot } from '@/lib/auth/pilot-helpers'
import { getPilotPortalStats } from '@/lib/services/pilot-portal-service'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Clock,
  CheckCircle,
  AlertTriangle,
  UserCircle,
  XCircle,
  Calendar,
  Plane,
} from 'lucide-react'
import { RetirementInformationCard } from '@/components/pilots/RetirementInformationCard'
import { LeaveBidStatusCard } from '@/components/portal/leave-bid-status-card'

export default async function PilotDashboardPage() {
  const supabase = await createClient()

  // Get pilot user data (layout already handles authentication, this is just for data)
  const pilotUser = await getAuthPilot()

  // This should never happen because layout redirects, but keep as safeguard
  if (!pilotUser) {
    redirect('/portal/login')
  }

  if (!pilotUser.registration_approved) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900 p-6">
        <Card className="max-w-md p-8 text-center">
          <div className="mb-4 flex justify-center">
            <Clock className="h-16 w-16 text-primary" aria-hidden="true" />
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

  // Fetch complete pilot data from pilots table for retirement info
  let pilotData = null
  if (pilotUser.pilot_id) {
    const { data: pilot } = await supabase
      .from('pilots')
      .select('id, first_name, last_name, middle_name, date_of_birth, commencement_date')
      .eq('id', pilotUser.pilot_id)
      .single()

    pilotData = pilot
  }

  // Use default retirement age (system_settings table doesn't exist yet)
  const retirementAge = 65
  const fullName = pilotData
    ? [pilotData.first_name, pilotData.middle_name, pilotData.last_name].filter(Boolean).join(' ')
    : [pilotUser.first_name, pilotUser.middle_name, pilotUser.last_name].filter(Boolean).join(' ')

  // Fetch leave bids for this pilot
  const { data: leaveBids } = await supabase
    .from('leave_bids')
    .select(
      `
      id,
      roster_period_code,
      status,
      created_at,
      updated_at,
      leave_bid_options (
        id,
        priority,
        start_date,
        end_date
      )
    `
    )
    .eq('pilot_id', pilotUser.pilot_id || pilotUser.id)
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <div className="min-h-screen">
      {/* Page Header */}
      <div className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-8 py-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Welcome, {pilotUser.rank} {pilotUser.first_name} {pilotUser.last_name}
          </h1>
        </div>
      </div>

      <main className="px-8 py-8">
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
            <h2 className="text-xl font-bold text-foreground">Certification Status</h2>
            {/* Expired Certifications Alert */}
            {(stats?.expired_certifications || 0) > 0 && (
              <Card className="border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/30 p-6">
                <div className="flex items-start space-x-4">
                  <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" aria-hidden="true" />
                  <div className="flex-1">
                    <h2 className="text-foreground mb-2 text-xl font-semibold text-red-900 dark:text-red-100">
                      ⚠️ Expired Certifications
                    </h2>
                    <p className="mb-4 text-red-800 dark:text-red-200">
                      You have {stats?.expired_certifications || 0} expired certification
                      {(stats?.expired_certifications || 0) !== 1 ? 's' : ''}. Please renew immediately.
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
                                className="flex items-start justify-between rounded border border-red-200 bg-white p-3"
                              >
                                <div className="flex-1">
                                  <p className="font-semibold text-red-900">{check.check_code}</p>
                                  <p className="text-sm text-red-700">{check.check_description}</p>
                                </div>
                                <div className="ml-2 text-right">
                                  <p className="font-bold text-red-600">
                                    Expired {daysExpired} days ago
                                  </p>
                                  <p className="text-sm text-red-500 dark:text-red-400">
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
              <Card className="border-orange-300 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/30 p-6">
                <div className="flex items-start space-x-4">
                  <AlertTriangle className="h-8 w-8 text-orange-600 dark:text-orange-400" aria-hidden="true" />
                  <div className="flex-1">
                    <h2 className="text-foreground mb-2 text-xl font-semibold text-orange-900 dark:text-orange-100">
                      🚨 Critical: Certifications Expiring Soon
                    </h2>
                    <p className="mb-4 text-orange-800 dark:text-orange-200">
                      You have {stats?.critical_certifications || 0} certification
                      {(stats?.critical_certifications || 0) !== 1 ? 's' : ''} expiring within the next 2
                      weeks. Action required.
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
                                className="flex items-start justify-between rounded border border-orange-200 bg-white p-3"
                              >
                                <div className="flex-1">
                                  <p className="font-semibold text-orange-900">
                                    {check.check_code}
                                  </p>
                                  <p className="text-sm text-orange-700">
                                    {check.check_description}
                                  </p>
                                </div>
                                <div className="ml-2 text-right">
                                  <p className="font-bold text-orange-600">
                                    {daysUntil} days remaining
                                  </p>
                                  <p className="text-sm text-orange-500 dark:text-orange-400">
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
              <Card className="border-yellow-300 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950/30 p-6">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="h-8 w-8 text-yellow-600 dark:text-yellow-400" aria-hidden="true" />
                  <div className="flex-1">
                    <h2 className="text-foreground mb-2 text-xl font-semibold text-yellow-900 dark:text-yellow-100">
                      ⚠️ Warning: Upcoming Certifications
                    </h2>
                    <p className="mb-4 text-yellow-800 dark:text-yellow-200">
                      You have {stats?.upcoming_checks || 0} certification
                      {(stats?.upcoming_checks || 0) !== 1 ? 's' : ''} expiring within the next 60 days.
                      Plan renewals accordingly.
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
                              className="flex items-start justify-between rounded border border-yellow-200 bg-white p-3"
                            >
                              <div className="flex-1">
                                <p className="font-semibold text-yellow-900">{check.check_code}</p>
                                <p className="text-sm text-yellow-700">{check.check_description}</p>
                              </div>
                              <div className="ml-2 text-right">
                                <p className="font-bold text-yellow-600">
                                  {daysUntil} days remaining
                                </p>
                                <p className="text-sm text-yellow-500 dark:text-yellow-400">
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

        {/* Statistics Cards */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Pending Leave Requests */}
          <Card className="p-6 transition-shadow hover:shadow-lg">
            <div className="mb-2 flex items-center justify-between">
              <Calendar className="h-8 w-8 text-primary" aria-hidden="true" />
            </div>
            <h3 className="text-muted-foreground text-sm font-medium">Leave Requests</h3>
            <div className="mt-3 space-y-1">
              <p className="text-foreground text-2xl font-bold">
                {stats?.pending_leave_requests || 0}
              </p>
              <p className="text-muted-foreground text-xs">Pending requests</p>
            </div>
          </Card>

          {/* Flight Requests */}
          <Card className="p-6 transition-shadow hover:shadow-lg">
            <div className="mb-2 flex items-center justify-between">
              <Plane className="h-8 w-8 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
            </div>
            <h3 className="text-muted-foreground text-sm font-medium">Flight Requests</h3>
            <div className="mt-3 space-y-1">
              <p className="text-foreground text-2xl font-bold">
                {stats?.pending_flight_requests || 0}
              </p>
              <p className="text-muted-foreground text-xs">Pending requests</p>
            </div>
          </Card>
        </div>

      </main>
    </div>
  )
}
