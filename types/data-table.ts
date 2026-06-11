/**
 * Data Table Types
 * Shared types for the TanStack Table + nuqs URL-synced data table system
 * (components/ui/data-table/, lib/hooks/use-data-table.ts)
 *
 * Pattern adapted from Kiranism/next-shadcn-dashboard-starter (MIT)
 */

import type { ColumnSort, RowData } from '@tanstack/react-table'
import type { LucideIcon } from 'lucide-react'

declare module '@tanstack/react-table' {
  // Type parameters are required by the upstream interface signature
  interface ColumnMeta<TData extends RowData, TValue> {
    /** Human-readable column label (used by view options + filter placeholders) */
    label?: string
    /** Placeholder text for text filter inputs */
    placeholder?: string
    /** Which toolbar filter control to render for this column */
    variant?: FilterVariant
    /** Options for select/multiSelect faceted filters */
    options?: Option[]
    /** Optional icon shown next to faceted filter options */
    icon?: LucideIcon
  }
}

export interface Option {
  label: string
  value: string
  count?: number
  icon?: LucideIcon
}

export type FilterVariant = 'text' | 'select' | 'multiSelect'

export interface ExtendedColumnSort<TData> extends Omit<ColumnSort, 'id'> {
  id: Extract<keyof TData, string>
}
