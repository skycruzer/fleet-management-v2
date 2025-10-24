# Certification Renewal Planning System

## Overview

The Certification Renewal Planning System is an intelligent load-balancing system that distributes pilot certification renewals across 28-day roster periods throughout the year. This prevents clustering of renewals and ensures operational capacity is maintained.

**Key Benefits:**

- ✅ Prevents certification renewal bottlenecks
- ✅ Distributes workload across the entire year
- ✅ Respects grace period rules for different certification types
- ✅ Provides capacity utilization visibility
- ✅ Enables proactive planning and scheduling

---

## System Architecture

### Database Tables

#### 1. `certification_renewal_plans`

Main table storing renewal plans for each pilot certification.

**Columns:**

- `id` - Unique identifier
- `pilot_id` - Reference to pilots table
- `check_type_id` - Reference to check_types table
- `original_expiry_date` - When the certification expires
- `planned_renewal_date` - Planned date for renewal
- `planned_roster_period` - Assigned roster period (e.g., "RP12/2025")
- `renewal_window_start` - Earliest date renewal can occur
- `renewal_window_end` - Latest date renewal can occur (expiry date)
- `status` - Current status (planned, confirmed, completed, cancelled)
- `priority` - Priority score (0-10, higher = more urgent)
- `paired_pilot_id` - Optional paired pilot for simulator checks
- `notes` - Additional notes

**Constraints:**

- `planned_renewal_date` must fall between `renewal_window_start` and `renewal_window_end`
- Priority must be between 0-10

#### 2. `roster_period_capacity`

Defines capacity limits for each roster period by certification category.

**Columns:**

- `roster_period` - Period identifier (e.g., "RP12/2025")
- `period_start_date` - Start date of roster period
- `period_end_date` - End date of roster period
- `max_pilots_per_category` - JSONB object with capacity limits

**Default Capacity Limits:**

```json
{
  "Pilot Medical": 4,
  "Flight Checks": 4,
  "Simulator Checks": 6,
  "Ground Courses Refresher": 8
}
```

#### 3. `renewal_plan_history`

Audit trail for all changes to renewal plans.

**Columns:**

- `id` - Unique identifier
- `renewal_plan_id` - Reference to certification_renewal_plans
- `change_type` - Type of change (date_change, status_change, etc.)
- `previous_date` - Date before change
- `new_date` - Date after change
- `reason` - Reason for change
- `changed_by` - User who made the change
- `changed_at` - Timestamp of change

---

## Grace Period Rules

Different certification types have different grace periods - the time window before expiry when renewal is allowed:

| Category                      | Grace Period | Renewal Window        |
| ----------------------------- | ------------ | --------------------- |
| **Pilot Medical**             | 28 days      | 28 days before expiry |
| **Flight Checks**             | 90 days      | 90 days before expiry |
| **Simulator Checks**          | 90 days      | 90 days before expiry |
| **Ground Courses Refresher**  | 60 days      | 60 days before expiry |
| **ID Cards**                  | 0 days       | On expiry date only   |
| **Foreign Pilot Work Permit** | 0 days       | On expiry date only   |
| **Travel Visa**               | 0 days       | On expiry date only   |

**Example:**

- Medical certification expires: December 15, 2025
- Grace period: 28 days
- Renewal window: November 17, 2025 - December 15, 2025
- System will assign to any roster period within this window

---

## Load Balancing Algorithm

### How It Works

1. **Fetch Expiring Certifications**
   - Query all certifications expiring in the next N months (default: 12)
   - Filter by category if specified

2. **Calculate Renewal Windows**
   - For each certification, calculate start and end dates based on grace period
   - Example: Medical expiring Dec 15 → Window: Nov 17 - Dec 15

3. **Find Eligible Roster Periods**
   - Get all roster periods that overlap with the renewal window
   - Example: Window Nov 17 - Dec 15 might include RP11/2025 and RP12/2025

4. **Load Balancing**
   - For each eligible period, calculate current load (renewals already assigned)
   - Assign certification to period with lowest load
   - Respect capacity limits per category

