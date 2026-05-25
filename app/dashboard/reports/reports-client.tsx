/**
 * Reports Client Component
 * Author: Maurice Rondeau
 * Date: November 4, 2025
 *
 * Modern UI for report generation with preview and PDF export
 */

'use client'

import { useQueryState, parseAsStringLiteral } from 'nuqs'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LeaveReportForm } from '@/components/reports/leave-report-form'
import { FlightRequestReportForm } from '@/components/reports/flight-request-report-form'
import { CertificationReportForm } from '@/components/reports/certification-report-form'
import { LeaveBidsReportForm } from '@/components/reports/leave-bids-report-form'
import { PilotInfoReportForm } from '@/components/reports/pilot-info-report-form'
import { ForecastReportForm } from '@/components/reports/forecast-report-form'
import {
  Calendar,
  Plane,
  Award,
  ClipboardList,
  Users,
  TrendingUp,
  Activity,
  ShieldCheck,
  LineChart,
} from 'lucide-react'
import type { ComponentType } from 'react'

// URL-synced via nuqs so report links are shareable and the tab survives refresh.
const TAB_VALUES = [
  'leave',
  'flight-requests',
  'leave-bids',
  'certifications',
  'pilot-info',
  'forecast',
] as const
type TabValue = (typeof TAB_VALUES)[number]

// Reports grouped into three operational categories. Category bar is the
// primary nav; sub-tabs inside each category select the actual report. The
// `tab` URL param still identifies the underlying report — no link breakage.
type Category = 'operations' | 'compliance' | 'planning'

const REPORT_CATEGORY: Record<TabValue, Category> = {
  leave: 'operations',
  'flight-requests': 'operations',
  'leave-bids': 'planning',
  certifications: 'compliance',
  'pilot-info': 'compliance',
  forecast: 'planning',
}

const CATEGORY_META: Record<
  Category,
  { label: string; icon: ComponentType<{ className?: string }>; defaultTab: TabValue }
> = {
  operations: { label: 'Operations', icon: Activity, defaultTab: 'leave' },
  compliance: { label: 'Compliance', icon: ShieldCheck, defaultTab: 'certifications' },
  planning: { label: 'Planning', icon: LineChart, defaultTab: 'forecast' },
}

const REPORT_META: Record<
  TabValue,
  { label: string; icon: ComponentType<{ className?: string }> }
> = {
  leave: { label: 'Leave Requests', icon: Calendar },
  'flight-requests': { label: 'Flight Requests', icon: Plane },
  'leave-bids': { label: 'Leave Bids', icon: ClipboardList },
  certifications: { label: 'Certifications', icon: Award },
  'pilot-info': { label: 'Pilot Info', icon: Users },
  forecast: { label: 'Forecast', icon: TrendingUp },
}

export function ReportsClient() {
  const [activeTab, setActiveTab] = useQueryState(
    'tab',
    parseAsStringLiteral(TAB_VALUES).withDefault('leave')
  )

  const activeCategory = REPORT_CATEGORY[activeTab]
  const reportsInCategory = TAB_VALUES.filter((t) => REPORT_CATEGORY[t] === activeCategory)

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

      {/* Outer category tabs — pick a domain, then a specific report below */}
      <Tabs
        value={activeCategory}
        onValueChange={(value) => {
          const next = CATEGORY_META[value as Category].defaultTab
          void setActiveTab(next)
        }}
      >
        <TabsList className="grid w-full grid-cols-3">
          {(Object.keys(CATEGORY_META) as Category[]).map((cat) => {
            const Icon = CATEGORY_META[cat].icon
            return (
              <TabsTrigger
                key={cat}
                value={cat}
                className="flex items-center gap-2 whitespace-nowrap"
              >
                <Icon className="h-4 w-4" />
                {CATEGORY_META[cat].label}
              </TabsTrigger>
            )
          })}
        </TabsList>
      </Tabs>

      {/* Inner report tabs — show the reports inside the active category */}
      <Tabs
        value={activeTab}
        onValueChange={(value) => {
          void setActiveTab(value as TabValue)
        }}
        className="space-y-6"
      >
        <TabsList
          className="flex h-auto w-full flex-wrap gap-1 sm:flex-nowrap sm:overflow-x-auto"
          aria-label={`${CATEGORY_META[activeCategory].label} reports`}
        >
          {reportsInCategory.map((t) => {
            const Icon = REPORT_META[t].icon
            return (
              <TabsTrigger key={t} value={t} className="flex items-center gap-2 whitespace-nowrap">
                <Icon className="h-4 w-4" />
                {REPORT_META[t].label}
              </TabsTrigger>
            )
          })}
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
