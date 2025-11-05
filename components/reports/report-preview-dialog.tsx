/**
 * Report Preview Dialog Component
 * Author: Maurice Rondeau
 * Date: November 4, 2025
 *
 * Modal dialog for previewing report data before export
 * Phase 2.3: Integrated TanStack Table with pagination support
 */

'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { ReportData, ReportType } from '@/types/reports'
import { Calendar, Plane, Award, BarChart3 } from 'lucide-react'
import { PaginatedReportTable } from './paginated-report-table'

interface ReportPreviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  reportData: ReportData | null
  reportType: ReportType
}

export function ReportPreviewDialog({ open, onOpenChange, reportData, reportType }: ReportPreviewDialogProps) {
  const [currentPage, setCurrentPage] = useState(1)

  if (!reportData) return null

  const getIcon = () => {
    switch (reportType) {
      case 'leave':
        return <Calendar className="h-5 w-5" />
      case 'flight-requests':
        return <Plane className="h-5 w-5" />
      case 'certifications':
        return <Award className="h-5 w-5" />
    }
  }

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
    // Note: In a real implementation, this would trigger a new query with the new page number
    // For now, we're displaying the single page of data returned from the server
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getIcon()}
            {reportData.title}
          </DialogTitle>
          <DialogDescription>
            Generated: {new Date(reportData.generatedAt).toLocaleString()}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[calc(90vh-200px)]">
          <div className="space-y-6 p-4">
            {/* Summary Statistics */}
            {reportData.summary && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(reportData.summary).map(([key, value]) => {
                      const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())
                      return (
                        <div key={key} className="space-y-1">
                          <p className="text-sm text-muted-foreground">{label}</p>
                          <p className="text-2xl font-bold">{value}</p>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Data Table - Phase 2.3: TanStack Table with Pagination */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Data ({reportData.pagination?.totalRecords || reportData.data.length} records)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PaginatedReportTable
                  data={reportData.data}
                  reportType={reportType}
                  pagination={reportData.pagination}
                  onPageChange={handlePageChange}
                />
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
