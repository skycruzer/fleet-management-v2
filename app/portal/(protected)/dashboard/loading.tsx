/**
 * Portal Dashboard Loading State
 * Mirrors the inline DashboardSkeleton in app/portal/(protected)/dashboard/page.tsx
 * (header bar, KPI grid, roster card, cert alerts) so route-level and
 * Suspense-level loading states match.
 */

export default function PortalDashboardLoading() {
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
