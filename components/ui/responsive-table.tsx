'use client'

/**
 * Responsive Table Component
 * Auto-switches between table and card views based on screen size
 * Eliminates horizontal scrolling on mobile
 *
 * @author Maurice (Skycruzer)
 * @version 1.1.0
 */

import * as React from 'react'
import { cn } from '@/lib/utils'
import { ChevronDown, ChevronUp, MoreHorizontal } from 'lucide-react'
import { Button } from './button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './dropdown-menu'

// Types — use shared Column definition
export type { Column } from './table-types'
import type { Column } from './table-types'

export interface Action<T> {
  label: string
  onClick: (row: T) => void
  icon?: React.ReactNode
  variant?: 'default' | 'destructive'
  disabled?: (row: T) => boolean
}

export interface ResponsiveTableProps<T> {
  /** Data to display */
  data: T[]
  /** Column definitions */
  columns: Column<T>[]
  /** Row actions */
  actions?: Action<T>[]
  /** Key extractor for rows */
  keyExtractor: (row: T) => string
  /** Breakpoint for switching views (default: md) */
  breakpoint?: 'sm' | 'md' | 'lg'
  /** Loading state */
  loading?: boolean
  /** Empty state message */
  emptyMessage?: string
  /** Called when row is clicked */
  onRowClick?: (row: T) => void
  /** Enable row selection */
  selectable?: boolean
  /** Selected row keys */
  selectedKeys?: Set<string>
  /** Called when selection changes */
  onSelectionChange?: (keys: Set<string>) => void
  /** Additional className */
  className?: string
}

type SortDirection = 'asc' | 'desc' | null

// Helper to get cell value
function getCellValue<T>(row: T, accessor: Column<T>['accessor']): unknown {
  if (!accessor) return ''
  if (typeof accessor === 'function') {
    return accessor(row)
  }
  return (row as Record<string, unknown>)[accessor as string]
}

// Helper to render cell — handles the two-arg (value, row) signature
function renderCell<T>(col: Column<T>, value: unknown, row: T): React.ReactNode {
  if (col.cell) {
    return (col.cell as (value: unknown, row: T) => React.ReactNode)(value, row)
  }
  return String(value ?? '')
}

