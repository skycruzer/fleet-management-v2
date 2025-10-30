# Implementation Plan #1: Enhanced Audit Log System

**Priority**: Foundation (Low Risk)
**Estimated Timeline**: 1-2 weeks
**Dependencies**: None
**Status**: Planning Phase

---

## Overview

Enhance the existing audit log system to provide detailed change tracking, approval workflow visibility, and before/after value comparison for leave requests and other critical operations.

### Current State

**Existing Infrastructure** (✅ Already Built):
- `audit_logs` table with `old_values` and `new_values` JSONB columns
- `audit-service.ts` (937 lines) with comprehensive query functions
- `AuditLogTimeline.tsx` component for timeline visualization
- Database triggers on: leave_requests, pilot_checks, flight_requests, tasks, disciplinary_actions

**What's Missing** (🔴 Needs Implementation):
- Field-by-field change comparison UI
- Approval workflow visualization
- Leave request approval reasons display
- Status transition timeline
- Audit trail export capabilities

---

## Objectives

### Primary Goals
1. ✅ Display field-by-field changes in leave requests
2. ✅ Show approval/denial workflow with reasons
3. ✅ Visualize status transitions over time
4. ✅ Add audit trail export (CSV)
5. ✅ Improve change comparison UI (before/after)

### Success Metrics
- Users can see exactly what changed in each edit
- Approval reasons are clearly visible
- Audit trail can be exported for compliance
- Page load time < 500ms for 100 audit log entries

---

## Technical Design

### Architecture

```
┌─────────────────────────────────────────────────────┐
│  Leave Request Details Page                        │
│  (Server Component)                                 │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │  Audit Trail Tab                            │   │
│  │  (Client Component)                         │   │
│  │                                             │   │
│  │  ├── AuditLogTimeline (existing)           │   │
│  │  ├── ChangeComparisonView (NEW)            │   │
│  │  ├── ApprovalWorkflowCard (NEW)            │   │
│  │  └── ExportAuditButton (NEW)               │   │
│  └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
         ↓
    audit-service.ts
         ↓
    Supabase audit_logs table
```

### Database Schema (No Changes Required)

Existing `audit_logs` table structure is sufficient:

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY,
  table_name TEXT,
  operation TEXT CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE', 'BUSINESS_EVENT')),
  old_values JSONB,  -- ✅ Perfect for before state
  new_values JSONB,  -- ✅ Perfect for after state
  action TEXT,
  entity_type TEXT,
  entity_id UUID,
  description TEXT,
  metadata JSONB,
  user_id UUID REFERENCES an_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Recommended Index** (Performance Optimization):
```sql
CREATE INDEX idx_audit_logs_entity
ON audit_logs(entity_type, entity_id, created_at DESC);
```

### Service Layer Extensions

**File**: `/lib/services/audit-service.ts`

**New Functions to Add**:

```typescript
/**
 * Get detailed change analysis for a specific audit log entry
 * Compares old_values and new_values to identify changed fields
 */
export async function getAuditLogChanges(
  auditLogId: string
): Promise<{
  changedFields: Array<{
    field: string
    oldValue: any
    newValue: any
    changeType: 'added' | 'removed' | 'modified'
  }>
  unchangedFields: Array<{
    field: string
    value: any
  }>
}> {
  // Implementation using JSONB comparison
}

/**
 * Get approval workflow history for a leave request
 * Shows all status transitions and approval reasons
 */
export async function getLeaveRequestApprovalHistory(
  leaveRequestId: string
): Promise<{
  timeline: Array<{
    timestamp: Date
    action: 'submitted' | 'approved' | 'denied' | 'cancelled'
    performedBy: { id: string; name: string; role: string }
    reason?: string
    oldStatus?: string
    newStatus?: string
  }>
}> {
  // Implementation using audit_logs + leave_requests join
}

/**
 * Export audit trail to CSV format
 */
export async function exportAuditTrailCSV(
  filters: {
    entityType?: string
    entityId?: string
    startDate?: Date
    endDate?: Date
  }
): Promise<string> {
  // Implementation returning CSV string
}
```

---

## Component Design

### 1. ChangeComparisonView Component

**File**: `/components/audit/ChangeComparisonView.tsx`

**Purpose**: Display field-by-field before/after comparison

