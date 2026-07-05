import { Skeleton } from '@/components/ui/skeleton'

// Suspense fallback for the EBT dashboard, which awaits several queries in parallel
// (session, currency data, fleet summary). Theme-aware skeletons via the shared Skeleton.
export default function EbtDashboardLoading() {
  return (
    <main className="ax-main">
      <div className="ax-wrap space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-7 w-48" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="border-border rounded-xl border p-5">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="mt-4 h-8 w-20" />
              <Skeleton className="mt-3 h-3 w-32" />
            </div>
          ))}
        </div>
        <div className="border-border rounded-xl border p-5">
          <Skeleton className="h-5 w-40" />
          <div className="mt-4 space-y-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-10 w-full rounded-md" />
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
