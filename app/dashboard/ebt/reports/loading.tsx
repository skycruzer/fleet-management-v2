import { Skeleton } from '@/components/ui/skeleton'

// Suspense fallback for the EBT reports list while listReports resolves.
// Theme-aware skeletons via the shared Skeleton.
export default function EbtReportsLoading() {
  return (
    <main className="ax-main">
      <div className="ax-wrap space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-7 w-32" />
          </div>
          <Skeleton className="h-9 w-32 rounded-md" />
        </div>
        <div className="border-border overflow-hidden rounded-xl border">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div
              key={i}
              className="border-border flex items-center gap-4 border-b p-4 last:border-b-0"
            >
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
