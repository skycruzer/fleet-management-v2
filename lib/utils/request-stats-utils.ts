/**
 * Request Statistics Utilities
 *
 * Helper functions for calculating and analyzing request statistics.
 *
 * @author Maurice Rondeau
 * @date December 2025
 */

import type { PilotRequest, WorkflowStatus } from '@/lib/services/unified-request-service'

/**
 * Request statistics structure
 */
export interface RequestStats {
  total: number
  pending: number
  approved: number
  denied: number
  withdrawn: number
  late: number
  pastDeadline: number
  critical: number
  warning: number
  clean: number
  byCategory: {
    leave: number
    flight: number
    leaveBid: number
  }
  byStatus: Record<WorkflowStatus, number>
}

/**
 * Calculate comprehensive request statistics
 */
export function calculateRequestStats(requests: PilotRequest[]): RequestStats {
  const stats: RequestStats = {
    total: requests.length,
    pending: 0,
    approved: 0,
    denied: 0,
    withdrawn: 0,
    late: 0,
    pastDeadline: 0,
    critical: 0,
    warning: 0,
    clean: 0,
    byCategory: {
      leave: 0,
      flight: 0,
      leaveBid: 0,
    },
    byStatus: {
      DRAFT: 0,
      SUBMITTED: 0,
      IN_REVIEW: 0,
      APPROVED: 0,
      DENIED: 0,
      WITHDRAWN: 0,
    },
  }

  for (const request of requests) {
    // Count by status
    stats.byStatus[request.workflow_status]++

    // Aggregate status groups
    if (request.workflow_status === 'SUBMITTED' || request.workflow_status === 'IN_REVIEW') {
      stats.pending++
    } else if (request.workflow_status === 'APPROVED') {
      stats.approved++
    } else if (request.workflow_status === 'DENIED') {
      stats.denied++
    } else if (request.workflow_status === 'WITHDRAWN') {
      stats.withdrawn++
    }

    // Count late and past deadline
    if (request.is_late_request) {
      stats.late++
    }
    if (request.is_past_deadline) {
      stats.pastDeadline++
    }

    // Count by category
    switch (request.request_category) {
      case 'LEAVE':
        stats.byCategory.leave++
        break
      case 'FLIGHT':
        stats.byCategory.flight++
        break
      case 'LEAVE_BID':
        stats.byCategory.leaveBid++
        break
    }

    // Count critical, warning, and clean for pending requests
    // Critical = crew conflicts (below minimum, scheduling conflicts)
    // Warning = late submission or past deadline (time-based concerns)
    // Clean = no issues
    if (request.workflow_status === 'SUBMITTED' || request.workflow_status === 'IN_REVIEW') {
      const hasCriticalIssue = request.conflict_flags && request.conflict_flags.length > 0
      const hasWarningIssue = request.is_late_request || request.is_past_deadline

      if (hasCriticalIssue) {
        stats.critical++
      } else if (hasWarningIssue) {
        stats.warning++
      } else {
        stats.clean++
      }
    }
  }

  return stats
}

/**
 * Check if a request is critical (needs immediate attention)
 */
export function isCriticalRequest(request: PilotRequest): boolean {
  // Critical if: pending and has crew/scheduling conflicts
  return (
    (request.workflow_status === 'SUBMITTED' || request.workflow_status === 'IN_REVIEW') &&
    request.conflict_flags &&
    request.conflict_flags.length > 0
  )
}

/**
 * Check if a request has warning flags
 */
export function hasWarningFlags(request: PilotRequest): boolean {
  return (
    request.is_late_request ||
    request.is_past_deadline ||
    (request.conflict_flags && request.conflict_flags.length > 0)
  )
}

/**
 * Get priority color for a request based on its status and flags
 */
export function getRequestPriorityColor(
  request: PilotRequest
): 'red' | 'yellow' | 'green' | 'gray' {
  if (isCriticalRequest(request)) {
    return 'red'
  }
  if (hasWarningFlags(request)) {
    return 'yellow'
  }
  if (request.workflow_status === 'APPROVED') {
    return 'green'
  }
  return 'gray'
}

/**
 * Sort requests by priority (critical first)
 */
export function sortByPriority(requests: PilotRequest[]): PilotRequest[] {
  return [...requests].sort((a, b) => {
    // Critical first
    const aCritical = isCriticalRequest(a)
    const bCritical = isCriticalRequest(b)
    if (aCritical && !bCritical) return -1
    if (!aCritical && bCritical) return 1

    // Then by warning flags
    const aWarning = hasWarningFlags(a)
    const bWarning = hasWarningFlags(b)
    if (aWarning && !bWarning) return -1
    if (!aWarning && bWarning) return 1

    // Then by submission date (newest first)
    return new Date(b.submission_date).getTime() - new Date(a.submission_date).getTime()
  })
}
