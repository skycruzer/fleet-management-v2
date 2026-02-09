/**
 * Admin Tabs Client Component
 * Tabbed interface for System Admin: Overview | Settings | Check Types | Registrations
 *
 * @author Maurice Rondeau
 * @version 1.1.0
 * @updated 2026-02 - Migrated to nuqs for URL state management
 */

'use client'

import { useQueryState, parseAsStringLiteral } from 'nuqs'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LayoutDashboard, Settings, FileType, UserCheck } from 'lucide-react'

const TAB_VALUES = ['overview', 'settings', 'check-types', 'registrations'] as const
type TabValue = (typeof TAB_VALUES)[number]

interface AdminTabsClientProps {
  overviewContent: React.ReactNode
  settingsContent: React.ReactNode
  checkTypesContent: React.ReactNode
  registrationsContent: React.ReactNode
  pendingRegistrationCount: number
}

export function AdminTabsClient({
  overviewContent,
  settingsContent,
  checkTypesContent,
  registrationsContent,
  pendingRegistrationCount,
}: AdminTabsClientProps) {
  // nuqs manages URL sync automatically — replaces manual useSearchParams + router.push
  const [currentTab, setCurrentTab] = useQueryState(
    'tab',
    parseAsStringLiteral(TAB_VALUES).withDefault('overview')
  )

  return (
    <Tabs value={currentTab} onValueChange={(v) => setCurrentTab(v as TabValue)} className="w-full">
      <TabsList className="grid w-full grid-cols-4 lg:inline-grid lg:w-auto">
        <TabsTrigger value="overview" className="gap-2">
          <LayoutDashboard className="h-4 w-4" />
          <span className="hidden sm:inline">Overview</span>
        </TabsTrigger>
        <TabsTrigger value="settings" className="gap-2">
          <Settings className="h-4 w-4" />
          <span className="hidden sm:inline">Settings</span>
        </TabsTrigger>
        <TabsTrigger value="check-types" className="gap-2">
          <FileType className="h-4 w-4" />
          <span className="hidden sm:inline">Check Types</span>
        </TabsTrigger>
        <TabsTrigger value="registrations" className="gap-2">
          <UserCheck className="h-4 w-4" />
          <span className="hidden sm:inline">Registrations</span>
          {pendingRegistrationCount > 0 && (
            <span className="bg-destructive text-destructive-foreground ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-medium">
              {pendingRegistrationCount}
            </span>
          )}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="mt-4">
        {overviewContent}
      </TabsContent>

      <TabsContent value="settings" className="mt-4">
        {settingsContent}
      </TabsContent>

      <TabsContent value="check-types" className="mt-4">
        {checkTypesContent}
      </TabsContent>

      <TabsContent value="registrations" className="mt-4">
        {registrationsContent}
      </TabsContent>
    </Tabs>
  )
}
