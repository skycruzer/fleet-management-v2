/**
 * Export Options Panel Component
 *
 * Provides UI for selecting export format (PDF/CSV) and filtering options
 * for certification renewal plan exports.
 */

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Download, FileText, Table2, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

type ExportFormat = 'pdf' | 'csv'
type ExportCategory = 'all' | 'Flight Checks' | 'Simulator Checks' | 'Ground Courses Refresher'

interface ExportOptionsPanelProps {
  year: number
  onExport: (options: ExportOptions) => Promise<void>
  disabled?: boolean
}

export interface ExportOptions {
  format: ExportFormat
  category: ExportCategory
  includePairing: boolean
}

const CATEGORIES = [
  { value: 'all', label: 'All Categories' },
  { value: 'Flight Checks', label: 'Flight Checks' },
  { value: 'Simulator Checks', label: 'Simulator Checks' },
  { value: 'Ground Courses Refresher', label: 'Ground Courses' },
]

export function ExportOptionsPanel({ year, onExport, disabled = false }: ExportOptionsPanelProps) {
  const [format, setFormat] = useState<ExportFormat>('pdf')
  const [category, setCategory] = useState<ExportCategory>('all')
  const [includePairing, setIncludePairing] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const [exportStatus, setExportStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const handleExport = async () => {
    setIsExporting(true)
    setExportStatus('idle')

    try {
      await onExport({
        format,
        category,
        includePairing,
      })
      setExportStatus('success')
      setTimeout(() => setExportStatus('idle'), 3000)
    } catch (error) {
      console.error('Export failed:', error)
      setExportStatus('error')
      setTimeout(() => setExportStatus('idle'), 5000)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Card className="p-4">
      <h4 className="mb-4 font-semibold">Export Options</h4>

      <div className="space-y-4">
        {/* Format Selection */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Format</Label>
          <RadioGroup
            value={format}
            onValueChange={(v) => setFormat(v as ExportFormat)}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="pdf" id="format-pdf" />
              <Label
                htmlFor="format-pdf"
                className="flex cursor-pointer items-center gap-1.5 text-sm"
              >
                <FileText className="h-4 w-4 text-[var(--color-status-high)]" />
                PDF Report
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="csv" id="format-csv" />
              <Label
                htmlFor="format-csv"
                className="flex cursor-pointer items-center gap-1.5 text-sm"
              >
                <Table2 className="h-4 w-4 text-[var(--color-status-low)]" />
                CSV Spreadsheet
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Category Filter */}
        <div className="space-y-2">
          <Label htmlFor="category-filter" className="text-sm font-medium">
            Category
          </Label>
          <Select value={category} onValueChange={(v) => setCategory(v as ExportCategory)}>
            <SelectTrigger id="category-filter" className="w-full">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-muted-foreground text-xs">
            {category === 'all'
              ? 'All categories will be included'
              : `Only ${category} renewals will be exported`}
          </p>
        </div>

        {/* Pairing Options (only for PDF or when category includes pairing-required) */}
        {(category === 'all' ||
          category === 'Flight Checks' ||
          category === 'Simulator Checks') && (
          <div className="flex items-center space-x-2">
            <Checkbox
              id="include-pairing"
              checked={includePairing}
              onCheckedChange={(checked) => setIncludePairing(checked === true)}
            />
            <Label htmlFor="include-pairing" className="cursor-pointer text-sm font-normal">
              Include Captain/FO pairing information
            </Label>
          </div>
        )}

        {/* Export Button */}
        <div className="flex items-center gap-3 pt-2">
          <Button
            onClick={handleExport}
            disabled={disabled || isExporting}
            className={cn(
              'flex-1',
              exportStatus === 'success' &&
                'bg-[var(--color-status-low)] hover:bg-[var(--color-status-low)]',
              exportStatus === 'error' &&
                'bg-[var(--color-status-high)] hover:bg-[var(--color-status-high)]'
            )}
          >
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : exportStatus === 'success' ? (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Downloaded!
              </>
            ) : exportStatus === 'error' ? (
              <>
                <AlertCircle className="mr-2 h-4 w-4" />
                Export Failed
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Export {format.toUpperCase()}
              </>
            )}
          </Button>
        </div>

        {/* Format Info */}
        <div className="text-muted-foreground bg-muted rounded-lg p-3 text-xs">
          {format === 'pdf' ? (
            <div className="space-y-1">
              <p className="text-foreground font-medium">PDF Report includes:</p>
              <ul className="list-inside list-disc space-y-0.5">
                <li>Cover page with summary statistics</li>
                <li>Executive summary by category</li>
                {includePairing && <li>Captain/FO pairing summary</li>}
                <li>Category detail pages with pilot assignments</li>
                <li>Combined pilot schedules</li>
              </ul>
            </div>
          ) : (
            <div className="space-y-1">
              <p className="text-foreground font-medium">CSV Export includes:</p>
              <ul className="list-inside list-disc space-y-0.5">
                <li>All renewal data in spreadsheet format</li>
                <li>Pilot names, IDs, and roles</li>
                <li>Check details and scheduled dates</li>
                {includePairing && <li>Pairing status and paired pilot info</li>}
                <li>Easy import into Excel, Google Sheets, etc.</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}

/**
 * Compact Export Buttons Component
 * For use in dialog footers or inline actions
 */
interface ExportButtonsProps {
  year: number
  onExportPDF: () => void
  onExportCSV: () => void
  disabled?: boolean
  isExporting?: boolean
}

export function ExportButtons({
  year,
  onExportPDF,
  onExportCSV,
  disabled = false,
  isExporting = false,
}: ExportButtonsProps) {
  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={onExportPDF} disabled={disabled || isExporting}>
        <FileText className="mr-1.5 h-4 w-4 text-[var(--color-status-high)]" />
        PDF
      </Button>
      <Button variant="outline" size="sm" onClick={onExportCSV} disabled={disabled || isExporting}>
        <Table2 className="mr-1.5 h-4 w-4 text-[var(--color-status-low)]" />
        CSV
      </Button>
    </div>
  )
}
