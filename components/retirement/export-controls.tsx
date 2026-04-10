/**
 * Export Controls Component
 * PDF and CSV export buttons with loading states and error handling
 *
 * @version 1.0.0
 * @since 2025-10-25
 */

'use client'

import { Button } from '@/components/ui/button'
import { Download, FileText, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useToast } from '@/hooks/use-toast'

/**
 * Client Component for PDF and CSV export functionality
 * Includes loading states, error handling, and success feedback
 */
export function ExportControls() {
  const [isExportingPDF, setIsExportingPDF] = useState(false)
  const [isExportingCSV, setIsExportingCSV] = useState(false)
  const { toast } = useToast()

  /**
   * Handle PDF export download
   */
  const handlePDFExport = async () => {
    setIsExportingPDF(true)
    try {
      const response = await fetch('/api/retirement/export/pdf')

      if (!response.ok) {
        throw new Error('Failed to generate PDF')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `retirement-forecast-${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      toast({
        title: 'PDF Generated',
        description: 'Retirement forecast PDF has been downloaded successfully.',
      })
    } catch (error) {
      console.error('PDF export error:', error)
      toast({
        title: 'Export Failed',
        description: 'Failed to generate PDF. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsExportingPDF(false)
    }
  }

  /**
   * Handle CSV export download
   */
  const handleCSVExport = async () => {
    setIsExportingCSV(true)
    try {
      const response = await fetch('/api/retirement/export/csv')

      if (!response.ok) {
        throw new Error('Failed to generate CSV')
      }

      const csvText = await response.text()
      const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `retirement-forecast-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      toast({
        title: 'CSV Generated',
        description: 'Retirement forecast CSV has been downloaded successfully.',
      })
    } catch (error) {
      console.error('CSV export error:', error)
      toast({
        title: 'Export Failed',
        description: 'Failed to generate CSV. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsExportingCSV(false)
    }
  }

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        onClick={handlePDFExport}
        disabled={isExportingPDF || isExportingCSV}
        aria-label="Export retirement forecast as PDF"
      >
        {isExportingPDF ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <FileText className="mr-2 h-4 w-4" />
        )}
        {isExportingPDF ? 'Generating PDF...' : 'Export PDF'}
      </Button>
      <Button
        variant="outline"
        onClick={handleCSVExport}
        disabled={isExportingPDF || isExportingCSV}
        aria-label="Export retirement forecast as CSV"
      >
        {isExportingCSV ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Download className="mr-2 h-4 w-4" />
        )}
        {isExportingCSV ? 'Exporting...' : 'Export CSV'}
      </Button>
    </div>
  )
}
