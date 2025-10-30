/**
 * System Settings Page
 * Configure system-wide preferences and settings
 */

export const dynamic = 'force-dynamic'

import { dashboardMetadata } from '@/lib/utils/metadata'
import { Card } from '@/components/ui/card'

export const metadata = dashboardMetadata.adminSettings
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { getSystemSettings } from '@/lib/services/admin-service'
import { SettingsClient } from './settings-client'

export default async function SystemSettingsPage() {
  const settings = await getSystemSettings()

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-foreground text-2xl font-bold">System Settings</h2>
          <p className="text-muted-foreground mt-1">Configure system-wide preferences and settings</p>
        </div>
        <div className="flex items-center space-x-3">
          <Link href="/dashboard/admin">
            <Button variant="outline">← Back to Admin</Button>
          </Link>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
            Add Setting
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card className="border-green-200 bg-green-50 p-6">
          <div className="flex items-center space-x-3">
            <span className="text-3xl">⚙️</span>
            <div>
              <p className="text-foreground text-2xl font-bold">{settings.length}</p>
              <p className="text-muted-foreground text-sm font-medium">Total Settings</p>
            </div>
          </div>
        </Card>
        <Card className="border-blue-200 bg-blue-50 p-6">
          <div className="flex items-center space-x-3">
            <span className="text-3xl">✅</span>
            <div>
              <p className="text-foreground text-2xl font-bold">
                {settings.filter((s: any) => s.is_active !== false).length}
              </p>
              <p className="text-muted-foreground text-sm font-medium">Active Settings</p>
            </div>
          </div>
        </Card>
        <Card className="border-primary/20 bg-primary/5 p-6">
          <div className="flex items-center space-x-3">
            <span className="text-3xl">🔒</span>
            <div>
              <p className="text-foreground text-2xl font-bold">
                {settings.filter((s: any) => s.is_system === true).length}
              </p>
              <p className="text-muted-foreground text-sm font-medium">System Protected</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Client Component with Interactive Editing */}
      <SettingsClient settings={settings} />

      {/* Help Text */}
      <Card className="border-yellow-200 bg-yellow-50 p-4">
        <div className="flex items-start space-x-3">
          <span className="text-2xl">⚠️</span>
          <div className="space-y-1">
            <p className="text-foreground text-sm font-medium">Important Information</p>
            <ul className="text-muted-foreground list-inside list-disc space-y-1 text-sm">
              <li>System-protected settings cannot be modified through the interface</li>
              <li>Changes to settings take effect immediately across the system</li>
              <li>All setting changes are logged in the audit trail</li>
              <li>Incorrect setting values can cause system malfunctions</li>
              <li>Backup current settings before making major changes</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  )
}
