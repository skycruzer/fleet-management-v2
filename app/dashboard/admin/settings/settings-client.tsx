'use client'

/**
 * Settings Client Component
 * Handles interactive editing of system settings
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import type { SystemSetting } from '@/lib/services/admin-service'

interface SettingsClientProps {
  settings: SystemSetting[]
}

export function SettingsClient({ settings }: SettingsClientProps) {
  const router = useRouter()
  const [editingSettingId, setEditingSettingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [localSettings, setLocalSettings] = useState(settings)

  const editingSetting = localSettings.find((s) => s.id === editingSettingId)

  function handleEdit(setting: SystemSetting) {
    setEditingSettingId(setting.id)
    setEditValue(JSON.stringify(setting.value, null, 2))
    setEditDescription(setting.description || '')
  }

  function handleClose() {
    setEditingSettingId(null)
    setEditValue('')
    setEditDescription('')
  }

  async function handleSave() {
    if (!editingSettingId) return

    try {
      setSaving(true)

      // Parse JSON value
      let parsedValue
      try {
        parsedValue = JSON.parse(editValue)
      } catch {
        alert('Invalid JSON format')
        setSaving(false)
        return
      }

      const response = await fetch(`/api/settings/${editingSettingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          value: parsedValue,
          description: editDescription || null,
        }),
        credentials: 'include',
      })

      const result = await response.json()

      if (result.success) {
        // Update local state
        setLocalSettings((prev) => prev.map((s) => (s.id === editingSettingId ? result.data : s)))
        handleClose()

        // Refresh page for critical settings that affect multiple pages
        if (result.data.key === 'app_title' || result.data.key === 'pilot_requirements') {
          router.refresh()
        }
      } else {
        alert(result.error || 'Failed to update setting')
      }
    } catch (error) {
      console.error('Error saving setting:', error)
      alert('Failed to update setting')
    } finally {
      setSaving(false)
    }
  }

  // Helper function to check if setting is protected
  const isProtected = (setting: SystemSetting) => (setting as any).is_system === true

  // Filter settings by category
  const uncategorizedSettings = localSettings.filter((s) => {
    const cat = (s as any).category
    return (
      !cat || (cat !== 'fleet' && cat !== 'certification' && cat !== 'leave' && cat !== 'system')
    )
  })

  return (
    <>
      {/* Uncategorized Settings - Show all as individual cards */}
      {uncategorizedSettings.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-foreground text-xl font-semibold">General Settings</h3>
          {uncategorizedSettings.map((setting) => (
            <Card key={setting.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-foreground text-lg font-semibold">{setting.key}</h3>
                  {setting.description && (
                    <p className="text-muted-foreground mt-1 text-sm">{setting.description}</p>
                  )}
                  <div className="mt-3">
                    <pre className="border-border bg-muted/50 text-card-foreground overflow-x-auto rounded border p-3 text-sm">
                      {JSON.stringify(setting.value, null, 2)}
                    </pre>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="default"
                  className="ml-4"
                  onClick={() => handleEdit(setting)}
                  disabled={isProtected(setting)}
                >
                  {isProtected(setting) ? 'Locked' : 'Edit'}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Settings Categories */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Fleet Configuration */}
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-foreground text-lg font-semibold">⚓ Fleet Configuration</h3>
          </div>
          <div className="space-y-3">
            {localSettings
              .filter((s) => (s as any).category === 'fleet' || s.key.includes('fleet'))
              .map((setting) => (
                <Card key={setting.id} className="bg-muted/50 p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-foreground text-sm font-medium">{setting.key}</p>
                      {setting.description && (
                        <p className="text-muted-foreground mt-1 text-xs">{setting.description}</p>
                      )}
                      <div className="mt-2">
                        <pre className="border-border bg-card text-card-foreground overflow-x-auto rounded border p-2 text-xs">
                          {JSON.stringify(setting.value, null, 2)}
                        </pre>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="ml-4"
                      onClick={() => handleEdit(setting)}
                      disabled={isProtected(setting)}
                    >
                      {isProtected(setting) ? 'Locked' : 'Edit'}
                    </Button>
                  </div>
                </Card>
              ))}
            {localSettings.filter((s) => (s as any).category === 'fleet' || s.key.includes('fleet'))
              .length === 0 && (
              <p className="text-muted-foreground py-4 text-center text-sm">
                No fleet configuration settings
              </p>
            )}
          </div>
        </Card>

        {/* Certification Configuration */}
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-foreground text-lg font-semibold">📋 Certification Settings</h3>
          </div>
          <div className="space-y-3">
            {localSettings
              .filter((s) => (s as any).category === 'certification' || s.key.includes('cert'))
              .map((setting) => (
                <Card key={setting.id} className="bg-muted/50 p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-foreground text-sm font-medium">{setting.key}</p>
                      {setting.description && (
                        <p className="text-muted-foreground mt-1 text-xs">{setting.description}</p>
                      )}
                      <div className="mt-2">
                        <pre className="border-border bg-card text-card-foreground overflow-x-auto rounded border p-2 text-xs">
                          {JSON.stringify(setting.value, null, 2)}
                        </pre>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="ml-4"
                      onClick={() => handleEdit(setting)}
                      disabled={isProtected(setting)}
                    >
                      {isProtected(setting) ? 'Locked' : 'Edit'}
                    </Button>
                  </div>
                </Card>
              ))}
            {localSettings.filter(
              (s) => (s as any).category === 'certification' || s.key.includes('cert')
            ).length === 0 && (
              <p className="text-muted-foreground py-4 text-center text-sm">
                No certification settings
              </p>
            )}
          </div>
        </Card>

        {/* Leave Management Settings */}
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-foreground text-lg font-semibold">🏖️ Leave Management</h3>
          </div>
          <div className="space-y-3">
            {localSettings
              .filter((s) => (s as any).category === 'leave' || s.key.includes('leave'))
              .map((setting) => (
                <Card key={setting.id} className="bg-muted/50 p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-foreground text-sm font-medium">{setting.key}</p>
                      {setting.description && (
                        <p className="text-muted-foreground mt-1 text-xs">{setting.description}</p>
                      )}
                      <div className="mt-2">
                        <pre className="border-border bg-card text-card-foreground overflow-x-auto rounded border p-2 text-xs">
                          {JSON.stringify(setting.value, null, 2)}
                        </pre>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="ml-4"
                      onClick={() => handleEdit(setting)}
                      disabled={isProtected(setting)}
                    >
                      {isProtected(setting) ? 'Locked' : 'Edit'}
                    </Button>
                  </div>
                </Card>
              ))}
            {localSettings.filter((s) => (s as any).category === 'leave' || s.key.includes('leave'))
              .length === 0 && (
              <p className="text-muted-foreground py-4 text-center text-sm">
                No leave management settings
              </p>
            )}
          </div>
        </Card>

        {/* System Settings */}
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-foreground text-lg font-semibold">🔧 System Settings</h3>
          </div>
          <div className="space-y-3">
            {localSettings
              .filter((s) => (s as any).category === 'system' || (s as any).is_system === true)
              .map((setting) => (
                <Card key={setting.id} className="bg-muted/50 p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <p className="text-foreground text-sm font-medium">{setting.key}</p>
                        {(setting as any).is_system && (
                          <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-800">
                            Protected
                          </span>
                        )}
                      </div>
                      {setting.description && (
                        <p className="text-muted-foreground mt-1 text-xs">{setting.description}</p>
                      )}
                      <div className="mt-2">
                        <pre className="border-border bg-card text-card-foreground overflow-x-auto rounded border p-2 text-xs">
                          {JSON.stringify(setting.value, null, 2)}
                        </pre>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="ml-4"
                      onClick={() => handleEdit(setting)}
                      disabled={(setting as any).is_system === true}
                    >
                      {(setting as any).is_system ? 'Locked' : 'Edit'}
                    </Button>
                  </div>
                </Card>
              ))}
            {localSettings.filter(
              (s) => (s as any).category === 'system' || (s as any).is_system === true
            ).length === 0 && (
              <p className="text-muted-foreground py-4 text-center text-sm">No system settings</p>
            )}
          </div>
        </Card>
      </div>

      {/* All Settings Table */}
      <Card className="p-6">
        <h3 className="text-foreground mb-4 text-lg font-semibold">All Settings</h3>
        <div className="overflow-x-auto">
          <table className="divide-border min-w-full divide-y">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-muted-foreground px-4 py-3 text-left text-xs font-medium tracking-wider uppercase">
                  Key
                </th>
                <th className="text-muted-foreground px-4 py-3 text-left text-xs font-medium tracking-wider uppercase">
                  Description
                </th>
                <th className="text-muted-foreground px-4 py-3 text-left text-xs font-medium tracking-wider uppercase">
                  Value
                </th>
                <th className="text-muted-foreground px-4 py-3 text-left text-xs font-medium tracking-wider uppercase">
                  Status
                </th>
                <th className="text-muted-foreground px-4 py-3 text-left text-xs font-medium tracking-wider uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-border divide-y">
              {localSettings.map((setting) => (
                <tr key={setting.id} className="hover:bg-muted/50">
                  <td className="text-foreground px-4 py-4 text-sm font-medium whitespace-nowrap">
                    {setting.key}
                  </td>
                  <td className="text-muted-foreground px-4 py-4 text-sm">
                    {setting.description || 'No description'}
                  </td>
                  <td className="text-muted-foreground px-4 py-4 text-sm">
                    <pre className="max-w-xs overflow-hidden text-xs text-ellipsis whitespace-nowrap">
                      {JSON.stringify(setting.value)}
                    </pre>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          (setting as any).is_active !== false
                            ? 'bg-green-100 text-green-800'
                            : 'bg-muted text-foreground'
                        }`}
                      >
                        {(setting as any).is_active !== false ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                      {(setting as any).is_system && (
                        <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                          PROTECTED
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isProtected(setting)}
                      className="hover:bg-primary hover:text-primary-foreground"
                      onClick={() => handleEdit(setting)}
                    >
                      {isProtected(setting) ? 'View' : 'Edit'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {localSettings.length === 0 && (
          <p className="text-muted-foreground py-8 text-center">No settings configured</p>
        )}
        <div className="text-muted-foreground mt-4 text-sm">
          Showing {localSettings.length} settings
        </div>
      </Card>

      {/* Edit Modal */}
      <Dialog open={!!editingSettingId} onOpenChange={handleClose}>
        <DialogContent className="flex max-h-[90vh] max-w-3xl flex-col">
          <DialogHeader>
            <DialogTitle className="text-2xl">Edit Setting: {editingSetting?.key}</DialogTitle>
          </DialogHeader>

          {/* Scrollable content area */}
          <div className="flex-1 space-y-4 overflow-y-auto pr-2">
            {/* Description */}
            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Enter description (optional)"
                className="mt-2"
              />
            </div>

            {/* Value (JSON) */}
            <div>
              <Label htmlFor="value">Value (JSON format)</Label>
              <Textarea
                id="value"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                placeholder="Enter JSON value"
                className="mt-2 font-mono text-sm"
                rows={12}
              />
              <p className="text-muted-foreground mt-1 text-xs">
                Enter a valid JSON value (e.g., {`{"key": "value"}`}, [1, 2, 3], "string", 123)
              </p>
            </div>
          </div>

          {/* Fixed actions at bottom */}
          <div className="mt-4 flex items-center justify-end space-x-3 border-t pt-4">
            <Button variant="outline" onClick={handleClose} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
