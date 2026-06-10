'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Pagination } from '@/components/ui/pagination'

interface DisciplinaryPaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  pageSize: number
}

/**
 * URL-driven wrapper around the shared Pagination component.
 * The disciplinary page is a server component paginated via ?page=,
 * so page changes navigate while preserving the other filters.
 */
export function DisciplinaryPagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
}: DisciplinaryPaginationProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', String(page))
    router.push(`?${params.toString()}`)
  }

  return (
    <Pagination
      currentPage={currentPage}
      totalPages={totalPages}
      totalItems={totalItems}
      pageSize={pageSize}
      onPageChange={handlePageChange}
      showPageSize={false}
    />
  )
}