```typescript
'use client'

interface ChangeComparisonViewProps {
  oldValues: Record<string, any>
  newValues: Record<string, any>
  highlightChanges?: boolean
}

export function ChangeComparisonView({
  oldValues,
  newValues,
  highlightChanges = true
}: ChangeComparisonViewProps) {
  // Compare objects and display changes
  // Visual design: Two-column layout with arrows
  // Color coding: Green for additions, Red for deletions, Yellow for modifications
}
```

**UI Design**:
```
┌─────────────────────────────────────────────────┐
│ Field Changed              Before → After       │
├─────────────────────────────────────────────────┤
│ 🟡 Status                 PENDING → APPROVED    │
│ 🟡 Start Date             2025-11-01 → 2025-11-05│
│ 🟡 Approved By            null → Admin User     │
│ ⚪ Roster Period          RP01/2026 (unchanged) │
└─────────────────────────────────────────────────┘
```

### 2. ApprovalWorkflowCard Component

**File**: `/components/audit/ApprovalWorkflowCard.tsx`

**Purpose**: Visualize approval workflow and status transitions

```typescript
interface ApprovalWorkflowCardProps {
  leaveRequestId: string
}

export async function ApprovalWorkflowCard({
  leaveRequestId
}: ApprovalWorkflowCardProps) {
  const history = await getLeaveRequestApprovalHistory(leaveRequestId)

  return (
    <Card>
      <CardHeader>
        <h3>Approval Workflow</h3>
      </CardHeader>
      <CardContent>
        <ApprovalTimeline timeline={history.timeline} />
      </CardContent>
    </Card>
  )
}
```

**UI Design**:
```
┌─────────────────────────────────────────────────┐
│ Approval Workflow                               │
├─────────────────────────────────────────────────┤
│ ● Submitted          2025-10-15 09:30           │
│   By: John Doe (Captain)                        │
│                                                 │
│ ● Pending Review     2025-10-15 09:30 - 10-20  │
│   Awaiting approval from Fleet Management       │
│                                                 │
│ ● Approved           2025-10-20 14:45           │
│   By: Admin User (Fleet Manager)                │
│   Reason: "Sufficient crew coverage available" │
└─────────────────────────────────────────────────┘
```

### 3. ExportAuditButton Component

**File**: `/components/audit/ExportAuditButton.tsx`

**Purpose**: Export audit trail to CSV

```typescript
'use client'

interface ExportAuditButtonProps {
  entityType: string
  entityId: string
}

export function ExportAuditButton({
  entityType,
  entityId
}: ExportAuditButtonProps) {
  const handleExport = async () => {
    // Call export API
    // Download CSV file
  }

  return (
    <Button onClick={handleExport}>
      <Download className="mr-2 h-4 w-4" />
      Export Audit Trail
    </Button>
  )
}
```

---

## Implementation Steps

### Phase 1: Service Layer (Days 1-2)

1. **Add `getAuditLogChanges()` function**
   - Parse `old_values` and `new_values` JSONB
   - Identify changed vs unchanged fields
   - Categorize changes (added/removed/modified)
   - Add unit tests

2. **Add `getLeaveRequestApprovalHistory()` function**
   - Query audit_logs for leave request operations
   - Join with an_users for performer details
   - Extract approval reasons from metadata
   - Sort by created_at chronologically
   - Add unit tests

3. **Add `exportAuditTrailCSV()` function**
   - Fetch audit logs with filters
   - Format as CSV with proper escaping
   - Include all relevant fields
   - Add unit tests

### Phase 2: UI Components (Days 3-5)

1. **Build ChangeComparisonView component**
   - Two-column layout (Before/After)
   - Color-coded changes
   - Handle nested objects
   - Accessibility labels
   - Storybook story

2. **Build ApprovalWorkflowCard component**
   - Server Component for data fetching
   - Timeline visualization
   - Status badges
   - Reason display
   - Storybook story

3. **Build ExportAuditButton component**
   - Client Component with download logic
   - Loading states
   - Error handling
   - Accessibility
   - Storybook story

### Phase 3: Integration (Days 6-7)

1. **Add audit trail tab to Leave Request details page**
   - Create tab navigation
   - Integrate all 3 new components
   - Add loading skeletons
   - Error boundaries

