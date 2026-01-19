/**
 * Export PDF Button Component
 * Client component for exporting renewal plan to PDF
 */

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileText, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface ExportPDFButtonProps {
  year: number
  disabled?: boolean
  hasData?: boolean
}

export function ExportPDFButton({ year, disabled, hasData = true }: ExportPDFButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleExport = async () => {
    if (!hasData) {
      toast.error('No Renewal Plans Generated', {
        description: `No renewal plans found for ${year}. Please click "Generate Renewal Plan" first to create plans for this year.`,
        duration: 6000,
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(`/api/renewal-planning/export-pdf?year=${year}`)

      if (!response.ok) {
        const data = await response.json()

        if (response.status === 404) {
          toast.error('No Renewal Plans Generated', {
            description:
              data.details ||
              `No renewal plans found for ${year}. Please click "Generate Renewal Plan" first to create plans for this year.`,
            duration: 6000,
          })
        } else {
          toast.error('PDF Export Failed', {
            description: data.details || 'Failed to generate PDF',
          })
        }
        return
      }

      // Download the PDF
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Renewal_Plan_${year}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      toast.success('PDF Downloaded', {
        description: `Renewal plan for ${year} has been downloaded successfully`,
      })
    } catch (error) {
      console.error('Error exporting PDF:', error)
      toast.error('Export Failed', {
        description: 'Failed to export PDF. Please try again.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const isDisabled = disabled || isLoading

  return (
    <Button variant="outline" size="sm" onClick={handleExport} disabled={isDisabled}>
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Exporting...
        </>
      ) : (
        <>
          <FileText className="mr-2 h-4 w-4" />
          Export PDF
        </>
      )}
    </Button>
  )
}
