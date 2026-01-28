/**
 * Pilot Portal - My Requests Page
 * Developer: Maurice Rondeau
 *
 * Consolidates: Leave Requests + RDO/SDO Requests
 * Tabs: Leave Requests | RDO/SDO Requests
 */

'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Calendar, Plane } from 'lucide-react'

const tabs = [
  { id: 'leave', label: 'Leave Requests', icon: Calendar },
  { id: 'rdo-sdo', label: 'RDO/SDO Requests', icon: Plane },
] as const

type TabId = (typeof tabs)[number]['id']

export default function MyRequestsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('leave')

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-foreground text-2xl font-semibold">My Requests</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          View and manage your leave and RDO/SDO requests.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-white/[0.08]">
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
                    : 'text-muted-foreground hover:text-foreground/80 border-transparent hover:border-white/[0.1]'
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
        {activeTab === 'leave' && (
          <div className="bg-card rounded-lg border border-white/[0.08] p-6">
            <p className="text-muted-foreground text-sm">
              Your leave requests will be displayed here. This consolidates the former
              /portal/leave-requests page.
            </p>
            {/* TODO: Import and render LeaveRequestsList component */}
          </div>
        )}

        {activeTab === 'rdo-sdo' && (
          <div className="bg-card rounded-lg border border-white/[0.08] p-6">
            <p className="text-muted-foreground text-sm">
              Your RDO/SDO requests will be displayed here. This consolidates the former
              /portal/flight-requests page.
            </p>
            {/* TODO: Import and render RdoSdoRequestsList component */}
          </div>
        )}
      </div>
    </div>
  )
}