2. **Create API route for export**
   - `/api/audit/export` endpoint
   - Validate permissions
   - Stream CSV response
   - Rate limiting

### Phase 4: Testing & Polish (Days 8-10)

1. **E2E Testing with Playwright**
   - Test change comparison display
   - Test approval workflow visualization
   - Test CSV export download
   - Test accessibility

2. **Performance Testing**
   - Measure audit log query performance
   - Add pagination if needed
   - Optimize JSONB queries
   - Add caching (5 minute TTL)

3. **Documentation**
   - Update README with audit features
   - Add developer guide for audit integration
   - Document CSV export format

---

## API Routes

### GET /api/audit/changes/[id]

**Purpose**: Get detailed change analysis for an audit log entry

**Request**:
```http
GET /api/audit/changes/a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

**Response**:
```json
{
  "success": true,
  "data": {
    "auditLogId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "changedFields": [
      {
        "field": "status",
        "oldValue": "PENDING",
        "newValue": "APPROVED",
        "changeType": "modified"
      },
      {
        "field": "approved_by",
        "oldValue": null,
        "newValue": "user-id-here",
        "changeType": "added"
      }
    ],
    "unchangedFields": [
      { "field": "roster_period_id", "value": "rp-id" }
    ]
  }
}
```

### GET /api/audit/approval-history/[leaveRequestId]

**Purpose**: Get approval workflow history for a leave request

**Response**:
```json
{
  "success": true,
  "data": {
    "timeline": [
      {
        "timestamp": "2025-10-15T09:30:00Z",
        "action": "submitted",
        "performedBy": {
          "id": "pilot-id",
          "name": "John Doe",
          "role": "Captain"
        }
      },
      {
        "timestamp": "2025-10-20T14:45:00Z",
        "action": "approved",
        "performedBy": {
          "id": "admin-id",
          "name": "Admin User",
          "role": "Admin"
        },
        "reason": "Sufficient crew coverage available",
        "oldStatus": "PENDING",
        "newStatus": "APPROVED"
      }
    ]
  }
}
```

### GET /api/audit/export

**Purpose**: Export audit trail to CSV

**Query Parameters**:
- `entityType` (required): 'leave_request' | 'pilot_check' | 'flight_request'
- `entityId` (optional): Specific entity UUID
- `startDate` (optional): ISO date string
- `endDate` (optional): ISO date string

**Response**:
```
Content-Type: text/csv
Content-Disposition: attachment; filename="audit-trail-2025-10-25.csv"

Timestamp,Operation,Entity Type,Entity ID,Changed By,Action,Description
2025-10-20T14:45:00Z,UPDATE,leave_request,abc-123,Admin User,approve_request,Leave request approved
```

---

## Testing Strategy

### Unit Tests (Jest)

**File**: `__tests__/services/audit-service.test.ts`

```typescript
describe('audit-service', () => {
  describe('getAuditLogChanges', () => {
    it('should identify modified fields', async () => {
      // Test JSONB comparison logic
    })

    it('should handle null values', async () => {
      // Test null handling
    })

    it('should identify nested object changes', async () => {
      // Test nested JSONB
    })
  })

  describe('getLeaveRequestApprovalHistory', () => {
    it('should return timeline in chronological order', async () => {
      // Test sorting
    })

    it('should include approval reasons', async () => {
      // Test metadata extraction
    })
  })
})
```

### E2E Tests (Playwright)

**File**: `e2e/audit-trail.spec.ts`

```typescript
test.describe('Audit Trail', () => {
  test('should display change comparison', async ({ page }) => {
    await page.goto('/dashboard/leave/request-id')
    await page.click('text=Audit Trail')

    await expect(page.locator('text=Status')).toBeVisible()
    await expect(page.locator('text=PENDING → APPROVED')).toBeVisible()
  })

  test('should export audit trail to CSV', async ({ page }) => {
    await page.goto('/dashboard/leave/request-id')

    const downloadPromise = page.waitForEvent('download')
    await page.click('button:has-text("Export Audit Trail")')
    const download = await downloadPromise

    expect(download.suggestedFilename()).toContain('.csv')
  })
})
```

---

## Performance Considerations

### Database Optimization

1. **Add Index for Audit Queries**:
```sql
CREATE INDEX idx_audit_logs_entity
ON audit_logs(entity_type, entity_id, created_at DESC);
```

2. **Cache Audit Logs** (5 minute TTL):
```typescript
const cacheKey = `audit:${entityType}:${entityId}`
const cached = await getCachedData(cacheKey)
if (cached) return cached

