import { Badge } from '@/components/ui/badge'
import type {
  DisciplinarySeverity,
  DisciplinaryStatus,
} from '@/lib/validations/disciplinary-schema'

type SeverityVariant = 'secondary' | 'info' | 'warning' | 'destructive'
type StatusVariant = 'info' | 'warning' | 'success' | 'secondary'

// Severity scale ordered low → critical, mapped to existing Badge variants so visual
// urgency increases with severity (gray → blue → amber → red).
const SEVERITY_VARIANT: Record<DisciplinarySeverity, SeverityVariant> = {
  low: 'secondary',
  medium: 'info',
  high: 'warning',
  critical: 'destructive',
}

const STATUS_VARIANT: Record<DisciplinaryStatus, StatusVariant> = {
  open: 'info',
  under_review: 'warning',
  resolved: 'success',
  closed: 'secondary',
}

const formatLabel = (value: string) =>
  value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

export function SeverityBadge({ value }: { value: string }) {
  const variant = SEVERITY_VARIANT[value as DisciplinarySeverity] ?? 'secondary'
  return <Badge variant={variant}>{formatLabel(value)}</Badge>
}

export function StatusBadge({ value }: { value: string }) {
  const variant = STATUS_VARIANT[value as DisciplinaryStatus] ?? 'secondary'
  return <Badge variant={variant}>{formatLabel(value)}</Badge>
}
