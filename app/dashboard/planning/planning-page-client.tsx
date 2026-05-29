/**
 * Planning Page Client Component
 * Developer: Maurice Rondeau
 *
 * Handles tab navigation and dynamic content loading
 */

'use client'

import { useState, useEffect, ReactNode, Suspense, lazy } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { RefreshCw, BarChart3, Loader2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

// Lazy load the analytics content
const AnalyticsContent = lazy(() => import('./analytics-content'))

const tabs = [
  { id: 'renewals', label: 'Renewal Planning', icon: RefreshCw },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
] as const

type TabId = (typeof tabs)[number]['id']

interface PlanningPageClientProps {
  activeTab: string
  children: ReactNode
}

function AnalyticsLoadingFallback() {
  return (
    <Card className="p-8 text-center">
      <div className="flex items-center justify-center space-x-2">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--color-info)]" aria-hidden="true" />
        <p className="text-muted-foreground text-sm">Loading analytics...</p>
      </div>
    </Card>
  )
}

export function PlanningPageClient({ activeTab, children }: PlanningPageClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [currentTab, setCurrentTab] = useState<TabId>(activeTab as TabId)

  // Sync state with URL
  useEffect(() => {
    setCurrentTab((activeTab as TabId) || 'renewals')
  }, [activeTab])

  const handleTabChange = (tabId: TabId) => {
    setCurrentTab(tabId)
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', tabId)
    router.push(`?${params.toString()}`)
  }

  // Extract children by tab
  const childArray = Array.isArray(children) ? children : [children]
  const renewalsContent = childArray.find((child: ReactNode) => {
    if (!child || typeof child !== 'object' || !('props' in child)) return false
    const props = (child as { props: Record<string, unknown> }).props
    return props['data-tab'] === 'renewals'
  })

  return (
    <Tabs value={currentTab} onValueChange={(value) => handleTabChange(value as TabId)}>
      <TabsList className="w-auto">
        {tabs.map((tab) => (
          <TabsTrigger key={tab.id} value={tab.id} className="gap-2">
            <tab.icon className="h-4 w-4" aria-hidden="true" />
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="renewals">{renewalsContent}</TabsContent>

      <TabsContent value="analytics">
        <Suspense fallback={<AnalyticsLoadingFallback />}>
          <AnalyticsContent />
        </Suspense>
      </TabsContent>
    </Tabs>
  )
}
