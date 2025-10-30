# React Calendar Library Quick Reference

**TL;DR: Use Custom Solution with shadcn/ui Calendar (already installed)**

---

## Quick Comparison Table

| Feature | Custom (shadcn) | react-calendar | FullCalendar | react-big-calendar |
|---------|----------------|----------------|--------------|-------------------|
| **Bundle Size** | 0 KB (installed) | +14 KB | +100 KB | +250 KB |
| **TypeScript** | Excellent | Good | Excellent | Good |
| **Next.js 15** | Perfect | Yes | With setup | Yes |
| **Tailwind CSS** | Native | Manual | Manual | Manual |
| **Customization** | Full control | Limited | Extensive | Good |
| **Development Time** | 2-4 hours | 3-5 hours | 4-6 hours | 4-6 hours |
| **Maintenance** | You own it | Low | Medium | Medium |
| **Learning Curve** | Low | Low | Medium | Medium |
| **Project Fit** | Perfect | Good | Overkill | Overkill |

---

## The Winner: Custom Solution with shadcn/ui Calendar

### Why?

1. **Already installed** - Zero bundle impact
2. **Perfect integration** - Uses existing Tailwind CSS and TypeScript patterns
3. **Proven pattern** - Project already uses this successfully (see `components/ui/calendar.tsx`)
4. **Full control** - Customize exactly for leave requests use case
5. **Best performance** - Purpose-built for your requirements

### What You Get

- Monthly calendar view with color-coded leave requests
- Approved (green), Pending (yellow), Denied (red) status indicators
- Recommended date highlighting (conflict-free dates)
- Crew availability status display
- Click to view/create leave requests
- Mobile responsive design
- Dark mode support
- Full TypeScript support

### Installation

**Nothing to install!** Already have:
- `react-day-picker`: 9.11.1
- `date-fns`: 4.1.0
- `/components/ui/calendar.tsx` (shadcn component)

### Implementation (2-4 hours)

```bash
# 1. Create leave calendar component
touch components/leave/leave-calendar.tsx

# 2. Create helper utilities
touch lib/utils/leave-calendar-utils.ts

# 3. Create page
touch app/dashboard/leave/calendar/page.tsx

# 4. Add tests
touch e2e/leave-calendar.spec.ts
```

### Code Snippet

```tsx
'use client'

import { Calendar } from '@/components/ui/calendar'
import { Badge } from '@/components/ui/badge'

export function LeaveRequestCalendar({ requests }: Props) {
  const modifiers = {
    approved: (date) => hasStatus(date, 'approved'),
    pending: (date) => hasStatus(date, 'pending'),
    denied: (date) => hasStatus(date, 'denied'),
    recommended: (date) => isConflictFree(date),
  }

  const modifiersClassNames = {
    approved: 'bg-green-100 text-green-900',
    pending: 'bg-yellow-100 text-yellow-900',
    denied: 'bg-red-100 text-red-900',
    recommended: 'ring-2 ring-blue-500',
  }

  return (
    <Calendar
      modifiers={modifiers}
      modifiersClassNames={modifiersClassNames}
      onSelect={handleDateClick}
    />
  )
}
```

---

## Alternative: react-calendar

**Use if**: You prefer a pre-built component over custom development

### Installation

```bash
npm install react-calendar
```

### Bundle Impact
+14 KB gzipped (minimal)

### Implementation

```tsx
'use client'

import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'

export function LeaveCalendar() {
  return (
    <Calendar
      tileContent={({ date }) => {
        const requests = getRequestsForDate(date)
        return <div>{requests.length} requests</div>
      }}
    />
  )
}
```

---

## Not Recommended

### FullCalendar
- **Why not**: Too large (+100 KB), too feature-rich, SSR complications
- **When to use**: If you need drag-and-drop scheduling, multiple view types (week/day), or advanced event management

### react-big-calendar
- **Why not**: Largest bundle (+250 KB), no clear advantages
- **When to use**: If you specifically want Google Calendar-style interface with full event management

---

## Quick Decision Matrix

**Choose Custom Solution if**:
- You want zero bundle impact ✅
- You value Tailwind CSS integration ✅
- You need full customization ✅
- You're comfortable with 2-4 hours development ✅
- You want to follow existing project patterns ✅

**Choose react-calendar if**:
- You prefer pre-built components
- Development time is critical (though difference is small)
- You want minimal external dependency

**Choose FullCalendar if**:
- You need drag-and-drop event scheduling
- You need week/day/agenda views
- You need advanced event management
- Bundle size is not a concern

**Choose react-big-calendar if**:
- You specifically need Google Calendar-style interface
- Bundle size is not a concern
- You need full event management features

---

## Implementation Checklist

For Custom Solution (Recommended):

**Core Components** (1-2 hours):
- [ ] Create `components/leave/leave-calendar.tsx`
- [ ] Add leave request color modifiers (approved/pending/denied)
- [ ] Add recommended date highlighting
- [ ] Add crew availability indicators
- [ ] Add date click handlers

**Utilities** (30 mins):
- [ ] Create `lib/utils/leave-calendar-utils.ts`
- [ ] Add date grouping functions
- [ ] Add recommended date logic
- [ ] Add crew shortage detection

**Integration** (30 mins):
- [ ] Create calendar page route
- [ ] Connect to leave-service.ts
- [ ] Add navigation links

**Polish** (1 hour):
- [ ] Add legend/key component
- [ ] Add mobile responsive design
- [ ] Add loading states
- [ ] Add error handling
- [ ] Dark mode support

**Testing** (1 hour):
- [ ] Unit tests for date logic
- [ ] Playwright E2E tests
- [ ] Storybook story

**Total: 2-4 hours**

---

## Example Files from Project

**Already exists**:
- `/components/ui/calendar.tsx` - shadcn Calendar component (213 lines)
- `/lib/utils/roster-utils.ts` - 28-day roster period logic
- `/lib/services/leave-service.ts` - Leave CRUD operations
- `/lib/services/leave-eligibility-service.ts` - Crew minimum requirements

**Similar patterns**:
- `/components/renewal-planning/renewal-calendar-monthly.tsx` - Monthly view example
- `/components/renewal-planning/renewal-calendar-yearly.tsx` - Yearly view example

---

## Resources

- [Full Research Report](./CALENDAR-LIBRARY-RESEARCH-REPORT.md) - Comprehensive 50-page analysis
- [shadcn/ui Calendar](https://ui.shadcn.com/docs/components/calendar)
- [react-day-picker Docs](https://react-day-picker.js.org/)
- [date-fns Docs](https://date-fns.org/)

---

**Recommendation**: Start with Custom Solution. If requirements significantly change (need drag-and-drop, need week/day views), migrate to FullCalendar later.

**Next Steps**:
1. Review this quick reference
2. Read full report if needed
3. Create leave-calendar.tsx component
4. Implement in 2-4 hours
5. Ship it!
