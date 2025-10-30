# Implementation Plan #6: Leave Request Audit Trail UI

**Priority**: Low (Depends on #1)
**Estimated Timeline**: 1 week
**Dependencies**: #1 (Enhanced Audit Log System)
**Status**: Planning Phase

---

## Overview

Build a comprehensive audit trail UI specifically for leave requests, showing approval/denial workflow, field-by-field changes, status transitions, and complete approval history.

### Current State

**Existing Implementation** (✅ Already Built - from #1):
- `audit-service.ts` with comprehensive query functions
- `AuditLogTimeline.tsx` component
- `audit_logs` table with `old_values` and `new_values` JSONB
- Database triggers on `leave_requests` table

**What's Missing** (🔴 Needs Implementation):
- Leave request-specific audit trail page
- Approval workflow visualization
- Field-by-field change comparison
- Status transition timeline
- Approval reason display

---

## Objectives

### Primary Goals
1. ✅ Create dedicated audit trail tab for leave requests
2. ✅ Display approval workflow with reasons
3. ✅ Show field-by-field changes (before/after)
4. ✅ Visualize status transitions over time
5. ✅ Export leave request audit trail (CSV)

### Success Metrics
- Users can see complete approval history
- Field changes are clearly visible
- Approval reasons are prominently displayed
- Page loads in < 500ms
- All features fully accessible (WCAG 2.1 AA)

---

## Technical Design

### Architecture

```
┌──────────────────────────────────────────────────────────────┐
│  Leave Request Details Page                                  │
│  /dashboard/leave/[id]                                       │
│                                                              │
│  ├── Request Details Tab (existing)                         │
│  ├── Pilot Information Tab (existing)                       │
│  │                                                          │
│  └── Audit Trail Tab (NEW)                                  │
│      ├── ApprovalWorkflowCard (from #1)                    │
│      ├── ChangeComparisonView (from #1)                    │
│      ├── AuditLogTimeline (existing)                       │
│      └── ExportAuditButton (from #1)                       │
└──────────────────────────────────────────────────────────────┘
         ↓
    audit-service.ts (from #1)
    leave-service.ts (existing)
         ↓
    audit_logs table
    leave_requests table
```

### Components (from Implementation Plan #1)

All required components were designed in Implementation Plan #1:

1. **ApprovalWorkflowCard** - Shows approval timeline
2. **ChangeComparisonView** - Field-by-field diff
3. **ExportAuditButton** - CSV export
4. **AuditLogTimeline** - Timeline visualization (existing)

---

## Implementation Steps

### Phase 1: Page Structure (Days 1-2)

1. **Add Audit Trail Tab to Leave Request Page**
   - Modify `/app/dashboard/leave/[id]/page.tsx`
   - Add tab navigation (Details | Audit Trail)
   - Set up tab routing

2. **Create Audit Trail Layout**
   - Grid layout for components
   - Loading skeletons
   - Error boundaries

### Phase 2: Component Integration (Days 3-4)

1. **Integrate ApprovalWorkflowCard**
   - Pass leave request ID
   - Display approval history
   - Show status transitions
   - Handle empty states

2. **Integrate ChangeComparisonView**
   - Fetch audit log changes
   - Display field comparisons
   - Highlight changed values
   - Handle complex JSONB fields

3. **Integrate AuditLogTimeline**
   - Filter for leave request operations
   - Show chronological events
   - Expandable details

4. **Integrate ExportAuditButton**
   - CSV export for leave request
   - Include all relevant fields
   - Download handling

### Phase 3: Leave Request-Specific Features (Day 5)

1. **Status Transition Indicators**
   - Visual timeline of status changes
   - Color-coded badges
   - Timestamps for each transition

2. **Approval Reason Display**
   - Extract from audit metadata
   - Prominent display in workflow
   - Historical approval patterns

### Phase 4: Testing & Polish (Days 6-7)

1. **E2E Testing**
   - Test audit trail display
   - Test approval workflow
   - Test export functionality
   - Test accessibility

2. **Edge Cases**
   - Leave requests with no changes
   - Multiple approvals/denials
   - Cancelled requests
   - System-generated changes

3. **Documentation**
   - Update user guide
   - Document audit trail features

---

## Leave Request-Specific Enhancements

### Approval Workflow Display

**Example Leave Request Audit Trail**:

```typescript
interface LeaveRequestAuditEntry {
  timestamp: Date
  action: 'submitted' | 'reviewed' | 'approved' | 'denied' | 'cancelled'
  performedBy: {
    id: string
    name: string
    role: string
  }
  changes: Array<{
    field: string
    oldValue: any
    newValue: any
  }>
  reason?: string
  metadata?: {
    eligibilityCheck?: boolean
    crewImpact?: string
    conflictingRequests?: string[]
  }
}
```

### Field Change Categories

**Leave Request Fields to Track**:
- Start Date
- End Date
- Roster Period
- Status (PENDING → APPROVED/DENIED)
- Approved By
- Approval Reason
- Request Method (EMAIL, ORACLE, LEAVE_BIDS)
- Late Request Flag

---

## UI Design

### Audit Trail Tab Layout

```
┌────────────────────────────────────────────────────────────┐
│ Leave Request Details                                      │
│ [ Details ] [ Audit Trail ]  ← Tab Navigation             │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ ┌────────────────────────────────────────────────────┐    │
│ │ Approval Workflow                                  │    │
│ │                                                    │    │
│ │ ● Submitted          2025-10-15 09:30             │    │
│ │   By: John Doe (Captain)                          │    │
│ │   Request Method: LEAVE_BIDS                      │    │
│ │                                                   │    │
│ │ ● Pending Review     2025-10-15 09:30 - 10-20    │    │
│ │   Awaiting approval from Fleet Management         │    │
│ │   Eligibility: ✅ PASSED (10 captains available)  │    │
│ │                                                   │    │
│ │ ● Approved           2025-10-20 14:45             │    │
│ │   By: Admin User (Fleet Manager)                  │    │
│ │   Reason: "Sufficient crew coverage available.    │    │
│ │            No conflicting requests."              │    │
│ └────────────────────────────────────────────────────┘    │
│                                                            │
│ ┌────────────────────────────────────────────────────┐    │
│ │ Field Changes                                      │    │
│ │                                                    │    │
│ │ 🟡 Status                 PENDING → APPROVED      │    │
│ │ 🟡 Approved By            null → Admin User       │    │
│ │ 🟡 Approval Timestamp     null → 2025-10-20 14:45 │    │
│ │ ⚪ Start Date             2025-11-01 (unchanged)   │    │
│ │ ⚪ End Date               2025-11-05 (unchanged)   │    │
│ │ ⚪ Roster Period          RP01/2026 (unchanged)    │    │
│ └────────────────────────────────────────────────────┘    │
│                                                            │
│ ┌────────────────────────────────────────────────────┐    │
│ │ Complete Audit Timeline                            │    │
│ │ (Expandable entries)                               │    │
│ └────────────────────────────────────────────────────┘    │
│                                                            │
│ [ Export Audit Trail (CSV) ]                              │
└────────────────────────────────────────────────────────────┘
```

---

## API Routes (from Implementation Plan #1)

**All required API routes were designed in Plan #1**:

1. **GET /api/audit/changes/[id]** - Get field-level changes
2. **GET /api/audit/approval-history/[leaveRequestId]** - Get approval workflow
3. **GET /api/audit/export** - Export audit trail to CSV

---

## Service Layer (from Implementation Plan #1)

**All required service functions were designed in Plan #1**:

1. **`getAuditLogChanges()`** - Field-by-field comparison
2. **`getLeaveRequestApprovalHistory()`** - Approval timeline
3. **`exportAuditTrailCSV()`** - CSV export

---

## Testing Strategy

### E2E Tests (Playwright)

```typescript
test.describe('Leave Request Audit Trail', () => {
  test('should display approval workflow', async ({ page }) => {
    await page.goto('/dashboard/leave/request-id')
    await page.click('text=Audit Trail')

    await expect(page.locator('text=Approval Workflow')).toBeVisible()
    await expect(page.locator('text=Submitted')).toBeVisible()
    await expect(page.locator('text=Approved')).toBeVisible()
  })

  test('should show field changes', async ({ page }) => {
    await page.goto('/dashboard/leave/request-id')
    await page.click('text=Audit Trail')

    await expect(page.locator('text=Status')).toBeVisible()
    await expect(page.locator('text=PENDING → APPROVED')).toBeVisible()
  })

  test('should export audit trail to CSV', async ({ page }) => {
    await page.goto('/dashboard/leave/request-id')
    await page.click('text=Audit Trail')

    const downloadPromise = page.waitForEvent('download')
    await page.click('button:has-text("Export Audit Trail")')
    const download = await downloadPromise

    expect(download.suggestedFilename()).toContain('leave-request-audit')
    expect(download.suggestedFilename()).toContain('.csv')
  })

  test('should display approval reasons', async ({ page }) => {
    await page.goto('/dashboard/leave/request-id')
    await page.click('text=Audit Trail')

    await expect(page.locator('text=Sufficient crew coverage')).toBeVisible()
  })
})
```

---

## Performance Considerations

### Database Optimization

**Audit queries are already optimized in Plan #1**:
- Index on `entity_type` + `entity_id` + `created_at`
- Cached audit log queries (5 minute TTL)
- Pagination for long histories

### Page Load Optimization

```typescript
// Server Component - prefetch audit data
export default async function LeaveRequestAuditTab({
  leaveRequestId
}: {
  leaveRequestId: string
}) {
  // Fetch all audit data in parallel
  const [approvalHistory, auditLogs] = await Promise.all([
    getLeaveRequestApprovalHistory(leaveRequestId),
    getAuditLogs({ entityType: 'leave_request', entityId: leaveRequestId })
  ])

  return (
    <div>
      <ApprovalWorkflowCard history={approvalHistory} />
      <ChangeComparisonView logs={auditLogs} />
      <AuditLogTimeline logs={auditLogs} />
    </div>
  )
}
```

---

## Security Considerations

### Access Control

**Only Admin/Manager can view leave request audit trails**:

```typescript
// Verify permission before showing audit tab
const { data: { user } } = await supabase.auth.getUser()
if (!user || !['Admin', 'Manager'].includes(user.role)) {
  return <ErrorCard message="Unauthorized" />
}
```

### RLS Policies

```sql
-- Audit logs are already protected by RLS (from Plan #1)
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

---

## Accessibility Requirements

### WCAG 2.1 AA Compliance

**All requirements defined in Plan #1**:
- Color + Icon + Text for status indicators
- Keyboard navigation for timeline
- ARIA labels for all changes
- Focus indicators
- Screen reader announcements

---

## Rollout Plan

### Phase 1: Internal Testing (Days 1-2)
- Deploy to staging
- Test all leave request scenarios
- Verify approval workflow display
- Check export functionality

### Phase 2: Production Deployment (Day 3)
- Deploy to production
- Enable for Admin/Manager roles
- Monitor performance
- Collect feedback

### Phase 3: Documentation (Day 4)
- Update user guides
- Create training materials
- Document audit trail features

---

## Success Criteria

✅ **Must Have**:
- [ ] Audit trail tab displays correctly
- [ ] Approval workflow shows complete history
- [ ] Field changes are clearly visible
- [ ] Export to CSV works correctly
- [ ] Page loads in < 500ms
- [ ] Zero accessibility violations

✅ **Nice to Have**:
- [ ] Real-time updates when status changes
- [ ] Comparison between multiple requests
- [ ] Advanced filtering options
- [ ] PDF export of audit trail

---

## Dependencies

### Implementation Plan #1 Components

**All components come from Plan #1**:
- ✅ ApprovalWorkflowCard
- ✅ ChangeComparisonView
- ✅ ExportAuditButton
- ✅ AuditLogTimeline (existing)

### Service Layer

**All service functions from Plan #1**:
- ✅ `getAuditLogChanges()`
- ✅ `getLeaveRequestApprovalHistory()`
- ✅ `exportAuditTrailCSV()`

---

## Post-Implementation

### Monitoring

Track these metrics:
- Audit trail page views
- Export download counts
- Average time spent on audit tab
- Error rates

### Future Enhancements

1. **Bulk Export**: Export multiple leave request audits
2. **Comparison View**: Compare audit trails between requests
3. **Advanced Search**: Full-text search across audit descriptions
4. **Real-Time Updates**: Live audit entries via Supabase subscriptions
5. **Audit Dashboard**: Summary statistics for all leave requests

---

**Implementation Priority**: LOW
**Business Value**: MEDIUM (Compliance, Transparency)
**Technical Complexity**: LOW (reuses components from #1)
**Risk Level**: VERY LOW

**Recommendation**: Implement immediately after #1 (Enhanced Audit System) is complete - quick win with high value.
