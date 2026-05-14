// Mirrors the Suspense fallback in app/dashboard/reports/page.tsx so the
// shimmer doesn't visually swap shapes between navigation and hard-load.
export default function ReportsLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="bg-muted animate-shimmer h-8 w-48 rounded-lg" />
        <div className="bg-muted animate-shimmer h-4 w-80 rounded-lg" />
      </div>
      <div className="bg-muted animate-shimmer h-10 w-full rounded-lg" />
      <div className="bg-card border-border rounded-xl border p-6">
        <div className="space-y-4">
          <div className="bg-muted animate-shimmer h-6 w-40 rounded-lg" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="bg-muted animate-shimmer h-10 rounded-lg" />
            <div className="bg-muted animate-shimmer h-10 rounded-lg" />
          </div>
          <div className="bg-muted animate-shimmer h-10 w-32 rounded-lg" />
        </div>
      </div>
    </div>
  )
}
