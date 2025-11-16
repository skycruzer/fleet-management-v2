# Manual Testing Guide - Pilot Portal Features

## Test Credentials
- **Pilot Portal**: mrondeau@airniugini.com.pg / mron2393
- **Admin Portal**: mrondeau@airniugini.com.pg / mron2393

## Features to Test

### 1. Roster Period Display ✅

**URL**: http://localhost:3000/portal/dashboard

**Steps**:
1. Login to pilot portal
2. View dashboard
3. **Verify**:
   - Roster period card appears at top
   - Shows "ACTIVE PERIOD" with current period code (e.g., RP12/2025)
   - Shows countdown: "X days remaining"
   - Shows progress bar
   - Shows "NEXT UP" section with next period details

**Expected Result**: Beautiful card with current/next roster periods and live countdown

---

### 2. Feedback History Page ✅

**URL**: http://localhost:3000/portal/feedback/history

**Steps**:
1. Login to pilot portal
2. Click "Feedback History" in sidebar (should have Clock icon)
3. **Verify**:
   - Page title: "Feedback History"
   - Statistics cards show: Total Feedback, Under Review, Resolved
   - Feedback list shows past submissions
   - Each feedback card shows:
     - Category badge (colored)
     - Status badge (Submitted/Under Review/Resolved)
     - Subject and message
     - Submission date
     - Admin response (if any) in highlighted section

**Expected Result**: Complete feedback history with status tracking

---

### 3. Notifications System ✅

**Location**: Top of sidebar/header

**Steps**:
1. Login to pilot portal
2. **Verify**:
   - Notification bell icon visible
   - Badge shows unread count (if any)
   - Click bell to open notifications panel
   - Notifications list appears

**Expected Result**: Working notification bell with panel

---

### 4. Leave Request Status Notifications ✅

**Admin Action Required**

**Steps**:
1. **Pilot**: Submit a leave request
   - Go to `/portal/leave-requests`
   - Click "Request Leave"
   - Fill form and submit

2. **Admin**: Approve/Deny the request
   - Login to admin portal: http://localhost:3000/auth/login
   - Navigate to leave requests management
   - Find the pilot's request
   - Approve or Deny with comments

3. **Pilot**: Check for notification
   - Return to pilot portal
   - **Verify**:
     - Notification bell shows badge
     - Notification appears: "✅ Leave Request Approved" or "❌ Leave Request Denied"
     - Message includes dates and admin comments
     - Link goes to `/portal/leave-requests`

**Expected Result**: Pilot receives notification when leave request status changes

---

### 5. Feedback Response Notifications ✅

**Admin Action Required**

**Steps**:
1. **Pilot**: Submit feedback
   - Go to `/portal/feedback`
   - Fill form:
     - Category: Any
     - Subject: "Test Notification Workflow"
     - Message: "Testing admin response notification"
   - Submit (can be anonymous or not)

2. **Admin**: Respond to feedback
   - Login to admin portal
   - Navigate to feedback management
   - Find pilot's feedback
   - Add admin response: "Thank you for your feedback!"
   - Save/Submit

3. **Pilot**: Check for notification
   - Return to pilot portal (may need to refresh)
   - **Verify**:
     - Notification bell shows badge
     - Notification appears: "💬 Feedback Response Received"
     - Message: "An administrator has responded to your feedback: 'Test Notification Workflow'"
     - Link goes to `/portal/feedback/history`
     - Feedback history shows admin response in highlighted section

**Expected Result**: Pilot receives notification when admin responds to feedback

---

## Complete Workflow Test

### End-to-End Scenario

1. **Pilot Submits Feedback**:
   ```
   Login → Feedback → Submit → Logout
   ```

2. **Admin Responds**:
   ```
   Login → Feedback Management → Find Feedback → Add Response → Save
   ```

3. **Pilot Receives Notification**:
   ```
   Login → See Notification Badge → Click Bell → See "Feedback Response Received" → Click Link → View Response in History
   ```

---

## Known Limitations

- ❌ **Flight Request Notifications**: Not implemented yet (admin API doesn't exist)
- ✅ **Leave Request Notifications**: Fully working
- ✅ **Feedback Response Notifications**: Fully working

---

## Test Checklist

- [ ] Pilot can login successfully
- [ ] Dashboard shows roster period card
- [ ] Roster card shows current period with countdown
- [ ] Roster card shows next period
- [ ] Sidebar has "Feedback History" link
- [ ] Feedback history page loads
- [ ] Feedback history shows statistics
- [ ] Can submit new feedback
- [ ] Notification bell is visible
- [ ] Admin can login
- [ ] Admin can view feedback
- [ ] Admin can respond to feedback
- [ ] Pilot receives notification for feedback response
- [ ] Notification links to correct page
- [ ] Feedback history shows admin response

---

## Troubleshooting

**No notifications appearing?**
- Check notification bell badge count
- Refresh page after admin action
- Check browser console for errors

**Feedback history empty?**
- Submit test feedback first
- Wait a moment and refresh

**Admin can't find feedback?**
- Verify admin has correct permissions
- Check if feedback management route exists
- Verify admin is logged in

---

## Developer Notes

**Service Layer**:
- `lib/services/notification-service.ts` - Notification CRUD
- `lib/services/feedback-service.ts` - Feedback management (line 409-424: notification trigger)
- `app/api/leave-requests/[id]/review/route.ts` - Leave notification trigger

**UI Components**:
- `components/portal/roster-period-card.tsx` - Roster display
- `app/portal/(protected)/feedback/history/page.tsx` - Feedback history
- `components/layout/pilot-portal-sidebar.tsx` - Navigation with feedback history link

**Database**:
- `notifications` table stores all notifications
- `pilot_feedback` table stores feedback with admin responses
- `pilot_requests` table stores leave/flight requests

