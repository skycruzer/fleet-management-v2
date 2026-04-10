import { TableSkeleton, MetricCardSkeleton } from '@/components/ui/skeleton'

export default function AuditLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="bg-muted/60 h-7 w-32 animate-pulse rounded" />
        <div className="bg-muted/60 h-4 w-64 animate-pulse rounded" />
      </div>
      <MetricCardSkeleton count={4} />
      <div className="bg-card rounded-lg border p-6">
        <TableSkeleton rows={8} columns={5} />
      </div>
    </div>
  )
}
