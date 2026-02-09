/**
 * Dashboard Skeleton
 * Developer: Maurice Rondeau
 *
 * Loading skeleton matching the 3-zone dashboard layout.
 */

export function DashboardSkeleton() {
  return (
    <div className="w-full space-y-6">
      {/* Zone 1: Greeting + Fleet Insights */}
      <div className="space-y-4">
        {/* Greeting skeleton */}
        <div className="flex items-center gap-4">
          <div className="bg-muted animate-shimmer h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <div className="bg-muted animate-shimmer h-6 w-48 rounded" />
            <div className="bg-muted/70 animate-shimmer h-4 w-32 rounded" />
          </div>
        </div>

        {/* Fleet insights skeleton — 4 metric cards */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="border-border bg-card rounded-xl border p-4 text-center">
              <div className="bg-muted/50 animate-shimmer mx-auto mb-2 h-5 w-5 rounded" />
              <div className="bg-muted animate-shimmer mx-auto mb-1 h-8 w-12 rounded" />
              <div className="bg-muted/70 animate-shimmer mx-auto h-3 w-16 rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Zone 2: Roster Periods — Compact carousel */}
      <div className="border-border bg-card rounded-xl border p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="bg-muted/70 animate-shimmer h-3 w-24 rounded" />
            <div className="bg-muted animate-shimmer h-6 w-40 rounded" />
          </div>
          <div className="bg-muted animate-shimmer h-8 w-20 rounded-full" />
        </div>
        <div className="mt-3 flex gap-2 overflow-hidden">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-muted/30 animate-shimmer h-16 w-32 shrink-0 rounded-lg" />
          ))}
        </div>
      </div>

      {/* Zone 3: Priorities + Quick Actions */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <div className="border-border bg-card rounded-xl border p-4 lg:col-span-2">
          <div className="bg-muted/70 animate-shimmer mb-3 h-3 w-24 rounded" />
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg p-2.5">
                <div className="bg-muted animate-shimmer h-4 w-4 rounded" />
                <div className="bg-muted animate-shimmer h-4 flex-1 rounded" />
                <div className="bg-muted animate-shimmer h-5 w-12 rounded-full" />
              </div>
            ))}
          </div>
        </div>

        <div className="border-border bg-card rounded-xl border p-4">
          <div className="bg-muted/70 animate-shimmer mb-3 h-3 w-20 rounded" />
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border-border flex items-center gap-3 rounded-xl border p-3">
                <div className="bg-muted animate-shimmer h-9 w-9 rounded-lg" />
                <div className="flex-1 space-y-1">
                  <div className="bg-muted animate-shimmer h-4 w-20 rounded" />
                  <div className="bg-muted/70 animate-shimmer h-3 w-32 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Zone 4: Calendar + Approvals + Alerts */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        <div className="border-border bg-card rounded-xl border p-4">
          <div className="bg-muted animate-shimmer mb-3 h-4 w-32 rounded" />
          <div className="grid grid-cols-7 gap-0.5">
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="bg-muted/30 animate-shimmer aspect-square rounded" />
            ))}
          </div>
        </div>

        <div className="border-border bg-card rounded-xl border p-4">
          <div className="bg-muted animate-shimmer mb-3 h-3 w-28 rounded" />
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 py-2">
                <div className="flex-1 space-y-1">
                  <div className="bg-muted animate-shimmer h-4 w-28 rounded" />
                  <div className="bg-muted/70 animate-shimmer h-3 w-20 rounded" />
                </div>
                <div className="flex gap-1">
                  <div className="bg-muted animate-shimmer h-8 w-8 rounded" />
                  <div className="bg-muted animate-shimmer h-8 w-8 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-muted animate-shimmer h-16 rounded-xl" />
      </div>

      {/* Zone 5: Staffing Requirements + Retirement Forecast */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <div className="border-border bg-card rounded-xl border p-4 lg:col-span-2">
          <div className="bg-muted/70 animate-shimmer mb-3 h-3 w-32 rounded" />
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg p-2.5">
                <div className="bg-muted animate-shimmer h-4 w-4 rounded" />
                <div className="bg-muted animate-shimmer h-4 flex-1 rounded" />
              </div>
            ))}
          </div>
        </div>

        <div className="border-border bg-card rounded-xl border p-4">
          <div className="bg-muted/70 animate-shimmer mb-3 h-3 w-28 rounded" />
          <div className="bg-muted animate-shimmer h-32 rounded-lg" />
        </div>
      </div>
    </div>
  )
}
