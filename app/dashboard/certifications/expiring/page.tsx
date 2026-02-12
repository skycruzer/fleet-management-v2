/**
 * Certifications Page - Expiring & Expired View
 * Displays ONLY certifications that are expiring soon or have expired
 * Grouped by expiry timeframes: 90, 60, 30, 14 days, and expired
 *
 * Business Rules:
 * - DO NOT show current/valid certifications (green status)
 * - Group by specific day ranges for clarity
 * - Use accordion UI for collapsible groups
 */

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { getCertificationsGroupedByCategory } from '@/lib/services/certification-service'
import { ExpiryGroupsAccordion } from '@/components/certifications/expiry-groups-accordion'
import {
  groupCertificationsByExpiry,
  getTotalExpiringCount,
  getMostCriticalGroup,
} from '@/lib/utils/certification-expiry-groups'
import { AlertCircle, AlertTriangle, Plus, CheckCircle } from 'lucide-react'

export default async function CertificationsPage() {
  // Data fetching with error handling
  let expiryGroups: ReturnType<typeof groupCertificationsByExpiry> | null = null
  let totalExpiring = 0
  let mostCritical: ReturnType<typeof getMostCriticalGroup> = null
  let expiredCount = 0
  let critical14DaysCount = 0
  let fetchError: string | null = null

  try {
    // Fetch certifications grouped by category on the server
    const groupedCertifications = await getCertificationsGroupedByCategory()

    // Get all certifications as flat array
    const allCertifications = Object.values(groupedCertifications).flat()

    // Group certifications by expiry timeframes (ONLY expiring/expired, NO current)
    expiryGroups = groupCertificationsByExpiry(allCertifications)

    // Calculate stats for expiring/expired certifications only
    totalExpiring = getTotalExpiringCount(expiryGroups)
    mostCritical = getMostCriticalGroup(expiryGroups)
    expiredCount = expiryGroups.expired.certifications.length
    critical14DaysCount = expiryGroups.within14Days.certifications.length
  } catch (error) {
    fetchError = error instanceof Error ? error.message : 'An unexpected error occurred'
  }

  // Error state - render error UI
  if (fetchError) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-foreground text-2xl font-bold">Certifications</h2>
            <p className="text-muted-foreground mt-1 text-sm">Error loading certifications</p>
          </div>
        </div>

        <Card className="border-destructive/20 bg-[var(--color-destructive-muted)] p-8 text-center">
          <AlertCircle
            className="mx-auto h-12 w-12 text-[var(--color-danger-400)]"
            aria-hidden="true"
          />
          <h3 className="text-foreground mt-4 text-lg font-semibold">
            Failed to Load Certifications
          </h3>
          <p className="text-muted-foreground mt-2">{fetchError}</p>
          <div className="mt-4">
            <Link href="/dashboard/certifications/expiring">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                Retry
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-foreground text-2xl font-bold">Expiring & Expired Certifications</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Certifications requiring attention - grouped by expiry timeframes
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Link href="/dashboard/certifications/new" className="w-full sm:w-auto">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
              Add Certification
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Stats - ONLY Expiring/Expired */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Total Requiring Attention */}
        <Card className="border-primary/20 bg-primary/5 p-6">
          <div className="flex items-center space-x-3">
            <AlertCircle className="text-primary h-8 w-8" aria-hidden="true" />
            <div>
              <p className="text-foreground text-2xl font-bold">{totalExpiring}</p>
              <p className="text-muted-foreground text-sm font-medium">Requiring Attention</p>
            </div>
          </div>
        </Card>

        {/* Expired */}
        <Card className="border-destructive/20 bg-[var(--color-destructive-muted)] p-6">
          <div className="flex items-center space-x-3">
            <AlertCircle className="h-8 w-8 text-[var(--color-danger-400)]" aria-hidden="true" />
            <div>
              <p className="text-foreground text-2xl font-bold">{expiredCount}</p>
              <p className="text-muted-foreground text-sm font-medium">Expired</p>
            </div>
          </div>
        </Card>

        {/* Critical (14 Days) */}
        <Card className="border-[var(--color-badge-orange)]/20 bg-[var(--color-badge-orange-bg)] p-6">
          <div className="flex items-center space-x-3">
            <AlertTriangle
              className="h-8 w-8 text-[var(--color-badge-orange)]"
              aria-hidden="true"
            />
            <div>
              <p className="text-foreground text-2xl font-bold">{critical14DaysCount}</p>
              <p className="text-muted-foreground text-sm font-medium">Critical (≤14 Days)</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Priority Alert */}
      {mostCritical && (
        <Card className="border-destructive/20 bg-[var(--color-destructive-muted)] p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle
              className="mt-1 h-6 w-6 text-[var(--color-danger-400)]"
              aria-hidden="true"
            />
            <div>
              <h3 className="text-foreground font-semibold">Priority Action Required</h3>
              <p className="text-muted-foreground mt-1 text-sm">
                {mostCritical.certifications.length}{' '}
                {mostCritical.certifications.length === 1 ? 'certification' : 'certifications'} in{' '}
                <strong>{mostCritical.label}</strong> group. {mostCritical.description}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* No Issues Message */}
      {totalExpiring === 0 && (
        <Card className="border-[var(--color-success-500)]/20 bg-[var(--color-success-muted)] p-8 text-center">
          <CheckCircle
            className="mx-auto h-12 w-12 text-[var(--color-success-400)]"
            aria-hidden="true"
          />
          <h3 className="text-foreground mt-4 text-lg font-semibold">All Certifications Current</h3>
          <p className="text-muted-foreground mt-2">
            No certifications are expiring within 90 days or have expired. Excellent compliance!
          </p>
        </Card>
      )}

      {/* Expiry Groups Accordion */}
      {totalExpiring > 0 && expiryGroups && <ExpiryGroupsAccordion groups={expiryGroups} />}

    </div>
  )
}
