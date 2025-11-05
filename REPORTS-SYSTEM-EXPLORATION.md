# Reports System - Comprehensive Exploration

## Executive Summary

The Fleet Management V2 reports system is a modern, feature-rich reporting platform that supports generating, previewing, exporting to PDF, and emailing reports for three core business areas: Leave Requests, Flight Requests, and Certifications. The system follows a clean service-layer architecture with React Hook Form for filtering and jsPDF for PDF generation.

---

## 1. REPORTS PAGE LOCATION AND STRUCTURE

### 1.1 Page Hierarchy

```
app/dashboard/reports/
├── page.tsx                    (Server component, metadata)
└── reports-client.tsx          (Client component, main UI)
```

### 1.2 File Locations

| File | Type | Purpose |
|------|------|---------|
| `/Users/skycruzer/Desktop/fleet-management-v2/app/dashboard/reports/page.tsx` | Server | Entry point, metadata setup |
| `/Users/skycruzer/Desktop/fleet-management-v2/app/dashboard/reports/reports-client.tsx` | Client | Main UI shell with tab navigation |

### 1.3 Page Structure

**Page.tsx** (Server Component):
- Sets metadata: `title: 'Reports | Fleet Management'`
- Returns `<ReportsClient />` component
- Minimal server-side logic

**ReportsClient.tsx** (Client Component):
- Tabbed interface with three main sections:
  1. Leave Requests Report
  2. Flight Requests Report
  3. Certifications Report
- Uses shadcn/ui Tabs, Card components
- Icons from Lucide (Calendar, Plane, Award)
- Each tab contains a form component
- Features info box describing report capabilities

### 1.4 Navigation Access

- Accessed via `/dashboard/reports` route
- Listed in professional-sidebar-client.tsx at line 123-124
- Title: 'Reports'

---

## 2. REPORTS API ROUTES

### 2.1 API Endpoint Summary

```
app/api/reports/
├── preview/route.ts          (POST - Generate report data for preview)
├── export/route.ts           (POST - Generate PDF for download)
└── email/route.ts            (POST - Send report via email)
```

### 2.2 Detailed API Routes

#### **POST /api/reports/preview**

**File**: `/Users/skycruzer/Desktop/fleet-management-v2/app/api/reports/preview/route.ts`

**Purpose**: Generate report data without PDF generation for browser preview

**Request Body**:
```typescript
{
  reportType: 'leave' | 'flight-requests' | 'certifications'
  filters?: ReportFilters
}
```

**Response**:
```typescript
{
  success: boolean
  report?: ReportData
  error?: string
}
```

**Flow**:
1. Receives `reportType` and `filters`
2. Validates `reportType` is provided
3. Calls `generateReport(reportType, filters)` from reports-service
4. Returns structured report data with summary and data array
5. Error handling with 400/500 status codes

**Key Functions**:
- `generateReport()` - Routes to appropriate report generator
- Status codes: 400 (missing reportType), 500 (generation error)

---

#### **POST /api/reports/export**

**File**: `/Users/skycruzer/Desktop/fleet-management-v2/app/api/reports/export/route.ts`

**Purpose**: Generate and download PDF file

**Request Body**:
```typescript
{
  reportType: 'leave' | 'flight-requests' | 'certifications'
  filters?: ReportFilters
}
```

**Response**: PDF binary stream with headers

