/**
 * Certification Category Manager Component
 * Allows admins to manage certification categories and their grace periods
 *
 * @version 1.0.0
 * @since 2025-10-20
 */

'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Pencil, Plus } from 'lucide-react'
import { useCsrfToken } from '@/lib/hooks/use-csrf-token'

interface CertificationCategory {
  id: string
  check_code: string
  check_description: string
  category: string | null
  grace_period_days: number | null
  renewal_reminder_days: number | null
  created_at: string
  updated_at: string
}

export function CertificationCategoryManager() {
  const { csrfToken } = useCsrfToken()
  const [categories, setCategories] = useState<CertificationCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [editingCategory, setEditingCategory] = useState<CertificationCategory | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    check_code: '',
    check_description: '',
    category: '',
    grace_period_days: 30,
    renewal_reminder_days: 60,
  })

  // Fetch certification categories
  useEffect(() => {
    fetchCategories()
  }, [])

  async function fetchCategories() {
    try {
      setLoading(true)
      const response = await fetch('/api/certification-categories')
      const result = await response.json()

      if (result.success) {
        setCategories(result.data)
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    } finally {
      setLoading(false)
    }
  }

  function handleEdit(category: CertificationCategory) {
    setEditingCategory(category)
    setFormData({
      check_code: category.check_code,
      check_description: category.check_description,
      category: category.category || '',
      grace_period_days: category.grace_period_days || 30,
      renewal_reminder_days: category.renewal_reminder_days || 60,
    })
    setIsDialogOpen(true)
  }

  function handleAdd() {
    setEditingCategory(null)
    setFormData({
      check_code: '',
      check_description: '',
      category: '',
      grace_period_days: 30,
      renewal_reminder_days: 60,
    })
    setIsDialogOpen(true)
  }

  function handleClose() {
    setIsDialogOpen(false)
    setEditingCategory(null)
  }

  async function handleSave() {
    try {
      setSaving(true)

      const url = editingCategory
        ? `/api/certification-categories/${editingCategory.id}`
        : '/api/certification-categories'

      const method = editingCategory ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken && { 'x-csrf-token': csrfToken }),
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (result.success) {
        await fetchCategories()
        handleClose()
      } else {
        alert(result.error || 'Failed to save category')
      }
    } catch (error) {
      alert('Failed to save category')
    } finally {
      setSaving(false)
    }
  }

  // Group categories by category name
  const groupedCategories = categories.reduce(
    (acc, cat) => {
      const categoryName = cat.category || 'Uncategorized'
      if (!acc[categoryName]) {
        acc[categoryName] = []
      }
      acc[categoryName].push(cat)
      return acc
    },
    {} as Record<string, CertificationCategory[]>
  )

  const sortedCategoryNames = Object.keys(groupedCategories).sort()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-foreground text-2xl font-bold">📋 Certification Categories</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage certification types, categories, and grace periods for renewals
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add Category
        </Button>
      </div>

      {/* Loading State */}
      {loading && (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">Loading certification categories...</p>
        </Card>
      )}

      {/* Categories Grid */}
      {!loading && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {sortedCategoryNames.map((categoryName) => (
            <Card key={categoryName} className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-foreground flex items-center gap-2 text-lg font-semibold">
                  {getCategoryIcon(categoryName)}
                  {categoryName}
                </h3>
                <Badge variant="outline">{groupedCategories[categoryName].length} types</Badge>
              </div>

              <div className="space-y-3">
                {groupedCategories[categoryName].map((category) => (
                  <Card key={category.id} className="bg-muted/30 p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="mb-1 flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {category.check_code}
                          </Badge>
                        </div>
                        <p className="text-foreground mb-2 text-sm font-medium">
                          {category.check_description}
                        </p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-muted-foreground">Grace Period:</span>
                            <span className="text-foreground ml-1 font-medium">
                              {category.grace_period_days || 30} days
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Reminder:</span>
                            <span className="text-foreground ml-1 font-medium">
                              {category.renewal_reminder_days || 60} days
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(category)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && categories.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground mb-4">No certification categories found</p>
          <Button onClick={handleAdd}>
            <Plus className="mr-2 h-4 w-4" />
            Add Your First Category
          </Button>
        </Card>
      )}

      {/* Edit/Add Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {editingCategory ? 'Edit Certification Category' : 'Add Certification Category'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Check Code */}
            <div>
              <Label htmlFor="check_code">Check Code *</Label>
              <Input
                id="check_code"
                value={formData.check_code}
                onChange={(e) =>
                  setFormData({ ...formData, check_code: e.target.value.toUpperCase() })
                }
                placeholder="e.g., PPC, MED, DG"
                className="mt-2"
                disabled={!!editingCategory}
              />
              <p className="text-muted-foreground mt-1 text-xs">
                Unique code for this certification type (uppercase)
              </p>
            </div>

            {/* Check Description */}
            <div>
              <Label htmlFor="check_description">Description *</Label>
              <Input
                id="check_description"
                value={formData.check_description}
                onChange={(e) => setFormData({ ...formData, check_description: e.target.value })}
                placeholder="e.g., Pilot Proficiency Check"
                className="mt-2"
              />
            </div>

            {/* Category */}
            <div>
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="e.g., Proficiency, Medical, Recurrent"
                className="mt-2"
              />
              <p className="text-muted-foreground mt-1 text-xs">
                Group multiple certification types under a category
              </p>
            </div>

            {/* Grace Period */}
            <div>
              <Label htmlFor="grace_period_days">Grace Period (Days) *</Label>
              <Input
                id="grace_period_days"
                type="number"
                min="0"
                value={formData.grace_period_days}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    grace_period_days: parseInt(e.target.value) || 0,
                  })
                }
                className="mt-2"
              />
              <p className="text-muted-foreground mt-1 text-xs">
                Number of days after expiry that certification is still considered valid
              </p>
            </div>

            {/* Renewal Reminder */}
            <div>
              <Label htmlFor="renewal_reminder_days">Renewal Reminder (Days) *</Label>
              <Input
                id="renewal_reminder_days"
                type="number"
                min="0"
                value={formData.renewal_reminder_days}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    renewal_reminder_days: parseInt(e.target.value) || 0,
                  })
                }
                className="mt-2"
              />
              <p className="text-muted-foreground mt-1 text-xs">
                Number of days before expiry to send renewal reminder
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 pt-4">
              <Button variant="outline" onClick={handleClose} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : editingCategory ? 'Save Changes' : 'Add Category'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Helper function to get category icon
function getCategoryIcon(category: string): string {
  const cat = category.toLowerCase()
  if (cat.includes('proficiency')) return '✈️'
  if (cat.includes('medical')) return '🏥'
  if (cat.includes('recurrent')) return '🔄'
  if (cat.includes('licence') || cat.includes('license')) return '📜'
  if (cat.includes('dangerous')) return '☣️'
  if (cat.includes('security')) return '🔒'
  return '📋'
}
