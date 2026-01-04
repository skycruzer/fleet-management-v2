/**
 * Change Comparison View Component
 * Displays field-by-field before/after comparison for audit log entries
 * Color-coded visualization with accessibility support
 *
 * @version 1.0.0
 * @since 2025-10-25
 */

'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, Plus, Minus, Edit3, Circle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { FieldChange, UnchangedField } from '@/lib/services/audit-service'

interface ChangeComparisonViewProps {
  changedFields: FieldChange[]
  unchangedFields?: UnchangedField[]
  showUnchanged?: boolean
  highlightChanges?: boolean
  compactMode?: boolean
}

/**
 * Change Comparison View Component
 * Displays audit log changes in a clear, color-coded format
 */
export function ChangeComparisonView({
  changedFields,
  unchangedFields = [],
  showUnchanged = false,
  highlightChanges = true,
  compactMode = false,
}: ChangeComparisonViewProps) {
  if (!changedFields || changedFields.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Field Changes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">No changes recorded</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">
          Field Changes
          <Badge variant="secondary" className="ml-2">
            {changedFields.length} {changedFields.length === 1 ? 'field' : 'fields'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Changed Fields */}
        <div className="space-y-2">
          {changedFields.map((change, index) => (
            <ChangeFieldRow
              key={`change-${index}`}
              change={change}
              compactMode={compactMode}
              highlightChanges={highlightChanges}
            />
          ))}
        </div>

        {/* Unchanged Fields (Optional) */}
        {showUnchanged && unchangedFields.length > 0 && (
          <>
            <div className="border-t pt-3">
              <div className="mb-2 flex items-center gap-2">
                <h4 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                  Unchanged Fields
                </h4>
                <Badge variant="outline" className="text-xs">
                  {unchangedFields.length}
                </Badge>
              </div>
              <div className="space-y-2">
                {unchangedFields.map((field, index) => (
                  <UnchangedFieldRow
                    key={`unchanged-${index}`}
                    field={field}
                    compactMode={compactMode}
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Individual changed field row component
 */
function ChangeFieldRow({
  change,
  compactMode,
  highlightChanges,
}: {
  change: FieldChange
  compactMode: boolean
  highlightChanges: boolean
}) {
  // Configuration for different change types
  const changeConfig = {
    added: {
      icon: Plus,
      iconColor: 'text-green-600',
      bgColor: highlightChanges ? 'bg-green-50 border-green-200' : '',
      label: 'Added',
      badgeVariant: 'default' as const,
      badgeClassName: 'bg-green-100 text-green-800 border-green-300',
    },
    removed: {
      icon: Minus,
      iconColor: 'text-red-600',
      bgColor: highlightChanges ? 'bg-red-50 border-red-200' : '',
      label: 'Removed',
      badgeVariant: 'destructive' as const,
      badgeClassName: 'bg-red-100 text-red-800 border-red-300',
    },
    modified: {
      icon: Edit3,
      iconColor: 'text-yellow-600',
      bgColor: highlightChanges ? 'bg-yellow-50 border-yellow-200' : '',
      label: 'Modified',
      badgeVariant: 'secondary' as const,
      badgeClassName: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    },
  }

  const config = changeConfig[change.changeType]
  const Icon = config.icon

  // Format field name (convert snake_case to Title Case)
  const formattedFieldName = change.field
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

  return (
    <div
      className={cn('rounded-lg border p-3 transition-colors', config.bgColor)}
      role="article"
      aria-label={`${config.label} field: ${formattedFieldName}. Before: ${change.displayOldValue}, After: ${change.displayNewValue}`}
    >
      {/* Field Name and Change Type */}
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={cn('h-4 w-4', config.iconColor)} aria-hidden="true" />
          <span className="text-sm font-medium">{formattedFieldName}</span>
        </div>
        <Badge className={cn('border', config.badgeClassName)}>{config.label}</Badge>
      </div>

      {/* Before/After Comparison */}
      {compactMode ? (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground max-w-[40%] truncate">
            {change.displayOldValue}
          </span>
          <ArrowRight className="h-3 w-3 flex-shrink-0" aria-label="changed to" />
          <span className="max-w-[40%] truncate font-medium">{change.displayNewValue}</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 items-center gap-2 md:grid-cols-[1fr_auto_1fr]">
          {/* Before Value */}
          <div className="space-y-1">
            <div className="text-muted-foreground text-xs tracking-wide uppercase">Before</div>
            <div className="bg-background/50 rounded border p-2 font-mono text-sm">
              {change.displayOldValue}
            </div>
          </div>

          {/* Arrow Separator */}
          <div className="flex justify-center">
            <ArrowRight className="text-muted-foreground h-5 w-5" aria-label="changed to" />
          </div>

          {/* After Value */}
          <div className="space-y-1">
            <div className="text-muted-foreground text-xs tracking-wide uppercase">After</div>
            <div className="bg-background/50 rounded border p-2 font-mono text-sm">
              {change.displayNewValue}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Individual unchanged field row component
 */
function UnchangedFieldRow({
  field,
  compactMode,
}: {
  field: UnchangedField
  compactMode: boolean
}) {
  // Format field name (convert snake_case to Title Case)
  const formattedFieldName = field.field
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

  return (
    <div
      className="bg-muted/30 rounded-lg border p-2 text-sm"
      role="article"
      aria-label={`Unchanged field: ${formattedFieldName}. Value: ${field.displayValue}`}
    >
      <div className="flex items-center gap-2">
        <Circle className="text-muted-foreground h-3 w-3" aria-hidden="true" />
        <span className="text-muted-foreground">{formattedFieldName}:</span>
        <span className={cn('font-mono', compactMode ? 'max-w-[60%] truncate' : '')}>
          {field.displayValue}
        </span>
      </div>
    </div>
  )
}
