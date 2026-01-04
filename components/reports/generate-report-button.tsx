/**
 * Generate Report Button Component
 *
 * Triggers roster period report generation and provides download/email options
 *
 * @author Maurice Rondeau
 * @date November 11, 2025
 */

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { FileText, Download, Mail, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { RosterReportPreviewDialog } from './roster-report-preview-dialog'
import { RosterEmailReportDialog } from './roster-email-report-dialog'
import type { RosterPeriodReport } from '@/lib/services/roster-report-service'

interface GenerateReportButtonProps {
  rosterPeriod: string
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg'
}

export function GenerateReportButton({
  rosterPeriod,
  variant = 'default',
  size = 'default',
}: GenerateReportButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [report, setReport] = useState<RosterPeriodReport | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [showEmail, setShowEmail] = useState(false)
  const { toast } = useToast()

  /**
   * Generate roster period report
   */
  async function handleGenerateReport(reportType: 'PREVIEW' | 'FINAL' = 'PREVIEW') {
    setIsGenerating(true)

    try {
      const response = await fetch(`/api/roster-reports/${rosterPeriod}?reportType=${reportType}`)
      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate report')
      }

      setReport(data.data)

      toast({
        title: 'Report Generated',
        description: `${reportType} report generated successfully for ${rosterPeriod}`,
      })
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to generate report',
      })
    } finally {
      setIsGenerating(false)
    }
  }

  /**
   * Download PDF report (client-side generation)
   */
  async function handleDownloadPDF() {
    if (!report) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please generate a report first',
      })
      return
    }

    try {
      // Dynamic import of PDF service (client-side only)
      const { generateRosterPDF, downloadPDF } = await import('@/lib/services/roster-pdf-service')

      const result = await generateRosterPDF(report, {
        includeDenied: true,
        includeAvailability: true,
        footerText: 'Fleet Management System - Air Niugini B767 Operations',
      })

      if (!result.success || !result.pdfBlob) {
        throw new Error(result.error || 'Failed to generate PDF')
      }

      // Download the PDF
      const filename = `roster-report-${rosterPeriod.replace('/', '-')}-${report.metadata.reportType.toLowerCase()}.pdf`
      downloadPDF(result.pdfBlob, filename)

      toast({
        title: 'PDF Downloaded',
        description: 'Report PDF has been downloaded successfully',
      })
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'PDF Generation Error',
        description: error.message || 'Failed to generate PDF',
      })
    }
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant={variant} size={size}>
            <FileText className="mr-2 h-4 w-4" />
            Generate Report
          </Button>
        </DialogTrigger>

        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Generate Roster Period Report</DialogTitle>
            <DialogDescription>
              Generate a comprehensive report for roster period {rosterPeriod}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {!report ? (
              <>
                <p className="text-muted-foreground text-sm">
                  Generate a preview or final report with all approved/denied requests and crew
                  availability analysis.
                </p>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => handleGenerateReport('PREVIEW')}
                    disabled={isGenerating}
                    className="flex-1"
                  >
                    {isGenerating ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <FileText className="mr-2 h-4 w-4" />
                    )}
                    Preview
                  </Button>

                  <Button
                    onClick={() => handleGenerateReport('FINAL')}
                    disabled={isGenerating}
                    className="flex-1"
                  >
                    {isGenerating ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <FileText className="mr-2 h-4 w-4" />
                    )}
                    Final Report
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                  <p className="font-medium text-green-900">Report Generated Successfully</p>
                  <p className="mt-1 text-sm text-green-700">
                    {report.metadata.reportType} report for {rosterPeriod}
                  </p>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-green-600">Total Requests:</span>{' '}
                      <span className="font-medium">{report.statistics.totalRequests}</span>
                    </div>
                    <div>
                      <span className="text-green-600">Approved:</span>{' '}
                      <span className="font-medium text-green-700">
                        {report.statistics.approvedCount}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setShowPreview(true)} className="flex-1">
                    <FileText className="mr-2 h-4 w-4" />
                    Preview
                  </Button>

                  <Button variant="outline" onClick={handleDownloadPDF} className="flex-1">
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF
                  </Button>

                  <Button onClick={() => setShowEmail(true)} className="flex-1">
                    <Mail className="mr-2 h-4 w-4" />
                    Email
                  </Button>
                </div>

                <Button
                  variant="ghost"
                  onClick={() => setReport(null)}
                  className="w-full"
                  size="sm"
                >
                  Generate New Report
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Report Preview Dialog */}
      {report && (
        <RosterReportPreviewDialog
          report={report}
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
        />
      )}

      {/* Email Report Dialog */}
      {report && (
        <RosterEmailReportDialog
          report={report}
          rosterPeriod={rosterPeriod}
          isOpen={showEmail}
          onClose={() => setShowEmail(false)}
        />
      )}
    </>
  )
}
