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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { ReportData, ReportType } from '@/types/reports'
import Image from 'next/image'
import { Calendar, Plane, Award, BarChart3, Users, TrendingUp } from 'lucide-react'
import { PaginatedReportTable } from './paginated-report-table'

interface ReportPreviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  reportData: ReportData | null
  reportType: ReportType
}

export function ReportPreviewDialog({
  open,
  onOpenChange,
  reportData,
  reportType,
}: ReportPreviewDialogProps) {
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
      case 'leave-bids':
        return <Calendar className="h-5 w-5" />
      case 'pilot-info':
        return <Users className="h-5 w-5" />
      case 'forecast':
        return <TrendingUp className="h-5 w-5" />
      default:
        return <BarChart3 className="h-5 w-5" />
    }
  }

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
    // Note: In a real implementation, this would trigger a new query with the new page number
    // For now, we're displaying the single page of data returned from the server
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-5xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Image
              src="/images/air-niugini-logo.jpg"
              alt="Air Niugini"
              width={24}
              height={24}
              className="h-6 w-6 rounded object-contain"
            />
            {reportData.title}
          </DialogTitle>
          <DialogDescription>
            Air Niugini Fleet Management &middot; Generated:{' '}
            {new Date(reportData.generatedAt).toLocaleString()}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[calc(90vh-200px)]">
          <div className="space-y-6 p-4">
            {/* Summary Statistics */}
            {reportData.summary && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <BarChart3 className="h-4 w-4" />
                    Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    {Object.entries(reportData.summary)
                      .filter(([, value]) => typeof value !== 'object' || value === null)
                      .map(([key, value]) => {
                        const label = key
                          .replace(/([A-Z])/g, ' $1')
                          .replace(/^./, (str) => str.toUpperCase())
                        return (
                          <div key={key} className="space-y-1">
                            <p className="text-muted-foreground text-sm">{label}</p>
                            <p className="text-2xl font-bold">{String(value ?? 'N/A')}</p>
                          </div>
                        )
                      })}
                  </div>
                  {/* Render nested summary objects (byStatus, byRank, bidsByRosterPeriod) */}
                  {Object.entries(reportData.summary)
                    .filter(
                      ([, value]) =>
                        typeof value === 'object' && value !== null && !Array.isArray(value)
                    )
                    .map(([key, value]) => {
                      const label = key
                        .replace(/([A-Z])/g, ' $1')
                        .replace(/^./, (str) => str.toUpperCase())
                      return (
                        <div key={key} className="mt-4">
                          <p className="text-muted-foreground mb-2 text-sm font-medium">{label}</p>
                          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                            {Object.entries(value as Record<string, unknown>).map(
                              ([subKey, subValue]) => {
                                const subLabel = subKey
                                  .replace(/([A-Z])/g, ' $1')
                                  .replace(/^./, (str) => str.toUpperCase())
                                return (
                                  <div key={subKey} className="space-y-1">
                                    <p className="text-muted-foreground text-xs">{subLabel}</p>
                                    <p className="text-lg font-semibold">{String(subValue ?? 0)}</p>
                                  </div>
                                )
                              }
                            )}
                          </div>
                        </div>
                      )
                    })}
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
