import { Skeleton } from '@/components/ui/skeleton'

export default function ApprovalsLoading() {
  return (
    <div className="w-full space-y-4 px-4 py-4 lg:px-6 lg:py-6">
      <Skeleton className="h-12 w-72" />
      <Skeleton className="h-10 w-full" />
      <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
        <Skeleton className="h-96 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    </div>
  )
}
