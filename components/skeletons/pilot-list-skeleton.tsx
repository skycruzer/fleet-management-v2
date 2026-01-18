export function PilotListSkeleton() {
  return (
    <div className="space-y-4 p-6">
      {/* Header Skeleton */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="h-8 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        <div className="flex gap-2">
          <div className="h-10 w-40 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-10 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        </div>
      </div>

      {/* Search and Filters Skeleton */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <div className="h-10 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-10 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        </div>
      </div>

      {/* Table Skeleton - Desktop */}
      <div className="hidden overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm md:block dark:border-gray-700 dark:bg-gray-900">
        {/* Table Header */}
        <div className="grid grid-cols-6 gap-4 border-b border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
          {['Name', 'Rank', 'Seniority', 'Status', 'Certifications', 'Actions'].map((col) => (
            <div key={col} className="h-4 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          ))}
        </div>

        {/* Table Rows */}
        <div className="divide-y divide-gray-200">
          {[...Array(27)].map((_, i) => (
            <div key={i} className="grid grid-cols-6 gap-4 p-4 hover:bg-gray-50 dark:bg-gray-800">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
                <div className="space-y-2">
                  <div className="h-4 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                  <div className="h-3 w-24 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
                </div>
              </div>
              <div className="flex items-center">
                <div className="h-4 w-20 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
              </div>
              <div className="flex items-center">
                <div className="h-4 w-12 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
              </div>
              <div className="flex items-center">
                <div className="h-6 w-16 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
              </div>
              <div className="flex items-center">
                <div className="h-4 w-16 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
              </div>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                <div className="h-8 w-8 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cards Skeleton - Mobile */}
      <div className="space-y-3 md:hidden">
        {[...Array(10)].map((_, i) => (
          <div
            key={i}
            className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900"
          >
            <div className="mb-3 flex items-start gap-3">
              <div className="h-12 w-12 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
              <div className="flex-1 space-y-2">
                <div className="h-5 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                <div className="h-4 w-24 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
              </div>
              <div className="h-6 w-16 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <div className="h-3 w-20 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
                <div className="h-3 w-12 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
              </div>
              <div className="flex justify-between">
                <div className="h-3 w-24 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
                <div className="h-3 w-16 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
              </div>
            </div>
            <div className="mt-3 flex gap-2 border-t border-gray-100 pt-3">
              <div className="h-8 flex-1 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
              <div className="h-8 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            </div>
          </div>
        ))}
      </div>

      {/* Pagination Skeleton */}
      <div className="flex items-center justify-between pt-4">
        <div className="h-4 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        <div className="flex gap-2">
          <div className="h-8 w-8 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-8 w-8 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-8 w-8 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-8 w-8 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        </div>
      </div>
    </div>
  )
}
