/**
 * Settings Quick Actions Component
 * Quick action buttons for common settings operations
 */

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { User, Lock, Bell } from 'lucide-react'
import { EditProfileDialog } from './edit-profile-dialog'
import { ChangePasswordDialog } from './change-password-dialog'
import { NotificationSettingsDialog } from './notification-settings-dialog'

interface SettingsQuickActionsProps {
  userData: {
    name: string
    email: string
  }
  onSuccess: () => void
}

export function SettingsQuickActions({ userData, onSuccess }: SettingsQuickActionsProps) {
  const [editProfileOpen, setEditProfileOpen] = useState(false)
  const [changePasswordOpen, setChangePasswordOpen] = useState(false)
  const [notificationSettingsOpen, setNotificationSettingsOpen] = useState(false)

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Button
          variant="outline"
          className="h-auto justify-start gap-3 p-4 text-left"
          onClick={() => setEditProfileOpen(true)}
        >
          <div className="rounded-lg bg-blue-100 p-2">
            <User className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <p className="font-semibold">Edit Profile</p>
            <p className="text-muted-foreground text-xs">Update personal info</p>
          </div>
        </Button>

        <Button
          variant="outline"
          className="h-auto justify-start gap-3 p-4 text-left"
          onClick={() => setChangePasswordOpen(true)}
        >
          <div className="rounded-lg bg-green-100 p-2">
            <Lock className="h-4 w-4 text-green-600" />
          </div>
          <div>
            <p className="font-semibold">Change Password</p>
            <p className="text-muted-foreground text-xs">Update security</p>
          </div>
        </Button>

        <Button
          variant="outline"
          className="h-auto justify-start gap-3 p-4 text-left"
          onClick={() => setNotificationSettingsOpen(true)}
        >
          <div className="rounded-lg bg-primary/10 p-2">
            <Bell className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="font-semibold">Notifications</p>
            <p className="text-muted-foreground text-xs">Manage alerts</p>
          </div>
        </Button>
      </div>

      {/* Dialogs */}
      <EditProfileDialog
        open={editProfileOpen}
        onOpenChange={setEditProfileOpen}
        userData={userData}
        onSuccess={onSuccess}
      />

      <ChangePasswordDialog open={changePasswordOpen} onOpenChange={setChangePasswordOpen} />

      <NotificationSettingsDialog
        open={notificationSettingsOpen}
        onOpenChange={setNotificationSettingsOpen}
        onSuccess={onSuccess}
      />
    </>
  )
}
