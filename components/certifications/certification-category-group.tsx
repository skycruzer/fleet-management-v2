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
import { format } from 'date-fns'
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

  // Get status color classes
  const getStatusColor = (cert: Certification): string => {
    if (!cert.status) return 'bg-muted text-muted-foreground'
    if (cert.status.color === 'red')
      return 'bg-[var(--color-status-high-bg)] text-[var(--color-status-high)]'
    if (cert.status.color === 'yellow')
      return 'bg-[var(--color-status-medium-bg)] text-[var(--color-status-medium)]'
    return 'bg-[var(--color-status-low-bg)] text-[var(--color-status-low)]'
  }

  return (
    <Card className="overflow-hidden">
      {/* Category Header */}
      <div
        className="hover:bg-muted/50 flex cursor-pointer items-center justify-between p-4 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex flex-1 items-center gap-4">
          <span className="text-2xl">{getCategoryIcon(category)}</span>
          <h3 className="text-foreground text-lg font-semibold">{category}</h3>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {stats.total} Total
            </Badge>
            <Badge
              variant="outline"
              className="border-[var(--color-status-low-border)] bg-[var(--color-status-low-bg)] text-xs text-[var(--color-status-low)]"
            >
              {stats.current} Current
            </Badge>
            <Badge
              variant="outline"
              className="border-[var(--color-status-medium-border)] bg-[var(--color-status-medium-bg)] text-xs text-[var(--color-status-medium)]"
            >
              {stats.expiring} Expiring
            </Badge>
            {stats.expired > 0 && (
              <Badge
                variant="outline"
                className="border-[var(--color-status-high-border)] bg-[var(--color-status-high-bg)] text-xs text-[var(--color-status-high)]"
              >
                {stats.expired} Expired
              </Badge>
            )}
          </div>
        </div>
        <Button variant="ghost" size="sm">
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </div>

      {/* Certifications Table */}
      {isExpanded && (
        <div className="border-t">
          <div className="overflow-x-auto">
            <table className="divide-border min-w-full divide-y">
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
                      {cert.created_at ? format(new Date(cert.created_at), 'MMM dd, yyyy') : 'N/A'}
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
                          {cert.expiry_date
                            ? format(new Date(cert.expiry_date), 'MMM dd, yyyy')
                            : 'N/A'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {cert.status && (
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(cert)}`}
                        >
                          {cert.status.label}
                        </span>
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
