# Pilot Portal Workflow Implementation Plan

**Date**: October 26, 2025
**Status**: Database Migration Required
**Priority**: High

---

## Executive Summary

The pilot portal leave bid workflow is currently non-functional because there is no link between Supabase Auth users and pilot records in the database. This document outlines the required implementation to make the complete workflow functional, including:

1. Pilot-user linking system
2. Bidirectional notification system (pilot ↔ admin)
3. Professional workflow between pilot portal and admin portal

---

## Current Issues

### 1. **Pilot Portal Cannot Identify Pilots**
**Error**: "Pilot account not found"

**Root Cause**: The `pilots` table has no column linking pilots to Supabase Auth users

**Tables Affected**:
- `pilots` (missing `user_id` column)
- `auth.users` (Supabase Auth)

**Impact**:
- Pilots cannot submit leave requests/bids
- Pilot portal dashboard cannot load pilot-specific data
- Flight requests cannot be submitted

---

## Solution Architecture

### Phase 1: Database Schema Changes (REQUIRED)

#### 1.1 Add `user_id` Column to Pilots Table

```sql
-- Migration: supabase/migrations/20251026_add_user_id_to_pilots.sql
ALTER TABLE pilots
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX idx_pilots_user_id ON pilots(user_id);

COMMENT ON COLUMN pilots.user_id IS 'Links pilot record to Supabase Auth user for portal access';
```

**Migration Status**: ✅ Created, ⚠️ **Not Yet Applied**

**How to Apply**: You need to run this migration manually in Supabase:

1. Go to https://supabase.com/dashboard/project/wgdmgvonqysflwdiiols/sql/new
2. Paste the SQL from `supabase/migrations/20251026_add_user_id_to_pilots.sql`
3. Click "Run"

#### 1.2 Create Notifications Table

```sql
CREATE TYPE notification_type AS ENUM (
  'leave_request_submitted',
  'leave_request_approved',
  'leave_request_rejected',
  'leave_request_pending_review',
  'leave_bid_submitted',
  'leave_bid_approved',
  'leave_bid_rejected',
  'flight_request_submitted',
  'flight_request_approved',
  'flight_request_rejected'
);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_recipient ON notifications(recipient_id);
CREATE INDEX idx_notifications_unread ON notifications(recipient_id, read) WHERE read = FALSE;

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own notifications
CREATE POLICY "Users can view their own notifications"
  ON notifications
  FOR SELECT
  USING (auth.uid() = recipient_id);

-- Policy: Users can mark their own notifications as read
CREATE POLICY "Users can update their own notifications"
  ON notifications
  FOR UPDATE
  USING (auth.uid() = recipient_id);
```

---

### Phase 2: Service Layer Updates

#### 2.1 Update Pilot Service

**File**: `lib/services/pilot-service.ts`

Add function to get pilot by user ID:

```typescript
export async function getPilotByUserId(userId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('pilots')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error) {
    throw new Error(`Failed to get pilot by user ID: ${error.message}`)
  }

  return data
}
```

#### 2.2 Create Notification Service

**File**: `lib/services/notification-service.ts`

