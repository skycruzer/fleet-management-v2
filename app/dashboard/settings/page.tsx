/**
 * User Settings Page
 * Manage user preferences and profile settings
 */

export const dynamic = 'force-dynamic'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import {
  User,
  Bell,
  Lock,
  Palette,
  Globe,
  Shield,
  ArrowLeft,
  Settings as SettingsIcon,
  CheckCircle2,
} from 'lucide-react'

export const metadata = {
  title: 'Settings - Fleet Management V2',
  description: 'Manage your preferences and settings',
}

const settingsCategories = [
  {
    icon: User,
    title: 'Profile Settings',
    description: 'Update your personal information and profile',
    items: ['Name', 'Email', 'Phone Number', 'Department'],
    color: 'blue',
  },
  {
    icon: Bell,
    title: 'Notifications',
    description: 'Configure notification preferences',
    items: ['Email Notifications', 'Push Notifications', 'SMS Alerts'],
    color: 'purple',
  },
  {
    icon: Lock,
    title: 'Security',
    description: 'Manage security settings and authentication',
    items: ['Change Password', 'Two-Factor Auth', 'Login History'],
    color: 'green',
  },
  {
    icon: Palette,
    title: 'Appearance',
    description: 'Customize the look and feel',
    items: ['Theme', 'Color Scheme', 'Font Size'],
    color: 'orange',
  },
  {
    icon: Globe,
    title: 'Regional Settings',
    description: 'Set your language and timezone',
    items: ['Language', 'Timezone', 'Date Format'],
    color: 'red',
  },
  {
    icon: Shield,
    title: 'Privacy',
    description: 'Control your privacy and data settings',
    items: ['Data Sharing', 'Activity Log', 'Account Visibility'],
    color: 'indigo',
  },
]

export default function SettingsPage() {
  return (
    <div className="space-y-8 p-8">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-foreground text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-2">Manage your account settings and preferences</p>
        </div>
        <Link href="/dashboard">
          <Button variant="outline" size="lg" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

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
              <p className="text-foreground text-2xl font-bold">Today</p>
              <p className="text-muted-foreground text-xs">2 hours ago</p>
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
            <div className="rounded-full bg-purple-100 p-3">
              <Shield className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Settings Categories */}
      <div>
        <h2 className="text-foreground mb-6 text-xl font-semibold">Settings Categories</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {settingsCategories.map((category) => {
            const Icon = category.icon
            const bgColor = {
              blue: 'bg-blue-100',
              purple: 'bg-purple-100',
              green: 'bg-green-100',
              orange: 'bg-orange-100',
              red: 'bg-red-100',
              indigo: 'bg-indigo-100',
            }[category.color]
            const textColor = {
              blue: 'text-blue-600',
              purple: 'text-purple-600',
              green: 'text-green-600',
              orange: 'text-orange-600',
              red: 'text-red-600',
              indigo: 'text-indigo-600',
            }[category.color]

            return (
              <Card
                key={category.title}
                className="group hover:border-primary p-6 transition-all hover:shadow-md"
              >
                <div className="mb-4 flex items-start justify-between">
                  <div className={`rounded-lg ${bgColor} p-3`}>
                    <Icon className={`h-6 w-6 ${textColor}`} />
                  </div>
                  <Badge variant="secondary">{category.items.length}</Badge>
                </div>
                <h3 className="text-foreground group-hover:text-primary mb-2 text-lg font-semibold">
                  {category.title}
                </h3>
                <p className="text-muted-foreground mb-4 text-sm">{category.description}</p>
                <ul className="mb-4 space-y-2">
                  {category.items.map((item) => (
                    <li
                      key={item}
                      className="text-muted-foreground flex items-center gap-2 text-sm"
                    >
                      <div className="bg-muted-foreground h-1.5 w-1.5 rounded-full" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Button variant="outline" className="w-full gap-2">
                  Configure
                  <SettingsIcon className="h-4 w-4" />
                </Button>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <Card className="p-6">
        <h2 className="text-foreground mb-6 text-xl font-semibold">Quick Actions</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Button variant="outline" className="h-auto justify-start gap-3 p-4 text-left">
            <div className="rounded-lg bg-blue-100 p-2">
              <User className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="font-semibold">Edit Profile</p>
              <p className="text-muted-foreground text-xs">Update personal info</p>
            </div>
          </Button>

          <Button variant="outline" className="h-auto justify-start gap-3 p-4 text-left">
            <div className="rounded-lg bg-green-100 p-2">
              <Lock className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <p className="font-semibold">Change Password</p>
              <p className="text-muted-foreground text-xs">Update security</p>
            </div>
          </Button>

          <Button variant="outline" className="h-auto justify-start gap-3 p-4 text-left">
            <div className="rounded-lg bg-purple-100 p-2">
              <Bell className="h-4 w-4 text-purple-600" />
            </div>
            <div>
              <p className="font-semibold">Notifications</p>
              <p className="text-muted-foreground text-xs">Manage alerts</p>
            </div>
          </Button>

          <Button variant="outline" className="h-auto justify-start gap-3 p-4 text-left">
            <div className="rounded-lg bg-orange-100 p-2">
              <Palette className="h-4 w-4 text-orange-600" />
            </div>
            <div>
              <p className="font-semibold">Theme</p>
              <p className="text-muted-foreground text-xs">Customize look</p>
            </div>
          </Button>
        </div>
      </Card>

      {/* Account Information */}
      <Card className="p-6">
        <h2 className="text-foreground mb-6 text-xl font-semibold">Account Information</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <tbody className="divide-y">
              <tr className="hover:bg-muted/50">
                <td className="text-muted-foreground py-4 text-sm font-medium">User ID</td>
                <td className="text-foreground py-4 text-sm">USR-12345</td>
              </tr>
              <tr className="hover:bg-muted/50">
                <td className="text-muted-foreground py-4 text-sm font-medium">Email</td>
                <td className="text-foreground py-4 text-sm">user@fleetmanagement.com</td>
              </tr>
              <tr className="hover:bg-muted/50">
                <td className="text-muted-foreground py-4 text-sm font-medium">Role</td>
                <td className="py-4">
                  <Badge>Admin</Badge>
                </td>
              </tr>
              <tr className="hover:bg-muted/50">
                <td className="text-muted-foreground py-4 text-sm font-medium">Account Created</td>
                <td className="text-foreground py-4 text-sm">January 15, 2025</td>
              </tr>
              <tr className="hover:bg-muted/50">
                <td className="text-muted-foreground py-4 text-sm font-medium">
                  Two-Factor Authentication
                </td>
                <td className="py-4">
                  <Badge variant="secondary">Enabled</Badge>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200 bg-red-50 p-6">
        <h2 className="mb-4 text-xl font-semibold text-red-900">Danger Zone</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-red-200 bg-white p-4">
            <div>
              <p className="font-semibold text-red-900">Export Account Data</p>
              <p className="text-sm text-red-700">Download all your account data</p>
            </div>
            <Button variant="outline" className="border-red-300 text-red-700 hover:bg-red-100">
              Export Data
            </Button>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-red-200 bg-white p-4">
            <div>
              <p className="font-semibold text-red-900">Delete Account</p>
              <p className="text-sm text-red-700">Permanently delete your account and all data</p>
            </div>
            <Button variant="destructive">Delete Account</Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