5. **Date Clamping**
   - Set planned date to roster period start date
   - If period start is before renewal window start, clamp to window start
   - If period start is after renewal window end, clamp to window end
   - **Critical:** This ensures `planned_renewal_date` always falls within the valid renewal window

6. **Priority Calculation**
   - Calculate priority based on days until expiry
   - < 30 days = priority 9-10 (critical)
   - 30-60 days = priority 7-8 (high)
   - 60-90 days = priority 5-6 (medium)
   - > 90 days = priority 1-4 (low)

### Code Reference

See `lib/services/certification-renewal-planning-service.ts` function `generateRenewalPlan()` for implementation details.

---

## User Interface

### 1. Main Dashboard (`/dashboard/renewal-planning`)

**Purpose:** Overview of all roster periods with capacity utilization

**Features:**

- Quick stats: Total planned renewals, overall utilization, high-risk periods
- Grid of roster period cards showing:
  - Period name and date range
  - Utilization percentage with color coding (green/yellow/red)
  - Category breakdown (top 4 categories)
  - Total renewals vs capacity
- High-risk period alerts (>80% utilization)
- Export CSV button
- Generate Plan button

**Utilization Color Coding:**

- 🟢 **Green** = Good utilization (<60%)
- 🟡 **Yellow** = Medium utilization (60-80%)
- 🔴 **Red** = High utilization (>80%)

### 2. Roster Period Detail Page (`/dashboard/renewal-planning/roster-period/[period]`)

**Purpose:** Detailed view of a specific roster period's renewal schedule

**Features:**

- Period summary cards:
  - Total renewals vs capacity
  - Utilization percentage
  - Number of categories
- Capacity breakdown by category with progress bars
- Tables of renewals grouped by category showing:
  - Pilot name and employee ID
  - Check type and description
  - Original expiry date
  - Planned renewal date
  - Priority score
  - Status
- High utilization warning if >80%
- Back to planning button

**URL Format:** `/dashboard/renewal-planning/roster-period/RP12%2F2025`

- Note: Forward slash is URL encoded as `%2F`
- System automatically decodes this to `RP12/2025`

### 3. Generate Plan Page (`/dashboard/renewal-planning/generate`)

**Purpose:** Configure and trigger renewal plan generation

**Features:**

- **Planning Horizon:** Number of months to plan ahead (default: 12)
- **Category Filter:** Select specific categories to plan (optional)
- **Clear Existing Plans:** Checkbox to delete existing plans before generating
- **Preview Mode:** See what would be generated without saving
- **Generate Button:** Execute plan generation

**Workflow:**

1. Optionally clear existing plans
2. Set planning horizon (e.g., 12 months)
3. Optionally filter by categories
4. Click "Generate Renewal Plan"
5. System creates plans and redirects to dashboard
6. Success toast shows number of plans created

---

## API Endpoints

### 1. Generate Renewal Plans

**Endpoint:** `POST /api/renewal-planning/generate`

**Request Body:**

```json
{
  "monthsAhead": 12,
  "categories": ["Pilot Medical", "Flight Checks"],
  "pilotIds": ["uuid1", "uuid2"]
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "totalPlans": 247,
    "byCategory": {
      "Pilot Medical": 45,
      "Flight Checks": 38,
      "Simulator Checks": 89,
      "Ground Courses Refresher": 75
    },
    "rosterPeriodSummary": {
      "RP12/2025": 15,
      "RP13/2025": 18,
      "RP01/2026": 12
    }
  }
}
```

### 2. Clear All Plans

**Endpoint:** `DELETE /api/renewal-planning/clear`

**Response:**

```json
{
  "success": true,
  "message": "All renewal plans have been cleared"
}
```

### 3. Export CSV

**Endpoint:** `GET /api/renewal-planning/export`

**Response:** CSV file download

**CSV Headers:**

- Roster Period
- Pilot Name
- Employee ID
- Role
- Seniority
- Check Code
- Check Description
- Category
- Original Expiry
- Planned Renewal
- Renewal Window Start
- Renewal Window End
- Status
- Priority
- Paired With
- Notes

