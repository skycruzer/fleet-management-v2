/**
 * Export Utilities
 * Functions for exporting data tables to CSV format
 */

import { formatDate as formatDateStandard } from './date-utils'

/**
 * Convert array of objects to CSV string
 * @param data - Array of objects to convert
 * @param columns - Column definitions with header and accessor
 * @returns CSV string
 */
export function convertToCSV<T>(
  data: T[],
  columns: Array<{
    header: string
    accessor: (row: T) => string | number | boolean | null | undefined
  }>
): string {
  // Create header row
  const headers = columns.map((col) => col.header)
  const headerRow = headers.map(escapeCSVValue).join(',')

  // Create data rows
  const dataRows = data.map((row) => {
    const values = columns.map((col) => {
      const value = col.accessor(row)
      return escapeCSVValue(String(value ?? ''))
    })
    return values.join(',')
  })

  return [headerRow, ...dataRows].join('\n')
}

/**
 * Escape CSV values to handle commas, quotes, and newlines
 * @param value - Value to escape
 * @returns Escaped value
 */
function escapeCSVValue(value: string): string {
  // If value contains comma, quote, or newline, wrap in quotes and escape quotes
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

/**
 * Download CSV file to user's computer
 * @param csv - CSV string content
 * @param filename - Name of the file (without .csv extension)
 */
export function downloadCSV(csv: string, filename: string): void {
  // Create blob with UTF-8 BOM for Excel compatibility
  const BOM = '\uFEFF'
  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' })

  // Create download link
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}.csv`)
  link.style.visibility = 'hidden'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  // Clean up
  URL.revokeObjectURL(url)
}

/**
 * Export data table to CSV and download
 * @param data - Data to export
 * @param columns - Column definitions
 * @param filename - Filename without extension
 */
export function exportToCSV<T>(
  data: T[],
  columns: Array<{
    header: string
    accessor: (row: T) => string | number | boolean | null | undefined
  }>,
  filename: string
): void {
  const csv = convertToCSV(data, columns)
  downloadCSV(csv, filename)
}

/**
 * Format date for CSV export (uses standardized date formatting)
 * @param date - Date to format
 * @returns Formatted date string
 */
export function formatDateForExport(date: Date | string | null | undefined): string {
  return formatDateStandard(date)
}

/**
 * Format boolean for CSV export
 * @param value - Boolean value
 * @returns 'Yes' or 'No'
 */
export function formatBooleanForExport(value: boolean | null | undefined): string {
  if (value === null || value === undefined) return ''
  return value ? 'Yes' : 'No'
}

/**
 * Generate timestamped filename
 * @param prefix - Filename prefix
 * @returns Filename with timestamp
 */
export function generateFilename(prefix: string): string {
  const now = new Date()
  const timestamp = now.toISOString().split('T')[0] // YYYY-MM-DD
  return `${prefix}_${timestamp}`
}
