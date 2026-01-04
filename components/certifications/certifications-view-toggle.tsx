/**
 * Certifications View Toggle Component
 * Client component for switching between table and grouped views with editing
 */

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { CertificationCategoryGroup } from '@/components/certifications/certification-category-group'
import { CertificationsTable } from '@/components/certifications/certifications-table'
import { Table, LayoutGrid } from 'lucide-react'
import type { CertificationWithDetails } from '@/lib/services/certification-service'
import { useRouter } from 'next/navigation'

interface CertificationsViewToggleProps {
  groupedCertifications: Record<string, CertificationWithDetails[]>
  allCertifications: CertificationWithDetails[]
}

export function CertificationsViewToggle({
  groupedCertifications,
  allCertifications,
}: CertificationsViewToggleProps) {
  const router = useRouter()
  const [viewMode, setViewMode] = useState<'grouped' | 'table'>('grouped')
  const [editingCertId, setEditingCertId] = useState<string | null>(null)
  const [editExpiryDate, setEditExpiryDate] = useState('')
  const [savingCert, setSavingCert] = useState(false)

  async function handleSaveCertification(certId: string) {
    try {
      setSavingCert(true)
      const response = await fetch(`/api/certifications/${certId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expiry_date: editExpiryDate }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update certification')
      }

      alert('Certification updated successfully')
      setEditingCertId(null)
      setEditExpiryDate('')
      router.refresh() // Refresh server component data
    } catch (error) {
      console.error('Error updating certification:', error)
      alert(error instanceof Error ? error.message : 'Failed to update certification')
    } finally {
      setSavingCert(false)
    }
  }

  function handleEditCertification(certId: string, currentExpiry: string | null) {
    setEditingCertId(certId)
    setEditExpiryDate(currentExpiry || '')
  }

  function handleCancelEdit() {
    setEditingCertId(null)
    setEditExpiryDate('')
  }

  // Sort categories alphabetically
  const sortedCategories = Object.keys(groupedCertifications).sort((a, b) => {
    if (a === 'Uncategorized') return 1
    if (b === 'Uncategorized') return -1
    return a.localeCompare(b)
  })

  const categoryCount = sortedCategories.length

  return (
    <>
      {/* View Toggle */}
      <div className="border-input bg-background flex items-center rounded-lg border p-1">
        <Button
          variant={viewMode === 'table' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setViewMode('table')}
          aria-label="Table view"
          className="h-8 flex-1 sm:flex-none"
        >
          <Table className="h-4 w-4 sm:mr-2" aria-hidden="true" />
          <span className="hidden sm:inline">Table</span>
        </Button>
        <Button
          variant={viewMode === 'grouped' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setViewMode('grouped')}
          aria-label="Grouped view"
          className="h-8 flex-1 sm:flex-none"
        >
          <LayoutGrid className="h-4 w-4 sm:mr-2" aria-hidden="true" />
          <span className="hidden sm:inline">Grouped</span>
        </Button>
      </div>

      {/* View Content */}
      {viewMode === 'table' ? (
        <CertificationsTable certifications={allCertifications} />
      ) : (
        <>
          {/* Category Summary */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-foreground text-lg font-semibold">Categories</h3>
              <Badge variant="secondary">{categoryCount} Categories</Badge>
            </div>
            <p className="text-muted-foreground mt-2 text-sm">
              Certifications are organized by check type category. Click on a category to expand and
              view details.
            </p>
          </Card>

          {/* Grouped Certifications by Category */}
          <div className="space-y-4">
            {sortedCategories.map((category) => (
              <CertificationCategoryGroup
                key={category}
                category={category}
                certifications={groupedCertifications[category]}
                defaultExpanded={category !== 'Uncategorized'}
                editingCertId={editingCertId}
                editExpiryDate={editExpiryDate}
                savingCert={savingCert}
                onEdit={handleEditCertification}
                onSave={handleSaveCertification}
                onCancel={handleCancelEdit}
                onEditExpiryDateChange={setEditExpiryDate}
              />
            ))}
          </div>

          {/* Empty State */}
          {categoryCount === 0 && (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground text-lg">No certifications found</p>
              <p className="text-muted-foreground mt-2 text-sm">
                Add your first certification to get started
              </p>
            </Card>
          )}
        </>
      )}
    </>
  )
}
