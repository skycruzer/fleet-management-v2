# Pilot Portal Capability Spec Delta

**Change ID**: `add-missing-core-features`
**Capability**: `pilot-portal`
**Type**: NEW CAPABILITY
**Status**: Draft

---

## ADDED Requirements

### Requirement: Pilot Authentication

The system SHALL provide secure authentication for pilots to access their self-service portal separate from admin authentication.

**Rationale**: Pilots need dedicated login flow at `/pilot/login` to access personal data without admin credentials.

**Business Rules**:
- Pilots MUST authenticate using email and password
- Authentication MUST use existing Supabase Auth (no separate auth system)
- Failed login attempts MUST be rate-limited (5 attempts per 15 minutes)
- Session timeout MUST be 24 hours for pilot portal

#### Scenario: Successful Pilot Login

- **WHEN** a pilot navigates to `/pilot/login`
- **AND** enters valid email and password credentials
- **THEN** the system authenticates the pilot
- **AND** redirects to `/pilot/dashboard`
- **AND** creates a session cookie valid for 24 hours

#### Scenario: Failed Login - Invalid Credentials

- **WHEN** a pilot enters invalid email or password
- **THEN** the system displays error message "Invalid credentials"
- **AND** does NOT reveal whether email or password was incorrect (security)
- **AND** increments failed login attempt counter
- **AND** maintains user on `/pilot/login` page

#### Scenario: Rate Limiting - Too Many Failed Attempts

- **WHEN** a pilot fails login 5 times within 15 minutes
- **THEN** the system temporarily locks the account for 15 minutes
- **AND** displays message "Too many failed attempts. Try again in 15 minutes."
- **AND** sends email notification to pilot about lockout

#### Scenario: Logout

- **WHEN** an authenticated pilot clicks "Logout" button
- **THEN** the system terminates the session
- **AND** clears session cookies
- **AND** redirects to `/pilot/login`

---

### Requirement: Pilot Dashboard

The system SHALL provide a personalized dashboard for pilots showing certification status, leave balance, upcoming flights, and notifications.

**Rationale**: Pilots need at-a-glance view of critical information without navigating multiple pages.

