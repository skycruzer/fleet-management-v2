/**
 * Category View Component
 * Displays certifications grouped by check type category with accordion UI
 *
 * @author Maurice Rondeau
 * @version 1.0.0
 * @created 2025-12-19
 */

'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChevronDown, CheckCircle, AlertCircle, Clock, FolderOpen, Pencil } from 'lucide-react'
import type { CertificationWithDetails } from '@/lib/services/certification-service'
import { format } from 'date-fns'

interface CategoryViewProps {
  certifications: CertificationWithDetails[]
  onEditCertification?: (certId: string) => void
}

interface CategoryGroup {
  name: string
  certifications: CertificationWithDetails[]
  stats: {
    current: number
    expiring: number
    expired: number
  }
}

/**
 * Group certifications by category
 */
function groupByCategory(certifications: CertificationWithDetails[]): CategoryGroup[] {
  const grouped = certifications.reduce(
    (acc, cert) => {
      const category = cert.check_type?.category || 'Uncategorized'
      if (!acc[category]) {
        acc[category] = {
          name: category,
          certifications: [],
          stats: { current: 0, expiring: 0, expired: 0 },
        }
      }
      acc[category].certifications.push(cert)

      // Update stats
      if (cert.status?.color === 'green') {
        acc[category].stats.current++
      } else if (cert.status?.color === 'yellow') {
        acc[category].stats.expiring++
      } else if (cert.status?.color === 'red') {
        acc[category].stats.expired++
      }

      return acc
    },
    {} as Record<string, CategoryGroup>
  )

  // Sort categories alphabetically, but put "Uncategorized" last
  return Object.values(grouped).sort((a, b) => {
    if (a.name === 'Uncategorized') return 1
    if (b.name === 'Uncategorized') return -1
    return a.name.localeCompare(b.name)
  })
}

/**
 * Get compliance status for a category
 */
function getCategoryCompliance(stats: CategoryGroup['stats']): {
  label: string
  variant: 'destructive' | 'default' | 'secondary'
  className: string
} {
  if (stats.expired > 0) {
    return {
      label: 'Issues',
      variant: 'destructive',
      className: '',
    }
  }
  if (stats.expiring > 0) {
    return {
      label: 'Attention',
      variant: 'default',
      className:
        'bg-yellow-100 text-yellow-800 hover:bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400',
    }
  }
  return {
    label: 'Compliant',
    variant: 'secondary',
    className:
      'bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400',
  }
}

/**
 * Single category accordion item
 */
function CategoryAccordion({
  category,
  onEditCertification,
}: {
  category: CategoryGroup
  onEditCertification?: (certId: string) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const compliance = getCategoryCompliance(category.stats)
  const total = category.certifications.length

  return (
    <Card className="overflow-hidden">
      {/* Accordion Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="hover:bg-muted/50 flex w-full items-center justify-between p-3 text-left transition-all"
        aria-expanded={isOpen}
        aria-controls={`category-${category.name}`}
      >
        <div className="flex items-center gap-2.5">
          <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-full">
            <FolderOpen className="text-primary h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-foreground font-semibold">{category.name}</h3>
            <p className="text-muted-foreground text-sm">
              {total} {total === 1 ? 'certification' : 'certifications'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Status Summary */}
          <div className="hidden items-center gap-1.5 sm:flex">
            {category.stats.current > 0 && (
              <Badge
                variant="secondary"
                className="gap-1 bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
              >
                <CheckCircle className="h-3 w-3" />
                {category.stats.current}
              </Badge>
            )}
            {category.stats.expiring > 0 && (
              <Badge
                variant="secondary"
                className="gap-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
              >
                <Clock className="h-3 w-3" />
                {category.stats.expiring}
              </Badge>
            )}
            {category.stats.expired > 0 && (
              <Badge variant="destructive" className="gap-1">
                <AlertCircle className="h-3 w-3" />
                {category.stats.expired}
              </Badge>
            )}
          </div>

          {/* Compliance Badge */}
          <Badge variant={compliance.variant} className={compliance.className}>
            {compliance.label}
          </Badge>

          {/* Chevron */}
          <ChevronDown
            className={`text-muted-foreground h-5 w-5 transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`}
            aria-hidden="true"
          />
        </div>
      </button>

      {/* Accordion Content */}
      {isOpen && (
        <div id={`category-${category.name}`} className="bg-muted/20 border-t px-3 py-2.5">
          <div className="space-y-1.5 xl:grid xl:grid-cols-2 xl:gap-1.5 xl:space-y-0 2xl:grid-cols-3">
            {category.certifications.map((cert) => (
              <div
                key={cert.id}
                className="bg-background flex items-center justify-between rounded-lg border p-2.5 transition-all hover:shadow-sm"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-foreground font-medium">
                      {cert.pilot?.first_name} {cert.pilot?.last_name}
                    </p>
                    <Badge variant="secondary" className="text-xs">
                      {cert.pilot?.employee_id}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground mt-0.5 text-sm">
                    {cert.check_type?.check_code} - {cert.check_type?.check_description}
                  </p>
                </div>

                <div className="flex items-center gap-2.5">
                  {/* Expiry Date */}
                  <div className="text-right">
                    <p className="text-foreground text-sm">
                      {cert.expiry_date
                        ? format(new Date(cert.expiry_date), 'MMM d, yyyy')
                        : 'No date'}
                    </p>
                    {cert.status?.daysUntilExpiry !== undefined && (
                      <p
                        className={`text-xs ${
                          cert.status.color === 'red'
                            ? 'text-red-600 dark:text-red-500'
                            : cert.status.color === 'yellow'
                              ? 'text-yellow-600 dark:text-yellow-500'
                              : 'text-green-600 dark:text-green-500'
                        }`}
                      >
                        {cert.status.daysUntilExpiry < 0
                          ? `${Math.abs(cert.status.daysUntilExpiry)}d ago`
                          : `${cert.status.daysUntilExpiry}d`}
                      </p>
                    )}
                  </div>

                  {/* Status Badge */}
                  <Badge
                    variant={
                      cert.status?.color === 'red'
                        ? 'destructive'
                        : cert.status?.color === 'yellow'
                          ? 'default'
                          : 'secondary'
                    }
                    className={
                      cert.status?.color === 'yellow'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                        : cert.status?.color === 'green'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : ''
                    }
                  >
                    {cert.status?.label || 'No Date'}
                  </Badge>

                  {/* Edit Button */}
                  {onEditCertification && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        onEditCertification(cert.id)
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  )
}

export function CategoryView({ certifications, onEditCertification }: CategoryViewProps) {
  const categories = groupByCategory(certifications)

  if (categories.length === 0) {
    return (
      <Card className="p-6 text-center">
        <FolderOpen className="text-muted-foreground mx-auto h-10 w-10" aria-hidden="true" />
        <h3 className="text-foreground mt-3 text-lg font-semibold">No Categories Found</h3>
        <p className="text-muted-foreground mt-2">
          Certifications will be organized by category once added.
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-2.5">
      {categories.map((category) => (
        <CategoryAccordion
          key={category.name}
          category={category}
          onEditCertification={onEditCertification}
        />
      ))}
    </div>
  )
}
