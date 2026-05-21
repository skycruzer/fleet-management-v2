/**
 * Data Degraded Banner
 * Developer: Maurice Rondeau
 *
 * Shown when the dashboard data layer (Redis + materialized view) is
 * unavailable and widgets are rendering placeholder figures.
 *
 * Aviation/FAA context: never let the dashboard present placeholder
 * counts as real fleet data. A visible warning is mandatory whenever
 * `DashboardMetrics.degraded` is true or a metrics fetch throws.
 */

import { AlertTriangle } from 'lucide-react'
import { Card } from '@/components/ui/card'

interface DataDegradedBannerProps {
  /** Optional technical reason, surfaced as small print for operators. */
  reason?: string
}

export function DataDegradedBanner({ reason }: DataDegradedBannerProps) {
  return (
    <Card role="alert" className="border-warning/40 bg-warning-50 flex items-start gap-3 p-4">
      <AlertTriangle className="text-warning mt-0.5 h-5 w-5 flex-shrink-0" aria-hidden="true" />
      <div className="min-w-0">
        <p className="text-warning-text text-sm font-semibold">Live fleet data unavailable</p>
        <p className="text-warning-text/80 text-sm">
          The figures shown below are placeholders and may not reflect current fleet status. Do not
          rely on them for compliance decisions until the data connection is restored.
        </p>
        {reason ? (
          <p className="text-warning-text/60 mt-1 font-mono text-xs break-words">{reason}</p>
        ) : null}
      </div>
    </Card>
  )
}