**Filename Format:** `renewal-plans-YYYY-MM-DD.csv`

---

## Service Layer Functions

### Core Functions

#### `generateRenewalPlan(options?)`

Generates renewal plans for all expiring certifications using load balancing.

**Parameters:**

```typescript
{
  monthsAhead?: number,    // Default: 12
  categories?: string[],   // Optional category filter
  pilotIds?: string[]      // Optional pilot filter
}
```

**Returns:** Array of created renewal plans with full details

---

#### `getRosterPeriodCapacity(period: string)`

Gets capacity summary for a specific roster period.

**Parameters:**

- `period` - Roster period code (e.g., "RP12/2025")

**Returns:**

```typescript
{
  rosterPeriod: string,
  periodStartDate: Date,
  periodEndDate: Date,
  totalCapacity: number,
  totalPlannedRenewals: number,
  utilizationPercentage: number,
  categoryBreakdown: {
    [category: string]: {
      capacity: number,
      plannedCount: number
    }
  }
}
```

---

#### `getRenewalsByRosterPeriod(period: string)`

Gets all renewal plans for a specific roster period.

**Parameters:**

- `period` - Roster period code

**Returns:** Array of renewal plans with pilot and check type details

---

#### `updateRenewalPlan(id: string, updates)`

Updates an existing renewal plan.

**Parameters:**

- `id` - Renewal plan UUID
- `updates` - Object with fields to update

**Returns:** Updated renewal plan

---

#### `getRenewalPlansByPilot(pilotId: string)`

Gets all renewal plans for a specific pilot.

**Parameters:**

- `pilotId` - Pilot UUID

**Returns:** Array of renewal plans

---

## Common Use Cases

### Use Case 1: Generate Initial Plans

**Scenario:** First time setup, need to plan all renewals for the next year

**Steps:**

1. Navigate to `/dashboard/renewal-planning/generate`
2. Set "Months Ahead" to 12
3. Leave category filter empty (all categories)
4. Check "Clear existing plans" if any test data exists
5. Click "Generate Renewal Plan"
6. Review results on dashboard

**Expected Outcome:**

- All certifications expiring in next 12 months are planned
- Plans distributed across roster periods
- Capacity utilization balanced

---

### Use Case 2: Review High-Risk Periods

**Scenario:** Some roster periods show high utilization (>80%)

**Steps:**

1. View dashboard at `/dashboard/renewal-planning`
2. Look for red-colored period cards
3. Check "High Risk Periods" alert box
4. Click on a high-risk period to view details
5. Review which categories are over-utilized
6. Consider manual rescheduling or capacity adjustment

**Expected Outcome:**

- Identify bottleneck periods
- See which categories are causing issues
- Plan mitigation strategies

---

### Use Case 3: Export for External Planning

**Scenario:** Need to share renewal schedule with training department

**Steps:**

1. Navigate to `/dashboard/renewal-planning`
2. Click "Export CSV" button
3. File downloads as `renewal-plans-YYYY-MM-DD.csv`
4. Open in Excel/Google Sheets
5. Filter/sort as needed

**Expected Outcome:**

- Complete renewal schedule in spreadsheet format
- Can be shared with stakeholders
- Easy to analyze in external tools

---

### Use Case 4: Regenerate Plans for Specific Categories

**Scenario:** Medical certification requirements changed, need to replan only medical renewals

**Steps:**

1. Navigate to `/dashboard/renewal-planning/generate`
2. Set "Months Ahead" to 12
3. Select only "Pilot Medical" in category filter
4. Check "Clear existing plans" (will only clear medical plans)
5. Click "Generate Renewal Plan"

**Expected Outcome:**

- Only medical certification plans regenerated
- Other categories unchanged
- Updated distribution based on new requirements

---

## Capacity Management

### Viewing Capacity Utilization

**Dashboard Level:**

- Overall utilization percentage across all periods
- Count of high-risk periods (>80%)
- Visual color coding on period cards

