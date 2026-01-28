export function DashboardSkeleton() {
  return (
    <div className="space-y-6 p-6">
      {/* Header Skeleton */}
      <div className="bg-muted animate-shimmer h-10 w-64 rounded" />

      {/* Metrics Cards Skeleton */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="border-border bg-card rounded-lg border p-6 shadow-sm">
            <div className="bg-muted animate-shimmer mb-2 h-4 w-24 rounded" />
            <div className="bg-muted animate-shimmer mb-3 h-8 w-16 rounded" />
            <div className="bg-muted/70 animate-shimmer h-3 w-32 rounded" />
          </div>
        ))}
      </div>

      {/* Upcoming Checks Skeleton */}
      <div className="border-border bg-card rounded-lg border p-6 shadow-sm">
        <div className="bg-muted animate-shimmer mb-4 h-6 w-48 rounded" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-muted/50 flex items-center gap-4 rounded-lg p-4">
              <div className="bg-muted animate-shimmer h-12 w-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="bg-muted animate-shimmer h-4 w-48 rounded" />
                <div className="bg-muted/70 animate-shimmer h-3 w-32 rounded" />
              </div>
              <div className="bg-muted animate-shimmer h-8 w-20 rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Fleet Status Skeleton */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="border-border bg-card rounded-lg border p-6 shadow-sm">
          <div className="bg-muted animate-shimmer mb-4 h-6 w-40 rounded" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="bg-muted animate-shimmer h-4 w-24 rounded" />
                <div className="bg-muted animate-shimmer h-6 w-12 rounded" />
              </div>
            ))}
          </div>
        </div>

        <div className="border-border bg-card rounded-lg border p-6 shadow-sm">
          <div className="bg-muted animate-shimmer mb-4 h-6 w-40 rounded" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="bg-muted animate-shimmer h-4 w-24 rounded" />
                <div className="bg-muted animate-shimmer h-6 w-12 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
