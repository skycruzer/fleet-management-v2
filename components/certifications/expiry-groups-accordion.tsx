/**
 * Expiry Groups Accordion
 * Client component that displays certifications grouped by expiry timeframes
 * Uses accordion UI for collapsible groups
 */

'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { AlertCircle, AlertTriangle, Clock, Info, ChevronDown } from 'lucide-react'
import { ExpiryGroup, formatDaysUntilExpiry } from '@/lib/utils/certification-expiry-groups'
import { useState } from 'react'

interface ExpiryGroupsAccordionProps {
  groups: Record<string, ExpiryGroup>
}

/**
 * Icon mapping for expiry groups
 */
const IconMap = {
  AlertCircle,
  AlertTriangle,
  Clock,
  Info,
}

/**
 * Color class mapping for different urgency levels
 */
const colorClasses = {
  red: {
    border: 'border-red-200 dark:border-red-700',
    bg: 'bg-red-50 dark:bg-red-950',
    text: 'text-red-900 dark:text-red-100',
    badgeBg: 'bg-red-600',
    badgeText: 'text-white',
    icon: 'text-red-600 dark:text-red-400',
  },
  orange: {
    border: 'border-orange-200 dark:border-orange-700',
    bg: 'bg-orange-50 dark:bg-orange-950',
    text: 'text-orange-900 dark:text-orange-100',
    badgeBg: 'bg-orange-600',
    badgeText: 'text-white',
    icon: 'text-orange-600 dark:text-orange-400',
  },
  yellow: {
    border: 'border-yellow-200 dark:border-yellow-700',
    bg: 'bg-yellow-50 dark:bg-yellow-950',
    text: 'text-yellow-900 dark:text-yellow-100',
    badgeBg: 'bg-yellow-600',
    badgeText: 'text-white',
    icon: 'text-yellow-600 dark:text-yellow-400',
  },
}

/**
 * Individual accordion item for a single expiry group
 */
function ExpiryGroupAccordion({ group }: { group: ExpiryGroup }) {
  const [isOpen, setIsOpen] = useState(false)
  const colors = colorClasses[group.color]
  const IconComponent = IconMap[group.icon as keyof typeof IconMap] || AlertCircle

  if (group.certifications.length === 0) {
    return null // Don't render empty groups
  }

  return (
    <Card className={`${colors.border} ${colors.bg} overflow-hidden`}>
      {/* Accordion Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-6 text-left transition-all hover:bg-black/5"
        aria-expanded={isOpen}
        aria-controls={`group-${group.id}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <IconComponent className={`h-6 w-6 ${colors.icon}`} aria-hidden="true" />
            <div>
              <h3 className={`text-lg font-semibold ${colors.text}`}>{group.label}</h3>
              <p className="text-muted-foreground text-sm">{group.description}</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Badge className={`${colors.badgeBg} ${colors.badgeText}`}>
              {group.certifications.length}{' '}
              {group.certifications.length === 1 ? 'Certification' : 'Certifications'}
            </Badge>
            <ChevronDown
              className={`h-5 w-5 transition-transform ${isOpen ? 'rotate-180' : ''} ${colors.icon}`}
              aria-hidden="true"
            />
          </div>
        </div>
      </button>

      {/* Accordion Content - Grouped by Category */}
      {isOpen && (
        <div id={`group-${group.id}`} className="border-t px-6 py-4">
          {group.byCategory && Object.keys(group.byCategory).length > 0 ? (
            // Group by category
            <div className="space-y-6">
              {Object.entries(group.byCategory).map(([category, certs]) => (
                <div key={category}>
                  {/* Category Header */}
                  <div className="mb-3 flex items-center space-x-2">
                    <div className="bg-primary/10 text-primary rounded px-2 py-1">
                      <span className="text-xs font-semibold tracking-wide uppercase">
                        {category}
                      </span>
                    </div>
                    <span className="text-muted-foreground text-xs">
                      ({certs.length} {certs.length === 1 ? 'certification' : 'certifications'})
                    </span>
                  </div>

                  {/* Certifications in this category */}
                  <div className="space-y-3">
                    {certs.map((cert) => (
                      <Link
                        key={cert.id}
                        href={`/dashboard/certifications/${cert.id}/edit`}
                        className="border-border hover:border-primary/50 block rounded-lg border bg-white p-4 transition-all hover:shadow-md dark:bg-gray-800"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            {/* Pilot Name */}
                            <h4 className="text-foreground font-semibold">
                              {cert.pilot
                                ? `${cert.pilot.first_name} ${cert.pilot.last_name}`
                                : 'Unknown Pilot'}
                            </h4>

                            {/* Check Type */}
                            <p className="text-muted-foreground mt-1 text-sm">
                              {cert.check_type?.check_description || 'Unknown Check Type'}
                            </p>

                            {/* Employee ID and Role */}
                            {cert.pilot && (
                              <p className="text-muted-foreground mt-1 text-xs">
                                {cert.pilot.employee_id} • {cert.pilot.role}
                              </p>
                            )}
                          </div>

                          <div className="ml-4 text-right">
                            {/* Expiry Date */}
                            {cert.expiry_date && (
                              <p className="text-foreground text-sm font-medium">
                                {new Date(cert.expiry_date).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}
                              </p>
                            )}

                            {/* Days Until Expiry */}
                            {cert.status?.daysUntilExpiry !== undefined && (
                              <p className={`mt-1 text-xs ${colors.text}`}>
                                {formatDaysUntilExpiry(cert.status.daysUntilExpiry)}
                              </p>
                            )}

                            {/* Status Badge */}
                            {cert.status && (
                              <Badge
                                className={`mt-2 ${
                                  cert.status.color === 'red'
                                    ? 'bg-red-600 text-white'
                                    : cert.status.color === 'yellow'
                                      ? 'bg-yellow-600 text-white'
                                      : 'bg-gray-600 text-white'
                                }`}
                              >
                                {cert.status.label}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center text-sm">
              No certifications in this group
            </p>
          )}
        </div>
      )}
    </Card>
  )
}

/**
 * Main accordion component that renders all expiry groups
 */
export function ExpiryGroupsAccordion({ groups }: ExpiryGroupsAccordionProps) {
  // Render groups in priority order
  const groupOrder = ['expired', 'within14Days', 'within30Days', 'within60Days', 'within90Days']

  return (
    <div className="space-y-4">
      {groupOrder.map((groupId) => {
        const group = groups[groupId]
        if (!group) return null
        return <ExpiryGroupAccordion key={groupId} group={group} />
      })}
    </div>
  )
}
