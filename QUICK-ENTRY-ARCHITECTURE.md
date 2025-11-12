# Quick Entry Form - Architecture Diagram

## Component Hierarchy

```
QuickEntryForm (Client Component)
├── Form (React Hook Form Provider)
│   ├── Progress Indicator (Steps 1-4)
│   │
│   ├── Step 1: Basic Information (Card)
│   │   ├── Pilot Selection (Select + Dropdown)
│   │   ├── Request Category (Select)
│   │   ├── Request Type (Select - Conditional)
│   │   │   ├── Leave Type (if category = LEAVE)
│   │   │   └── Flight Type (if category = FLIGHT)
│   │   └── Submission Channel (Select)
│   │
│   ├── Step 2: Date Selection (Card)
│   │   ├── Start Date (Calendar Popover)
│   │   ├── End Date (Calendar Popover - Conditional)
│   │   ├── Roster Period Alert
│   │   ├── Deadline Status Alert
│   │   └── Conflict Warning Alert
│   │
│   ├── Step 3: Additional Details (Card)
│   │   ├── Reason (Textarea)
│   │   ├── Source Reference (Input)
│   │   └── Admin Notes (Textarea)
│   │
│   ├── Step 4: Review & Submit (Card)
│   │   ├── Pilot Summary
│   │   ├── Request Details
│   │   ├── Additional Info
│   │   └── Final Conflict Warning
│   │
│   └── Navigation Buttons
│       ├── Previous Button
│       ├── Next Button
│       ├── Cancel Button (Step 1 only)
│       └── Submit Button (Step 4 only)
```

## Data Flow

```
User Input
    ↓
React Hook Form (Client State)
    ↓
Zod Validation (Per Step)
    ↓
[On Date Change] → Roster Period Calculation
    ↓
[On Pilot/Date Change] → Conflict Detection API
    ↓
GET /api/requests/check-conflicts
    ├→ Query leave_requests (Supabase)
    └→ Query flight_requests (Supabase)
    ↓
Display Warnings (Non-blocking)
    ↓
[On Submit] → Determine Endpoint
    ↓
POST /api/{leave-requests|flight-requests|leave-bids}
    ↓
Create Request (Supabase)
    ↓
Success → Toast + Callback + Redirect
Error → Toast + Stay on Form
```

## State Management

```typescript
// React Hook Form State
form.watch('pilot_id')         // Selected pilot
form.watch('request_category') // LEAVE | FLIGHT | LEAVE_BID
form.watch('start_date')       // YYYY-MM-DD
form.watch('end_date')         // YYYY-MM-DD
form.watch('submission_channel') // EMAIL | PHONE | ORACLE

// Component State
currentStep                    // 1 | 2 | 3 | 4
isSubmitting                   // boolean
conflictWarning                // ConflictWarning | null
rosterPeriod                   // string | null (e.g., "RP13/2025")
deadlineStatus                 // DeadlineStatusInfo | null
```

## Validation Flow

```
Step 1 → Next Button
    ↓
Validate: pilot_id, request_category, submission_channel
    ↓
[If category = LEAVE] → Validate: leave_type
[If category = FLIGHT] → Validate: flight_type
    ↓
All Valid? → Advance to Step 2
    ↓
Step 2 → Next Button
    ↓
Validate: start_date
    ↓
[If category = LEAVE or LEAVE_BID] → Validate: end_date
    ↓
Validate: end_date >= start_date
    ↓
Validate: (end_date - start_date) <= 90 days
    ↓
All Valid? → Advance to Step 3
    ↓
Step 3 → Next Button
    ↓
Validate: Optional fields (length limits)
    ↓
All Valid? → Advance to Step 4
    ↓
Step 4 → Submit Button
    ↓
Final Validation (All Fields)
    ↓
Submit to API
```

## API Integration

