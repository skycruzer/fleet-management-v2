/**
 * Succession Pipeline Table Component
 * Displays captain promotion candidates with readiness levels
 *
 * Features:
 * - Server Component (renders data server-side)
 * - Color-coded readiness badges
 * - Sortable by seniority, years of service
 * - Qualification gap indicators
 * - Recommended actions display
 * - Role-based visibility (Admin/Manager only for sensitive data)
 *
 * @version 1.0.0
 * @since 2025-10-25
 */

import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card } from '@/components/ui/card'
import { Users, TrendingUp, AlertCircle } from 'lucide-react'
import { SuccessionCandidate } from '@/lib/services/succession-planning-service'

interface SuccessionPipelineTableProps {
  candidates: SuccessionCandidate[]
  showSensitiveData: boolean // Admin/Manager only
}

/**
 * Get badge color based on readiness level
 */
function getReadinessBadgeVariant(
  readiness: SuccessionCandidate['promotionReadiness']
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (readiness) {
    case 'Ready':
      return 'default' // Green
    case 'Potential':
      return 'secondary' // Blue
    case 'Developing':
      return 'outline' // Gray
    default:
      return 'destructive' // Red
  }
}

/**
 * Get badge color CSS classes for readiness
 */
function getReadinessBadgeClasses(readiness: SuccessionCandidate['promotionReadiness']): string {
  switch (readiness) {
    case 'Ready':
      return 'bg-[var(--color-status-low-bg)] text-[var(--color-status-low)] border-[var(--color-status-low-border)]'
    case 'Potential':
      return 'bg-[var(--color-info-bg)] text-[var(--color-info)] border-[var(--color-info-border)]'
    case 'Developing':
      return 'bg-muted text-muted-foreground border-border'
    default:
      return 'bg-[var(--color-status-high-bg)] text-[var(--color-status-high)] border-[var(--color-status-high-border)]'
  }
}

/**
 * Server Component for displaying succession pipeline candidates
 * Renders captain promotion candidates in a table format
 */
export function SuccessionPipelineTable({
  candidates,
  showSensitiveData,
}: SuccessionPipelineTableProps) {
  // Sort by readiness (Ready > Potential > Developing), then by seniority
  const sortedCandidates = [...candidates].sort((a, b) => {
    const readinessOrder = { Ready: 1, Potential: 2, Developing: 3, 'Not Eligible': 4 }
    const readinessDiff =
      readinessOrder[a.promotionReadiness] - readinessOrder[b.promotionReadiness]

    if (readinessDiff !== 0) return readinessDiff

    return a.seniorityNumber - b.seniorityNumber
  })

  if (candidates.length === 0) {
    return (
      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-[var(--color-info)]" />
            <h3 className="text-foreground text-lg font-semibold">Succession Pipeline</h3>
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center dark:border-gray-700 dark:bg-gray-800">
          <AlertCircle className="mx-auto mb-2 h-12 w-12 text-gray-400 dark:text-gray-500" />
          <p className="text-sm text-gray-600 dark:text-gray-300">No promotion candidates found</p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            First Officers will appear here when they meet promotion criteria
          </p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Users className="h-5 w-5 text-[var(--color-info)]" />
          <h3 className="text-foreground text-lg font-semibold">
            Succession Pipeline ({candidates.length})
          </h3>
        </div>
        <Badge variant="outline" className="text-xs">
          {showSensitiveData ? 'Admin/Manager View' : 'Limited View'}
        </Badge>
      </div>

      {/* Summary Stats */}
      <div className="mb-4 grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-[var(--color-status-low-border)] bg-[var(--color-status-low-bg)] p-3">
          <p className="text-xs font-medium text-[var(--color-status-low)]">Ready</p>
          <p className="text-foreground text-2xl font-bold">
            {candidates.filter((c) => c.promotionReadiness === 'Ready').length}
          </p>
        </div>

        <div className="rounded-lg border border-[var(--color-info-border)] bg-[var(--color-info-bg)] p-3">
          <p className="text-xs font-medium text-[var(--color-info)]">Potential</p>
          <p className="text-foreground text-2xl font-bold">
            {candidates.filter((c) => c.promotionReadiness === 'Potential').length}
          </p>
        </div>

        <div className="border-border bg-muted rounded-lg border p-3">
          <p className="text-muted-foreground text-xs font-medium">Developing</p>
          <p className="text-foreground text-2xl font-bold">
            {candidates.filter((c) => c.promotionReadiness === 'Developing').length}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="border-border overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">Rank</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="text-center">Years Service</TableHead>
              <TableHead className="text-center">Age</TableHead>
              <TableHead className="text-center">Readiness</TableHead>
              <TableHead>Qualification Gaps</TableHead>
              {showSensitiveData && <TableHead>Recommended Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedCandidates.map((candidate) => (
              <TableRow key={candidate.id}>
                {/* Seniority Number */}
                <TableCell className="text-muted-foreground font-mono text-xs">
                  #{candidate.seniorityNumber}
                </TableCell>

                {/* Full Name */}
                <TableCell className="font-medium">{candidate.fullName}</TableCell>

                {/* Years of Service */}
                <TableCell className="text-center">
                  <Badge variant="outline" className="font-mono">
                    {candidate.yearsOfService}
                  </Badge>
                </TableCell>

                {/* Age */}
                <TableCell className="text-center">
                  <Badge variant="outline" className="font-mono">
                    {candidate.age}
                  </Badge>
                </TableCell>

                {/* Promotion Readiness */}
                <TableCell className="text-center">
                  <Badge className={getReadinessBadgeClasses(candidate.promotionReadiness)}>
                    {candidate.promotionReadiness}
                  </Badge>
                </TableCell>

                {/* Qualification Gaps */}
                <TableCell>
                  {candidate.qualificationGaps.length === 0 ? (
                    <span className="text-xs font-medium text-[var(--color-status-low)]">
                      ✓ All requirements met
                    </span>
                  ) : (
                    <ul className="space-y-1">
                      {candidate.qualificationGaps.map((gap, index) => (
                        <li key={index} className="text-muted-foreground flex items-start text-xs">
                          <AlertCircle className="mt-0.5 mr-1 h-3 w-3 flex-shrink-0 text-[var(--color-status-medium)]" />
                          {gap}
                        </li>
                      ))}
                    </ul>
                  )}
                </TableCell>

                {/* Recommended Actions (Admin/Manager only) */}
                {showSensitiveData && (
                  <TableCell>
                    {candidate.recommendedActions.length === 0 ? (
                      <span className="text-muted-foreground text-xs italic">None</span>
                    ) : (
                      <ul className="space-y-1">
                        {candidate.recommendedActions.map((action, index) => (
                          <li
                            key={index}
                            className="text-muted-foreground flex items-start text-xs"
                          >
                            <TrendingUp className="mt-0.5 mr-1 h-3 w-3 flex-shrink-0 text-[var(--color-info)]" />
                            {action}
                          </li>
                        ))}
                      </ul>
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Footer Note */}
      {!showSensitiveData && (
        <div className="mt-4 rounded-lg border border-[var(--color-info-border)] bg-[var(--color-info-bg)] p-3">
          <p className="text-xs text-[var(--color-info)]">
            <span className="font-semibold">Note:</span> Full succession planning details are only
            visible to Admin and Manager roles.
          </p>
        </div>
      )}
    </Card>
  )
}