```typescript
import { createClient } from '@/lib/supabase/server'

export type NotificationType =
  | 'leave_request_submitted'
  | 'leave_request_approved'
  | 'leave_request_rejected'
  | 'leave_request_pending_review'
  | 'leave_bid_submitted'
  | 'leave_bid_approved'
  | 'leave_bid_rejected'
  | 'flight_request_submitted'
  | 'flight_request_approved'
  | 'flight_request_rejected'

export async function createNotification(params: {
  recipientId: string
  type: NotificationType
  title: string
  message: string
  link?: string
}) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('notifications')
    .insert({
      recipient_id: params.recipientId,
      type: params.type,
      title: params.title,
      message: params.message,
      link: params.link
    })
    .select()
    .single()

  if (error) {
    console.error('Failed to create notification:', error)
    return null
  }

  return data
}

export async function getUnreadNotifications(userId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('recipient_id', userId)
    .eq('read', false)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to get notifications:', error)
    return []
  }

  return data
}

export async function markNotificationAsRead(notificationId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('notifications')
    .update({ read: true, updated_at: new Date().toISOString() })
    .eq('id', notificationId)

  if (error) {
    console.error('Failed to mark notification as read:', error)
    return false
  }

  return true
}

// Helper functions for common notification scenarios

export async function notifyAdminOfPilotRequest(params: {
  pilotName: string
  requestType: 'leave_request' | 'leave_bid' | 'flight_request'
  requestId: string
}) {
  // Get all admin users
  const supabase = await createClient()
  const { data: admins } = await supabase
    .from('an_users')
    .select('id')
    .in('role', ['Admin', 'Manager'])

  if (!admins || admins.length === 0) {
    console.warn('No admin users found to notify')
    return
  }

  const typeMap = {
    'leave_request': 'leave_request_submitted',
    'leave_bid': 'leave_bid_submitted',
    'flight_request': 'flight_request_submitted'
  }

  const linkMap = {
    'leave_request': `/dashboard/leave`,
    'leave_bid': `/dashboard/admin/leave-bids`,
    'flight_request': `/dashboard/flight-requests`
  }

  for (const admin of admins) {
    await createNotification({
      recipientId: admin.id,
      type: typeMap[params.requestType] as NotificationType,
      title: `New ${params.requestType.replace('_', ' ')} from ${params.pilotName}`,
      message: `${params.pilotName} has submitted a ${params.requestType.replace('_', ' ')} for your review.`,
      link: linkMap[params.requestType]
    })
  }
}

export async function notifyPilotOfRequestStatus(params: {
  pilotUserId: string
  requestType: 'leave_request' | 'leave_bid' | 'flight_request'
  status: 'approved' | 'rejected' | 'pending_review'
  requestId: string
}) {
  const typeMap = {
    'leave_request_approved': 'leave_request_approved',
    'leave_request_rejected': 'leave_request_rejected',
    'leave_request_pending_review': 'leave_request_pending_review',
    'leave_bid_approved': 'leave_bid_approved',
    'leave_bid_rejected': 'leave_bid_rejected',
    'leave_bid_pending_review': 'leave_request_pending_review',
    'flight_request_approved': 'flight_request_approved',
    'flight_request_rejected': 'flight_request_rejected',
    'flight_request_pending_review': 'leave_request_pending_review'
  }

  const key = `${params.requestType}_${params.status}`
  const type = typeMap[key as keyof typeof typeMap] as NotificationType

  const titleMap = {
    'approved': 'Request Approved',
    'rejected': 'Request Rejected',
    'pending_review': 'Request Under Review'
  }

  const messageMap = {
    'approved': `Your ${params.requestType.replace('_', ' ')} has been approved.`,
    'rejected': `Your ${params.requestType.replace('_', ' ')} has been rejected.`,
    'pending_review': `Your ${params.requestType.replace('_', ' ')} is now under review.`
  }

  await createNotification({
    recipientId: params.pilotUserId,
    type,
    title: titleMap[params.status],
    message: messageMap[params.status],
    link: `/portal/${params.requestType.replace('_', '-')}s`
  })
}
```

---

### Phase 3: API Endpoint Updates

#### 3.1 Update Leave Request API

**File**: `app/api/leave-requests/route.ts`

Add notification when admin approves/rejects:

```typescript
// In the approval/rejection handler
import { notifyPilotOfRequestStatus } from '@/lib/services/notification-service'
import { getPilotByUserId } from '@/lib/services/pilot-service'

// After updating leave request status
const { data: leaveRequest } = await supabase
  .from('leave_requests')
  .select('*, pilots(*)')
  .eq('id', requestId)
  .single()

if (leaveRequest?.pilots?.user_id) {
  await notifyPilotOfRequestStatus({
    pilotUserId: leaveRequest.pilots.user_id,
    requestType: 'leave_request',
    status: newStatus, // 'approved' or 'rejected'
    requestId
  })
}
```

#### 3.2 Update Pilot Portal Leave Request API

**File**: `app/api/portal/leave-requests/route.ts`

```typescript
import { getPilotByUserId } from '@/lib/services/pilot-service'
import { notifyAdminOfPilotRequest } from '@/lib/services/notification-service'

export async function POST(request: Request) {
  const supabase = await createClient()

  // Get authenticated user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get pilot record by user_id
  const pilot = await getPilotByUserId(user.id)
  if (!pilot) {
    return NextResponse.json({ error: 'Pilot account not found' }, { status: 404 })
  }

  // Create leave request
  const body = await request.json()
  const { data: leaveRequest, error } = await supabase
    .from('leave_requests')
    .insert({
      pilot_id: pilot.id,
      ...body
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Notify admins
  await notifyAdminOfPilotRequest({
    pilotName: `${pilot.first_name} ${pilot.last_name}`,
    requestType: 'leave_request',
    requestId: leaveRequest.id
  })

  return NextResponse.json({ data: leaveRequest })
}
```

---

### Phase 4: UI Components

#### 4.1 Notification Bell Component

**File**: `components/notifications/notification-bell.tsx`

```typescript
'use client'

import { useEffect, useState } from 'react'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export function NotificationBell() {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadNotifications()

    // Subscribe to new notifications
    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications'
      }, () => {
        loadNotifications()
      })
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [])

  async function loadNotifications() {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('read', false)
      .order('created_at', { ascending: false })
      .limit(5)

    if (data) {
      setNotifications(data)
      setUnreadCount(data.length)
    }
  }

  async function markAsRead(id: string, link?: string) {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id)

    if (link) {
      router.push(link)
    }

    loadNotifications()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-xs text-white flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No new notifications
          </div>
        ) : (
          notifications.map((notification: any) => (
            <DropdownMenuItem
              key={notification.id}
              onClick={() => markAsRead(notification.id, notification.link)}
              className="cursor-pointer p-4"
            >
              <div className="flex flex-col gap-1">
                <div className="font-medium">{notification.title}</div>
                <div className="text-sm text-muted-foreground">
                  {notification.message}
                </div>
              </div>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

#### 4.2 Add Notification Bell to Headers

**Admin Dashboard** (`components/layout/professional-header.tsx`):
```typescript
import { NotificationBell } from '@/components/notifications/notification-bell'

