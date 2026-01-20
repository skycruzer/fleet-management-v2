export function RenewalPlanningSkeleton() {
  return (
    <div className="space-y-6 p-6">
      {/* Header + Year Selector Skeleton */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="bg-muted h-8 w-48 animate-pulse rounded" />
        <div className="flex gap-2">
          <div className="bg-muted h-10 w-32 animate-pulse rounded" />
          <div className="bg-muted h-10 w-40 animate-pulse rounded" />
        </div>
      </div>

      {/* Stats Summary Skeleton */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="border-border bg-card rounded-lg border p-4 shadow-sm">
            <div className="bg-muted mb-2 h-3 w-20 animate-pulse rounded" />
            <div className="bg-muted h-6 w-12 animate-pulse rounded" />
          </div>
        ))}
      </div>

      {/* Period Cards Skeleton */}
      <div>
        <div className="bg-muted mb-4 h-6 w-32 animate-pulse rounded" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(13)].map((_, i) => (
            <div
              key={i}
              className="border-border bg-card animate-pulse rounded-lg border p-4 shadow-sm"
              style={{ animationDelay: `${i * 30}ms` }}
            >
              {/* Period Header */}
              <div className="mb-3 flex items-start justify-between">
                <div className="bg-muted h-6 w-20 rounded" />
                <div className="bg-muted h-5 w-16 rounded" />
              </div>

              {/* Date Range */}
              <div className="bg-muted/70 mb-3 h-4 w-full rounded" />

              {/* Distribution Stats */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="bg-muted/70 h-3 w-20 rounded" />
                  <div className="bg-muted/70 h-3 w-8 rounded" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="bg-muted/70 h-3 w-24 rounded" />
                  <div className="bg-muted/70 h-3 w-8 rounded" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="bg-muted/70 h-3 w-16 rounded" />
                  <div className="bg-muted/70 h-3 w-8 rounded" />
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-4">
                <div className="bg-muted h-8 w-full rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