**Headers Returned**:
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="[reportType]-report-[date].pdf"
Content-Length: [size]
```

**Flow**:
1. Generates report data with `generateReport()`
2. Converts to PDF with `generatePDF()`
3. Creates filename: `{reportType}-report-{YYYY-MM-DD}.pdf`
4. Converts Buffer to Uint8Array
5. Returns as downloadable attachment

**Key Functions**:
- `generateReport()` - Gets report data
- `generatePDF()` - Converts to PDF using jsPDF
- Status codes: 400 (missing reportType), 500 (generation error)

---

#### **POST /api/reports/email**

**File**: `/Users/skycruzer/Desktop/fleet-management-v2/app/api/reports/email/route.ts`

**Purpose**: Generate report and send via email using Resend

**Request Body**:
```typescript
{
  reportType: ReportType
  filters?: ReportFilters
  recipients: string[]
  subject?: string
  message?: string
}
```

**Response**:
```typescript
{
  success: boolean
  messageId?: string
  error?: string
}
```

**Dependencies**:
- Resend.com email service
- Environment variables:
  - `RESEND_API_KEY`
  - `RESEND_FROM_EMAIL` (defaults to 'reports@fleetmanagement.com')

**Flow**:
1. Validates `reportType` and `recipients`
2. Generates report data with `generateReport()`
3. Generates PDF with `generatePDF()`
4. Builds email HTML with summary and report metadata
5. Sends via `resend.emails.send()` with PDF attachment
6. Returns Resend message ID on success

**Email Template Features**:
- Report title and description
- Generated timestamp
- Summary statistics as HTML list
- PDF attachment (auto-generated filename)
- Automated footer identifying system

**Status Codes**: 400 (missing params), 500 (send error)

---

## 3. REPORTS COMPONENTS

### 3.1 Component Tree

```
ReportsClient (main shell)
├── LeaveReportForm
│   ├── Form (React Hook Form)
│   ├── ReportPreviewDialog
│   └── ReportEmailDialog
├── FlightRequestReportForm
│   ├── Form (React Hook Form)
│   ├── ReportPreviewDialog
│   └── ReportEmailDialog
└── CertificationReportForm
    ├── Form (React Hook Form)
    ├── ReportPreviewDialog
    └── ReportEmailDialog
