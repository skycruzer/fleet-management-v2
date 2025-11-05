/**
 * Reports Client Component
 * Author: Maurice Rondeau
 * Date: November 4, 2025
 *
 * Modern UI for report generation with preview and PDF export
 */

'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LeaveReportForm } from '@/components/reports/leave-report-form'
import { FlightRequestReportForm } from '@/components/reports/flight-request-report-form'
import { CertificationReportForm } from '@/components/reports/certification-report-form'
import { Calendar, Plane, Award, FileText } from 'lucide-react'

export function ReportsClient() {
  const [activeTab, setActiveTab] = useState<string>('leave')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground mt-2">
          Generate, preview, and export reports for leave requests, flight requests, and certifications
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="leave" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Leave Requests
          </TabsTrigger>
          <TabsTrigger value="flight-requests" className="flex items-center gap-2">
            <Plane className="h-4 w-4" />
            Flight Requests
          </TabsTrigger>
          <TabsTrigger value="certifications" className="flex items-center gap-2">
            <Award className="h-4 w-4" />
            Certifications
          </TabsTrigger>
        </TabsList>

        <TabsContent value="leave" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Leave Requests Report
              </CardTitle>
              <CardDescription>
                Generate comprehensive reports on leave requests with filtering by date range, roster period, status, and rank
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LeaveReportForm />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="flight-requests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plane className="h-5 w-5" />
                Flight Requests Report
              </CardTitle>
              <CardDescription>
                Generate comprehensive reports on flight requests with filtering by date range, status, and destination
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FlightRequestReportForm />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="certifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Certifications Report
              </CardTitle>
              <CardDescription>
                Generate compliance reports showing certification status, expiring checks, and pilot-specific data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CertificationReportForm />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="mt-8 p-4 bg-muted rounded-lg">
        <div className="flex items-start gap-3">
          <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
          <div className="space-y-1">
            <h3 className="font-medium">Report Features</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• <strong>Preview:</strong> View report data in the browser before exporting</li>
              <li>• <strong>PDF Export:</strong> Download professionally formatted PDF reports</li>
              <li>• <strong>Email Delivery:</strong> Send reports directly to recipients via email</li>
              <li>• <strong>Advanced Filtering:</strong> Customize reports with date ranges, status filters, and more</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