// Table View Component
function TableView<T>({
  data,
  columns,
  actions,
  keyExtractor,
  onRowClick,
  sortColumn,
  sortDirection,
  onSort,
}: {
  data: T[]
  columns: Column<T>[]
  actions?: Action<T>[]
  keyExtractor: (row: T) => string
  onRowClick?: (row: T) => void
  sortColumn: string | null
  sortDirection: SortDirection
  onSort: (id: string) => void
}) {
  return (
    <div className="border-border overflow-hidden rounded-xl border">
      <table className="w-full">
        <thead className="bg-muted/30">
          <tr>
            {columns.map((col) => (
              <th
                key={col.id}
                className={cn(
                  'text-muted-foreground px-4 py-3 text-left text-xs font-semibold tracking-wider uppercase tabular-nums',
                  col.width,
                  col.align === 'center' && 'text-center',
                  col.align === 'right' && 'text-right',
                  col.sortable && 'hover:bg-muted/40 cursor-pointer transition-colors'
                )}
                onClick={() => col.sortable && onSort(col.id)}
              >
                <div className="flex items-center gap-1">
                  {col.header}
                  {col.sortable &&
                    sortColumn === col.id &&
                    (sortDirection === 'asc' ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    ))}
                </div>
              </th>
            ))}
            {actions && actions.length > 0 && <th className="w-12 px-4 py-3" />}
          </tr>
        </thead>
        <tbody className="divide-border divide-y">
          {data.map((row) => (
            <tr
              key={keyExtractor(row)}
              className={cn(
                'bg-transparent transition-colors',
                onRowClick && 'hover:bg-muted/40 cursor-pointer'
              )}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((col) => {
                const value = getCellValue(row, col.accessor)
                return (
                  <td
                    key={col.id}
                    className={cn(
                      'px-4 py-3 text-sm',
                      col.align === 'center' && 'text-center',
                      col.align === 'right' && 'text-right'
                    )}
                  >
                    {renderCell(col, value, row)}
                  </td>
                )
              })}
              {actions && actions.length > 0 && (
                <td className="px-2 py-3" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {actions.map((action, i) => (
                        <DropdownMenuItem
                          key={i}
                          onClick={() => action.onClick(row)}
                          disabled={action.disabled?.(row)}
                          className={
                            action.variant === 'destructive'
                              ? 'text-[var(--color-status-high)]'
                              : ''
                          }
                        >
                          {action.icon && <span className="mr-2">{action.icon}</span>}
                          {action.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// Card View Component (Mobile)
function CardView<T>({
  data,
  columns,
  actions,
  keyExtractor,
  onRowClick,
}: {
  data: T[]
  columns: Column<T>[]
  actions?: Action<T>[]
  keyExtractor: (row: T) => string
  onRowClick?: (row: T) => void
}) {
  // Filter columns by priority for mobile (priority 1-2 always visible)
  const primaryColumns = columns.filter((col) => (col.priority ?? 1) <= 2)
  const secondaryColumns = columns.filter((col) => (col.priority ?? 1) > 2)

  return (
    <div className="space-y-3">
      {data.map((row) => (
        <div
          key={keyExtractor(row)}
          className={cn(
            'border-border bg-background rounded-xl border p-4 transition-all duration-200',
            onRowClick && 'hover:border-border/80 cursor-pointer hover:shadow-md'
          )}
          onClick={() => onRowClick?.(row)}
        >
          {/* Primary info row */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 space-y-1">
              {primaryColumns.map((col) => {
                const value = getCellValue(row, col.accessor)
                return (
                  <div key={col.id}>
                    {col.priority === 1 ? (
                      <span className="text-foreground font-medium">
                        {renderCell(col, value, row)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-sm">
                        {renderCell(col, value, row)}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
            {actions && actions.length > 0 && (
              <div onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="-mt-1 -mr-2 h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {actions.map((action, i) => (
                      <DropdownMenuItem
                        key={i}
                        onClick={() => action.onClick(row)}
                        disabled={action.disabled?.(row)}
                        className={
                          action.variant === 'destructive' ? 'text-[var(--color-status-high)]' : ''
                        }
                      >
                        {action.icon && <span className="mr-2">{action.icon}</span>}
                        {action.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>

          {/* Secondary info */}
          {secondaryColumns.length > 0 && (
            <div className="border-border/50 mt-3 border-t pt-3">
              <div className="grid grid-cols-2 gap-2">
                {secondaryColumns.map((col) => {
                  const value = getCellValue(row, col.accessor)
                  return (
                    <div key={col.id} className="text-xs">
                      <span className="text-muted-foreground">{col.header}: </span>
                      <span className="font-medium">{renderCell(col, value, row)}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// Loading skeleton
function TableSkeleton({ columns, rows = 5 }: { columns: number; rows?: number }) {
  return (
    <div className="border-border overflow-hidden rounded-xl border">
      <div className="animate-shimmer">
        <div className="bg-muted/30 h-12" />
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="border-border flex h-14 items-center gap-4 border-t px-4">
            {Array.from({ length: columns }).map((_, j) => (
              <div key={j} className="bg-muted/60 h-4 flex-1 rounded" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

// Main Component
export function ResponsiveTable<T>({
  data,
  columns,
  actions,
  keyExtractor,
  breakpoint = 'md',
  loading = false,
  emptyMessage = 'No data available',
  onRowClick,
  className,
}: ResponsiveTableProps<T>) {
  const [sortColumn, setSortColumn] = React.useState<string | null>(null)
  const [sortDirection, setSortDirection] = React.useState<SortDirection>(null)

  const handleSort = (id: string) => {
    if (sortColumn === id) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : prev === 'desc' ? null : 'asc'))
      if (sortDirection === 'desc') {
        setSortColumn(null)
      }
    } else {
      setSortColumn(id)
      setSortDirection('asc')
    }
  }

  // Sort data if needed
  const sortedData = React.useMemo(() => {
    if (!sortColumn || !sortDirection) return data

    const col = columns.find((c) => c.id === sortColumn)
    if (!col) return data

    return [...data].sort((a, b) => {
      const aVal = getCellValue(a, col.accessor)
      const bVal = getCellValue(b, col.accessor)

      if (aVal === bVal) return 0
      if (aVal === null || aVal === undefined) return 1
      if (bVal === null || bVal === undefined) return -1

      const comparison = String(aVal).localeCompare(String(bVal))
      return sortDirection === 'asc' ? comparison : -comparison
    })
  }, [data, columns, sortColumn, sortDirection])

  if (loading) {
    return <TableSkeleton columns={columns.length} />
  }

  if (data.length === 0) {
    return (
      <div className="border-border flex flex-col items-center justify-center rounded-xl border border-dashed px-4 py-12 text-center">
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    )
  }

  const breakpointClass = {
    sm: 'sm:hidden',
    md: 'md:hidden',
    lg: 'lg:hidden',
  }[breakpoint]

  const inverseBreakpointClass = {
    sm: 'hidden sm:block',
    md: 'hidden md:block',
    lg: 'hidden lg:block',
  }[breakpoint]

  return (
    <div className={className}>
      {/* Card view for mobile */}
      <div className={breakpointClass}>
        <CardView
          data={sortedData}
          columns={columns}
          actions={actions}
          keyExtractor={keyExtractor}
          onRowClick={onRowClick}
        />
      </div>

      {/* Table view for desktop */}
      <div className={inverseBreakpointClass}>
        <TableView
          data={sortedData}
          columns={columns}
          actions={actions}
          keyExtractor={keyExtractor}
          onRowClick={onRowClick}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          onSort={handleSort}
        />
      </div>
    </div>
  )
}