```

### 3.2 Component File Locations

| Component | File Path | Type | Purpose |
|-----------|-----------|------|---------|
| ReportsClient | `components/reports/(reports not shown in list)` | Client | Main tab container |
| LeaveReportForm | `components/reports/leave-report-form.tsx` | Client | Leave report filtering UI |
| FlightRequestReportForm | `components/reports/flight-request-report-form.tsx` | Client | Flight request report filtering UI |
| CertificationReportForm | `components/reports/certification-report-form.tsx` | Client | Certification report filtering UI |
| ReportPreviewDialog | `components/reports/report-preview-dialog.tsx` | Client | Preview modal with data table |
| ReportEmailDialog | `components/reports/report-email-dialog.tsx` | Client | Email dialog with recipient input |

### 3.3 Component Details

#### **LeaveReportForm**

**File**: `/Users/skycruzer/Desktop/fleet-management-v2/components/reports/leave-report-form.tsx`

**Features**:
- Date range picker (Start Date, End Date)
- Multi-select roster periods (RP1/2025 through RP13/2026)
- Status checkboxes: Pending, Approved, Rejected
- Rank checkboxes: Captain, First Officer
- Three action buttons: Preview, Export PDF, Email Report

**State Management**:
```typescript
const [isLoading, setIsLoading] = useState(false)
const [previewData, setPreviewData] = useState<ReportData | null>(null)
const [showPreview, setShowPreview] = useState(false)
const [showEmail, setShowEmail] = useState(false)
```

**Validation Schema** (Zod):
```typescript
{
  startDate: string (optional)
  endDate: string (optional)
  rosterPeriods: string[] (array of "RP#/YYYY")
  statusPending: boolean
  statusApproved: boolean
  statusRejected: boolean
  rankCaptain: boolean
  rankFirstOfficer: boolean
}
```

**Handlers**:
- `handlePreview()` - Calls `/api/reports/preview`, opens preview dialog
- `handleExport()` - Calls `/api/reports/export`, downloads PDF
- `handleEmail()` - Opens email dialog (passes filters)

**Roster Period Generation**:
- Auto-generates RP1-RP13 for 2025 and 2026
- Format: "RP1/2025", "RP2/2025", ..., "RP13/2026"
- Displayed in 6-column grid with scrollable container

---

#### **CertificationReportForm**

**File**: `/Users/skycruzer/Desktop/fleet-management-v2/components/reports/certification-report-form.tsx`

**Features**:
- Date range: Completion Date From/To
- Expiry Threshold dropdown:
  - All Certifications
  - Expiring within 30/60/90/120/180 days
- Multi-select roster periods
- Multi-select check types (fetched from API)
- Rank filters: Captain, First Officer
- Three action buttons: Preview, Export PDF, Email Report

**Key Differences from Leave Form**:
- Uses `expiryThreshold` (integer, days) instead of status
- Uses `checkTypes` (array of check type IDs)
- Fetches check types on component mount via `/api/check-types`
- Check types displayed in 3-column grid

**Data Fetching**:
```typescript
useEffect(() => {
  async function fetchCheckTypes() {
    const response = await fetch('/api/check-types')
    const result = await response.json()
    if (result.success) {
      setCheckTypes(result.data)
    }
  }
  fetchCheckTypes()
}, [])
```

**Check Type Interface**:
```typescript
interface CheckType {
  id: string
  check_code: string
  check_description: string
  category: string | null
}
```

---

#### **FlightRequestReportForm**

**File**: `/Users/skycruzer/Desktop/fleet-management-v2/components/reports/flight-request-report-form.tsx`

**Features**:
- Date range: Departure From, Return Through (flight_date field)
- Status checkboxes: Pending, Approved, Rejected
- Rank checkboxes: Captain, First Officer
- **NO roster period filtering** (flight_requests table doesn't have roster_period column)
- Three action buttons: Preview, Export PDF, Email Report

**Key Differences**:
- Simplest form (no roster periods or check types)
- Date fields named "Departure From" and "Return Through" (UX clarity)
- Filters comments note that flight_requests doesn't have roster_period

---

#### **ReportPreviewDialog**

**File**: `/Users/skycruzer/Desktop/fleet-management-v2/components/reports/report-preview-dialog.tsx`

**Features**:
- Modal dialog with max-width-5xl
- Scrollable content area
- Summary statistics card (grid of key metrics)
- Data table with scrollable body (400px height)
- Report-type-specific table columns
- Status badges with color coding

**Summary Display**:
- Grid layout (2 columns on mobile, 4 on desktop)
- Displays all keys from `reportData.summary`
- Auto-formats key names: "totalRequests" → "Total Requests"

**Table Columns by Report Type**:

*Leave Reports*:
- Pilot | Rank | Type | Start Date | End Date | Status | Roster Period

*Flight Requests*:
- Pilot | Rank | Destination | Departure | Return | Purpose | Status

*Certifications*:
- Pilot | Rank | Check Type | Completion | Expiry | Days Until Expiry | Status

**Status Badges**:
- Leave: approved (default), rejected (destructive), other (secondary)
- Flight: Same as leave
- Certifications: EXPIRED (destructive), EXPIRING SOON (default), CURRENT (secondary)

**Icons**: Report-type icons (Calendar, Plane, Award) in title

---

#### **ReportEmailDialog**

**File**: `/Users/skycruzer/Desktop/fleet-management-v2/components/reports/report-email-dialog.tsx`

**Features**:
- Modal dialog for email configuration
- Three form fields:
  1. Recipients (required) - comma-separated emails
  2. Subject (optional) - custom email subject
  3. Message (optional) - custom email body

**Validation Schema**:
```typescript
{
  recipients: string (min 1 character, auto-split by comma)
  subject: string (optional)
  message: string (optional)
}
```

**Email Processing**:
1. Splits recipients string by comma
2. Trims whitespace from each email
3. POSTs to `/api/reports/email` with:
   - reportType
   - filters
   - recipients array
   - subject (optional)
   - message (optional)

**Success Flow**:
1. Shows success toast with recipient count
2. Closes dialog
3. Resets form

**Error Handling**:
- Toast displays error message from API
- Prevents dialog close on error

---

## 4. REPORTS SERVICES

### 4.1 Service File

**Location**: `/Users/skycruzer/Desktop/fleet-management-v2/lib/services/reports-service.ts`

**Author**: Maurice Rondeau
**Date**: November 4, 2025

### 4.2 Service Functions

#### **generateLeaveReport(filters: ReportFilters): Promise<ReportData>**

**Purpose**: Fetch and summarize leave request data

**Query Structure**:
```typescript
from('leave_requests').select(`
  *,
  pilot:pilots!leave_requests_pilot_id_fkey (
    first_name,
    last_name,
    employee_id,
    role
  )
`)
```

**Filters Applied**:
1. **dateRange**: `gte('start_date', startDate).lte('end_date', endDate)`
2. **status**: `in('status', status_array)` - pending, approved, rejected
3. **rosterPeriod** (single): `eq('roster_period', period)`
4. **rosterPeriods** (multiple): `in('roster_period', periods_array)`
5. **rank**: Filtered client-side by comparing `pilot.role`

**Summary Statistics**:
- `totalRequests` - Total filtered records
- `pending` - Count of pending status
- `approved` - Count of approved status
- `rejected` - Count of rejected status
- `captainRequests` - Count where pilot.role = 'Captain'
- `firstOfficerRequests` - Count where pilot.role = 'First Officer'

**Return Structure**:
```typescript
{
  title: 'Leave Requests Report'
  description: 'Comprehensive report of all leave requests'
  generatedAt: ISO string
  generatedBy: 'System'
  filters: ReportFilters (echo back)
  data: array of leave requests with pilot relations
  summary: statistics object
}
```

---

#### **generateFlightRequestReport(filters: ReportFilters): Promise<ReportData>**

**Purpose**: Fetch and summarize flight request data

**Query Structure**:
```typescript
from('flight_requests').select(`
  *,
  pilot:pilots!flight_requests_pilot_id_fkey (
    first_name,
    last_name,
    employee_id,
    role
  )
`)
```

**Filters Applied**:
1. **dateRange**: `gte('flight_date', startDate).lte('flight_date', endDate)`
2. **status**: `in('status', status_array)`
3. **rank**: Filtered client-side
4. **NOTE**: No roster period filtering (column doesn't exist)

**Summary Statistics**:
- `totalRequests`
- `pending`
- `approved`
- `rejected`
- `uniqueDescriptions` - Count of unique description values

**Return Structure**: Same as LeaveReport

---

#### **generateCertificationsReport(filters: ReportFilters): Promise<ReportData>**

**Purpose**: Fetch and summarize certification/check data

**Query Structure**:
```typescript
from('pilot_checks').select(`
  *,
  pilot:pilots!pilot_checks_pilot_id_fkey (
    first_name,
    last_name,
    employee_id,
    role
  ),
  check_type:check_types!pilot_checks_check_type_id_fkey (
    check_code,
    check_description,
    category
  )
`)
```

**Filters Applied**:
1. **dateRange**: Filters on `completion_date` range
2. **checkType** (single): `eq('check_type_id', id)`
3. **checkTypes** (multiple): `in('check_type_id', ids_array)`
4. **rank**: Filtered client-side
5. **expiryThreshold**: Filtered after calculating days until expiry

**Calculated Fields** (added to data):
```typescript
{
  daysUntilExpiry: Math.floor((expiryDate - today) / ms_per_day)
  isExpired: daysUntilExpiry < 0
  isExpiringSoon: daysUntilExpiry >= 0 && daysUntilExpiry <= 90
}
```

**Summary Statistics**:
- `totalCertifications`
- `expired` - Count where isExpired = true
- `expiringSoon` - Count where isExpiringSoon = true && isExpired = false
- `current` - Count where neither expired nor expiring soon
- `uniquePilots` - Count of distinct pilot_ids

**Return Structure**: Same as LeaveReport

---

#### **generatePDF(report: ReportData, reportType: ReportType): Buffer**

**Purpose**: Convert ReportData to PDF using jsPDF

**Libraries Used**:
- `jsPDF` - PDF document generation
- `jsPDF-autotable` - Table plugin for jsPDF

**PDF Structure**:

1. **Header Section**:
   - Title (20pt, centered, bold)
   - Generated timestamp (10pt, centered)

2. **Summary Section**:
   - Section title (14pt, bold)
   - Key-value pairs (10pt, normal)
   - Spacing: 6pt between lines

3. **Data Table** (report-type specific):
   - Uses autoTable plugin
   - Blue header styling: `fillColor: [41, 128, 185]`
   - Font size: 8pt
   - Cell padding: 2px

4. **Table Columns by Type**:

   **Leave**:
   ```
   Pilot | Rank | Type | Start Date | End Date | Status | Roster Period
   ```

   **Flight Requests**:
   ```
   Pilot | Rank | Type | Flight Date | Description | Status
   ```

   **Certifications**:
   ```
   Pilot | Rank | Check Type | Completion | Expiry | Days Until Expiry | Status
   ```

5. **Status Cell Coloring** (Certifications only):
   - EXPIRED: Red (rgb(231, 76, 60)), bold
   - EXPIRING SOON: Orange/Yellow (rgb(241, 196, 15)), bold
   - Current: Default color

6. **Footer**:
   - Page numbers: "Page X of Y" centered at bottom

**Return**: Buffer object containing PDF binary data

---

#### **generateReport(reportType: ReportType, filters: ReportFilters): Promise<ReportData>**

**Purpose**: Router function to dispatch to appropriate generator

**Routing Logic**:
```typescript
switch(reportType) {
  case 'leave': return generateLeaveReport(filters)
  case 'flight-requests': return generateFlightRequestReport(filters)
  case 'certifications': return generateCertificationsReport(filters)
  default: throw Error(`Unknown report type: ${reportType}`)
}
```

---

### 4.3 Service Architecture Patterns

**Database Access**:
- Uses `createClient()` from `@/lib/supabase/server`
- Single Supabase client per function
- Error handling with `.error` check

**Data Transformation**:
- Joins via foreign key relations in select statement
- Client-side filtering for rank (no FK constraint from pilot.role)
- Post-processing for calculated fields (certifications)

**Summary Calculation**:
- Array methods: `filter()`, `map()`, `Set` for uniqueness
- Stateless pure functions
- All filtering happens in memory (after fetch)

---

## 5. CURRENT FEATURES

### 5.1 Report Types Available

| Report Type | Data Source | Key Metrics | Filters |
|------------|-------------|------------|---------|
| **Leave Requests** | `leave_requests` table | Total, Pending, Approved, Rejected, by Rank | Date Range, Status, Rank, Roster Period |
| **Flight Requests** | `flight_requests` table | Total, Pending, Approved, Rejected, Unique Descriptions | Date Range, Status, Rank |
| **Certifications** | `pilot_checks` table | Total, Expired, Expiring Soon, Current, Unique Pilots | Date Range, Expiry Threshold (30-180 days), Rank, Check Type |

### 5.2 Data Visualization

**Preview Dialog**:
- Summary statistics in responsive grid (2-4 columns)
- Scrollable data table (400px height)
- Status badges with color coding
- Report metadata (title, generation time)

**PDF Export**:
- Professional formatted document
- Header with title and timestamp
- Summary statistics section
- Tabular data with color-coded status
- Page numbers
- Proper sizing for printing

**Email**:
- HTML formatted message
- Summary displayed as unordered list
- PDF attachment with meaningful filename
- Automated from address and custom subject support

### 5.3 Export/Email Capabilities

**PDF Export**:
- Downloads with auto-generated filename: `{reportType}-report-{YYYY-MM-DD}.pdf`
- Proper Content-Type: `application/pdf`
- Content-Disposition: `attachment`
- Handles large datasets with pagination (jsPDF auto-pages)

**Email Delivery**:
- Via Resend.com service
- Multiple recipients supported (comma-separated list)
- Optional custom subject and message
- Auto-generated default subject and template
- PDF attachment included
- Automated signature

### 5.4 Filtering/Search Functionality

**Leave Requests Report Filters**:
- Date range (inclusive)
- Multiple status selection: Pending, Approved, Rejected
- Multiple rank selection: Captain, First Officer
- Multiple roster period selection: RP1-RP13 for 2025-2026

**Flight Requests Report Filters**:
- Date range (departure date)
- Multiple status selection
- Multiple rank selection
- *(No roster period - not applicable to flight_requests table)*

**Certifications Report Filters**:
- Completion date range
- Expiry threshold presets: 30, 60, 90, 120, 180 days
- Multiple roster period selection
- Multiple check type selection (dynamic, fetched from DB)
- Multiple rank selection

**Filter Combinations**:
- All filters are cumulative (AND logic)
- Optional filters can be left blank
- At least one selection in multi-selects activates filter

---

## 6. DATABASE SCHEMA

### 6.1 Tables Used in Reports

#### **leave_requests Table**

**Primary Columns**:
- `id` - UUID primary key
- `pilot_id` - FK to pilots
- `start_date` - Date of leave start
- `end_date` - Date of leave end
- `roster_period` - String like "RP1/2025"
- `status` - Enum: pending, approved, rejected
- `leave_type` - Type of leave (RDO, SDO, ANNUAL, SICK, LSL, LWOP, MATERNITY, COMPASSIONATE)
- `created_at` - Timestamp

**Relations**:
- Foreign key: `pilot_id` → pilots(id)
- Foreign key: `approved_by` → users(id)

---

#### **flight_requests Table**

**Primary Columns**:
- `id` - UUID primary key
- `pilot_id` - FK to pilots
- `flight_date` - Date of flight
- `destination` - Flight destination
- `departure_date` - Departure date
- `return_date` - Return date
- `purpose` - Purpose/description of flight
- `request_type` - Type of request (RDO, SDO, etc.)
- `status` - Enum: pending, approved, rejected
- `description` - Additional notes

**Relations**:
- Foreign key: `pilot_id` → pilots(id)
- Foreign key: `reviewed_by` → users(id)

**Note**: Does NOT have `roster_period` column

---

#### **pilot_checks Table**

**Primary Columns**:
- `id` - UUID primary key
- `pilot_id` - FK to pilots
- `check_type_id` - FK to check_types
- `completion_date` - When check was completed
- `expiry_date` - When check expires
- `created_at` - Record creation timestamp

**Calculated in Reports**:
- `daysUntilExpiry` - Difference between expiry_date and today
- `isExpired` - daysUntilExpiry < 0
- `isExpiringSoon` - daysUntilExpiry between 0 and 90

**Relations**:
- Foreign key: `pilot_id` → pilots(id)
- Foreign key: `check_type_id` → check_types(id)

---

#### **pilots Table**

**Columns Used in Reports**:
- `id` - UUID primary key
- `first_name` - First name
- `last_name` - Last name
- `employee_id` - Employee ID
- `role` - Enum: Captain, First Officer
- `is_active` - Boolean

**Relations**:
- Referenced by: leave_requests, flight_requests, pilot_checks

---

#### **check_types Table**

**Columns**:
- `id` - UUID primary key
- `check_code` - Code like "BASE", "AMP-SIM"
- `check_description` - Full description
- `category` - Category grouping (for reporting)

**Relations**:
- Referenced by: pilot_checks

---

### 6.2 Database Views (if used for reporting)

**Note**: Current reports-service uses direct table queries, not views. However, these views are available in the system:

- `pilot_checks_overview` - Simplified view of pilot checks
- `expiring_checks` - Pre-calculated expiring certifications
- `detailed_expiring_checks` - Enhanced expiring data
- `pilot_report_summary` - Comprehensive pilot summaries

*Current implementation does NOT leverage these views - all calculations done in application layer.*

---

## 7. ARCHITECTURAL PATTERNS

### 7.1 Service Layer Pattern

**Implementation**:
- All database operations in `reports-service.ts`
- API routes call service functions, don't query Supabase directly
- Separation of concerns: Data fetching, filtering, calculation

**Benefits**:
- Reusable across components and API routes
- Testable business logic
- Single source of truth for data transformation

---

### 7.2 Form Handling Pattern

**Technology Stack**:
- React Hook Form (form state management)
- Zod (schema validation)
- shadcn/ui components (form UI)

**Pattern**:
1. Define Zod schema with all filter fields
2. Create useForm hook with resolver
3. Build ReportFilters object from form values
4. POST to API with structured data
5. Handle response in component state

---

### 7.3 Dialog Pattern

**Two Dialog Types**:

1. **ReportPreviewDialog**:
   - Controlled by parent component state
   - Receives reportData as prop
   - Read-only display of report contents

2. **ReportEmailDialog**:
   - Controlled by parent component state
   - Receives reportType and filters as props
   - Posts to API and handles result

---

### 7.4 Error Handling

**API Routes**:
- Try-catch wrapping all async operations
- Console logging for debugging
- NextResponse JSON with success flag
- Meaningful error messages
- HTTP status codes: 400 (client), 500 (server)

**Components**:
- Toast notifications for user feedback
- Loading states to prevent double-submission
- Form validation via Zod
- Disabled buttons during async operations

---

## 8. TECHNOLOGY STACK

| Component | Technology | Version | Purpose |
|-----------|----------|---------|---------|
| **Forms** | React Hook Form | 7.65.0 | Form state & validation |
| **Validation** | Zod | 4.1.12 | Schema validation |
| **PDF Generation** | jsPDF | Latest | PDF document creation |
| **PDF Tables** | jsPDF-autotable | Latest | Table plugin for jsPDF |
| **Email** | Resend | Latest | Email delivery service |
| **UI Components** | shadcn/ui | Latest | Dialog, Card, Tabs, Input, Checkbox, etc. |
| **Icons** | Lucide React | Latest | Calendar, Plane, Award, Mail, Download, Eye |
| **Backend** | Next.js | 16.0.0 | API routes, SSR |
| **Database** | Supabase/PostgreSQL | Latest | Data source |

---

## 9. ENVIRONMENT CONFIGURATION

**Required Environment Variables** (for email functionality):

```env
RESEND_API_KEY=<API key from Resend.com>
RESEND_FROM_EMAIL=<sender email, defaults to reports@fleetmanagement.com>
```

**Optional**:
- Both variables have fallbacks in code

---

## 10. DATA FLOW DIAGRAMS

### 10.1 Report Generation Flow

```
User Form Submission
         ↓
