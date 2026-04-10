/**
 * Filter Preset Manager Component
 * Author: Maurice Rondeau
 * Date: November 4, 2025
 *
 * Phase 2.4: Component for saving, loading, and managing filter presets
 */

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Save, BookmarkPlus, Trash2, ChevronDown } from 'lucide-react'
import { useFilterPresets, type FilterPreset } from '@/lib/hooks/use-filter-presets'
import type { ReportFilters } from '@/types/reports'
import { useToast } from '@/hooks/use-toast'

interface FilterPresetManagerProps {
  reportType: 'leave' | 'flight-requests' | 'certifications' | 'leave-bids'
  currentFilters: ReportFilters
  onLoadPreset: (filters: ReportFilters) => void
}

export function FilterPresetManager({
  reportType,
  currentFilters,
  onLoadPreset,
}: FilterPresetManagerProps) {
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [presetName, setPresetName] = useState('')
  const { toast } = useToast()

  const { presets, savePreset, deletePreset, isLoading } = useFilterPresets(reportType)

  const handleSavePreset = () => {
    if (!presetName.trim()) {
      toast({
        title: 'Invalid Name',
        description: 'Please enter a name for this preset',
        variant: 'destructive',
      })
      return
    }

    try {
      savePreset(presetName.trim(), currentFilters)
      toast({
        title: 'Preset Saved',
        description: `Filter preset "${presetName}" has been saved successfully`,
      })
      setShowSaveDialog(false)
      setPresetName('')
    } catch (error) {
      toast({
        title: 'Save Failed',
        description: 'Failed to save filter preset',
        variant: 'destructive',
      })
    }
  }

  const handleLoadPreset = (preset: FilterPreset) => {
    try {
      onLoadPreset(preset.filters)
      toast({
        title: 'Preset Loaded',
        description: `Filter preset "${preset.name}" has been applied`,
      })
    } catch (error) {
      toast({
        title: 'Load Failed',
        description: 'Failed to load filter preset',
        variant: 'destructive',
      })
    }
  }

  const handleDeletePreset = (preset: FilterPreset, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      deletePreset(preset.id)
      toast({
        title: 'Preset Deleted',
        description: `Filter preset "${preset.name}" has been deleted`,
      })
    } catch (error) {
      toast({
        title: 'Delete Failed',
        description: 'Failed to delete filter preset',
        variant: 'destructive',
      })
    }
  }

  // Check if current filters have any values
  const hasActiveFilters = Object.keys(currentFilters).length > 0

  return (
    <>
      <div className="flex gap-2">
        {/* Save Current Filters Button */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowSaveDialog(true)}
          disabled={!hasActiveFilters}
          className="h-9"
        >
          <Save className="mr-2 h-4 w-4" />
          Save Filters
        </Button>

        {/* Load Saved Presets Dropdown */}
        {presets.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="outline" size="sm" className="h-9">
                <BookmarkPlus className="mr-2 h-4 w-4" />
                Load Preset
                <ChevronDown className="ml-2 h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
              <DropdownMenuLabel>Saved Filter Presets</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {presets.map((preset) => (
                <DropdownMenuItem
                  key={preset.id}
                  onClick={() => handleLoadPreset(preset)}
                  className="flex cursor-pointer items-center justify-between"
                >
                  <span className="flex-1">{preset.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={(e) => handleDeletePreset(preset, e)}
                    className="hover:bg-destructive hover:text-destructive-foreground ml-2 h-6 w-6 p-0"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Save Preset Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Filter Preset</DialogTitle>
            <DialogDescription>
              Give this filter configuration a name so you can quickly apply it later.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="preset-name">Preset Name</Label>
              <Input
                id="preset-name"
                placeholder="e.g., Expiring in 30 days, Pending Captains, etc."
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleSavePreset()
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSavePreset}>
              Save Preset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
