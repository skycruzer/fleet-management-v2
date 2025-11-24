# Browser Testing Checklist - Pilot Portal Features

## 🌐 Open Your Browser and Follow These Steps

### Test 1: Roster Period Card ✅
**URL**: http://localhost:3000/portal/login

1. Open browser and go to http://localhost:3000/portal/login
2. **Login**:
   - Email: `mrondeau@airniugini.com.pg`
   - Password: `mron2393`
   - Click "Login"

3. **On Dashboard** - Look for the roster period card at the top:
   - [ ] Card titled "Roster Period" is visible
   - [ ] Shows "ACTIVE PERIOD" badge
   - [ ] Displays current roster code (e.g., RP12/2025)
   - [ ] Shows countdown: "X days remaining"
   - [ ] Shows progress bar
   - [ ] Shows "NEXT UP" section with next period
   - [ ] Design looks clean with gradient colors

**EXPECTED**: Beautiful card showing current RP12/2025 or RP13/2025 with live countdown

---

### Test 2: Feedback History Link ✅
**Stay on Dashboard**

4. **Check Sidebar**:
   - [ ] Scroll down sidebar navigation
   - [ ] Find "Feedback History" menu item
   - [ ] Item has Clock icon (⏰)
   - [ ] Item shows description: "View past feedback"

**EXPECTED**: New menu item appears between "Feedback" and bottom of navigation

---

### Test 3: Feedback History Page ✅
**Click the Feedback History link**

5. **Page loads** (URL: /portal/feedback/history):
   - [ ] Page title: "Feedback History"
   - [ ] "New Feedback" button in header
   - [ ] Three statistics cards:
     - Total Feedback
     - Under Review
     - Resolved
   - [ ] Each card shows a number

6. **Feedback List** (if you have submitted feedback before):
   - [ ] Feedback cards show category badges (colored)
   - [ ] Status badges (Submitted/Under Review/Resolved)
   - [ ] Subject and message are visible
   - [ ] Submission date shows "X days/hours ago"

**EXPECTED**: Professional feedback history page with stats and list

---

### Test 4: Submit Test Feedback ✅
**Click "New Feedback" button or go to /portal/feedback**

7. **Fill Feedback Form**:
   - Category: Select "System"
   - Subject: "Browser Test - Notification Workflow"
   - Message: "Testing if admin response triggers notification"
   - Anonymous: Leave unchecked
   - Click "Submit Feedback"

8. **After Submission**:
   - [ ] Success message appears OR
   - [ ] Redirects to feedback history
   - [ ] New feedback appears in history list

**EXPECTED**: Feedback submitted successfully and appears in history

---

### Test 5: Admin Responds to Feedback ✅
**Open NEW BROWSER TAB** (keep pilot portal open)

9. **Admin Login** - Go to http://localhost:3000/auth/login:
   - Email: `mrondeau@airniugini.com.pg`
   - Password: `mron2393`
   - Click "Login"

10. **Navigate to Feedback** (route may vary):
    - Look for "Feedback" in sidebar/menu
    - Or go directly to dashboard and find feedback section
    - Find the feedback you just submitted: "Browser Test - Notification Workflow"

11. **Add Admin Response**:
    - Click on the feedback item
    - Find response/reply field
    - Type: "Thank you for testing! This notification system is working correctly."
    - Click "Submit" or "Send Response"
    - [ ] Response saved successfully

**EXPECTED**: Admin can view and respond to pilot feedback

---

### Test 6: Pilot Receives Notification 🔔
**Switch back to PILOT PORTAL TAB**

12. **Refresh the page** (F5 or Cmd+R):
    - [ ] Look at notification bell icon (top of sidebar)
    - [ ] Bell shows red badge with number "1"
    - [ ] Click the notification bell

13. **Notification Panel Opens**:
    - [ ] Panel/dropdown appears
    - [ ] Notification shows:
      - Title: "💬 Feedback Response Received"
      - Message: "An administrator has responded to your feedback: 'Browser Test - Notification Workflow'"
    - [ ] Click on the notification

14. **Redirects to Feedback History**:
    - [ ] Page navigates to /portal/feedback/history
    - [ ] Your feedback card shows admin response section
    - [ ] Response text appears in highlighted blue/green area
    - [ ] Response timestamp shows "Responded X minutes ago"

**EXPECTED**: Notification appears, clicking it shows feedback with admin response

---

### Test 7: Leave Request Notification ✅
**Stay in Pilot Portal**

15. **Submit Leave Request**:
    - Click "Leave Requests" in sidebar
    - Click "Request Leave" button
    - Fill form:
      - Type: "ANNUAL"
      - Start Date: Pick a date 7+ days in future
      - End Date: Pick date 2-3 days after start
      - Reason: "Browser test for notifications"
    - Submit request

16. **Switch to Admin Tab** again:
    - Navigate to leave requests management
    - Find the new request
    - Click "Approve" (or "Deny" to test that flow)
    - Add comment: "Approved for testing purposes"
    - Submit approval

17. **Back to Pilot Tab**:
    - Refresh page
    - [ ] Notification bell shows new badge
    - [ ] Click bell
    - [ ] New notification: "✅ Leave Request Approved" (or "❌ Denied")
    - [ ] Message includes dates and admin comment
    - [ ] Click notification
    - [ ] Goes to /portal/leave-requests
    - [ ] Request shows "APPROVED" status

**EXPECTED**: Leave approval triggers notification with comments

---

## ✅ Success Criteria

All checkboxes should be marked:
- [ ] Roster period card displays correctly
- [ ] Feedback history link appears in sidebar
- [ ] Feedback history page loads with stats
- [ ] Can submit new feedback
- [ ] Admin can respond to feedback
- [ ] Pilot receives notification for feedback response
- [ ] Notification links to correct page
- [ ] Feedback history shows admin response
- [ ] Leave request approval sends notification
- [ ] All notifications appear in notification bell

---

## 🐛 Troubleshooting

**Notification badge not showing?**
- Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
- Check browser console (F12) for errors
- Verify admin action completed successfully

**Feedback history empty?**
- Submit at least one feedback first
- Check if you're logged in as correct pilot

**Can't find admin feedback page?**
- Check admin sidebar navigation
- Try URL: http://localhost:3000/dashboard/feedback (if exists)
- Verify you're logged in as admin

**Roster period not showing?**
- Check browser console for errors
- Verify component is imported correctly
- Hard refresh the page

---

## 📸 Screenshots Recommended

Take screenshots of:
1. Roster period card on dashboard
2. Feedback history page with admin response
3. Notification bell with badge
4. Notification panel open showing messages

---

## 🎯 Quick Test Summary

**Pilot Flow**: Login → See Roster Card → Submit Feedback → Receive Notification
**Admin Flow**: Login → Find Feedback → Add Response
**Verification**: Pilot sees notification and admin response in history

**Total Time**: ~10 minutes for complete workflow test

