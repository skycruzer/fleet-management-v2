/**
 * User Settings Page
 * Manage user preferences and profile settings
 */

export const dynamic = 'force-dynamic'

import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { SettingsClient } from './settings-client'
import { Breadcrumb } from '@/components/navigation/breadcrumb'

export const metadata = {
  title: 'Settings - Fleet Management V2',
  description: 'Manage your preferences and settings',
}

export default function SettingsPage() {
  return (
    <div className="space-y-8 p-8">
      {/* Breadcrumb Navigation */}
      <Breadcrumb />

      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-foreground text-3xl font-bold tracking-tight">My Settings</h1>
          <p className="text-muted-foreground mt-2">Manage your account settings and preferences</p>
        </div>
        <Link href="/dashboard">
          <Button variant="outline" size="lg" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      {/* Client Component with Real Data */}
      <SettingsClient />
    </div>
  )
}
