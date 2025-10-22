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
    if (!cert.status) return 'bg-gray-100 text-gray-800'
    if (cert.status.color === 'red') return 'bg-red-100 text-red-800'
    if (cert.status.color === 'yellow') return 'bg-yellow-100 text-yellow-800'
    return 'bg-green-100 text-green-800'
  }

  return (
    <Card className="overflow-hidden">
      {/* Category Header */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-4 flex-1">
          <span className="text-2xl">{getCategoryIcon(category)}</span>
          <h3 className="text-lg font-semibold text-foreground">{category}</h3>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {stats.total} Total
            </Badge>
            <Badge variant="outline" className="text-xs border-green-500 bg-green-50 text-green-800">
              {stats.current} Current
            </Badge>
            <Badge variant="outline" className="text-xs border-yellow-500 bg-yellow-50 text-yellow-800">
              {stats.expiring} Expiring
            </Badge>
            {stats.expired > 0 && (
              <Badge variant="outline" className="text-xs border-red-500 bg-red-50 text-red-800">
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
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted/20">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Check Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Completion
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Expiry
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-background">
                {certifications.map((cert) => (
                  <tr key={cert.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-4 text-sm font-medium text-foreground whitespace-nowrap">
                      {cert.check_type?.check_description || 'N/A'}
                    </td>
                    <td className="px-4 py-4 text-sm text-muted-foreground whitespace-nowrap">
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
                            className="bg-green-600 hover:bg-green-700 text-white"
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
