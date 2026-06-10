/**
 * Settings Page Client Component
 * Client-side settings page with real data from Supabase
 */

'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { SettingsQuickActions } from '@/components/settings/settings-quick-actions'
import { SettingsDangerZone } from '@/components/settings/settings-danger-zone'

interface UserData {
  id: string
  email: string
  name: string
  role: string
  created_at: string
  last_sign_in_at?: string
}

interface SettingsClientProps {
  initialUserData: UserData
}

export function SettingsClient({ initialUserData }: SettingsClientProps) {
  const [userData, setUserData] = useState<UserData>(initialUserData)
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Server is the source of truth: page.tsx fetches via the service layer and
  // passes the result down — sync local state whenever the server re-renders
  useEffect(() => {
    setUserData(initialUserData)
  }, [initialUserData])

  // Refresh user data after a successful quick action by re-running the page
  // server component (service-layer fetch) instead of querying the DB directly
  const fetchUserData = () => {
    startTransition(() => {
      router.refresh()
    })
  }

  if (isPending) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="h-96" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Available Settings */}
      <Card className="p-6">
        <h2 className="text-foreground mb-2 text-xl font-semibold">Available Settings</h2>
        <p className="text-muted-foreground mb-6 text-sm">
          Configure your account preferences and security settings
        </p>
        <SettingsQuickActions
          userData={{
            name: userData.name,
            email: userData.email,
          }}
          onSuccess={fetchUserData}
        />
      </Card>

      {/* Account Information */}
      <Card className="p-6">
        <h2 className="text-foreground mb-6 text-xl font-semibold">Account Information</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <tbody className="divide-y">
              <tr className="hover:bg-muted/50">
                <td className="text-muted-foreground py-4 text-sm font-medium">Account Ref</td>
                <td className="text-muted-foreground py-4 font-mono text-sm">
                  ···{userData.id.slice(-8)}
                </td>
              </tr>
              <tr className="hover:bg-muted/50">
                <td className="text-muted-foreground py-4 text-sm font-medium">Full Name</td>
                <td className="text-foreground py-4 text-sm">{userData.name}</td>
              </tr>
              <tr className="hover:bg-muted/50">
                <td className="text-muted-foreground py-4 text-sm font-medium">Email</td>
                <td className="text-foreground py-4 text-sm">{userData.email}</td>
              </tr>
              <tr className="hover:bg-muted/50">
                <td className="text-muted-foreground py-4 text-sm font-medium">Role</td>
                <td className="py-4">
                  <Badge>{userData.role}</Badge>
                </td>
              </tr>
              <tr className="hover:bg-muted/50">
                <td className="text-muted-foreground py-4 text-sm font-medium">Account Created</td>
                <td className="text-foreground py-4 text-sm">
                  {new Date(userData.created_at).toLocaleDateString('en-GB', {
                    year: 'numeric',
                    month: 'short',
                    day: '2-digit',
                  })}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      {/* Danger Zone */}
      <SettingsDangerZone userEmail={userData.email} />
    </div>
  )
}
