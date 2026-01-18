export function RenewalPlanningSkeleton() {
  return (
    <div className="space-y-6 p-6">
      {/* Header + Year Selector Skeleton */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="h-8 w-48 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        <div className="flex gap-2">
          <div className="h-10 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-10 w-40 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        </div>
      </div>

      {/* Stats Summary Skeleton */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900"
          >
            <div className="mb-2 h-3 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-6 w-12 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          </div>
        ))}
      </div>

      {/* Period Cards Skeleton */}
      <div>
        <div className="mb-4 h-6 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(13)].map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900"
              style={{ animationDelay: `${i * 30}ms` }}
            >
              {/* Period Header */}
              <div className="mb-3 flex items-start justify-between">
                <div className="h-6 w-20 rounded bg-gray-200 dark:bg-gray-700" />
                <div className="h-5 w-16 rounded bg-gray-200 dark:bg-gray-700" />
              </div>

              {/* Date Range */}
              <div className="mb-3 h-4 w-full rounded bg-gray-100 dark:bg-gray-800" />

              {/* Distribution Stats */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="h-3 w-20 rounded bg-gray-100 dark:bg-gray-800" />
                  <div className="h-3 w-8 rounded bg-gray-100 dark:bg-gray-800" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="h-3 w-24 rounded bg-gray-100 dark:bg-gray-800" />
                  <div className="h-3 w-8 rounded bg-gray-100 dark:bg-gray-800" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="h-3 w-16 rounded bg-gray-100 dark:bg-gray-800" />
                  <div className="h-3 w-8 rounded bg-gray-100 dark:bg-gray-800" />
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-4">
                <div className="h-8 w-full rounded bg-gray-200 dark:bg-gray-700" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
