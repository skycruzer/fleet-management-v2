import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

/**
 * Skeleton loader for pilot list items
 */
function PilotListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="flex items-center justify-between py-4">
          <div className="flex items-center space-x-3 flex-1">
            {/* Avatar skeleton */}
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2 flex-1">
              {/* Name skeleton */}
              <Skeleton className="h-4 w-48" />
              {/* Employee ID skeleton */}
              <Skeleton className="h-3 w-64" />
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {/* Badge skeleton */}
            <Skeleton className="h-6 w-24 rounded-full" />
            {/* Age/retirement skeleton */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-3 w-20" />
            </div>
            {/* Status indicator skeleton */}
            <Skeleton className="h-3 w-3 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * Skeleton loader for card grids
 */
function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="rounded-lg border bg-card p-6 space-y-4">
          <div className="flex items-center space-x-2">
            <Skeleton className="h-8 w-8 rounded" />
            <Skeleton className="h-6 w-32" />
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      ))}
    </div>
  )
}

/**
 * Skeleton loader for table rows
 */
function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="w-full">
      {/* Table header */}
      <div className="flex items-center border-b py-3 mb-2">
        {[...Array(columns)].map((_, i) => (
          <div key={i} className="flex-1 px-4">
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
      {/* Table rows */}
      {[...Array(rows)].map((_, rowIndex) => (
        <div key={rowIndex} className="flex items-center border-b py-3">
          {[...Array(columns)].map((_, colIndex) => (
            <div key={colIndex} className="flex-1 px-4">
              <Skeleton className="h-4 w-full" />
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

/**
 * Skeleton loader for form fields
 */
function FormSkeleton({ fields = 5 }: { fields?: number }) {
  return (
    <div className="space-y-6">
      {[...Array(fields)].map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      <div className="flex justify-end space-x-2 pt-4">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  )
}

/**
 * Skeleton loader for dashboard metrics/stats cards
 */
function MetricCardSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="rounded-lg border bg-card p-6 space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-4 rounded" />
          </div>
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-3 w-32" />
        </div>
      ))}
    </div>
  )
}

/**
 * Skeleton loader for charts
 */
function ChartSkeleton({ height = 300 }: { height?: number }) {
  return (
    <div className="rounded-lg border bg-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-8 w-24 rounded-md" />
      </div>
      <Skeleton className="w-full" style={{ height: `${height}px` }} />
    </div>
  )
}

/**
 * Skeleton loader for detail pages
 */
function DetailPageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Stats Grid */}
      <MetricCardSkeleton count={4} />

      {/* Content Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border bg-card p-6 space-y-4">
          <Skeleton className="h-6 w-32" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
        <div className="rounded-lg border bg-card p-6 space-y-4">
          <Skeleton className="h-6 w-32" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card p-6">
        <Skeleton className="h-6 w-32 mb-4" />
        <TableSkeleton rows={5} columns={4} />
      </div>
    </div>
  )
}

/**
 * Full page loading skeleton
 */
function PageSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        {/* Page header */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-32 rounded-md" />
        </div>

        {/* Filter card */}
        <div className="rounded-lg border bg-card p-6 space-y-4">
          <Skeleton className="h-5 w-32" />
          <div className="flex gap-4">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>

        {/* Content card */}
        <div className="rounded-lg border bg-card p-6">
          <div className="space-y-2 mb-4">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <PilotListSkeleton count={5} />
        </div>
      </div>
    </div>
  )
}

export {
  Skeleton,
  PilotListSkeleton,
  CardGridSkeleton,
  TableSkeleton,
  FormSkeleton,
  MetricCardSkeleton,
  ChartSkeleton,
  DetailPageSkeleton,
  PageSkeleton,
}
