# Leave Reports - Redesign Proposal
**Date**: November 11, 2025
**Author**: Maurice Rondeau

---

## 🔴 Current Problems

### Problem 1: Conflicting Filters
**Issue**: Date range and roster periods are applied as AND conditions, causing zero results.

**Example**:
- User selects: Date range `11/11/2025` + Roster period `RP1/2026`
- SQL Query: `WHERE start_date >= '2025-11-11' AND end_date <= '2025-11-11' AND roster_period = 'RP1/2026'`
- Result: **0 records** (because RP1/2026 dates don't fall on 11/11/2025)

### Problem 2: Date Range Cannot Be Cleared
**Issue**: Form requires date fields, preventing users from filtering by roster period only.

### Problem 3: Too Many Filter Options
**Current filters**:
1. Date range (required)
2. Roster periods (26 checkboxes!)
3. Status (3 checkboxes)
4. Rank (2 checkboxes)
5. Submission Method (4 checkboxes)

**Result**: Overwhelming UI, confusing logic

---

## ✅ Proposed Solution: Simplified Filter Design

### Option A: Single Time Filter (Radio Button Choice)

**Filter By Time**:
- ○ Date Range (shows date pickers)
- ○ Roster Periods (shows roster period multi-select)

**Logic**:
- User chooses ONE: either date range OR roster periods
- Never both at the same time
- Eliminates conflicts

**UI Mockup**:
```
┌─────────────────────────────────────────────────────────┐
│ Filter by Time                                          │
│                                                         │
│ ○ Date Range                                           │
│   Start Date: [___________]  End Date: [___________]   │
│                                                         │
│ ● Roster Periods                                       │
│   [Select Roster Periods ▼] (multi-select dropdown)   │
│   Selected: RP1/2026, RP2/2026                         │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

### Option B: Make Date Range Optional

**Changes**:
1. Remove `required` attribute from date fields
2. Add "Clear Dates" button
3. Apply filters with OR logic:
   - If date range set: filter by dates
   - If roster periods set: filter by roster periods
   - If both set: use OR logic (show records matching either)

**SQL Logic**:
```sql
WHERE (
  -- If date range provided
  (start_date >= '2025-11-11' AND end_date <= '2025-11-11')
  OR
  -- If roster periods provided
  roster_period IN ('RP1/2026', 'RP2/2026')
)
AND status IN ('pending', 'approved', 'rejected')
AND pilot.role IN ('Captain', 'First Officer')
AND request_method IN ('SYSTEM', 'EMAIL', 'ORACLE', 'LEAVE_BIDS')
```

---

### Option C: Preset Report Types (Recommended)

**Idea**: Most users want common reports. Provide presets with custom option.

**Report Type Dropdown**:
```
┌─────────────────────────────────────────────────────────┐
│ Report Type: [Select Report Type ▼]                    │
│                                                         │
│ Options:                                                │
│  • All Leave Requests (no time filter)                │
│  • Current Roster Period (auto-calculates current RP) │
│  • Next 30 Days                                        │
│  • Next 90 Days                                        │
│  • Specific Roster Periods (shows multi-select)       │
│  • Custom Date Range (shows date pickers)             │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Benefits**:
- ✅ No conflicting filters
- ✅ Most common use cases covered
- ✅ Still allows custom filtering
- ✅ Cleaner UI

---

## 🎨 Recommended Final Design (Option C + Simplified Filters)

### Section 1: Report Type
```
┌─────────────────────────────────────────────────────────┐
│ Report Type: [Current Roster Period ▼]                 │
│                                                         │
│ Showing: RP1/2026 (2025-12-06 to 2026-01-02)          │
└─────────────────────────────────────────────────────────┘
```

### Section 2: Additional Filters (Collapsible)
```
┌─────────────────────────────────────────────────────────┐
│ ▼ Additional Filters (Optional)                        │
│                                                         │
│ Status: [☑ Pending] [☑ Approved] [☑ Rejected]         │
│ Rank: [☑ Captain] [☑ First Officer]                   │
│ Submission: [☑ Pilot Portal] [☑ Email] [☑ Oracle]     │
│             [☑ Leave Bids]                             │
│                                                         │
│ [Select All] [Clear All]                               │
└─────────────────────────────────────────────────────────┘
```

### Section 3: Actions
```
[👁 Preview] [📥 Export PDF] [📧 Email Report]
```

---

## 📊 Data Analysis Needed

**To finalize the design, I need to know**:

1. What are the **most common reports** you run?
   - All current leave requests?
   - Specific roster period?
   - Date range lookups?

2. How do you typically use the roster period filter?
   - Single roster period at a time?
   - Multiple roster periods together?

3. Should date range and roster periods be mutually exclusive?
   - OR logic (show records matching either)?
   - AND logic (show records matching both)?

---

## 🚀 Implementation Plan

### Phase 1: Quick Fix (Option B)
**Time**: 30 minutes
**Changes**:
1. Make date fields optional
2. Add "Clear Dates" button
3. Change filter logic to OR

### Phase 2: Better UX (Option A)
**Time**: 1 hour
**Changes**:
1. Radio button: Date Range vs Roster Periods
2. Show/hide relevant inputs
3. Update filter logic

### Phase 3: Best UX (Option C) - Recommended
**Time**: 2 hours
**Changes**:
1. Add Report Type dropdown with presets
2. Simplify filter sections
3. Add "Current Roster Period" auto-calculation
4. Collapsible "Advanced Filters" section

---

## ❓ Questions for You

1. **Which option do you prefer**: A, B, or C?
2. **Common reports**: What reports do you run most often?
3. **User needs**: Who uses this report? What do they need to see?
4. **Filter logic**: Should roster periods + date range be OR or AND logic?

Let me know your preference and I'll implement the redesign!
