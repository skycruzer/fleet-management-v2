/**
 * System Settings Page
 * Configure system-wide preferences and settings
 */

import { dashboardMetadata } from '@/lib/utils/metadata'

export const metadata = dashboardMetadata.adminSettings
import { PageHeader } from '@/components/layout/page-header'
import { getSystemSettings } from '@/lib/services/admin-service'
import { SettingsClient } from './settings-client'

export default async function SystemSettingsPage() {
  const settings = await getSystemSettings()

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="System Settings"
        description="Configure system-wide preferences and settings"
        breadcrumbs={[{ label: 'Admin', href: '/dashboard/admin' }, { label: 'Settings' }]}
      />

      {/* Client Component with Interactive Editing */}
      <SettingsClient settings={settings} />
    </div>
  )
}
