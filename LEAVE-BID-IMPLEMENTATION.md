# Leave Bid Implementation Summary

## Overview

Implemented an annual leave bidding system for pilots to submit their preferred leave periods for the coming year. Each pilot can submit up to 4 leave period options ranked by priority.

## Features Implemented

### 1. Leave Bid Form Component
**File**: `components/portal/leave-bid-form.tsx`

- **4 Priority Options**: Each labeled as "1st Choice", "2nd Choice", "3rd Choice", "4th Choice"
- **Date Pickers**: Start date and end date for each option
- **Visual Hierarchy**: Each option has distinct color coding (cyan, blue, indigo, purple)
- **Live Preview**: Shows formatted dates and total days for each option
- **Validation**:
  - At least one option must be filled
  - End date must be after start date
  - All dates must be in the coming year (2026)
- **Clear Individual Options**: Button to clear each option separately
- **Reset All**: Button to clear entire form
- **Smart Submission**: Auto-detects if updating existing bid or creating new

### 2. Updated Leave Requests Page
**File**: `app/portal/(protected)/leave-requests/page.tsx`

- Added `LeaveBidForm` component at the top of the page
- Positioned before regular leave requests list
- Maintains all existing functionality (view, filter, cancel requests)

### 3. API Endpoint
**File**: `app/api/portal/leave-bids/route.ts`

**POST /api/portal/leave-bids**
- Creates new leave bid or updates existing bid for the year
- Validates pilot authentication
- Stores bid with status 'PENDING'
- Handles transaction rollback on errors

**GET /api/portal/leave-bids**
- Retrieves all bids for authenticated pilot
- Returns bids with nested options
- Ordered by year (most recent first)

### 4. Database Schema
**File**: `supabase/migrations/20251027_create_leave_bids_tables.sql`

**Table: `leave_bids`**
- `id` (UUID, Primary Key)
- `pilot_id` (UUID, Foreign Key to pilots)
- `bid_year` (INTEGER) - Year for the bid (e.g., 2026)
- `status` (TEXT) - PENDING, APPROVED, REJECTED, PROCESSING
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ) - Auto-updated via trigger

**Table: `leave_bid_options`**
- `id` (UUID, Primary Key)
- `bid_id` (UUID, Foreign Key to leave_bids)
- `priority` (INTEGER) - 1 to 4
- `start_date` (DATE)
- `end_date` (DATE)
- `created_at` (TIMESTAMPTZ)

**Constraints**:
- One bid per pilot per year (`unique_pilot_bid_year`)
- Valid date range (`end_date > start_date`)
- Unique priority within bid (`unique_bid_priority`)
- Priority must be 1-4

**Indexes**:
- `idx_leave_bids_pilot_id` - Fast lookup by pilot
- `idx_leave_bids_bid_year` - Fast lookup by year
- `idx_leave_bids_status` - Fast filtering by status
- `idx_leave_bid_options_bid_id` - Fast option retrieval

**Row Level Security (RLS)**:
- Pilots can view, create, and update their own pending bids
- Pilots can manage options for their own pending bids
- Admins/Managers can view all bids and update status
- Automatic cleanup when pilot or bid is deleted (CASCADE)

## User Experience

### For Pilots

1. **Navigate to Leave Requests** page (`/portal/leave-requests`)
2. **See Annual Leave Bid Form** at the top of the page
3. **Fill in Preferred Options**:
   - Fill at least 1 option (up to 4)
   - Select start and end dates for each
   - See live preview with formatted dates and day count
4. **Submit or Reset**:
   - Submit to save the bid
   - Reset All to clear the form
   - Clear individual options if needed
5. **Get Feedback**:
   - Success message on submission
   - Error messages for validation issues
   - Form auto-resets after successful submission

### Visual Design

- **Gradient Header**: Cyan to blue gradient with calendar icon
- **Color-Coded Options**: Each priority level has distinct color
- **Responsive Layout**: Works on mobile and desktop
- **Accessible Forms**: Proper labels and focus states
- **Clear Actions**: Distinct buttons for submit, reset, and clear

## Database Migration

### To Apply Migration

You need to manually apply the migration using Supabase SQL Editor:

1. Go to: https://app.supabase.com/project/wgdmgvonqysflwdiiols/sql/new
2. Copy contents of: `supabase/migrations/20251027_create_leave_bids_tables.sql`
3. Paste into SQL Editor
4. Click "Run"

**Migration File**: `/Users/skycruzer/Desktop/fleet-management-v2/supabase/migrations/20251027_create_leave_bids_tables.sql`

This will create:
- `leave_bids` table
- `leave_bid_options` table
- All indexes
- All RLS policies
- Automatic timestamp update trigger

## Future Enhancements

### Potential Features (Not Implemented)
1. **View Previous Bids**: Show history of submitted bids
2. **Admin Approval Interface**: Dashboard for admins to review/approve bids
3. **Bid Status Notifications**: Email alerts when bid status changes
4. **Conflict Detection**: Show if multiple pilots bid for same dates
5. **Seniority-Based Auto-Approval**: Automatically approve based on seniority rules
6. **Calendar View**: Visual calendar showing all submitted bids
7. **Edit Existing Bids**: Allow editing before deadline
8. **Deadline Enforcement**: Close bidding after a specific date
9. **Analytics**: Reports on bid patterns and coverage

## Testing

### Manual Testing Steps

1. **Login as Pilot**: Navigate to pilot portal
2. **Go to Leave Requests**: Click "Leave Requests" in sidebar
3. **Fill Form**:
   - Add at least one leave option
   - Select valid dates in 2026
4. **Submit**: Click "Submit Leave Bid"
5. **Verify Success**: Check for success message
6. **Test Validation**:
   - Try submitting with no options (should fail)
   - Try end date before start date (should fail)
   - Try dates in 2025 (should fail)
7. **Test Clear**: Click "Clear" on individual option
8. **Test Reset**: Click "Reset All" button

### API Testing

```bash
# Test GET (requires authentication)
curl http://localhost:3000/api/portal/leave-bids

# Test POST (requires authentication + pilot_id)
curl -X POST http://localhost:3000/api/portal/leave-bids \
  -H "Content-Type: application/json" \
  -d '{
    "bid_year": 2026,
    "options": [
      {"priority": 1, "start_date": "2026-01-15", "end_date": "2026-01-29"},
      {"priority": 2, "start_date": "2026-03-10", "end_date": "2026-03-24"}
    ]
  }'
```

## Files Created/Modified

### New Files
1. ✅ `components/portal/leave-bid-form.tsx` - Main form component
2. ✅ `app/api/portal/leave-bids/route.ts` - API endpoint
3. ✅ `supabase/migrations/20251027_create_leave_bids_tables.sql` - Database schema
4. ✅ `apply-leave-bids-migration.mjs` - Migration helper script

### Modified Files
1. ✅ `app/portal/(protected)/leave-requests/page.tsx` - Added LeaveBidForm import and display

## Summary

The leave bid system is now fully implemented and ready for testing. Pilots can submit their annual leave preferences with up to 4 ranked options. The system includes proper validation, security (RLS), and a clean user interface that matches the existing portal design.

**Next Step**: Apply the database migration using Supabase SQL Editor, then test the form in the pilot portal.

---

**Implementation Date**: October 26, 2025
**Developer**: Claude Code
**Status**: ✅ Complete - Awaiting Database Migration
