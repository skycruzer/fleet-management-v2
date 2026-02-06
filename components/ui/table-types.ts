/**
 * Shared Table Column Types
 * Author: Maurice Rondeau
 *
 * Unified column type used by both DataTable and ResponsiveTable.
 * Each component picks the fields it needs; unused fields are optional.
 */

import type React from 'react'

/**
 * Unified column definition for table components.
 *
 * - `id` is the canonical unique key (DataTable convention).
 *   ResponsiveTable aliases it as `key`.
 * - `accessorKey` / `accessorFn` / `accessor` all provide data access.
 * - Visual & behaviour flags are optional so each table can ignore
 *   the fields it doesn't support.
 */
export interface Column<T> {
  /** Unique column identifier */
  id: string

  /** Display header text */
  header: string

  // --- Data access (pick one) ---

  /** Simple property-key accessor (DataTable style) */
  accessorKey?: keyof T

  /** Function accessor returning raw value (DataTable style) */
  accessorFn?: (row: T) => unknown

  /**
   * Property key or function accessor (ResponsiveTable style).
   * Components that need this should cast or adapt at the boundary.
   */
  accessor?: keyof T | ((row: T) => React.ReactNode)

  // --- Rendering ---

  /**
   * Custom cell renderer.
   * DataTable calls as `cell(row)`. ResponsiveTable calls as `cell(value, row)`.
   * Use the single-arg `(row: T) => ReactNode` form for type safety;
   * ResponsiveTable casts internally to its two-arg variant.
   */
  cell?: (...args: any[]) => React.ReactNode

  // --- Behaviour flags ---

  /** Enable column sorting */
  sortable?: boolean

  /** Enable column filtering (DataTable) */
  filterable?: boolean

  // --- Layout & responsive ---

  /** Mobile priority: 1 = always visible, higher = hidden on small screens (ResponsiveTable) */
  priority?: number

  /** Column width class (ResponsiveTable) */
  width?: string

  /** Content alignment (ResponsiveTable) */
  align?: 'left' | 'center' | 'right'
}
