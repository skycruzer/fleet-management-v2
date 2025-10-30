/**
 * Unified Compliance Card Component
 *
 * Consolidates the fleet compliance overview into a single responsive card.
 * Replaces the previous 3-card split layout with a unified horizontal design.
 *
 * Features:
 * - Large circular progress indicator (left side)
 * - Horizontal category progress bars (right side)
 * - Responsive layout (stacks on mobile, horizontal on desktop)
 * - Color-coded by compliance level
 * - Smooth animations with Framer Motion
 *
 * Architecture: Uses existing ComplianceOverviewServer component for now
 * TODO: Refactor when compliance data structure is available in dashboard metrics
 */

import { ComplianceOverviewServer } from './compliance-overview-server'

export async function UnifiedComplianceCard() {
  // Use existing compliance overview component
  // This will be refactored once we have compliance data in DashboardMetrics
  return <ComplianceOverviewServer />
}
