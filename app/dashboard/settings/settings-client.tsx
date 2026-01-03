/**
 * Settings Page Client Component
 * Client-side settings page with real data from Supabase
 */

'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { createClient } from '../../../lib/supabase/client'
import { User, CheckCircle2, Shield, Building2, Code2, Calendar } from 'lucide-react'
import { SettingsQuickActions } from '@/components/settings/settings-quick-actions'
import { SettingsDangerZone } from '@/components/settings/settings-danger-zone'
import { formatDistanceToNow } from 'date-fns'

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
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const fetchUserData = async () => {
    setLoading(true)
    try {
      // Try to refresh from an_users table
      const { data: anUser, error } = await supabase
        .from('an_users')
        .select('*')
        .eq('id', userData.id)
        .single()

      if (!error && anUser) {
        setUserData({
          id: anUser.id,
          email: anUser.email,
          name: anUser.name || 'User',
          role: anUser.role || 'admin',
          created_at: anUser.created_at || new Date().toISOString(),
          last_sign_in_at: anUser.updated_at || undefined, // Use updated_at as last activity indicator
        })
      }
    } catch (error) {
      console.error('Error refreshing user data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-12 w-3/4" />
        <div className="grid gap-6 sm:grid-cols-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Quick Stats */}
      <div className="grid gap-6 sm:grid-cols-3">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-muted-foreground text-sm font-medium">Account Status</p>
              <p className="text-foreground text-2xl font-bold">Active</p>
            </div>
            <div className="rounded-full bg-green-100 p-3">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-muted-foreground text-sm font-medium">Last Login</p>
              <p className="text-foreground text-2xl font-bold">
                {userData.last_sign_in_at
                  ? formatDistanceToNow(new Date(userData.last_sign_in_at), { addSuffix: true })
                  : 'Never'}
              </p>
            </div>
            <div className="rounded-full bg-blue-100 p-3">
              <User className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-muted-foreground text-sm font-medium">Security Level</p>
              <p className="text-foreground text-2xl font-bold">High</p>
            </div>
            <div className="bg-primary/10 rounded-full p-3">
              <Shield className="text-primary h-6 w-6" />
            </div>
          </div>
        </Card>
      </div>

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
                <td className="text-muted-foreground py-4 text-sm font-medium">User ID</td>
                <td className="text-foreground py-4 font-mono text-sm">{userData.id}</td>
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
                  {new Date(userData.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      {/* System & Developer Information */}
      <Card className="p-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="bg-primary/10 rounded-lg p-2">
            <Building2 className="text-primary h-5 w-5" />
          </div>
          <div>
            <h2 className="text-foreground text-xl font-semibold">System Information</h2>
            <p className="text-muted-foreground text-sm">Developer and company details</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <tbody className="divide-y">
              <tr className="hover:bg-muted/50">
                <td className="text-muted-foreground flex items-center gap-2 py-4 text-sm font-medium">
                  <Code2 className="h-4 w-4" />
                  Developer
                </td>
                <td className="text-foreground py-4 text-sm font-medium">
                  Maurice Rondeau (Skycruzer)
                </td>
              </tr>
              <tr className="hover:bg-muted/50">
                <td className="text-muted-foreground flex items-center gap-2 py-4 text-sm font-medium">
                  <Building2 className="h-4 w-4" />
                  Company
                </td>
                <td className="text-foreground py-4 text-sm font-medium">PIN PNG LTD</td>
              </tr>
              <tr className="hover:bg-muted/50">
                <td className="text-muted-foreground py-4 text-sm font-medium">System Version</td>
                <td className="py-4">
                  <Badge variant="outline">v2.5.0</Badge>
                </td>
              </tr>
              <tr className="hover:bg-muted/50">
                <td className="text-muted-foreground flex items-center gap-2 py-4 text-sm font-medium">
                  <Calendar className="h-4 w-4" />
                  Build Date
                </td>
                <td className="text-foreground py-4 text-sm">October 29, 2025</td>
              </tr>
              <tr className="hover:bg-muted/50">
                <td className="text-muted-foreground py-4 text-sm font-medium">Technology Stack</td>
                <td className="py-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">Next.js 16</Badge>
                    <Badge variant="secondary">React 19</Badge>
                    <Badge variant="secondary">TypeScript 5.7</Badge>
                    <Badge variant="secondary">Supabase</Badge>
                  </div>
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
