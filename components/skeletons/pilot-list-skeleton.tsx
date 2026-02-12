/**
 * Pilot List Skeleton Component
 * Loading state placeholder for the pilots page
 *
 * Developer: Maurice Rondeau
 */

export function PilotListSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats Bar Skeleton — 2x2 on mobile, 4-across on desktop */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="border-border bg-card rounded-xl border p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="bg-muted animate-shimmer h-12 w-12 flex-shrink-0 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="bg-muted animate-shimmer h-7 w-16 rounded" />
                <div className="bg-muted/70 animate-shimmer h-4 w-24 rounded" />
              </div>
            </div>
            <div className="bg-muted animate-shimmer mt-3 h-1.5 rounded-full" />
          </div>
        ))}
      </div>

      {/* Filter Bar Skeleton */}
      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="bg-muted animate-shimmer h-10 max-w-md flex-1 rounded" />
          <div className="bg-muted/70 animate-shimmer h-4 w-24 rounded" />
        </div>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-1.5">
            <div className="bg-muted/70 animate-shimmer h-3 w-8 rounded" />
            <div className="flex gap-1">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-muted animate-shimmer h-7 w-16 rounded-full" />
              ))}
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="bg-muted/70 animate-shimmer h-3 w-10 rounded" />
            <div className="flex gap-1">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-muted animate-shimmer h-7 w-16 rounded-full" />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* View Toggle Skeleton */}
      <div className="border-input bg-background flex items-center rounded-lg border p-1">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-muted animate-shimmer h-8 w-20 rounded" />
        ))}
      </div>

      {/* Card Grid Skeleton — responsive grid matching PilotCard layout */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="border-border bg-card rounded-xl border shadow-sm">
            <div className="p-5">
              {/* Header: Avatar + Identity */}
              <div className="mb-4 flex items-start gap-3">
                <div className="bg-muted animate-shimmer h-14 w-14 flex-shrink-0 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="bg-muted animate-shimmer h-4 w-28 rounded" />
                  <div className="flex gap-1.5">
                    <div className="bg-muted animate-shimmer h-5 w-16 rounded-full" />
                    <div className="bg-muted/70 animate-shimmer h-5 w-14 rounded-full" />
                  </div>
                </div>
              </div>
              {/* Detail rows */}
              <div className="space-y-2">
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="flex items-center justify-between">
                    <div className="bg-muted/70 animate-shimmer h-3.5 w-16 rounded" />
                    <div className="bg-muted animate-shimmer h-3.5 w-12 rounded" />
                  </div>
                ))}
              </div>
            </div>
            {/* Footer */}
            <div className="border-border flex gap-2 border-t px-5 py-3">
              <div className="bg-muted animate-shimmer h-8 flex-1 rounded" />
              <div className="bg-muted animate-shimmer h-8 flex-1 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Pagination Skeleton */}
      <div className="flex items-center justify-between pt-4">
        <div className="bg-muted animate-shimmer h-4 w-32 rounded" />
        <div className="flex gap-2">
          <div className="bg-muted animate-shimmer h-8 w-8 rounded" />
          <div className="bg-muted animate-shimmer h-8 w-8 rounded" />
          <div className="bg-muted animate-shimmer h-8 w-8 rounded" />
          <div className="bg-muted animate-shimmer h-8 w-8 rounded" />
        </div>
      </div>
    </div>
  )
}
