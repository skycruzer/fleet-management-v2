/**
 * Dashboard Loading State
 * Renders the same DashboardSkeleton used as the page's Suspense fallback
 * so route-level and component-level loading states match.
 */

import { DashboardSkeleton } from '@/components/skeletons/dashboard-skeleton'

export default function DashboardLoading() {
  return <DashboardSkeleton />
}
