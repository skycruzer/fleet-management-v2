# TRACKED: Leave Bid Notification System

**Status**: Pending
**Priority**: P2
**Created**: 2026-01-04

## Description

Implement automatic notifications when leave bids are approved or rejected.

## Location

`app/api/admin/leave-bids/review/route.ts:99`

## Implementation Notes

The notification code is already scaffolded but commented out:

```typescript
await sendPilotNotification(updatedBid.pilot_id, {
  type: action === 'approve' ? 'LEAVE_BID_APPROVED' : 'LEAVE_BID_REJECTED',
  rosterPeriodCode: updatedBid.roster_period_code,
  bidId: updatedBid.id,
})
```

## Dependencies

- Notification service must support `LEAVE_BID_APPROVED` and `LEAVE_BID_REJECTED` types
- Email templates for bid status updates

## Acceptance Criteria

- [ ] Pilot receives notification when bid is approved
- [ ] Pilot receives notification when bid is rejected
- [ ] Notification includes roster period and bid details
