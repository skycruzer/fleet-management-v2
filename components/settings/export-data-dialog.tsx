/**
 * Export Data Dialog Component
 * Dialog for exporting user data in various formats
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Loader2, Download, FileJson, FileSpreadsheet } from 'lucide-react'

interface ExportDataDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ExportDataDialog({ open, onOpenChange }: ExportDataDialogProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [format, setFormat] = useState<'json' | 'csv'>('json')
  const [includeProfile, setIncludeProfile] = useState(true)
  const [includeCertifications, setIncludeCertifications] = useState(true)
  const [includeLeaveRequests, setIncludeLeaveRequests] = useState(true)
  const [includeActivityLog, setIncludeActivityLog] = useState(false)

  const supabase = createClient()

  const handleExport = async () => {
    if (!includeProfile && !includeCertifications && !includeLeaveRequests && !includeActivityLog) {
      toast.error('Please select at least one data category to export')
      return
    }

    setIsExporting(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        toast.error('Not authenticated')
        return
      }

      const exportData: any = {
        export_date: new Date().toISOString(),
        user_id: user.id,
      }

      // Fetch user profile data
      if (includeProfile) {
        const { data: userData } = await supabase
          .from('an_users')
          .select('*')
          .eq('id', user.id)
          .single()

        exportData.profile = userData
      }

      // Fetch pilot data if user is a pilot
      if (includeCertifications || includeLeaveRequests) {
        const { data: pilotData } = await supabase
          .from('pilots')
          .select('*')
          .eq('email', user.email || '')
          .single()

        if (pilotData) {
          exportData.pilot_profile = pilotData

          // Fetch certifications
          if (includeCertifications) {
            const { data: certifications } = await supabase
              .from('pilot_checks')
              .select('*, check_types(*)')
              .eq('pilot_id', pilotData.id)

            exportData.certifications = certifications
          }

          // Fetch leave requests
          if (includeLeaveRequests) {
            const { data: leaveRequests } = await supabase
              .from('leave_requests')
              .select('*')
              .eq('pilot_id', pilotData.id)

            exportData.leave_requests = leaveRequests
          }
        }
      }

      // Fetch activity log
      if (includeActivityLog) {
        const { data: auditLogs } = await supabase
          .from('audit_logs')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(100)

        exportData.activity_log = auditLogs
      }

      // Export based on format
      if (format === 'json') {
        downloadJSON(exportData)
      } else {
        downloadCSV(exportData)
      }

      toast.success('Data exported successfully')
      onOpenChange(false)
    } catch (error) {
      console.error('Error exporting data:', error)
      toast.error('Failed to export data')
    } finally {
      setIsExporting(false)
    }
  }

  const downloadJSON = (data: any) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `fleet-management-data-export-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const downloadCSV = (data: any) => {
    let csvContent = ''

    // Profile section
    if (data.profile) {
      csvContent += 'Profile Information\n'
      csvContent += Object.keys(data.profile).join(',') + '\n'
      csvContent += Object.values(data.profile).join(',') + '\n\n'
    }

    // Certifications section
    if (data.certifications && data.certifications.length > 0) {
      csvContent += 'Certifications\n'
      const certKeys = Object.keys(data.certifications[0])
      csvContent += certKeys.join(',') + '\n'
      data.certifications.forEach((cert: any) => {
        csvContent += certKeys.map((key) => cert[key]).join(',') + '\n'
      })
      csvContent += '\n'
    }

    // Leave requests section
    if (data.leave_requests && data.leave_requests.length > 0) {
      csvContent += 'Leave Requests\n'
      const leaveKeys = Object.keys(data.leave_requests[0])
      csvContent += leaveKeys.join(',') + '\n'
      data.leave_requests.forEach((leave: any) => {
        csvContent += leaveKeys.map((key) => leave[key]).join(',') + '\n'
      })
    }

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `fleet-management-data-export-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Export Account Data</DialogTitle>
          <DialogDescription>
            Download a copy of your data in your preferred format
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Format Selection */}
          <div className="space-y-3">
            <Label>Export Format</Label>
            <RadioGroup value={format} onValueChange={(value: any) => setFormat(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="json" id="json" />
                <Label htmlFor="json" className="flex cursor-pointer items-center gap-2 font-normal">
                  <FileJson className="h-4 w-4" />
                  JSON (Detailed, machine-readable)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="csv" id="csv" />
                <Label htmlFor="csv" className="flex cursor-pointer items-center gap-2 font-normal">
                  <FileSpreadsheet className="h-4 w-4" />
                  CSV (Spreadsheet-friendly)
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Data Categories */}
          <div className="space-y-3">
            <Label>Data to Include</Label>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="profile"
                  checked={includeProfile}
                  onCheckedChange={(checked) => setIncludeProfile(checked as boolean)}
                />
                <Label
                  htmlFor="profile"
                  className="cursor-pointer font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Profile Information
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="certifications"
                  checked={includeCertifications}
                  onCheckedChange={(checked) => setIncludeCertifications(checked as boolean)}
                />
                <Label htmlFor="certifications" className="cursor-pointer font-normal">
                  Certifications & Checks
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="leave"
                  checked={includeLeaveRequests}
                  onCheckedChange={(checked) => setIncludeLeaveRequests(checked as boolean)}
                />
                <Label htmlFor="leave" className="cursor-pointer font-normal">
                  Leave Request History
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="activity"
                  checked={includeActivityLog}
                  onCheckedChange={(checked) => setIncludeActivityLog(checked as boolean)}
                />
                <Label htmlFor="activity" className="cursor-pointer font-normal">
                  Activity Log (Last 100 entries)
                </Label>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isExporting}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Export Data
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
