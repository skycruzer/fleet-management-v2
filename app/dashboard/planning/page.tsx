/**
 * Planning Page
 * Developer: Maurice Rondeau
 *
 * Consolidates: Renewal Planning + Analytics
 * Tabs: Renewal Planning | Analytics
 */

'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { RefreshCw, BarChart3 } from 'lucide-react'

const tabs = [
  { id: 'renewals', label: 'Renewal Planning', icon: RefreshCw },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
] as const

type TabId = (typeof tabs)[number]['id']

export default function PlanningPage() {
  const [activeTab, setActiveTab] = useState<TabId>('renewals')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Planning</h1>
        <p className="mt-1 text-sm text-slate-500">
          Certification renewal planning and fleet analytics.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex gap-6">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 border-b-2 px-1 pb-3 text-sm font-medium transition-colors',
                  activeTab === tab.id
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
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
        {activeTab === 'renewals' && (
          <div className="rounded-lg border border-slate-200 bg-white p-6">
            <p className="text-sm text-slate-500">
              Renewal planning dashboard will be displayed here. This consolidates the former
              /dashboard/renewal-planning page.
            </p>
            {/* TODO: Import and render RenewalPlanningDashboard component */}
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="rounded-lg border border-slate-200 bg-white p-6">
            <p className="text-sm text-slate-500">
              Analytics dashboard will be displayed here. This consolidates the former
              /dashboard/analytics page.
            </p>
            {/* TODO: Import and render Analytics components */}
          </div>
        )}
      </div>
    </div>
  )
}
