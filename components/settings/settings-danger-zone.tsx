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
      <Card className="border-red-200 bg-red-50 p-6">
        <h2 className="mb-4 text-xl font-semibold text-red-900">Danger Zone</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-red-200 bg-white p-4">
            <div>
              <p className="font-semibold text-red-900">Export Account Data</p>
              <p className="text-sm text-red-700">Download all your account data</p>
            </div>
            <Button
              variant="outline"
              className="border-red-300 text-red-700 hover:bg-red-100"
              onClick={() => setExportDialogOpen(true)}
            >
              Export Data
            </Button>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-red-200 bg-white p-4">
            <div>
              <p className="font-semibold text-red-900">Delete Account</p>
              <p className="text-sm text-red-700">Permanently delete your account and all data</p>
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
