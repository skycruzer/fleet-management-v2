export function PilotListSkeleton() {
  return (
    <div className="space-y-4 p-6">
      {/* Header Skeleton */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="bg-muted animate-shimmer h-8 w-32 rounded" />
        <div className="flex gap-2">
          <div className="bg-muted animate-shimmer h-10 w-40 rounded" />
          <div className="bg-muted animate-shimmer h-10 w-32 rounded" />
        </div>
      </div>

      {/* Search and Filters Skeleton */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <div className="bg-muted animate-shimmer h-10 w-full rounded" />
        </div>
        <div className="flex gap-2">
          <div className="bg-muted animate-shimmer h-10 w-32 rounded" />
          <div className="bg-muted animate-shimmer h-10 w-32 rounded" />
        </div>
      </div>

      {/* Table Skeleton - Desktop */}
      <div className="border-border bg-card hidden overflow-hidden rounded-lg border shadow-sm md:block">
        {/* Table Header */}
        <div className="border-border bg-muted/50 grid grid-cols-6 gap-4 border-b p-4">
          {['Name', 'Rank', 'Seniority', 'Status', 'Certifications', 'Actions'].map((col) => (
            <div key={col} className="bg-muted animate-shimmer h-4 rounded" />
          ))}
        </div>

        {/* Table Rows */}
        <div className="divide-border divide-y">
          {[...Array(27)].map((_, i) => (
            <div key={i} className="hover:bg-muted bg-card grid grid-cols-6 gap-4 p-4">
              <div className="flex items-center gap-3">
                <div className="bg-muted animate-shimmer h-10 w-10 rounded-full" />
                <div className="space-y-2">
                  <div className="bg-muted animate-shimmer h-4 w-32 rounded" />
                  <div className="bg-muted/70 animate-shimmer h-3 w-24 rounded" />
                </div>
              </div>
              <div className="flex items-center">
                <div className="bg-muted/70 animate-shimmer h-4 w-20 rounded" />
              </div>
              <div className="flex items-center">
                <div className="bg-muted/70 animate-shimmer h-4 w-12 rounded" />
              </div>
              <div className="flex items-center">
                <div className="bg-muted animate-shimmer h-6 w-16 rounded-full" />
              </div>
              <div className="flex items-center">
                <div className="bg-muted/70 animate-shimmer h-4 w-16 rounded" />
              </div>
              <div className="flex items-center gap-2">
                <div className="bg-muted animate-shimmer h-8 w-8 rounded" />
                <div className="bg-muted animate-shimmer h-8 w-8 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cards Skeleton - Mobile */}
      <div className="space-y-3 md:hidden">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="border-border bg-card rounded-lg border p-4 shadow-sm">
            <div className="mb-3 flex items-start gap-3">
              <div className="bg-muted animate-shimmer h-12 w-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="bg-muted animate-shimmer h-5 w-32 rounded" />
                <div className="bg-muted/70 animate-shimmer h-4 w-24 rounded" />
              </div>
              <div className="bg-muted animate-shimmer h-6 w-16 rounded-full" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <div className="bg-muted/70 animate-shimmer h-3 w-20 rounded" />
                <div className="bg-muted/70 animate-shimmer h-3 w-12 rounded" />
              </div>
              <div className="flex justify-between">
                <div className="bg-muted/70 animate-shimmer h-3 w-24 rounded" />
                <div className="bg-muted/70 animate-shimmer h-3 w-16 rounded" />
              </div>
            </div>
            <div className="border-border mt-3 flex gap-2 border-t pt-3">
              <div className="bg-muted animate-shimmer h-8 flex-1 rounded" />
              <div className="bg-muted animate-shimmer h-8 w-20 rounded" />
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
