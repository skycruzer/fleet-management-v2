/**
 * Analytics & Reports Tab Container
 * Wraps analytics dashboard and reports in a tabbed interface
 *
 * @author Maurice Rondeau
 * @version 1.0.0
 */

'use client'

import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BarChart3, FileText } from 'lucide-react'

type TabValue = 'dashboard' | 'reports'

interface AnalyticsReportsClientProps {
  dashboardContent: React.ReactNode
  reportsContent: React.ReactNode
}

export function AnalyticsReportsClient({
  dashboardContent,
  reportsContent,
}: AnalyticsReportsClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const currentTab = (searchParams.get('tab') as TabValue) || 'dashboard'

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === 'dashboard') {
      params.delete('tab')
    } else {
      params.set('tab', value)
    }
    const queryString = params.toString()
    router.push(`${pathname}${queryString ? `?${queryString}` : ''}`, { scroll: false })
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-foreground text-xl font-semibold tracking-tight lg:text-2xl">
          Analytics & Reports
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Fleet analytics dashboard and report generation
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:inline-grid lg:w-auto">
          <TabsTrigger value="dashboard" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            <span>Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="reports" className="gap-2">
            <FileText className="h-4 w-4" />
            <span>Reports</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-4">
          {dashboardContent}
        </TabsContent>

        <TabsContent value="reports" className="mt-4">
          {reportsContent}
        </TabsContent>
      </Tabs>
    </div>
  )
}
