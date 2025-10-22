# Fleet Management V2 - User Guide

**B767 Pilot Management System**
**Air Niugini Fleet Operations**
**Version**: 2.0.0
**Last Updated**: October 22, 2025

---

## 📖 Table of Contents

1. [Getting Started](#getting-started)
2. [Pilot Portal](#pilot-portal)
3. [Admin Dashboard](#admin-dashboard)
4. [Features Guide](#features-guide)
5. [Troubleshooting](#troubleshooting)
6. [FAQ](#faq)

---

## 🚀 Getting Started

### Accessing the System

**Website**: https://fleet-management.example.com

**Login Credentials**:
- Pilots will receive login credentials via email
- Contact fleet management for account assistance

### First Time Login

1. Navigate to the login page
2. Enter your email address
3. Enter your password
4. Click "Sign In"

**Forgot Password?**
- Click "Forgot Password" on the login page
- Enter your email address
- Check your email for reset instructions

---

## 👨✈️ Pilot Portal

The Pilot Portal is your self-service hub for managing certifications, leave requests, flight requests, and providing feedback.

### Dashboard

**Access**: https://fleet-management.example.com/portal/dashboard

**Overview**:
- View your current certifications and expiry dates
- See upcoming leave requests
- Check pending flight requests
- View compliance status

**Key Metrics**:
- **Total Certifications**: Number of active certifications
- **Expiring Soon**: Certifications expiring in 60 days
- **Leave Approved**: Number of approved leave periods
- **Flight Requests**: Pending flight request status

---

### My Certifications

**Access**: Portal → My Certifications

**View Certifications**:
- All your certifications displayed in cards
- Color-coded status:
  - 🟢 **Green**: Valid (> 30 days remaining)
  - 🟡 **Yellow**: Expiring soon (≤ 30 days)
  - 🔴 **Red**: Expired

**Certification Details**:
- Check type (Line Check, SIM Check, etc.)
- Category (FLT, SIM, GRD, MED)
- Validity dates (Check Date, Expiry Date)
- Days until expiry
- Compliance status

**Actions**:
- Click on a certification to view full details
- Filter by category or status
- Search certifications by name
- Export to CSV for record keeping

---

### Leave Requests

**Access**: Portal → My Leave

#### Viewing Leave Requests

**Leave List**:
- **Pending**: Awaiting approval
- **Approved**: Approved leave periods
- **Rejected**: Denied requests (with reason)

**Request Details**:
- Roster period
- Start and end dates
- Number of days
- Type (Annual, Sick, etc.)
- Status and approval notes

#### Submitting Leave Requests

**Access**: Portal → My Leave → Submit Leave Request

**Steps**:
1. Select roster period from dropdown
2. Choose leave type (Annual, Sick, Compassionate, etc.)
3. Review selected dates
4. Add any notes or comments
5. Click "Submit Request"

**Important**:
- Leave requests must align with roster periods
- Submit early for best chance of approval
- Seniority determines priority if multiple requests overlap
- Check eligibility alerts for potential conflicts

**Eligibility System**:
- ⚠️ **Eligibility Alert**: Multiple pilots requesting same dates
- 📋 **Final Review**: 22 days before roster period starts
- Approval based on:
  1. Seniority number (lower = higher priority)
  2. Request submission date (earlier = better)

---

### Flight Requests

**Access**: Portal → Flight Requests → Submit Flight Request

**Request Types**:
- Additional flights
- Route changes
- Schedule preferences
- Training requests

**Steps**:
1. Click "Submit Flight Request"
2. Select request type
3. Fill in flight details
4. Add justification/notes
5. Submit for review

**Tracking**:
- View all submitted requests
- Check approval status
- Review admin feedback
- Track request history

---

### Feedback System

**Access**: Portal → Feedback → Submit Feedback

**Categories**:
- General feedback
- Operations
- Safety
- Training
- Scheduling
- System/IT
- Other

**Submission**:
1. Select category
2. Enter subject line
3. Write detailed feedback
4. Choose anonymous (optional)
5. Submit

**Features**:
- Anonymous submissions supported
- Direct line to fleet management
- All feedback reviewed
- Helps improve operations

---

## 🎛️ Admin Dashboard

The Admin Dashboard provides comprehensive fleet management tools for administrators and managers.

### Dashboard Home

**Access**: https://fleet-management.example.com/dashboard

**Overview**:
- Fleet-wide metrics
- Expiring certifications
- Compliance status
- Leave requests
- Quick actions

**Key Metrics**:
- Total Pilots
- Active Certifications
- Expiring (30/60/90 days)
- Leave Requests (Pending/Approved)

**Recent Activity**:
- Latest certification updates
- New leave requests
- System alerts

---

### Pilot Management

**Access**: Dashboard → Pilots

#### Viewing Pilots

**Pilot List**:
- All B767 pilots
- Sortable columns (Name, Rank, Seniority, Status)
- Search by name, rank, or seniority
- Filter by status (Active, Inactive)
- Pagination (25 pilots per page)

**Pilot Card**:
- Name and rank
- Seniority number
- Email and phone
- Current status
- Compliance indicator

**Actions**:
- View pilot details
- Edit pilot information
- View certifications
- View leave history

#### Adding New Pilot

**Access**: Dashboard → Pilots → Add New Pilot

**Required Information**:
- First name, last name
- Rank (Captain, First Officer)
- Email address
- Phone number
- Seniority number
- Date of birth
- Hire date
- Contract type

**Optional**:
- Emergency contact
- Address
- Notes

**Steps**:
1. Click "Add New Pilot"
2. Fill in required fields
3. Add optional information
4. Click "Create Pilot"
5. System creates user account automatically

#### Editing Pilot Information

**Access**: Pilot detail page → Edit

**Editable Fields**:
- Contact information
- Status (Active/Inactive)
- Qualifications
- Contract type
- Notes

**Qualifications** (Captains only):
- Line Captain
- Training Captain
- Examiner
- RHS Captain expiry date

---

### Certification Management

**Access**: Dashboard → Certifications

#### Viewing Certifications

**List View**:
- All certifications across fleet
- Filter by:
  - Pilot name
  - Check type
  - Category (FLT, SIM, GRD, MED)
  - Status (Valid, Expiring, Expired)
- Sort by expiry date, check date, pilot
- Export to CSV

**Grouped View**:
- Group by check type
- See all pilots' status for each check
- Quick compliance overview

#### Adding Certification

**Access**: Dashboard → Certifications → Add Certification

**Required**:
- Pilot (select from dropdown)
- Check type (Line Check, SIM Check, etc.)
- Check date
- Expiry date (auto-calculated based on check type)

**Steps**:
1. Click "Add Certification"
2. Select pilot
3. Select check type
4. Enter check date
5. Review auto-calculated expiry
6. Add notes if needed
7. Click "Create"

**Validation**:
- Check date cannot be in future
- Expiry automatically calculated
- Prevents duplicate active certifications

#### Bulk Operations

**Export**:
- Export all certifications to CSV
- Filter first, then export
- Includes all relevant data
- Timestamp in filename

**Notifications**:
- System automatically flags expiring certifications
- 90/60/30 day warnings
- Dashboard shows expiry statistics

---

### Leave Management

**Access**: Dashboard → Leave Requests

#### Reviewing Leave Requests

**Request List**:
- All leave requests
- Filter by:
  - Status (Pending, Approved, Rejected)
  - Roster period
  - Pilot
- Sort by submission date, dates

**Request Details**:
- Pilot name and rank
- Roster period
- Date range
- Leave type
- Days requested
- Submission date
- Status

**Eligibility Information**:
- Remaining crew (Captains/FOs separately)
- Other pending requests for same dates
- Conflicts or alerts
- Approval recommendation

#### Approving/Rejecting Requests

**Approval Criteria**:
- Minimum 10 Captains must remain available
- Minimum 10 First Officers must remain available
- Evaluated by rank separately
- Priority by seniority, then submission date

**Steps**:
1. Review request details
2. Check eligibility information
3. Review other pending requests
4. Click "Approve" or "Reject"
5. Add notes (required for rejections)
6. Confirm action

**Batch Processing**:
- Review multiple requests at once
- Filter by roster period
- Approve/reject in bulk
- Export for records

---

### Analytics

**Access**: Dashboard → Analytics

**Available Reports**:
- Fleet compliance overview
- Certification expiry distribution
- Leave usage trends
- Pilot demographics
- Training completion rates

**Filters**:
- Date range
- Rank (Captain, First Officer)
- Status (Active, Inactive)
- Check type

**Export**:
- Download charts as images
- Export data to CSV
- Print-friendly format

---

### Admin Settings

**Access**: Dashboard → Admin → Settings

#### User Management

**View Users**:
- All system users
- Roles (Admin, Manager, Pilot)
- Status (Active, Inactive)

**Add User**:
- Create new admin/manager accounts
- Assign roles and permissions
- Set initial password

**Edit User**:
- Update roles
- Reset password
- Deactivate accounts

#### Check Types

**Manage Check Types**:
- Add new certification types
- Edit existing types
- Set validity periods
- Assign categories

**Fields**:
- Check name
- Category (FLT, SIM, GRD, MED)
- Validity months
- Description

---

## 🎯 Features Guide

### Search Functionality

**Global Search**:
- Available on all list pages
- Real-time filtering
- Search across multiple fields
- Results count displayed

**Pilots Search**:
- By name
- By rank
- By seniority number

**Certifications Search**:
- By pilot name
- By check type
- By category

### Export Features

**CSV Export**:
- Available on pilots and certifications lists
- Includes all filtered data
- Timestamped filenames
- Excel-compatible format

**Usage**:
1. Apply filters (optional)
2. Click "Export to CSV"
3. File downloads automatically
4. Open in Excel or Google Sheets

### Dark Mode

**Toggle Dark Mode**:
- Click sun/moon icon in header
- Choose Light, Dark, or System
- Preference saved automatically
- Works across all pages

**System Mode**:
- Automatically matches your device theme
- Changes with system settings
- Smooth transitions

### Mobile Support

**Responsive Design**:
- Fully functional on phones and tablets
- Touch-optimized buttons (44px minimum)
- Swipe gestures for navigation
- Mobile-friendly forms

**Mobile Navigation**:
- Hamburger menu on mobile
- Swipe from left edge to open menu
- Swipe left to close menu
- Quick access to all features

### Offline Support (PWA)

**Progressive Web App**:
- Install on home screen (mobile)
- Works offline (view cached data)
- Push notifications (when enabled)
- App-like experience

**Installing**:
1. Open in mobile browser
2. Tap "Add to Home Screen"
3. Confirm installation
4. Launch from home screen icon

---

## 🔧 Troubleshooting

### Login Issues

**Problem**: Cannot log in
- **Solution**: Verify email and password
- Check caps lock is off
- Try password reset
- Contact admin if account locked

**Problem**: Password reset not working
- **Solution**: Check spam folder for email
- Ensure using correct email address
- Wait 5 minutes for email delivery
- Contact support if no email received

### Page Loading Issues

**Problem**: Page won't load
- **Solution**: Refresh the page (Cmd/Ctrl + R)
- Clear browser cache
- Try different browser
- Check internet connection

**Problem**: Data not updating
- **Solution**: Hard refresh (Cmd/Ctrl + Shift + R)
- Log out and log back in
- Clear browser cookies
- Contact support if persists

### Form Submission Issues

**Problem**: Form won't submit
- **Solution**: Check all required fields filled
- Look for error messages
- Ensure valid data format
- Try again after 30 seconds

**Problem**: Changes not saving
- **Solution**: Check internet connection
- Verify all fields are valid
- Try clearing form and re-entering
- Contact support with error details

### Mobile Issues

**Problem**: Menu won't open on mobile
- **Solution**: Tap hamburger icon (three lines)
- Try swiping from left edge
- Refresh page
- Update browser

**Problem**: Buttons too small to tap
- **Solution**: Enable zoom in browser settings
- Use landscape orientation
- All buttons are 44px minimum (report if smaller)

---

## ❓ FAQ

### General

**Q: How do I change my password?**
A: Click your profile icon → Settings → Change Password

**Q: Can I access the system on mobile?**
A: Yes! The system is fully responsive and mobile-optimized.

**Q: Is there a mobile app?**
A: The system is a Progressive Web App (PWA) - install it from your browser for an app-like experience.

### Pilots

**Q: How do I know if my certifications are expiring?**
A: Check your dashboard - expiring certifications show in yellow (≤30 days) or red (expired).

**Q: How do I request leave?**
A: Portal → My Leave → Submit Leave Request

**Q: Can I cancel a leave request?**
A: Contact fleet management to cancel approved requests. Delete pending requests from the leave list.

**Q: Why was my leave request rejected?**
A: Check the rejection notes. Usually due to minimum crew requirements or seniority priority.

**Q: How far in advance should I submit leave?**
A: As early as possible. Submissions are processed 22 days before the roster period starts.

### Administrators

**Q: How do I add a new pilot?**
A: Dashboard → Pilots → Add New Pilot

**Q: Can I approve multiple leave requests at once?**
A: Yes, filter by roster period and process in batch.

**Q: How do I export data?**
A: Click "Export to CSV" button on pilots or certifications pages.

**Q: How do I add a new check type?**
A: Dashboard → Admin → Check Types → Add Check Type

**Q: Can I see audit logs?**
A: Contact system administrator for audit log access.

---

## 📞 Support

### Contact Information

**Fleet Management Office**:
- **Email**: fleet@example.com
- **Phone**: +675 XXX XXXX
- **Hours**: Monday-Friday, 8:00 AM - 5:00 PM

**Technical Support**:
- **Email**: support@example.com
- **Emergency**: +675 XXX XXXX (24/7)

### Reporting Issues

**Bug Reports**:
1. Document the issue
2. Take screenshots if possible
3. Note what you were trying to do
4. Email details to support@example.com

**Feature Requests**:
- Use the Feedback system in Pilot Portal
- Email suggestions to fleet@example.com

---

**Fleet Management V2**
*B767 Pilot Management System*
*Air Niugini Fleet Operations*
*Version 2.0.0 - Production Ready*
