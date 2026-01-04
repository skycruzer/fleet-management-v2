/**
 * Recent Activity Widget
 *
 * Displays recent pilot actions and updates on the dashboard
 * Shows last 5 activities with timestamps
 *
 * @created 2025-10-29
 * @priority Priority 2
 */

'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, CheckCircle, XCircle, AlertCircle, FileText } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface Activity {
  id: string
  type: 'leave_request' | 'flight_request' | 'certification_update' | 'profile_update'
  title: string
  description: string
  timestamp: Date
  status: 'success' | 'pending' | 'error' | 'info'
}

interface RecentActivityWidgetProps {
  activities: Activity[]
  maxItems?: number
}

const activityIcons = {
  leave_request: Clock,
  flight_request: FileText,
  certification_update: CheckCircle,
  profile_update: AlertCircle,
}

const statusColors = {
  success: 'bg-green-100 text-green-800 border-green-200',
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  error: 'bg-red-100 text-red-800 border-red-200',
  info: 'bg-blue-100 text-blue-800 border-blue-200',
}

const statusIcons = {
  success: CheckCircle,
  pending: Clock,
  error: XCircle,
  info: AlertCircle,
}

export function RecentActivityWidget({ activities, maxItems = 5 }: RecentActivityWidgetProps) {
  const displayActivities = activities.slice(0, maxItems)

  if (displayActivities.length === 0) {
    return (
      <Card className="p-6">
        <div className="mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5 text-cyan-600" />
          <h3 className="text-foreground text-lg font-semibold">Recent Activity</h3>
        </div>
        <p className="text-muted-foreground py-8 text-center text-sm">
          No recent activity to display
        </p>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center gap-2">
        <Clock className="h-5 w-5 text-cyan-600" />
        <h3 className="text-foreground text-lg font-semibold">Recent Activity</h3>
      </div>

      <div className="space-y-4">
        {displayActivities.map((activity) => {
          const Icon = activityIcons[activity.type]
          const StatusIcon = statusIcons[activity.status]

          return (
            <div
              key={activity.id}
              className="flex items-start gap-3 border-b pb-4 last:border-0 last:pb-0"
            >
              {/* Activity Icon */}
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-cyan-100">
                <Icon className="h-5 w-5 text-cyan-600" />
              </div>

              {/* Activity Content */}
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-foreground text-sm font-medium">{activity.title}</p>
                    <p className="text-muted-foreground mt-1 text-xs">{activity.description}</p>
                  </div>

                  {/* Status Badge */}
                  <Badge
                    variant="outline"
                    className={`flex items-center gap-1 ${statusColors[activity.status]} flex-shrink-0`}
                  >
                    <StatusIcon className="h-3 w-3" />
                    <span className="capitalize">{activity.status}</span>
                  </Badge>
                </div>

                {/* Timestamp */}
                <p className="text-muted-foreground mt-2 flex items-center gap-1 text-xs">
                  <Clock className="h-3 w-3" />
                  {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {activities.length > maxItems && (
        <div className="mt-4 border-t pt-4">
          <p className="text-muted-foreground text-center text-xs">
            Showing {maxItems} of {activities.length} activities
          </p>
        </div>
      )}
    </Card>
  )
}
