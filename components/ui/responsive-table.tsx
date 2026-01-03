'use client'

/**
 * Responsive Table Component
 * Auto-switches between table and card views based on screen size
 * Eliminates horizontal scrolling on mobile
 *
 * @author Maurice (Skycruzer)
 * @version 1.0.0
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

// Types
export interface Column<T> {
  /** Unique key for the column */
  key: string
  /** Display header */
  header: string
  /** Accessor function or key path */
  accessor: keyof T | ((row: T) => React.ReactNode)
  /** Priority for mobile display (1 = always visible, higher = hidden on mobile) */
  priority?: number
  /** Custom cell renderer */
  cell?: (value: unknown, row: T) => React.ReactNode
  /** Enable sorting */
  sortable?: boolean
  /** Column width class */
  width?: string
  /** Align content */
  align?: 'left' | 'center' | 'right'
}

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
  if (typeof accessor === 'function') {
    return accessor(row)
  }
  return row[accessor]
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
  onSort: (key: string) => void
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <table className="w-full">
        <thead className="bg-slate-50">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  'px-4 py-3 text-left text-xs font-semibold tracking-wider text-slate-600 uppercase',
                  col.width,
                  col.align === 'center' && 'text-center',
                  col.align === 'right' && 'text-right',
                  col.sortable && 'cursor-pointer transition-colors hover:bg-slate-100'
                )}
                onClick={() => col.sortable && onSort(col.key)}
              >
                <div className="flex items-center gap-1">
                  {col.header}
                  {col.sortable &&
                    sortColumn === col.key &&
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
        <tbody className="divide-y divide-slate-100">
          {data.map((row) => (
            <tr
              key={keyExtractor(row)}
              className={cn(
                'bg-white transition-colors',
                onRowClick && 'cursor-pointer hover:bg-slate-50'
              )}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((col) => {
                const value = getCellValue(row, col.accessor)
                return (
                  <td
                    key={col.key}
                    className={cn(
                      'px-4 py-3 text-sm',
                      col.align === 'center' && 'text-center',
                      col.align === 'right' && 'text-right'
                    )}
                  >
                    {col.cell ? col.cell(value, row) : String(value ?? '')}
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
                          className={action.variant === 'destructive' ? 'text-red-600' : ''}
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
            'rounded-xl border border-slate-200 bg-white p-4 transition-all duration-200',
            onRowClick && 'cursor-pointer hover:border-slate-300 hover:shadow-md'
          )}
          onClick={() => onRowClick?.(row)}
        >
          {/* Primary info row */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 space-y-1">
              {primaryColumns.map((col) => {
                const value = getCellValue(row, col.accessor)
                return (
                  <div key={col.key}>
                    {col.priority === 1 ? (
                      <span className="text-foreground font-medium">
                        {col.cell ? col.cell(value, row) : String(value ?? '')}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-sm">
                        {col.cell ? col.cell(value, row) : String(value ?? '')}
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
                        className={action.variant === 'destructive' ? 'text-red-600' : ''}
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
            <div className="mt-3 border-t border-slate-100 pt-3">
              <div className="grid grid-cols-2 gap-2">
                {secondaryColumns.map((col) => {
                  const value = getCellValue(row, col.accessor)
                  return (
                    <div key={col.key} className="text-xs">
                      <span className="text-muted-foreground">{col.header}: </span>
                      <span className="font-medium">
                        {col.cell ? col.cell(value, row) : String(value ?? '')}
                      </span>
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
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <div className="animate-pulse">
        <div className="h-12 bg-slate-50" />
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex h-14 items-center gap-4 border-t border-slate-100 px-4">
            {Array.from({ length: columns }).map((_, j) => (
              <div key={j} className="h-4 flex-1 rounded bg-slate-200" />
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

  const handleSort = (key: string) => {
    if (sortColumn === key) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : prev === 'desc' ? null : 'asc'))
      if (sortDirection === 'desc') {
        setSortColumn(null)
      }
    } else {
      setSortColumn(key)
      setSortDirection('asc')
    }
  }

  // Sort data if needed
  const sortedData = React.useMemo(() => {
    if (!sortColumn || !sortDirection) return data

    const col = columns.find((c) => c.key === sortColumn)
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
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 px-4 py-12 text-center">
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