```
Conflict Checking (Real-time)
    ↓
GET /api/requests/check-conflicts
    ?pilot_id={uuid}
    &start_date={YYYY-MM-DD}
    &end_date={YYYY-MM-DD}
    ↓
Response: {
  success: true,
  hasConflict: boolean,
  conflicts: [...],
  message: string
}

Request Submission
    ↓
[If LEAVE] → POST /api/leave-requests
[If FLIGHT] → POST /api/flight-requests
[If LEAVE_BID] → POST /api/leave-bids
    ↓
Payload: {
  pilot_id: string,
  request_type: string,
  start_date: string,
  end_date: string | null,
  request_method: 'EMAIL' | 'PHONE' | 'ORACLE',
  source_reference?: string,
  notes?: string,
  reason?: string,
  is_late_request: boolean
}
    ↓
Response: {
  success: boolean,
  data?: { id, status, created_at },
  error?: string
}
```

## File Dependencies

```
components/requests/quick-entry-form.tsx
    ├── Imports
    │   ├── react-hook-form (useForm)
    │   ├── @hookform/resolvers/zod (zodResolver)
    │   ├── next/navigation (useRouter)
    │   ├── lucide-react (Icons)
    │   ├── date-fns (format)
    │   │
    │   ├── @/lib/validations/quick-entry-schema
    │   │   ├── QuickEntrySchema
    │   │   ├── QuickEntryFormInput
    │   │   └── getDeadlineStatus
    │   │
    │   ├── @/lib/utils/roster-utils
    │   │   └── getRosterPeriodFromDate
    │   │
    │   ├── @/hooks/use-toast
    │   │   └── useToast
    │   │
    │   └── @/components/ui/*
    │       ├── Button, Input, Textarea
    │       ├── Calendar, Popover
    │       ├── Alert, Badge, Card
    │       ├── Separator, Select
    │       └── Form (all subcomponents)
    │
    └── Types
        ├── Pilot (local interface)
        ├── ConflictWarning (local interface)
        └── QuickEntryFormProps (local interface)
```

## Error Handling Strategy

```
Client-Side Validation
    ├── Zod Schema (Pre-submit)
    ├── Field-level Errors (Inline)
    └── Step-level Validation (Block navigation)

API Errors
    ├── Network Errors (Toast: red)
    ├── Validation Errors (Toast: red)
    ├── Authentication Errors (Redirect to login)
    └── Database Errors (Toast: red)

User Warnings (Non-blocking)
    ├── Conflict Warnings (Alert: yellow)
    ├── Late Request (Alert: yellow)
    └── Past Deadline (Alert: red)

Success Feedback
    └── Success Toast (green) + Callback
```

## Styling Architecture

```
Tailwind CSS Classes
    ├── Layout: container, mx-auto, p-6, space-y-6
    ├── Grid: flex, items-center, justify-between
    ├── Typography: text-sm, font-semibold, text-muted-foreground
    ├── Colors: bg-primary, text-destructive, border-muted
    └── Responsive: max-w-3xl, max-h-[90vh]

shadcn/ui Theme
    ├── CSS Variables (--primary, --destructive, etc.)
    ├── Dark Mode Support (class-based)
    └── Component Variants (default, destructive, outline)

Custom Utilities
    └── cn() - Class name merging with clsx
```

## Performance Optimizations

```
React Hook Form
    ├── Uncontrolled inputs (minimal re-renders)
    ├── Field-level subscriptions (watch specific fields)
    └── Optimistic validation (instant feedback)

Conflict Detection
    ├── Debounced API calls (prevent excessive requests)
    └── Conditional execution (only when pilot + dates present)

Roster Period Calculation
    ├── Memoized with useEffect
    └── Only recalculates on start_date change

Form State
    ├── Local state management (no global state)
    └── Efficient re-renders (isolated form context)
```

---

**Architecture Version**: 1.0.0
**Last Updated**: 2025-01-11
**Author**: Maurice Rondeau
