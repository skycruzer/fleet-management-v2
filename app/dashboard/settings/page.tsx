/**
 * User Settings Page
 * Manage user preferences and profile settings
 */

import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { SettingsClient } from './settings-client'
import { Breadcrumb } from '@/components/navigation/breadcrumb'
import { getAuthenticatedAdmin } from '@/lib/middleware/admin-auth-helper'
import { createClient } from '@/lib/supabase/server'

export const metadata = {
  title: 'Settings - Fleet Management V2',
  description: 'Manage your preferences and settings',
}

export default async function SettingsPage() {
  // Check authentication (supports both Supabase Auth and admin-session cookie)
  const auth = await getAuthenticatedAdmin()
  if (!auth.authenticated) {
    redirect('/auth/login')
  }

  // Fetch user data from an_users table using userId from auth
  const supabase = await createClient()
  const { data: anUser } = await supabase
    .from('an_users')
    .select('*')
    .eq('id', auth.userId!)
    .single()

  // Build initial user data to pass to client component
  const initialUserData = anUser
    ? {
        id: anUser.id,
        email: anUser.email,
        name: anUser.name || 'User',
        role: anUser.role || 'admin',
        created_at: anUser.created_at || new Date().toISOString(),
        last_sign_in_at: anUser.updated_at || undefined, // Use updated_at as last activity indicator
      }
    : {
        id: auth.userId!,
        email: auth.email!,
        name: 'Admin User',
        role: 'admin',
        created_at: new Date().toISOString(),
        last_sign_in_at: undefined,
      }

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <Breadcrumb />

      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-foreground text-xl font-semibold">My Settings</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage your account settings and preferences
          </p>
        </div>
        <Link href="/dashboard">
          <Button variant="outline" size="lg" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      {/* Client Component with Real Data */}
      <SettingsClient initialUserData={initialUserData} />
    </div>
  )
}
