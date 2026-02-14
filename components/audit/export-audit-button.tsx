/**
 * Export Audit Button Component
 * Client component for exporting audit trail to CSV
 * Handles download, loading states, and error handling
 *
 * @version 1.0.0
 * @since 2025-10-25
 */

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'

interface ExportAuditButtonProps {
  entityType: string
  entityId?: string
  startDate?: Date
  endDate?: Date
  label?: string
  variant?: 'default' | 'outline' | 'secondary' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

/**
 * Export Audit Button Component
 * Triggers CSV export download for audit trail data
 */
export function ExportAuditButton({
  entityType,
  entityId,
  startDate,
  endDate,
  label = 'Export Audit Trail',
  variant = 'outline',
  size = 'default',
}: ExportAuditButtonProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [exportSuccess, setExportSuccess] = useState(false)
  const { toast } = useToast()

  const handleExport = async () => {
    try {
      setIsExporting(true)
      setExportSuccess(false)

      // Build query parameters
      const params = new URLSearchParams()
      params.append('entityType', entityType)

      if (entityId) {
        params.append('entityId', entityId)
      }

      if (startDate) {
        params.append('startDate', startDate.toISOString())
      }

      if (endDate) {
        params.append('endDate', endDate.toISOString())
      }

      // Call export API
      const response = await fetch(`/api/audit/export?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'text/csv',
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.error || `Export failed with status ${response.status}`)
      }

      // Get CSV data
      const csvData = await response.text()

      // Create blob and download
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)

      // Generate filename
      const timestamp = format(new Date(), 'yyyy-MM-dd-HHmmss')
      const filename = `audit-trail-${entityType}${entityId ? `-${entityId.slice(0, 8)}` : ''}-${timestamp}.csv`

      // Create download link
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', filename)
      link.style.display = 'none'

      // Trigger download
      document.body.appendChild(link)
      link.click()

      // Cleanup
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      // Show success
      setExportSuccess(true)
      toast({
        title: 'Export Successful',
        description: `Audit trail exported to ${filename}`,
      })

      // Reset success state after 3 seconds
      setTimeout(() => {
        setExportSuccess(false)
      }, 3000)
    } catch (error) {
      console.error('Export error:', error)

      toast({
        title: 'Export Failed',
        description:
          error instanceof Error
            ? error.message
            : 'Failed to export audit trail. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsExporting(false)
    }
  }

  // Button icon based on state
  const ButtonIcon = exportSuccess ? CheckCircle2 : isExporting ? Loader2 : Download

  return (
    <Button
      onClick={handleExport}
      disabled={isExporting}
      variant={variant}
      size={size}
      aria-label={isExporting ? 'Exporting audit trail...' : label}
    >
      <ButtonIcon
        className={`h-4 w-4 ${size !== 'icon' ? 'mr-2' : ''} ${isExporting ? 'animate-spin' : ''}`}
        aria-hidden="true"
      />
      {size !== 'icon' && (
        <span>{isExporting ? 'Exporting...' : exportSuccess ? 'Exported!' : label}</span>
      )}
    </Button>
  )
}

/**
 * Compact version for use in table rows or tight spaces
 */
export function ExportAuditIconButton(props: Omit<ExportAuditButtonProps, 'label' | 'size'>) {
  return <ExportAuditButton {...props} size="icon" label="Export" />
}
