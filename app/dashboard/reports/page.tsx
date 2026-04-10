/**
 * Reports Page - Leave, Flight Requests, and Certifications
 * Author: Maurice Rondeau
 * Date: November 4, 2025
 *
 * Streamlined reporting for three key areas
 */

import { Suspense } from 'react'
import { Metadata } from 'next'
import { ReportsClient } from './reports-client'

export const metadata: Metadata = {
  title: 'Reports | Fleet Management',
  description: 'Generate reports for leave requests, flight requests, and certifications',
}

function ReportsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="bg-muted animate-shimmer h-8 w-48 rounded-lg" />
        <div className="bg-muted animate-shimmer h-4 w-80 rounded-lg" />
      </div>
      <div className="bg-muted animate-shimmer h-10 w-full rounded-lg" />
      <div className="bg-card border-border rounded-xl border p-6">
        <div className="space-y-4">
          <div className="bg-muted animate-shimmer h-6 w-40 rounded-lg" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="bg-muted animate-shimmer h-10 rounded-lg" />
            <div className="bg-muted animate-shimmer h-10 rounded-lg" />
          </div>
          <div className="bg-muted animate-shimmer h-10 w-32 rounded-lg" />
        </div>
      </div>
    </div>
  )
}

export default function ReportsPage() {
  return (
    <Suspense fallback={<ReportsSkeleton />}>
      <ReportsClient />
    </Suspense>
  )
}
