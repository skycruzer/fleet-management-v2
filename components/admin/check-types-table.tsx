/** Developer: Maurice Rondeau */

'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { Bell, BellOff, Settings2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { useCsrfToken } from '@/lib/hooks/use-csrf-token'
import type { CheckType } from '@/lib/services/admin-service'

const AVAILABLE_REMINDER_DAYS = [90, 60, 30, 14, 7] as const

interface CheckTypesTableProps {
  checkTypes: CheckType[]
}

export function CheckTypesTable({ checkTypes }: CheckTypesTableProps) {
  const { toast } = useToast()
  const { csrfToken } = useCsrfToken()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedCheckType, setSelectedCheckType] = useState<CheckType | null>(null)
  const [reminderDays, setReminderDays] = useState<number[]>([])
  const [emailEnabled, setEmailEnabled] = useState(true)
  const [saving, setSaving] = useState(false)

  // Local state to reflect saved changes without full page reload
  const [localCheckTypes, setLocalCheckTypes] = useState(checkTypes)

  function openReminderDialog(ct: CheckType) {
    setSelectedCheckType(ct)
    setReminderDays(ct.reminder_days ?? [90, 60, 30, 14, 7])
    setEmailEnabled(ct.email_notifications_enabled ?? false)
    setDialogOpen(true)
  }

  function toggleDay(day: number) {
    setReminderDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort((a, b) => b - a)
    )
  }

  async function handleSave() {
    if (!selectedCheckType) return
    setSaving(true)

    try {
      const response = await fetch(`/api/check-types/${selectedCheckType.id}/reminders`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({
          reminder_days: reminderDays,
          email_notifications_enabled: emailEnabled,
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to save reminder settings')
      }

      // Update local state to reflect changes
      setLocalCheckTypes((prev) =>
        prev.map((ct) =>
          ct.id === selectedCheckType.id
            ? { ...ct, reminder_days: reminderDays, email_notifications_enabled: emailEnabled }
            : ct
        )
      )

      toast({
        title: 'Reminder settings saved',
        description: `Updated reminders for ${selectedCheckType.check_code}`,
        variant: 'success',
      })

      setDialogOpen(false)
    } catch (error) {
      toast({
        title: 'Error saving settings',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Code</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Reminders</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Updated</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {localCheckTypes.map((checkType) => {
            const days = checkType.reminder_days ?? []
            const notificationsOn = checkType.email_notifications_enabled

            return (
              <TableRow key={checkType.id}>
                <TableCell className="text-foreground font-medium whitespace-nowrap">
                  {checkType.check_code}
                </TableCell>
                <TableCell className="text-foreground">{checkType.check_description}</TableCell>
                <TableCell className="text-muted-foreground whitespace-nowrap">
                  {checkType.category || 'N/A'}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {notificationsOn ? (
                    <span className="inline-flex items-center gap-1.5 text-xs text-[var(--color-success-400)]">
                      <Bell className="h-3.5 w-3.5" aria-hidden="true" />
                      {days.length > 0
                        ? days.sort((a, b) => b - a).join(', ') + 'd'
                        : 'No days set'}
                    </span>
                  ) : (
                    <span className="text-muted-foreground inline-flex items-center gap-1.5 text-xs">
                      <BellOff className="h-3.5 w-3.5" aria-hidden="true" />
                      Off
                    </span>
                  )}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <span className="inline-flex items-center rounded-full bg-[var(--color-success-muted)] px-2.5 py-0.5 text-xs font-medium text-[var(--color-success-400)]">
                    ACTIVE
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground whitespace-nowrap">
                  {format(new Date(checkType.updated_at), 'MMM dd, yyyy')}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openReminderDialog(checkType)}
                    aria-label={`Configure reminders for ${checkType.check_code}`}
                  >
                    <Settings2 className="mr-1.5 h-4 w-4" aria-hidden="true" />
                    Reminders
                  </Button>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>

      {/* Reminder Settings Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Configure Reminders</DialogTitle>
            <DialogDescription>
              Set email reminder schedule for <strong>{selectedCheckType?.check_code}</strong> —{' '}
              {selectedCheckType?.check_description}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Email Notifications Toggle */}
            <div className="flex items-center justify-between">
              <Label htmlFor="email-toggle" className="flex flex-col gap-1">
                <span className="text-sm font-medium">Email Notifications</span>
                <span className="text-muted-foreground text-xs">
                  Send reminder emails before expiry
                </span>
              </Label>
              <Switch id="email-toggle" checked={emailEnabled} onCheckedChange={setEmailEnabled} />
            </div>

            {/* Reminder Days Checkboxes */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Reminder Schedule</Label>
              <p className="text-muted-foreground text-xs">
                Select when to send reminders before a certification expires
              </p>
              <div className="space-y-2">
                {AVAILABLE_REMINDER_DAYS.map((day) => (
                  <label
                    key={day}
                    className="hover:bg-muted/50 flex items-center gap-3 rounded-md border px-3 py-2 transition-colors"
                  >
                    <Checkbox
                      checked={reminderDays.includes(day)}
                      onCheckedChange={() => toggleDay(day)}
                      disabled={!emailEnabled}
                    />
                    <span
                      className={`text-sm ${!emailEnabled ? 'text-muted-foreground' : 'text-foreground'}`}
                    >
                      {day} days before expiry
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