**Business Rules**:
- Dashboard MUST display only data for authenticated pilot (no other pilots' data)
- Certification status MUST use FAA color coding (Red/Yellow/Green)
- Leave balance MUST reflect current roster period
- Dashboard MUST update in real-time when data changes

#### Scenario: View Dashboard After Login

- **WHEN** a pilot successfully logs in
- **THEN** the system displays `/pilot/dashboard`
- **AND** shows pilot's name, rank, and employee ID
- **AND** displays certification summary with color-coded status counts:
  - Red (Expired): count of expired certifications
  - Yellow (Expiring Soon ≤30 days): count of expiring certifications
  - Green (Current >30 days): count of current certifications
- **AND** shows available leave balance (days remaining in current roster period)
- **AND** lists next 5 upcoming certification expiries with dates
- **AND** displays notification count (unread notifications)

#### Scenario: Real-time Dashboard Updates

- **WHEN** a pilot is viewing their dashboard
- **AND** an admin approves a leave request for this pilot
- **THEN** the leave balance updates in real-time without page refresh
- **AND** a notification appears showing "Leave request approved"

#### Scenario: Expired Certifications Warning

- **WHEN** a pilot has 1 or more expired certifications (Red status)
- **THEN** the dashboard displays a prominent warning banner
- **AND** banner text reads "⚠️ You have [count] expired certifications. Please contact training immediately."
- **AND** clicking banner navigates to `/pilot/certifications` filtered to expired only

---

### Requirement: Pilot Self-Registration

The system SHALL allow new pilots to self-register for portal access with admin approval workflow.

**Rationale**: Streamlines onboarding process and reduces admin overhead for account creation.

**Business Rules**:
- Registration MUST require first name, last name, email, employee ID
- Email MUST be unique (no duplicate accounts)
- Employee ID MUST match existing pilot record in database
- Registration MUST go to admin approval queue (PENDING status)
- Pilots CANNOT log in until registration is APPROVED

#### Scenario: Successful Registration Submission

- **WHEN** a new pilot navigates to `/pilot/register`
- **AND** fills out registration form with:
  - First Name: "John"
  - Last Name: "Smith"
  - Email: "john.smith@example.com"
  - Employee ID: "P12345"
- **AND** clicks "Submit Registration"
- **THEN** the system validates employee ID matches existing pilot record
- **AND** creates registration request with status PENDING
- **AND** displays confirmation message "Registration submitted. You will receive an email when approved."
- **AND** sends email to admins about new registration

#### Scenario: Registration Rejected - Duplicate Email

- **WHEN** a pilot attempts to register with email already in system
- **THEN** the system displays error "Email already registered. Contact admin if you forgot your password."
- **AND** does NOT create duplicate registration

#### Scenario: Registration Rejected - Invalid Employee ID

- **WHEN** a pilot submits employee ID not in pilot database
- **THEN** the system displays error "Employee ID not found. Please contact admin."
- **AND** does NOT create registration (prevents unauthorized access)

#### Scenario: Admin Approves Registration

- **WHEN** an admin reviews registration at `/dashboard/admin/pilot-registrations`
- **AND** clicks "Approve" for a PENDING registration
- **THEN** the system creates pilot portal account
- **AND** updates registration status to APPROVED
- **AND** sends email to pilot with login instructions
- **AND** pilot can immediately log in at `/pilot/login`

#### Scenario: Admin Denies Registration

- **WHEN** an admin clicks "Deny" for a registration
- **AND** provides reason "Pilot no longer employed"
- **THEN** the system updates status to DENIED
- **AND** sends email to pilot with denial reason
- **AND** pilot cannot create new registration with same email for 30 days

---

### Requirement: Pilot Certifications View

The system SHALL provide read-only view of pilot's certifications with FAA color-coded expiry status.

**Rationale**: Pilots need visibility into their certification status to plan renewals.

**Business Rules**:
- Pilots MUST see only their own certifications (RLS enforced)
- Certifications MUST be color-coded by expiry status:
  - Red: Expired (days_until_expiry < 0)
  - Yellow: Expiring Soon (days_until_expiry ≤ 30)
  - Green: Current (days_until_expiry > 30)
- Certifications MUST be sortable by check type, expiry date, status
- Expired certifications MUST appear at top of list (default sort)

#### Scenario: View All Certifications

- **WHEN** a pilot navigates to `/pilot/certifications`
- **THEN** the system displays a table of all certifications with columns:
  - Check Type (e.g., "Line Check", "Proficiency Check")
  - Completion Date
  - Expiry Date
  - Days Until Expiry
  - Status (Red/Yellow/Green indicator)
- **AND** certifications are sorted by expiry date ascending (soonest first)
- **AND** expired certifications appear with red background highlight

#### Scenario: Filter Certifications by Status

- **WHEN** a pilot selects "Expired Only" filter
- **THEN** the system shows only certifications with status Red
- **AND** displays count "Showing [count] expired certifications"

#### Scenario: Sort Certifications

- **WHEN** a pilot clicks "Check Type" column header
- **THEN** the system re-sorts certifications alphabetically by check type
- **AND** maintains color coding and expiry status

---

### Requirement: Leave Request Submission

The system SHALL allow pilots to submit leave requests for specific roster periods with eligibility validation.

**Rationale**: Pilots need self-service leave bidding aligned to 28-day roster periods with seniority-based priority.

**Business Rules**:
- Leave requests MUST align to roster period boundaries (28-day cycles)
- Pilots MUST select leave type: RDO, WDO, ANNUAL
- System MUST validate minimum crew requirements (10 Captains + 10 First Officers per rank)
- System MUST show eligibility indicator (Green/Yellow/Red) before submission
- Leave requests MUST default to PENDING status
- Pilots CANNOT delete APPROVED leave requests (must contact admin)

#### Scenario: Submit Leave Request - Green Eligibility

- **WHEN** a pilot navigates to `/pilot/leave`
- **AND** selects roster period "RP3/2025"
- **AND** selects dates "2025-03-15 to 2025-03-21" (7 days)
- **AND** selects leave type "ANNUAL"
- **AND** clicks "Check Eligibility"
- **THEN** the system calculates remaining crew for pilot's rank
- **AND** displays "✅ Green - Likely to be approved (15 Captains available)"
- **WHEN** pilot clicks "Submit Request"
- **THEN** the system creates leave request with status PENDING
- **AND** displays confirmation "Leave request submitted successfully"

#### Scenario: Submit Leave Request - Yellow Eligibility Warning

- **WHEN** a pilot checks eligibility
- **AND** remaining crew for rank is exactly 10 (minimum threshold)
- **THEN** the system displays "⚠️ Yellow - May be approved based on seniority (10 Captains available, minimum met)"
- **AND** shows pilot's seniority number and priority ranking

#### Scenario: Submit Leave Request - Red Eligibility Blocked

- **WHEN** a pilot checks eligibility
- **AND** remaining crew for rank would drop below 10
- **THEN** the system displays "❌ Red - Cannot approve (would leave only 8 Captains, minimum is 10)"
- **AND** disables "Submit Request" button
- **AND** suggests alternative dates

#### Scenario: View Leave Request Status

- **WHEN** a pilot views their leave requests
- **THEN** the system displays table with columns:
  - Roster Period
  - Dates
  - Leave Type
  - Status (PENDING/APPROVED/DENIED)
  - Submission Date
  - Seniority Priority (if multiple requests for same dates)
- **AND** PENDING requests show "Awaiting admin approval"
- **AND** APPROVED requests show green checkmark
- **AND** DENIED requests show reason from admin

---

### Requirement: Flight Request Submission

The system SHALL allow pilots to submit flight requests for additional flying opportunities with admin approval workflow.

**Rationale**: Pilots need a formal channel to express interest in additional flights or route changes.

**Business Rules**:
- Flight requests MUST include route, dates, reason
- Requests MUST default to PENDING status
- Pilots MUST receive notification when request is APPROVED or DENIED
- Pilots CAN delete PENDING requests (not APPROVED/DENIED)

#### Scenario: Submit Flight Request

- **WHEN** a pilot navigates to `/pilot/flight-requests`
- **AND** clicks "New Flight Request"
- **AND** fills out form:
  - Route: "POM-LAE-POM"
  - Dates: "2025-04-10 to 2025-04-12"
  - Reason: "Request additional flying hours"
- **AND** clicks "Submit"
- **THEN** the system creates flight request with status PENDING
- **AND** displays "Flight request submitted. You will be notified when reviewed."
- **AND** sends notification to admins

#### Scenario: View Flight Request Status

- **WHEN** a pilot views `/pilot/flight-requests`
- **THEN** the system displays all their flight requests with:
  - Route
  - Dates
  - Status (PENDING/APPROVED/DENIED)
  - Admin Comments (if any)
  - Submission Date
- **AND** APPROVED requests show green indicator
- **AND** DENIED requests show red indicator with admin reason

#### Scenario: Delete Pending Flight Request

- **WHEN** a pilot clicks "Delete" on a PENDING request
- **AND** confirms deletion
- **THEN** the system soft-deletes the request
- **AND** displays "Request deleted successfully"

#### Scenario: Cannot Delete Approved Request

- **WHEN** a pilot tries to delete an APPROVED request
- **THEN** the system displays error "Cannot delete approved requests. Contact admin."
- **AND** does NOT delete the request

---

### Requirement: Pilot Profile Management

The system SHALL allow pilots to view and update their personal profile information (read-only for critical fields).

**Rationale**: Pilots need ability to update contact information and preferences.

**Business Rules**:
- Pilots CAN update: phone number, email (requires verification), emergency contact
- Pilots CANNOT update: name, rank, seniority number, employee ID (admin-only)
- Email changes MUST require verification (send confirmation email)

#### Scenario: View Profile

- **WHEN** a pilot navigates to `/pilot/profile`
- **THEN** the system displays:
  - Read-only fields: Name, Rank, Seniority Number, Employee ID, Commencement Date
  - Editable fields: Phone Number, Email, Emergency Contact Name, Emergency Contact Phone
- **AND** shows "Last Updated: [timestamp]"

#### Scenario: Update Phone Number

- **WHEN** a pilot updates phone number from "555-1234" to "555-5678"
- **AND** clicks "Save Changes"
- **THEN** the system validates phone number format
- **AND** updates profile
- **AND** displays "Profile updated successfully"

#### Scenario: Update Email - Requires Verification

- **WHEN** a pilot changes email from "old@example.com" to "new@example.com"
- **AND** clicks "Save Changes"
- **THEN** the system sends verification email to new address
- **AND** displays "Verification email sent to new@example.com. Click link to confirm."
- **AND** does NOT update email until verification link clicked
- **WHEN** pilot clicks verification link in email
- **THEN** the system updates email to "new@example.com"
- **AND** displays "Email verified and updated"

---

### Requirement: Pilot Notifications

The system SHALL provide real-time notifications for pilots regarding leave approvals, flight requests, and system updates.

**Rationale**: Pilots need timely updates on request status and important system changes.

**Business Rules**:
- Notifications MUST appear in real-time (using Supabase Realtime)
- Notifications MUST be dismissible
- Unread count MUST appear in dashboard header
- Notifications MUST persist until dismissed (not auto-delete)

#### Scenario: Receive Leave Approval Notification

- **WHEN** an admin approves a pilot's leave request
- **THEN** the system creates notification with:
  - Type: "LEAVE_APPROVED"
  - Message: "Your leave request for RP3/2025 has been approved"
  - Timestamp: Current UTC time
  - Read Status: Unread
- **AND** pilot sees notification in real-time (if online)
- **AND** notification count increments in header badge

#### Scenario: View Notifications

- **WHEN** a pilot clicks notification bell icon in header
- **THEN** the system displays dropdown with last 10 notifications
- **AND** unread notifications appear with blue dot indicator
- **AND** notifications are sorted by timestamp descending (newest first)

#### Scenario: Dismiss Notification

- **WHEN** a pilot clicks "X" on a notification
- **THEN** the system marks notification as read
- **AND** removes from notification list
- **AND** decrements unread count

---

## MODIFIED Requirements

_No existing requirements are modified by this change. All changes are additive (new capabilities)._

---

## REMOVED Requirements

_No requirements are removed by this change._

---

## RENAMED Requirements

_No requirements are renamed by this change._

---

## Implementation Notes

### Database Tables Required

1. **`pilot_registrations`**
   - Columns: id, first_name, last_name, email, employee_id, status (PENDING/APPROVED/DENIED), denial_reason, created_at, updated_at
   - RLS: Admins can see all, pilots can see only their own

2. **`pilot_notifications`**
   - Columns: id, pilot_id, type, message, read_status, created_at
   - RLS: Pilots can see only their own

### Service Layer

New services required:
- `lib/services/pilot-auth-service.ts` - Authentication logic
- `lib/services/pilot-registration-service.ts` - Registration CRUD
- `lib/services/pilot-notification-service.ts` - Notification management

Modified services:
- `lib/services/pilot-portal-service.ts` - Extend dashboard data aggregation

### Reuse Existing Logic

- **Leave Request Submission**: Reuse `lib/services/leave-eligibility-service.ts` for minimum crew validation
- **Roster Period Utilities**: Reuse `lib/utils/roster-utils.ts` for 28-day period calculations
- **Certification Color Coding**: Reuse `lib/utils/certification-utils.ts` for FAA status indicators
- **Supabase Auth**: Reuse existing authentication (no new auth system)

### Real-time Features

- **Notifications**: Use Supabase Realtime subscriptions on `pilot_notifications` table
- **Dashboard Updates**: Use Supabase Realtime for leave approval status changes

### Security

- **RLS Policies**: All new tables require policies restricting pilots to own data only
- **Role Checks**: Middleware enforces `/pilot/*` routes require Pilot role
- **Rate Limiting**: Implement on login endpoint (5 attempts per 15 minutes)

---

**Status**: Draft (Spec Delta)
**Validation Required**: Yes (openspec validate --strict)
**Breaking Changes**: No
**Backward Compatibility**: Yes (additive only)