const data = await fetchAuditLogs()
await setCachedData(cacheKey, data, 300) // 5 minutes
```

### Pagination

For long audit histories (>100 entries):
```typescript
interface AuditLogPaginationParams {
  page: number
  limit: number  // Default: 20
}
```

---

## Security Considerations

### Row-Level Security (RLS)

**Audit logs are sensitive** - ensure proper RLS:

```sql
-- Only Admins and Managers can view audit logs
CREATE POLICY audit_logs_view_policy ON audit_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM an_users
    WHERE id = auth.uid()
    AND role IN ('Admin', 'Manager')
  )
);
```

### API Route Protection

```typescript
// Verify user has permission to view audit logs
const { data: { user } } = await supabase.auth.getUser()
if (!user || !['Admin', 'Manager'].includes(user.role)) {
  return NextResponse.json(
    { success: false, error: 'Unauthorized' },
    { status: 403 }
  )
}
```

---

## Accessibility Requirements

### WCAG 2.1 AA Compliance

1. **Color Contrast**: All status indicators must have 4.5:1 contrast ratio
2. **Keyboard Navigation**: Tab through timeline entries
3. **Screen Reader Support**: ARIA labels for all changes
4. **Focus Indicators**: Visible focus states

### ARIA Labels Example

```tsx
<div
  role="article"
  aria-label={`Audit log entry: ${operation} on ${timestamp}`}
>
  <span aria-label="Status changed from PENDING to APPROVED">
    PENDING → APPROVED
  </span>
</div>
```

---

## Rollout Plan

### Phase 1: Internal Testing (Week 1)
- Deploy to staging environment
- Internal team testing
- Gather feedback

### Phase 2: Pilot Testing (Week 2)
- Deploy to production with feature flag
- Enable for Admin users only
- Monitor performance and errors

### Phase 3: Full Rollout (Week 3)
- Enable for all Manager users
- Update documentation
- Training for fleet managers

---

## Success Criteria

✅ **Must Have**:
- [ ] Field-by-field change comparison displays correctly
- [ ] Approval workflow timeline shows all status transitions
- [ ] CSV export works for all audit log types
- [ ] Page load time < 500ms for 100 entries
- [ ] Zero accessibility violations (axe-core)

✅ **Nice to Have**:
- [ ] Real-time updates when new audit entries are created
- [ ] Advanced filtering (by user, date range, operation type)
- [ ] PDF export option
- [ ] Audit log statistics dashboard

---

## Risk Mitigation

### Risk: Large JSONB comparisons may be slow
**Mitigation**: Add pagination, limit to last 100 entries by default

### Risk: CSV export may time out for large datasets
**Mitigation**: Implement async export with email delivery for >1000 entries

### Risk: Complex nested JSONB may not display correctly
**Mitigation**: Flatten nested objects for display, provide raw JSON view option

---

## Dependencies

### NPM Packages (None Required)
- All functionality can be built with existing stack
- Optional: `json-diff` for advanced comparison (only if needed)

### Internal Dependencies
- ✅ `audit-service.ts` (already exists - 937 lines)
- ✅ `AuditLogTimeline.tsx` (already exists)
- ✅ Supabase audit_logs table (already exists)

---

## Post-Implementation

### Monitoring

Track these metrics:
- Audit log query performance (should be < 200ms)
- CSV export download counts
- Error rates on audit endpoints
- User engagement with audit trail tab

### Future Enhancements

1. **Advanced Search**: Full-text search across audit descriptions
2. **Bulk Export**: Export multiple entity audit trails at once
3. **Audit Comparison**: Compare audit trails between different entities
4. **Audit Dashboard**: Summary statistics and trends
5. **Real-time Notifications**: Alert managers when critical changes occur

---

**Implementation Priority**: HIGH
**Business Value**: HIGH (Compliance, Transparency, Debugging)
**Technical Complexity**: MEDIUM
**Risk Level**: LOW

**Recommendation**: Start implementation immediately - this is foundational for other improvements.
