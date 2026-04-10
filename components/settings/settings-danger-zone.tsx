/**
 * Settings Danger Zone Component
 * Critical account actions (export data, delete account)
 */

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ExportDataDialog } from './export-data-dialog'
import { DeleteAccountDialog } from './delete-account-dialog'

interface SettingsDangerZoneProps {
  userEmail: string
}

export function SettingsDangerZone({ userEmail }: SettingsDangerZoneProps) {
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  return (
    <>
      <Card className="border-[var(--color-status-high-border)] bg-[var(--color-status-high-bg)] p-6">
        <h2 className="mb-4 text-xl font-semibold text-[var(--color-status-high-foreground)]">
          Danger Zone
        </h2>
        <div className="space-y-4">
          <div className="bg-card flex items-center justify-between rounded-lg border border-[var(--color-status-high-border)] p-4">
            <div>
              <p className="font-semibold text-[var(--color-status-high-foreground)]">
                Export Account Data
              </p>
              <p className="text-sm text-[var(--color-status-high)]">
                Download all your account data
              </p>
            </div>
            <Button
              variant="outline"
              className="border-[var(--color-status-high-border)] text-[var(--color-status-high)] hover:bg-[var(--color-status-high-bg)]"
              onClick={() => setExportDialogOpen(true)}
            >
              Export Data
            </Button>
          </div>
          <div className="bg-card flex items-center justify-between rounded-lg border border-[var(--color-status-high-border)] p-4">
            <div>
              <p className="font-semibold text-[var(--color-status-high-foreground)]">
                Delete Account
              </p>
              <p className="text-sm text-[var(--color-status-high)]">
                Permanently delete your account and all data
              </p>
            </div>
            <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
              Delete Account
            </Button>
          </div>
        </div>
      </Card>

      {/* Dialogs */}
      <ExportDataDialog open={exportDialogOpen} onOpenChange={setExportDialogOpen} />
      <DeleteAccountDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        userEmail={userEmail}
      />
    </>
  )
}
