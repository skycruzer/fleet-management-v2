/**
 * Leave Management Page
 * Developer: Maurice Rondeau
 *
 * Consolidates: Leave Approvals, Leave Calendar, Leave Bids
 * Tabs: Pending Approvals | Calendar | Leave Bids
 */

'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { CheckCircle, Calendar, CalendarCheck } from 'lucide-react'

const tabs = [
  { id: 'approvals', label: 'Pending Approvals', icon: CheckCircle },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
  { id: 'bids', label: 'Leave Bids', icon: CalendarCheck },
] as const

type TabId = (typeof tabs)[number]['id']

export default function LeaveManagementPage() {
  const [activeTab, setActiveTab] = useState<TabId>('approvals')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-foreground text-2xl font-semibold">Leave Management</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Review leave requests, view the calendar, and manage leave bids.
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
        {activeTab === 'approvals' && (
          <div className="bg-card rounded-lg border border-white/[0.08] p-6">
            <p className="text-muted-foreground text-sm">
              Leave approval requests will be displayed here. This consolidates the former
              /dashboard/leave/approve page.
            </p>
            {/* TODO: Import and render LeaveApprovalClient component */}
          </div>
        )}

        {activeTab === 'calendar' && (
          <div className="bg-card rounded-lg border border-white/[0.08] p-6">
            <p className="text-muted-foreground text-sm">
              Leave calendar view will be displayed here. This consolidates the former
              /dashboard/leave/calendar page.
            </p>
            {/* TODO: Import and render LeaveCalendar component */}
          </div>
        )}

        {activeTab === 'bids' && (
          <div className="bg-card rounded-lg border border-white/[0.08] p-6">
            <p className="text-muted-foreground text-sm">
              Leave bid review will be displayed here. This consolidates the former
              /dashboard/admin/leave-bids page.
            </p>
            {/* TODO: Import and render LeaveBidReviewTable component */}
          </div>
        )}
      </div>
    </div>
  )
}
