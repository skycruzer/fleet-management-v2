/**
 * Notification Settings Dialog Component
 * Dialog for managing notification preferences
 */

'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

interface NotificationSettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialSettings?: {
    email_notifications?: boolean
    push_notifications?: boolean
    sms_alerts?: boolean
    certification_reminders?: boolean
    leave_request_updates?: boolean
  }
  onSuccess: () => void
}

export function NotificationSettingsDialog({
  open,
  onOpenChange,
  initialSettings,
  onSuccess,
}: NotificationSettingsDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const supabase = createClient()

  const [settings, setSettings] = useState({
    email_notifications: initialSettings?.email_notifications ?? true,
    push_notifications: initialSettings?.push_notifications ?? false,
    sms_alerts: initialSettings?.sms_alerts ?? false,
    certification_reminders: initialSettings?.certification_reminders ?? true,
    leave_request_updates: initialSettings?.leave_request_updates ?? true,
  })

  const handleSave = async () => {
    setIsSubmitting(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        toast.error('Not authenticated')
        return
      }

      // Update notification settings in an_users table
      const { error } = await supabase
        .from('an_users')
        .update({
          notification_settings: settings,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (error) throw error

      toast.success('Notification settings updated')
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error('Error updating notification settings:', error)
      toast.error('Failed to update settings')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Notification Settings</DialogTitle>
          <DialogDescription>Manage how you receive notifications</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* General Notifications */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">General Notifications</h3>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email-notifications">Email Notifications</Label>
                <p className="text-muted-foreground text-xs">
                  Receive notifications via email
                </p>
              </div>
              <Switch
                id="email-notifications"
                checked={settings.email_notifications}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, email_notifications: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="push-notifications">Push Notifications</Label>
                <p className="text-muted-foreground text-xs">
                  Receive push notifications in browser
                </p>
              </div>
              <Switch
                id="push-notifications"
                checked={settings.push_notifications}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, push_notifications: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="sms-alerts">SMS Alerts</Label>
                <p className="text-muted-foreground text-xs">
                  Receive urgent alerts via SMS
                </p>
              </div>
              <Switch
                id="sms-alerts"
                checked={settings.sms_alerts}
                onCheckedChange={(checked) => setSettings({ ...settings, sms_alerts: checked })}
              />
            </div>
          </div>

          {/* Specific Notifications */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Specific Notifications</h3>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="cert-reminders">Certification Reminders</Label>
                <p className="text-muted-foreground text-xs">
                  Get notified about expiring certifications
                </p>
              </div>
              <Switch
                id="cert-reminders"
                checked={settings.certification_reminders}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, certification_reminders: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="leave-updates">Leave Request Updates</Label>
                <p className="text-muted-foreground text-xs">
                  Get notified about leave request status changes
                </p>
              </div>
              <Switch
                id="leave-updates"
                checked={settings.leave_request_updates}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, leave_request_updates: checked })
                }
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
