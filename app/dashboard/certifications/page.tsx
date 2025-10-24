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

export const dynamic = 'force-dynamic'

export default async function CertificationsPage() {
  try {
    // Fetch certifications grouped by category on the server
    const groupedCertifications = await getCertificationsGroupedByCategory()

    // Get all certifications as flat array
    const allCertifications = Object.values(groupedCertifications).flat()

    // Group certifications by expiry timeframes (ONLY expiring/expired, NO current)
    const expiryGroups = groupCertificationsByExpiry(allCertifications)

    // Calculate stats for expiring/expired certifications only
    const totalExpiring = getTotalExpiringCount(expiryGroups)
    const mostCritical = getMostCriticalGroup(expiryGroups)
    const expiredCount = expiryGroups.expired.certifications.length
    const critical14DaysCount = expiryGroups.within14Days.certifications.length

    return (
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-foreground text-2xl font-bold">
              Expiring & Expired Certifications
            </h2>
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
          <Card className="border-destructive/20 bg-red-50 p-6">
            <div className="flex items-center space-x-3">
              <AlertCircle className="h-8 w-8 text-red-600" aria-hidden="true" />
              <div>
                <p className="text-foreground text-2xl font-bold">{expiredCount}</p>
                <p className="text-muted-foreground text-sm font-medium">Expired</p>
              </div>
            </div>
          </Card>

          {/* Critical (14 Days) */}
          <Card className="border-orange-200 bg-orange-50 p-6">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="h-8 w-8 text-orange-600" aria-hidden="true" />
              <div>
                <p className="text-foreground text-2xl font-bold">{critical14DaysCount}</p>
                <p className="text-muted-foreground text-sm font-medium">Critical (≤14 Days)</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Priority Alert */}
        {mostCritical && (
          <Card className="border-destructive/20 bg-red-50 p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="mt-1 h-6 w-6 text-red-600" aria-hidden="true" />
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
          <Card className="border-green-200 bg-green-50 p-8 text-center">
            <CheckCircle className="mx-auto h-12 w-12 text-green-600" aria-hidden="true" />
            <h3 className="text-foreground mt-4 text-lg font-semibold">
              All Certifications Current
            </h3>
            <p className="text-muted-foreground mt-2">
              No certifications are expiring within 90 days or have expired. Excellent compliance!
            </p>
          </Card>
        )}

        {/* Expiry Groups Accordion */}
        {totalExpiring > 0 && <ExpiryGroupsAccordion groups={expiryGroups} />}

        {/* Help Text */}
        <Card className="bg-primary/5 border-primary/20 p-4">
          <div className="flex items-start space-x-3">
            <span className="text-2xl" aria-hidden="true">
              ℹ️
            </span>
            <div className="space-y-1">
              <p className="text-foreground text-sm font-medium">About This View</p>
              <ul className="text-muted-foreground list-inside list-disc space-y-1 text-sm">
                <li>This page shows ONLY expiring or expired certifications</li>
                <li>Current/valid certifications are not displayed</li>
                <li>Certifications are grouped by urgency (expired → 14 → 30 → 60 → 90 days)</li>
                <li>Click any certification to view details or update expiry date</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    )
  } catch (error) {
    // Error handling
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-foreground text-2xl font-bold">Certifications</h2>
            <p className="text-muted-foreground mt-1 text-sm">Error loading certifications</p>
          </div>
        </div>

        <Card className="border-destructive/20 bg-red-50 p-8 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-600" aria-hidden="true" />
          <h3 className="text-foreground mt-4 text-lg font-semibold">
            Failed to Load Certifications
          </h3>
          <p className="text-muted-foreground mt-2">
            {error instanceof Error ? error.message : 'An unexpected error occurred'}
          </p>
          <div className="mt-4">
            <Button
              onClick={() => window.location.reload()}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Retry
            </Button>
          </div>
        </Card>
      </div>
    )
  }
}
