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
      return 'bg-green-100 text-green-800 border-green-300'
    case 'Potential':
      return 'bg-blue-100 text-blue-800 border-blue-300'
    case 'Developing':
      return 'bg-gray-100 text-gray-800 border-gray-300'
    default:
      return 'bg-red-100 text-red-800 border-red-300'
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
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-foreground">Succession Pipeline</h3>
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600">No promotion candidates found</p>
          <p className="text-xs text-gray-500 mt-1">
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
          <Users className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-foreground">
            Succession Pipeline ({candidates.length})
          </h3>
        </div>
        <Badge variant="outline" className="text-xs">
          {showSensitiveData ? 'Admin/Manager View' : 'Limited View'}
        </Badge>
      </div>

      {/* Summary Stats */}
      <div className="mb-4 grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-green-200 bg-green-50 p-3">
          <p className="text-xs font-medium text-green-700">Ready</p>
          <p className="text-2xl font-bold text-green-900">
            {candidates.filter((c) => c.promotionReadiness === 'Ready').length}
          </p>
        </div>

        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
          <p className="text-xs font-medium text-blue-700">Potential</p>
          <p className="text-2xl font-bold text-blue-900">
            {candidates.filter((c) => c.promotionReadiness === 'Potential').length}
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
          <p className="text-xs font-medium text-gray-700">Developing</p>
          <p className="text-2xl font-bold text-gray-900">
            {candidates.filter((c) => c.promotionReadiness === 'Developing').length}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-md border border-border">
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
                <TableCell className="font-mono text-xs text-muted-foreground">
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
                    <span className="text-xs text-green-600 font-medium">
                      ✓ All requirements met
                    </span>
                  ) : (
                    <ul className="space-y-1">
                      {candidate.qualificationGaps.map((gap, index) => (
                        <li key={index} className="text-xs text-muted-foreground flex items-start">
                          <AlertCircle className="h-3 w-3 text-orange-500 mr-1 mt-0.5 flex-shrink-0" />
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
                      <span className="text-xs text-muted-foreground italic">None</span>
                    ) : (
                      <ul className="space-y-1">
                        {candidate.recommendedActions.map((action, index) => (
                          <li key={index} className="text-xs text-muted-foreground flex items-start">
                            <TrendingUp className="h-3 w-3 text-blue-500 mr-1 mt-0.5 flex-shrink-0" />
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
        <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3">
          <p className="text-xs text-blue-800">
            <span className="font-semibold">Note:</span> Full succession planning details are only
            visible to Admin and Manager roles.
          </p>
        </div>
      )}
    </Card>
  )
}
