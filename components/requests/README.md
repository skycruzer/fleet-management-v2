# Quick Entry Form Component

Admin component for manually entering pilot requests from email, phone, or Oracle submissions.

## Overview

The Quick Entry Form is a multi-step wizard that allows administrators to manually create pilot requests when they are submitted through non-system channels (email, phone calls, Oracle system).

## Features

- **Multi-step Form**: 4-step wizard for organized data entry
- **Request Category Support**: Leave, Flight, and Leave Bid requests
- **Real-time Validation**: Immediate feedback with Zod schema validation
- **Conflict Detection**: Automatic checking for overlapping requests
- **Roster Period Calculation**: Auto-calculates roster period from dates
- **Deadline Status**: Shows if request is on-time, late, or past deadline
- **Comprehensive Review**: Final review step before submission
- **Toast Notifications**: Success/error feedback to users

## Usage

### Basic Implementation

```tsx
import { QuickEntryForm } from '@/components/requests/quick-entry-form'

export default function RequestsPage() {
  const pilots = await getPilots() // Fetch pilots from service

  return (
    <div className="container mx-auto p-6">
      <h1 className="mb-6 text-2xl font-bold">Quick Entry Form</h1>
      <QuickEntryForm
        pilots={pilots}
        onSuccess={() => {
          console.log('Request submitted!')
          router.push('/dashboard/requests')
        }}
        onCancel={() => {
          router.push('/dashboard/requests')
        }}
      />
    </div>
  )
}
```

### With Dialog

```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { QuickEntryForm } from '@/components/requests/quick-entry-form'

export function QuickEntryDialog({ open, onOpenChange, pilots }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manual Request Entry</DialogTitle>
        </DialogHeader>
        <QuickEntryForm
          pilots={pilots}
          onSuccess={() => onOpenChange(false)}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
```

## Props

| Prop        | Type         | Required | Description                                           |
| ----------- | ------------ | -------- | ----------------------------------------------------- |
| `pilots`    | `Pilot[]`    | Yes      | Array of pilot objects for dropdown selection         |
| `onSuccess` | `() => void` | No       | Callback fired when request is successfully submitted |
| `onCancel`  | `() => void` | No       | Callback fired when form is cancelled (Step 1 only)   |

## Form Steps

### Step 1: Basic Information

- **Pilot Selection**: Searchable dropdown with all active pilots
- **Request Category**: Leave, Flight, or Leave Bid
- **Request Type**: Conditional field based on category
  - Leave: RDO, SDO, ANNUAL, SICK, LSL, LWOP, MATERNITY, COMPASSIONATE
  - Flight: FLIGHT_REQUEST, RDO, SDO, OFFICE_DAY
- **Submission Channel**: EMAIL, PHONE, or ORACLE

### Step 2: Date Selection

- **Start Date**: Required for all request types
- **End Date**: Required for LEAVE and LEAVE_BID, optional for FLIGHT
- **Auto-calculations**:
  - Roster period from start date
  - Deadline status (on-time vs late)
  - Conflict detection with existing requests

### Step 3: Additional Details

- **Reason/Description**: Optional explanation from pilot
- **Source Reference**: Email ID, phone log number, or Oracle ticket number
- **Admin Notes**: Internal notes not visible to pilot

### Step 4: Review & Submit

- Complete summary of all entered information
- Conflict warnings (if any)
- Final submission

## Validation Rules

### Date Validation

- Start date cannot be in the past (for new requests)
- End date must be on or after start date
- Maximum 90 days per request
- Dates must be in YYYY-MM-DD format

### Required Fields by Category

**LEAVE Requests:**

- pilot_id ✓
- leave_type ✓
- start_date ✓
- end_date ✓
- submission_channel ✓

**FLIGHT Requests:**

- pilot_id ✓
- flight_type ✓
- start_date ✓
- submission_channel ✓

**LEAVE_BID Requests:**

- pilot_id ✓
- start_date ✓
- end_date ✓
- submission_channel ✓

## API Integration

The form submits to different endpoints based on request category:

