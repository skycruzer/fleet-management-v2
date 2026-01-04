/**
 * Certifications Table Component
 * Sortable and filterable table view of all certifications
 */

'use client'

import * as React from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DataTable, DataTableSearch, useTableFilter, type Column } from '@/components/ui/data-table'
import { EmptyState } from '@/components/ui/empty-state'
import { Eye, FileText, Download } from 'lucide-react'
import type { CertificationWithDetails } from '@/lib/services/certification-service'
import { exportToCSV, generateFilename } from '@/lib/utils/export-utils'
import { formatDate } from '@/lib/utils/date-utils'

interface CertificationsTableProps {
  certifications: CertificationWithDetails[]
}

export function CertificationsTable({ certifications }: CertificationsTableProps) {
  // Filter function for search
  const filterFn = React.useCallback((cert: CertificationWithDetails, query: string) => {
    const searchStr = query.toLowerCase()
    return (
      cert.pilot?.first_name.toLowerCase().includes(searchStr) ||
      cert.pilot?.last_name.toLowerCase().includes(searchStr) ||
      cert.check_type?.check_code.toLowerCase().includes(searchStr) ||
      cert.check_type?.check_description.toLowerCase().includes(searchStr) ||
      cert.check_type?.category?.toLowerCase().includes(searchStr) ||
      cert.status?.label.toLowerCase().includes(searchStr) ||
      false
    )
  }, [])

  const { filteredData, filterQuery, setFilterQuery } = useTableFilter(certifications, filterFn)

  // Export function
  const handleExport = React.useCallback(() => {
    const exportColumns = [
      {
        header: 'Pilot Name',
        accessor: (row: CertificationWithDetails) =>
          `${row.pilot?.first_name} ${row.pilot?.last_name}`,
      },
      {
        header: 'Employee ID',
        accessor: (row: CertificationWithDetails) => row.pilot?.employee_id ?? '',
      },
      { header: 'Rank', accessor: (row: CertificationWithDetails) => row.pilot?.role ?? '' },
      {
        header: 'Check Code',
        accessor: (row: CertificationWithDetails) => row.check_type?.check_code ?? '',
      },
      {
        header: 'Check Description',
        accessor: (row: CertificationWithDetails) => row.check_type?.check_description ?? '',
      },
      {
        header: 'Category',
        accessor: (row: CertificationWithDetails) => row.check_type?.category ?? 'Uncategorized',
      },
      {
        header: 'Expiry Date',
        accessor: (row: CertificationWithDetails) => formatDate(row.expiry_date),
      },
      {
        header: 'Status',
        accessor: (row: CertificationWithDetails) => row.status?.label ?? 'No Date',
      },
      {
        header: 'Days Until Expiry',
        accessor: (row: CertificationWithDetails) => row.status?.daysUntilExpiry ?? '',
      },
    ]

    exportToCSV(filteredData, exportColumns, generateFilename('certifications'))
  }, [filteredData])

  // Define columns
  const columns: Column<CertificationWithDetails>[] = [
    {
      id: 'pilot',
      header: 'Pilot',
      sortable: true,
      accessorFn: (row) => `${row.pilot?.last_name}, ${row.pilot?.first_name}`,
      cell: (row) => (
        <div className="flex flex-col">
          <span className="text-foreground font-medium">
            {row.pilot?.first_name} {row.pilot?.last_name}
          </span>
          <span className="text-muted-foreground text-xs">{row.pilot?.employee_id}</span>
        </div>
      ),
    },
    {
      id: 'rank',
      header: 'Rank',
      accessorFn: (row) => row.pilot?.role || '',
      sortable: true,
      cell: (row) => (
        <Badge variant={row.pilot?.role === 'Captain' ? 'default' : 'secondary'}>
          {row.pilot?.role || '-'}
        </Badge>
      ),
    },
    {
      id: 'check',
      header: 'Check Type',
      sortable: true,
      accessorFn: (row) => row.check_type?.check_code || '',
      cell: (row) => (
        <div className="flex flex-col">
          <span className="text-foreground font-medium">{row.check_type?.check_code}</span>
          <span className="text-muted-foreground text-xs">{row.check_type?.check_description}</span>
        </div>
      ),
    },
    {
      id: 'category',
      header: 'Category',
      accessorFn: (row) => row.check_type?.category || '',
      sortable: true,
      cell: (row) => (
        <span className="text-foreground text-sm">
          {row.check_type?.category || 'Uncategorized'}
        </span>
      ),
    },
    {
      id: 'expiry',
      header: 'Expiry Date',
      accessorKey: 'expiry_date',
      sortable: true,
      cell: (row) => <span className="text-foreground">{formatDate(row.expiry_date) || '-'}</span>,
    },
    {
      id: 'status',
      header: 'Status',
      accessorFn: (row) => row.status?.label || 'No Date',
      sortable: true,
      cell: (row) => {
        if (!row.status) return <Badge variant="secondary">No Date</Badge>

        const variant =
          row.status.color === 'red'
            ? 'destructive'
            : row.status.color === 'yellow'
              ? 'default'
              : row.status.color === 'green'
                ? 'default'
                : 'secondary'

        const className =
          row.status.color === 'yellow'
            ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400'
            : row.status.color === 'green'
              ? 'bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400'
              : ''

        return (
          <div className="flex flex-col gap-1">
            <Badge variant={variant} className={className}>
              {row.status.label}
            </Badge>
            {row.status.daysUntilExpiry !== undefined && (
              <span className="text-muted-foreground text-xs">
                {row.status.daysUntilExpiry < 0
                  ? `${Math.abs(row.status.daysUntilExpiry)} days ago`
                  : `${row.status.daysUntilExpiry} days`}
              </span>
            )}
          </div>
        )
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (row) => (
        <Link href={`/dashboard/pilots/${row.pilot_id}`}>
          <Button
            size="sm"
            variant="ghost"
            aria-label={`View pilot ${row.pilot?.first_name} ${row.pilot?.last_name}`}
          >
            <Eye className="h-4 w-4" aria-hidden="true" />
          </Button>
        </Link>
      ),
    },
  ]

  // Show empty state if no certifications at all
  if (certifications.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="No certifications found"
        description="Get started by adding certifications to track pilot qualifications and expiry dates."
        action={{
          label: 'Add Certification',
          href: '/dashboard/certifications/new',
        }}
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <DataTableSearch
          value={filterQuery}
          onChange={setFilterQuery}
          placeholder="Search by pilot, check type, category, or status..."
          className="max-w-md"
        />
        <Button onClick={handleExport} variant="outline" size="sm" className="w-full sm:w-auto">
          <Download className="mr-2 h-4 w-4" aria-hidden="true" />
          Export to CSV
        </Button>
      </div>
      {filteredData.length === 0 && filterQuery ? (
        <EmptyState
          title="No certifications match your search"
          description={`We couldn't find any certifications matching "${filterQuery}". Try adjusting your search terms.`}
          action={{
            label: 'Clear search',
            onClick: () => setFilterQuery(''),
          }}
        />
      ) : (
        <DataTable
          data={filteredData}
          columns={columns}
          emptyMessage="No certifications found. Try adjusting your search."
          enablePagination={true}
          initialPageSize={25}
          pageSizeOptions={[10, 25, 50, 100]}
        />
      )}
    </div>
  )
}