// In the header component
<div className="flex items-center gap-2">
  <NotificationBell />
  {/* ... existing header content ... */}
</div>
```

**Pilot Portal** (`app/portal/(protected)/layout.tsx`):
```typescript
import { NotificationBell } from '@/components/notifications/notification-bell'

// In the pilot portal layout
<div className="flex items-center gap-2">
  <NotificationBell />
  {/* ... existing header content ... */}
</div>
```

---

### Phase 5: Link Existing Pilot to Test User

**File**: `link-pilot-to-user.mjs`

```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

console.log('=== Linking Pilot to User Account ===\n')

// Find user by email
const email = 'mrondeau@airniugini.com.pg'
console.log(`Looking for user with email: ${email}`)

// Note: You'll need the service role key to query auth.users
// For now, you can get the user ID from Supabase dashboard
const userId = 'USER_ID_FROM_SUPABASE_DASHBOARD'

// Find pilot by name
console.log('Finding pilot record...')
const { data: pilots } = await supabase
  .from('pilots')
  .select('id, first_name, last_name')
  .or('email.eq.mrondeau@airniugini.com.pg,last_name.ilike.%rondeau%')

if (pilots && pilots.length > 0) {
  console.log('Found pilot:', pilots[0])

  // Update pilot with user_id
  const { error } = await supabase
    .from('pilots')
    .update({ user_id: userId })
    .eq('id', pilots[0].id)

  if (error) {
    console.error('Error linking pilot:', error)
  } else {
    console.log('✅ Pilot successfully linked to user account!')
  }
} else {
  console.log('❌ Pilot not found')
}
```

---

## Implementation Steps (Recommended Order)

### Step 1: Database Migration ⚠️ **MANUAL ACTION REQUIRED**

1. Go to Supabase SQL Editor: https://supabase.com/dashboard/project/wgdmgvonqysflwdiiols/sql/new
2. Run the following SQL:

```sql
-- Add user_id to pilots table
ALTER TABLE pilots
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX idx_pilots_user_id ON pilots(user_id);

COMMENT ON COLUMN pilots.user_id IS 'Links pilot record to Supabase Auth user for portal access';
```

3. Verify the column was added:

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'pilots' AND column_name = 'user_id';
```

### Step 2: Create Notifications Table

Run the notifications table SQL from Phase 1.2 above in Supabase SQL Editor.

### Step 3: Link Test Pilot to User

1. Get the user ID for `mrondeau@airniugini.com.pg` from Supabase Auth dashboard
2. Update the pilot record:

```sql
UPDATE pilots
SET user_id = 'USER_ID_HERE'
WHERE email = 'mrondeau@airniugini.com.pg'
   OR last_name ILIKE '%rondeau%';
```

### Step 4: Update Code

All code changes are outlined in Phases 2-4 above. The priority order is:

1. Create `notification-service.ts`
2. Update `pilot-service.ts` with `getPilotByUserId()`
3. Update pilot portal API endpoints to use `user_id` lookups
4. Add notifications to API endpoints
5. Create `NotificationBell` component
6. Add notification bell to headers

### Step 5: Test Complete Workflow

1. Pilot logs in → submits leave request
2. Admin receives notification
3. Admin approves/rejects request
4. Pilot receives notification
5. Both sides can see request status

---

## Testing Checklist

- [ ] Pilot can log in to portal
- [ ] Pilot can see their own data on dashboard
- [ ] Pilot can submit leave request
- [ ] Admin receives notification of new request
- [ ] Admin can view request in admin portal
- [ ] Admin can approve/reject request
- [ ] Pilot receives notification of status change
- [ ] Notification bell shows unread count
- [ ] Clicking notification navigates to correct page
- [ ] Marking notification as read updates count

---

## Technical Considerations

### Security

- RLS policies ensure users only see their own notifications
- Pilot portal API enforces user can only access their own data
- Admin notifications go to users with Admin or Manager role

### Performance

- Notifications table has indexes on `recipient_id` and unread status
- Real-time subscriptions use Supabase channels for instant updates
- Notification queries are limited to recent/unread items

### Scalability

- Notification system supports multiple admins
- Can easily add new notification types
- Service layer makes it easy to trigger notifications from anywhere

---

## Next Steps

Once the database migrations are complete and pilot-user linking is working:

1. Test leave bid submission end-to-end
2. Test flight request submission end-to-end
3. Test RDO/SDO request submission end-to-end
4. Verify notifications work in both directions
5. Add email notifications (optional enhancement)
6. Add push notifications (optional enhancement)

---

**Status**: ⚠️ **Awaiting Database Migration**

**Required Action**: Run SQL migrations in Supabase dashboard to add `user_id` column to `pilots` table and create `notifications` table.

Once migrations are complete, the implementation can proceed with code changes.