```typescript
// Leave requests
POST / api / leave - requests

// Flight requests
POST / api / flight - requests

// Leave bids
POST / api / leave - bids
```

### Request Payload

```typescript
{
  pilot_id: string
  request_type: LeaveType | FlightType
  start_date: string (YYYY-MM-DD)
  end_date: string | null
  reason?: string
  request_date: string (ISO 8601)
  request_method: 'EMAIL' | 'PHONE' | 'ORACLE'
  source_reference?: string
  notes?: string
  is_late_request: boolean
  roster_period?: string
}
```

### Response Format

```typescript
{
  success: boolean
  data?: {
    id: string
    request_type: string
    status: 'PENDING'
    created_at: string
    roster_period: string
  }
  error?: string
}
```

## Features Deep Dive

### Conflict Detection

The form automatically checks for existing requests with overlapping dates when:

- Pilot is selected
- Start date is changed
- End date is changed

Conflicts are displayed as warnings before submission but do not block the form.

### Roster Period Calculation

Uses `getRosterPeriodFromDate()` utility to calculate the 28-day roster period:

```typescript
import { getRosterPeriodFromDate } from '@/lib/utils/roster-utils'

const period = getRosterPeriodFromDate(new Date('2025-11-15'))
// Returns: { code: 'RP13/2025', startDate: ..., endDate: ... }
```

### Deadline Status

Requests are flagged based on advance notice:

- **On-time**: ≥21 days advance notice
- **Late**: 1-20 days advance notice
- **Past deadline**: Start date in the past

### Multi-step Navigation

- **Next button**: Validates current step fields before advancing
- **Previous button**: Returns to previous step without validation
- **Cancel button**: Only appears on Step 1
- **Submit button**: Only appears on Step 4

## Styling & Accessibility

- Fully responsive design
- Keyboard navigation support
- ARIA labels and descriptions
- Error messages linked to form fields
- Focus management between steps
- Color-coded status indicators

## Error Handling

The form handles errors at multiple levels:

1. **Client-side validation**: Zod schema validation before submission
2. **API errors**: Toast notifications for server errors
3. **Network errors**: Toast notifications for connection issues
4. **Conflict warnings**: Non-blocking alerts for existing requests

## TypeScript Types

All types are exported from:

- `@/lib/validations/quick-entry-schema` - Form validation schemas
- `@/types/quick-entry` - Request types and interfaces

## Testing

Run Storybook to interact with the component:

```bash
npm run storybook
```

Stories available:

- Default (with full pilot list)
- WithCallbacks (demonstrates callbacks)
- SmallPilotList (edge case: few pilots)
- SinglePilot (edge case: one pilot)

## Best Practices

1. **Always fetch fresh pilot data** before rendering form
2. **Implement onSuccess callback** to refresh parent data
3. **Use Dialog wrapper** for modal presentations
4. **Handle errors gracefully** with toast notifications
5. **Validate server-side** - client validation is not sufficient

## Dependencies

- react-hook-form - Form state management
- zod - Schema validation
- date-fns - Date formatting and calculations
- lucide-react - Icons
- shadcn/ui - UI components
- next/navigation - Router integration

## Related Files

- **Validation**: `/lib/validations/quick-entry-schema.ts`
- **Types**: `/types/quick-entry.ts`
- **Utilities**: `/lib/utils/roster-utils.ts`
- **Services**:
  - `/lib/services/leave-service.ts`
  - `/lib/services/flight-request-service.ts`
  - `/lib/services/leave-bid-service.ts`

## Known Limitations

1. File attachments not yet implemented (planned)
2. Bulk entry not supported (one request at a time)
3. No draft/save functionality (must complete in one session)
4. Conflict detection is informational only (doesn't block submission)

## Future Enhancements

- [ ] Add file attachment support for email screenshots
- [ ] Implement draft saving
- [ ] Add bulk import from CSV/Excel
- [ ] Enhanced conflict resolution workflow
- [ ] Email notifications to pilot after submission
- [ ] Audit trail visualization

---

**Version**: 1.0.0
**Author**: Maurice Rondeau
**Last Updated**: 2025-01-11