Form Validation (Zod)
         ↓
Build ReportFilters Object
         ↓
POST to /api/reports/preview (or export/email)
         ↓
API Route Receives Request
         ↓
generateReport(reportType, filters) → reports-service.ts
         ↓
Database Query (Supabase)
         ↓
Data Transformation & Filtering
         ↓
Calculate Summary Statistics
         ↓
Return ReportData Object
         ↓
[Preview] Show in Dialog
[Export] generatePDF() → Download PDF
[Email] Send via Resend with PDF
```

### 10.2 Component Communication Flow

```
ReportsClient (Tabs)
    ├── LeaveReportForm
    │   ├── onPreview() → /api/reports/preview → ReportPreviewDialog
    │   ├── onExport() → /api/reports/export → Download
    │   └── onEmail() → ReportEmailDialog
    │       └── onSubmit() → /api/reports/email
    │
    ├── FlightRequestReportForm
    │   └── (same pattern)
    │
    └── CertificationReportForm
        └── (same pattern)
```

---

## 11. API PAYLOAD EXAMPLES

### 11.1 Leave Report Request

```json
{
  "reportType": "leave",
  "filters": {
    "dateRange": {
      "startDate": "2025-01-01",
      "endDate": "2025-12-31"
    },
    "rosterPeriods": ["RP1/2025", "RP2/2025"],
    "status": ["approved"],
    "rank": ["Captain"]
  }
}
```

### 11.2 Certification Report Request

```json
{
  "reportType": "certifications",
  "filters": {
    "dateRange": {
      "startDate": "2025-01-01",
      "endDate": "2025-12-31"
    },
    "expiryThreshold": 90,
    "checkTypes": ["check_type_id_1", "check_type_id_2"],
    "rank": ["Captain", "First Officer"]
  }
}
```

### 11.3 Email Report Request

```json
{
  "reportType": "leave",
  "filters": { ... },
  "recipients": ["manager@company.com", "admin@company.com"],
  "subject": "Monthly Leave Report",
  "message": "Please find the leave report attached."
}
```

---

## 12. KEY FILES SUMMARY

| File | Lines | Purpose |
|------|-------|---------|
| `app/dashboard/reports/page.tsx` | 20 | Server component, metadata |
| `app/dashboard/reports/reports-client.tsx` | 116 | Main UI shell with tabs |
| `components/reports/leave-report-form.tsx` | 360 | Leave filtering form |
| `components/reports/flight-request-report-form.tsx` | 299 | Flight request filtering form |
| `components/reports/certification-report-form.tsx` | 422 | Certification filtering form |
| `components/reports/report-preview-dialog.tsx` | 196 | Preview modal |
| `components/reports/report-email-dialog.tsx` | 193 | Email modal |
| `lib/services/reports-service.ts` | 387 | Report generation logic |
| `types/reports.ts` | 55 | TypeScript type definitions |
| `app/api/reports/preview/route.ts` | 42 | Preview API endpoint |
| `app/api/reports/export/route.ts` | 57 | PDF export API endpoint |
| `app/api/reports/email/route.ts` | 97 | Email API endpoint |

**Total**: ~2,644 lines of code (excluding dependencies)

---

## 13. POTENTIAL IMPROVEMENTS & EXTENSIBILITY

### 13.1 Current Limitations

1. **Roster Period Filtering**: Only available for Leave and Certifications, not Flight Requests (by design - table structure)
2. **Client-Side Rank Filtering**: Rank filter applied after data fetch (performance consideration for large datasets)
3. **PDF Styling**: Limited to basic colors, could benefit from branding
4. **Email Templates**: Uses simple HTML, could use template engines
5. **Report Caching**: No caching of generated reports
6. **Pagination**: Large datasets could benefit from pagination instead of full load

### 13.2 Extensibility Points

1. **New Report Types**: Add case to `generateReport()` switch, create new form component
2. **Additional Filters**: Extend ReportFilters interface, update form components
3. **Custom PDF Styling**: Modify `generatePDF()` function
4. **Email Templates**: Parameterize HTML in `/api/reports/email`
5. **Data Export Formats**: Add export to CSV/Excel alongside PDF
6. **Scheduled Reports**: Could add background job support (via bull/queue)

---

## Conclusion

The reports system is a well-architected, feature-complete solution for generating, previewing, exporting, and emailing operational reports. It follows Next.js and React best practices, maintains clean separation of concerns through service-layer pattern, and provides a modern user experience with interactive filtering and multiple export options.

The system successfully consolidates reporting for three critical business processes (leave, flights, certifications) into a unified interface while maintaining data integrity through proper Supabase relationships and type safety through TypeScript.
