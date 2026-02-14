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
import { LeaveBidsReportForm } from '@/components/reports/leave-bids-report-form'
import { PilotInfoReportForm } from '@/components/reports/pilot-info-report-form'
import { ForecastReportForm } from '@/components/reports/forecast-report-form'
import { Calendar, Plane, Award, ClipboardList, Users, TrendingUp } from 'lucide-react'

export function ReportsClient() {
  const [activeTab, setActiveTab] = useState<string>('leave')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-foreground text-xl font-semibold tracking-tight lg:text-2xl">
          Reports
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Generate, preview, and export reports for leave requests, flight requests, leave bids,
          certifications, pilot information, and workforce forecasts
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="flex h-auto w-full flex-wrap gap-1 sm:flex-nowrap sm:overflow-x-auto">
          <TabsTrigger value="leave" className="flex items-center gap-2 whitespace-nowrap">
            <Calendar className="h-4 w-4" />
            Leave Requests
          </TabsTrigger>
          <TabsTrigger
            value="flight-requests"
            className="flex items-center gap-2 whitespace-nowrap"
          >
            <Plane className="h-4 w-4" />
            Flight Requests
          </TabsTrigger>
          <TabsTrigger value="leave-bids" className="flex items-center gap-2 whitespace-nowrap">
            <ClipboardList className="h-4 w-4" />
            Leave Bids
          </TabsTrigger>
          <TabsTrigger value="certifications" className="flex items-center gap-2 whitespace-nowrap">
            <Award className="h-4 w-4" />
            Certifications
          </TabsTrigger>
          <TabsTrigger value="pilot-info" className="flex items-center gap-2 whitespace-nowrap">
            <Users className="h-4 w-4" />
            Pilot Info
          </TabsTrigger>
          <TabsTrigger value="forecast" className="flex items-center gap-2 whitespace-nowrap">
            <TrendingUp className="h-4 w-4" />
            Forecast
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
                Generate comprehensive reports on leave requests with filtering by date range,
                roster period, status, and rank
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
                Generate comprehensive reports on flight requests with filtering by date range,
                status, and destination
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FlightRequestReportForm />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leave-bids" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                Leave Bids Report
              </CardTitle>
              <CardDescription>
                Generate reports on annual leave preference bids with filtering by roster period,
                status, and rank
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LeaveBidsReportForm />
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
                Generate compliance reports showing certification status, expiring checks, and
                pilot-specific data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CertificationReportForm />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pilot-info" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Pilot Information Report
              </CardTitle>
              <CardDescription>
                Generate comprehensive pilot profiles including qualifications, certifications
                summary, and licensing information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PilotInfoReportForm />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="forecast" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Workforce Forecast Report
              </CardTitle>
              <CardDescription>
                Generate strategic forecasts including retirement timelines, succession planning,
                and crew shortage predictions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ForecastReportForm />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
