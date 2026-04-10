import { CardGridSkeleton } from '@/components/ui/skeleton'

export default function ReportsLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="bg-muted/60 h-7 w-28 animate-pulse rounded" />
        <div className="bg-muted/60 h-4 w-48 animate-pulse rounded" />
      </div>
      <CardGridSkeleton count={6} />
    </div>
  )
}
