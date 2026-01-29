/**
 * Planning Page Client Component
 * Developer: Maurice Rondeau
 *
 * Handles tab navigation and dynamic content loading
 */

'use client'

import { useState, useEffect, ReactNode, Suspense, lazy } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import { RefreshCw, BarChart3, Loader2 } from 'lucide-react'
import { Card } from '@/components/ui/card'

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
        <Loader2 className="text-primary h-6 w-6 animate-spin" aria-hidden="true" />
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
    <>
      {/* Tab Navigation */}
      <div className="border-b border-slate-200 dark:border-white/[0.08]">
        <nav className="-mb-px flex gap-6">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  'flex items-center gap-2 border-b-2 px-1 pb-3 text-sm font-medium transition-colors',
                  currentTab === tab.id
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:text-muted-foreground dark:hover:border-white/[0.1] dark:hover:text-foreground/80'
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {currentTab === 'renewals' && renewalsContent}

        {currentTab === 'analytics' && (
          <Suspense fallback={<AnalyticsLoadingFallback />}>
            <AnalyticsContent />
          </Suspense>
        )}
      </div>
    </>
  )
}
