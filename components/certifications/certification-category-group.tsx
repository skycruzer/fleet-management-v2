/**
 * Certification Category Group Component
 * Displays certifications grouped by category with expandable sections
 *
 * @version 1.0.0
 * @since 2025-10-20
 */

'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { formatDate } from '@/lib/utils/date-utils'
import type { CertificationWithDetails } from '@/lib/services/certification-service'

// Use the service type directly
type Certification = CertificationWithDetails

interface CertificationCategoryGroupProps {
  category: string
  certifications: Certification[]
  defaultExpanded?: boolean
  editingCertId: string | null
  editExpiryDate: string
  savingCert: boolean
  onEdit: (certId: string, currentExpiry: string | null) => void
  onSave: (certId: string) => Promise<void>
  onCancel: () => void
  onEditExpiryDateChange: (date: string) => void
}

export function CertificationCategoryGroup({
  category,
  certifications,
  defaultExpanded = true,
  editingCertId,
  editExpiryDate,
  savingCert,
  onEdit,
  onSave,
  onCancel,
  onEditExpiryDateChange,
}: CertificationCategoryGroupProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  // Calculate category statistics
  const stats = {
    total: certifications.length,
    current: certifications.filter((c) => c.status?.color === 'green').length,
    expiring: certifications.filter((c) => c.status?.color === 'yellow').length,
    expired: certifications.filter((c) => c.status?.color === 'red').length,
  }

  // Get category icon
  const getCategoryIcon = (category: string) => {
    const cat = category.toLowerCase()
    if (cat.includes('proficiency')) return '✈️'
    if (cat.includes('medical')) return '🏥'
    if (cat.includes('recurrent')) return '🔄'
    if (cat.includes('licence') || cat.includes('license')) return '📜'
    if (cat.includes('dangerous')) return '☣️'
    if (cat.includes('security')) return '🔒'
    return '📋'
  }

  // Get status badge variant
  const getStatusVariant = (cert: Certification) => {
    if (!cert.status) return 'secondary' as const
    if (cert.status.color === 'red') return 'destructive' as const
    if (cert.status.color === 'yellow') return 'warning' as const
    return 'success' as const
  }

  return (
    <Card className="overflow-hidden">
      {/* Category Header */}
      <button
        type="button"
        aria-expanded={isExpanded}
        className="hover:bg-muted/50 flex w-full cursor-pointer items-center justify-between p-4 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex flex-1 items-center gap-4">
          <span className="text-2xl">{getCategoryIcon(category)}</span>
          <h3 className="text-foreground text-lg font-semibold">{category}</h3>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {stats.total} Total
            </Badge>
            <Badge variant="success" className="text-xs">
              {stats.current} Current
            </Badge>
            <Badge variant="warning" className="text-xs">
              {stats.expiring} Expiring
            </Badge>
            {stats.expired > 0 && (
              <Badge variant="destructive" className="text-xs">
                {stats.expired} Expired
              </Badge>
            )}
          </div>
        </div>
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-md">
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </span>
      </button>

      {/* Certifications Table */}
      {isExpanded && (
        <div className="border-t">
          <div className="overflow-x-auto">
            <table
              className="divide-border min-w-full divide-y"
              aria-label={`${category} certifications`}
            >
              <thead className="bg-muted/20">
                <tr>
                  <th className="text-muted-foreground px-4 py-3 text-left text-xs font-medium tracking-wider uppercase">
                    Check Type
                  </th>
                  <th className="text-muted-foreground px-4 py-3 text-left text-xs font-medium tracking-wider uppercase">
                    Completion
                  </th>
                  <th className="text-muted-foreground px-4 py-3 text-left text-xs font-medium tracking-wider uppercase">
                    Expiry
                  </th>
                  <th className="text-muted-foreground px-4 py-3 text-left text-xs font-medium tracking-wider uppercase">
                    Status
                  </th>
                  <th className="text-muted-foreground px-4 py-3 text-left text-xs font-medium tracking-wider uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-border bg-background divide-y">
                {certifications.map((cert) => (
                  <tr key={cert.id} className="hover:bg-muted/50 transition-colors">
                    <td className="text-foreground px-4 py-4 text-sm font-medium whitespace-nowrap">
                      {cert.check_type?.check_description || 'N/A'}
                    </td>
                    <td className="text-muted-foreground px-4 py-4 text-sm whitespace-nowrap">
                      {cert.created_at ? formatDate(cert.created_at) : 'N/A'}
                    </td>
                    <td className="px-4 py-4 text-sm whitespace-nowrap">
                      {editingCertId === cert.id ? (
                        <div className="flex items-center gap-2">
                          <Input
                            type="date"
                            value={editExpiryDate}
                            onChange={(e) => onEditExpiryDateChange(e.target.value)}
                            className="w-40"
                            disabled={savingCert}
                          />
                          <Button
                            size="sm"
                            onClick={() => onSave(cert.id)}
                            disabled={savingCert}
                            className="bg-[var(--color-status-low)] text-white hover:bg-[var(--color-success-600)]"
                          >
                            {savingCert ? 'Saving...' : 'Save'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={onCancel}
                            disabled={savingCert}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <span className="text-foreground">
                          {cert.expiry_date ? formatDate(cert.expiry_date) : 'N/A'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {cert.status && (
                        <Badge variant={getStatusVariant(cert)}>{cert.status.label}</Badge>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {editingCertId !== cert.id && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onEdit(cert.id, cert.expiry_date)}
                          disabled={editingCertId !== null}
                          className="hover:bg-primary hover:text-primary-foreground"
                        >
                          Edit
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Card>
  )
}
