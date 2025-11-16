# Reports Status and Required Fixes

**Date**: November 16, 2025
**Status**: Reports functional but displaying incomplete data

---

## ✅ Completed Features

1. **Roster Period Filtering** - All 3 report tabs now have:
   - Toggle between "Roster Period" and "Date Range"
   - Multi-select roster periods (RP1/2025 - RP13/2026)
   - Backend conversion from roster periods to date ranges
   - Consistent UI across all tabs

2. **Quick Dates Feature Removed** - Per user request

3. **Validation Fixed** - Status values now correctly use uppercase enums

4. **UI Consistency** - All three tabs have identical filter UI

---

## ❌ Current Issues

### Issue 1: Data Display Showing "undefined undefined"

**Symptoms:**
- Pilot names show as "undefined undefined"
- Ranks show as "N/A"
- Dates and roster periods display correctly

**Root Cause:**
The reports service was updated to join with `pilots` table, but the query structure may not match the actual database schema or there's no data in the tables.

**Evidence:**
- `leave_requests` table has 0 records
- `flight_requests` table has 0 records
- Screenshot shows 10 records with roster periods but undefined names

**Likely Explanation:**
The data visible in the screenshot may be from:
1. Browser cache showing old test data
2. A different table we haven't identified
3. Seed/mock data that needs to be updated

### Issue 2: Multi-Select UX Could Be Improved

**Current**: Native HTML `<select multiple>` dropdown
**User Feedback**: Asked if there's a better way to present this

**Suggested Improvement**:
Replace with modern multi-select component using:
- shadcn Popover + Command components
- Checkbox list with search
- Selected items shown as badges
- Better visual feedback

---

## 🔧 Required Fixes

### Priority 1: Fix Data Display

**Option A: Create Seed Data**
```sql
-- Insert test leave requests linked to existing pilots
INSERT INTO leave_requests (pilot_id, leave_type, start_date, end_date, status, roster_period)
SELECT
  id,
  'ANNUAL',
  '2025-12-29',
  '2026-01-15',
  'APPROVED',
  'RP01/2026'
FROM pilots
LIMIT 10;
```

**Option B: Fix Service Query**
The current service queries `leave_requests` with pilot join:
```typescript
.from('leave_requests')
.select(`
  *,
  pilot:pilots!leave_requests_pilot_id_fkey(
    first_name,
    last_name,
    role,
    employee_id
  )
`)
```

This is correct IF the `leave_requests` table has data and proper foreign keys.

**Verification Needed:**
1. Check if `leave_requests` table exists and has proper schema
2. Verify foreign key `leave_requests_pilot_id_fkey` exists
3. Check if there's a different table being used (maybe `pilot_leave_requests`?)

### Priority 2: Improve Multi-Select UX

**Implementation:**
Create `/components/reports/roster-period-multi-select.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { Check, ChevronsUpDown, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'

interface RosterPeriodMultiSelectProps {
  periods: string[]
  selectedPeriods: string[]
  onChange: (selected: string[]) => void
}

export function RosterPeriodMultiSelect({
  periods,
  selectedPeriods,
  onChange,
}: RosterPeriodMultiSelectProps) {
  const [open, setOpen] = useState(false)

  const handleSelect = (period: string) => {
    if (selectedPeriods.includes(period)) {
      onChange(selectedPeriods.filter(p => p !== period))
    } else {
      onChange([...selectedPeriods, period])
    }
  }

  const handleRemove = (period: string) => {
    onChange(selectedPeriods.filter(p => p !== period))
  }

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {selectedPeriods.length > 0
              ? `${selectedPeriods.length} period(s) selected`
              : 'Select roster periods...'}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput placeholder="Search periods..." />
            <CommandEmpty>No period found.</CommandEmpty>
            <CommandGroup className="max-h-64 overflow-auto">
              {periods.map((period) => (
                <CommandItem
                  key={period}
                  value={period}
                  onSelect={() => handleSelect(period)}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      selectedPeriods.includes(period) ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {period}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedPeriods.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedPeriods.map((period) => (
            <Badge key={period} variant="secondary" className="gap-1">
              {period}
              <button
                onClick={() => handleRemove(period)}
                className="ml-1 hover:bg-secondary-foreground/20 rounded-full"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
```

**Update all 3 report forms:**
```typescript
// Replace current multi-select with:
<RosterPeriodMultiSelect
  periods={rosterPeriods}
  selectedPeriods={field.value || []}
  onChange={(selected) => {
    field.onChange(selected)
    handleFormChange()
  }}
/>
```

---

## 📝 Next Steps

1. **Investigate Data Source**
   - Check browser network tab for actual API response
   - Verify what data structure is being returned
   - Identify correct table and foreign keys

2. **Fix Data Mapping**
   - Update reports-service.ts to use correct table/fields
   - Ensure pilot join works properly
   - Test with actual database data

3. **Create Seed Data** (if needed)
   - Populate leave_requests table with test data
   - Link to existing pilots
   - Include various roster periods and statuses

4. **Improve UX** (after data fix)
   - Implement better multi-select component
   - Add search/filter functionality
   - Show selected periods as removable badges

5. **Test All Report Types**
   - Leave Requests - verify names/ranks display
   - Flight Requests - same data structure fix needed
   - Certifications - different structure, verify pilot join

---

## 🎯 Expected Outcome

After fixes, all three report tabs should:
- ✅ Display pilot names correctly (not "undefined undefined")
- ✅ Show ranks/roles correctly (not "N/A")
- ✅ Have modern, user-friendly multi-select for roster periods
- ✅ Generate accurate PDF exports
- ✅ Send properly formatted email reports

---

**Status**: Awaiting investigation of actual data source and table structure
**Blocker**: Need to determine correct table and verify data exists
