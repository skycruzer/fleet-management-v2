/**
 * Requests Loading State
 * Developer: Maurice Rondeau
 */

export default function RequestsLoading() {
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="animate-shimmer h-8 w-40 rounded" />
        <div className="flex gap-2">
          <div className="animate-shimmer h-10 w-28 rounded-lg" />
          <div className="animate-shimmer h-10 w-28 rounded-lg" />
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-muted flex gap-1 rounded-lg p-1">
        {['Leave', 'Flight', 'All'].map((tab) => (
          <div key={tab} className="animate-shimmer h-9 flex-1 rounded-md" />
        ))}
      </div>

      {/* Request Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="border-border bg-card space-y-3 rounded-xl border p-5">
            <div className="flex items-center justify-between">
              <div className="animate-shimmer h-5 w-24 rounded" />
              <div className="animate-shimmer h-6 w-16 rounded-full" />
            </div>
            <div className="animate-shimmer h-4 w-48 rounded" />
            <div className="animate-shimmer h-4 w-32 rounded" />
            <div className="flex gap-2 pt-2">
              <div className="animate-shimmer h-9 flex-1 rounded-lg" />
              <div className="animate-shimmer h-9 flex-1 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
