/**
 * Attention Required View Component
 * Displays certifications requiring attention (expiring/expired) with priority grouping
 *
 * @author Maurice Rondeau
 * @version 1.0.0
 * @created 2025-12-19
 */

'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertTriangle, CheckCircle, Pencil } from 'lucide-react'
import { ExpiryGroupsAccordion } from './expiry-groups-accordion'
import {
  groupCertificationsByExpiry,
  getTotalExpiringCount,
  getMostCriticalGroup,
  formatDaysUntilExpiry,
} from '@/lib/utils/certification-expiry-groups'
import type { CertificationWithDetails } from '@/lib/services/certification-service'

interface AttentionRequiredViewProps {
  certifications: CertificationWithDetails[]
  onEditCertification?: (certId: string) => void
}

export function AttentionRequiredView({
  certifications,
  onEditCertification,
}: AttentionRequiredViewProps) {
  // Group certifications by expiry timeframes
  const expiryGroups = groupCertificationsByExpiry(certifications)
  const totalExpiring = getTotalExpiringCount(expiryGroups)
  const mostCritical = getMostCriticalGroup(expiryGroups)

  // All good state
  if (totalExpiring === 0) {
    return (
      <Card className="border-green-200 bg-green-50 p-6 text-center dark:border-green-800 dark:bg-green-950/30">
        <CheckCircle
          className="mx-auto h-10 w-10 text-green-600 dark:text-green-500"
          aria-hidden="true"
        />
        <h3 className="text-foreground mt-3 text-lg font-semibold">All Certifications Current</h3>
        <p className="text-muted-foreground mt-2">
          No certifications are expiring within 90 days or have expired. Excellent compliance!
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {/* Priority Alert Banner */}
      {mostCritical && (
        <Card className="border-destructive/20 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950/30">
          <div className="flex items-start space-x-2.5">
            <AlertTriangle
              className="mt-0.5 h-5 w-5 shrink-0 text-red-600 dark:text-red-500"
              aria-hidden="true"
            />
            <div className="flex-1">
              <h3 className="text-foreground font-semibold">Priority Action Required</h3>
              <p className="text-muted-foreground mt-1 text-sm">
                {mostCritical.certifications.length}{' '}
                {mostCritical.certifications.length === 1 ? 'certification' : 'certifications'} in{' '}
                <strong>{mostCritical.label}</strong> group. {mostCritical.description}
              </p>
            </div>
            <Badge variant="destructive" className="shrink-0">
              {totalExpiring} Total
            </Badge>
          </div>
        </Card>
      )}

      {/* Quick Action Cards for Critical Items (Top 5) */}
      {mostCritical && mostCritical.certifications.length > 0 && (
        <div className="space-y-1.5">
          <h4 className="text-muted-foreground text-sm font-medium">
            Most Urgent ({Math.min(mostCritical.certifications.length, 5)} shown)
          </h4>
          <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {mostCritical.certifications.slice(0, 5).map((cert) => (
              <Card
                key={cert.id}
                className="flex items-center justify-between p-2.5 transition-all hover:shadow-md"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-foreground truncate font-medium">
                    {cert.pilot?.first_name} {cert.pilot?.last_name}
                  </p>
                  <p className="text-muted-foreground truncate text-xs">
                    {cert.check_type?.check_description}
                  </p>
                  {cert.status?.daysUntilExpiry !== undefined && (
                    <p
                      className={`text-xs font-medium ${
                        cert.status.daysUntilExpiry < 0
                          ? 'text-red-600 dark:text-red-500'
                          : 'text-yellow-600 dark:text-yellow-500'
                      }`}
                    >
                      {formatDaysUntilExpiry(cert.status.daysUntilExpiry)}
                    </p>
                  )}
                </div>
                {onEditCertification && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEditCertification(cert.id)}
                    className="ml-2 shrink-0"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Full Accordion Groups */}
      <div className="pt-3">
        <h4 className="text-muted-foreground mb-3 text-sm font-medium">
          All Certifications Requiring Attention
        </h4>
        <ExpiryGroupsAccordion groups={expiryGroups} />
      </div>
    </div>
  )
}