**Period Level:**

- Total renewals vs total capacity
- Breakdown by category with progress bars
- Warning message if >80% utilized

### Adjusting Capacity Limits

Capacity limits are defined in the `roster_period_capacity` table.

**To adjust:**

1. Access database directly (Supabase dashboard)
2. Update `max_pilots_per_category` JSONB field
3. Example:

```sql
UPDATE roster_period_capacity
SET max_pilots_per_category = jsonb_set(
  max_pilots_per_category,
  '{Pilot Medical}',
  '6'
)
WHERE roster_period = 'RP12/2025';
```

**Recommended Limits:**

- Pilot Medical: 4 (1 per week)
- Flight Checks: 4 (1 per week)
- Simulator Checks: 6 (2 per week, can pair pilots)
- Ground Courses: 8 (can handle larger groups)

---

## Troubleshooting

### Issue: Plans not generating

**Symptoms:** Generate button clicked but no plans created

**Possible Causes:**

1. No certifications expiring in the planning window
2. Database connection issue
3. RLS policy blocking inserts

**Solution:**

1. Check browser console for errors
2. Verify certifications exist with expiry dates in range
3. Check Supabase logs for policy violations

---

### Issue: High utilization across all periods

**Symptoms:** Most periods showing >80% utilization

**Possible Causes:**

1. Many certifications expiring around the same time
2. Capacity limits too low
3. Grace periods too short

**Solution:**

1. Consider staggering certification expiry dates when issuing renewals
2. Increase capacity limits if operationally feasible
3. Review grace period settings

---

### Issue: "Unknown" showing for pilot names

**Symptoms:** Roster period detail page shows "Unknown" instead of pilot names

**Possible Causes:**

1. Supabase relationship not configured correctly
2. RLS policy blocking pilot data access
3. Join query syntax issue

**Solution:**

1. Check Supabase relationship configuration
2. Verify RLS policies allow reading pilot data
3. Review service layer join queries

---

### Issue: Constraint violation error

**Symptoms:** Database error about `valid_renewal_window` constraint

**Possible Causes:**

1. Planned date falls outside renewal window
2. Date clamping logic not working
3. Invalid input dates

**Solution:**

1. Verify date clamping logic in `generateRenewalPlan()`
2. Check that planned date is between window start and end
3. Review input certification data for validity

---

## Future Enhancements

### Planned Features

1. **Manual Rescheduling**
   - Drag-and-drop interface to move renewals between periods
   - Automatic capacity validation
   - Conflict detection

2. **Pairing Automation**
   - Automatic pilot pairing for simulator checks
   - Consider seniority and crew pairing rules
   - Optimize for efficiency

3. **Email Notifications**
   - Notify pilots of scheduled renewals
   - Reminders at 30, 14, 7 days before
   - Admin alerts for high utilization

4. **What-If Analysis**
   - Preview impact of capacity changes
   - Simulate different planning horizons
   - Test different distribution strategies

5. **Integration with Training Calendar**
   - Block out unavailable dates
   - Sync with external training providers
   - Avoid conflicts with other activities

6. **Mobile App**
   - Pilots can view their renewal schedule
   - Request reschedules
   - Receive push notifications

---

## Technical Notes

### Performance Considerations

- Plan generation for 247 renewals takes ~2-3 seconds
- Database queries use proper indexes on dates and foreign keys
- Load balancing algorithm is O(n\*m) where n=certifications, m=roster periods
- CSV export streams data for large datasets

### Security

- All API endpoints require authentication
- RLS policies enforce data access controls
- Audit trail tracks all plan modifications
- No sensitive data in client-side state

### Browser Compatibility

- Tested on Chrome, Firefox, Safari, Edge
- Requires modern browser with ES2020 support
- Mobile responsive design

---

## Support

For issues or questions:

1. Check this documentation first
2. Review error messages in browser console
3. Check Supabase logs for database issues
4. Contact system administrator

---

**Last Updated:** October 24, 2025
**Version:** 1.0.0
**Author:** Fleet Management System
