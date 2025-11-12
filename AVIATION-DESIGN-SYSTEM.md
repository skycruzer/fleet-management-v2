# Aviation-Themed Design System

**Fleet Management V2 - B767 Pilot Management System**
**Author**: Maurice Rondeau
**Date**: November 11, 2025
**Version**: 1.0.0

---

## 🎨 Design Philosophy

Fleet Management V2 uses an **aviation-inspired design language** that combines:
- **Professional航空 aesthetics** - Clean, precise, trustworthy
- **Boeing blue color palette** - Industry-standard aviation colors
- **Cockpit-inspired UI patterns** - Familiar to pilots and aviation professionals
- **WCAG AAA accessibility** - Meeting highest accessibility standards

---

## 🎯 Core Design Principles

### 1. **Clarity First**
Aviation requires precision. Every UI element must be:
- Immediately understandable
- No ambiguous states
- Clear visual hierarchy
- Obvious call-to-actions

### 2. **Safety-Oriented**
Like aviation itself, the UI prioritizes safety:
- Color-coded status indicators (FAA-compliant)
- Critical alerts prominently displayed
- Confirmation dialogs for destructive actions
- Undo/redo where possible

### 3. **Efficiency-Driven**
Fleet managers work fast. The UI must be:
- Minimal clicks to complete tasks
- Keyboard shortcuts for power users
- Batch operations supported
- Quick filters and search

### 4. **Aviation Familiarity**
Using terminology and patterns pilots recognize:
- "Control Tower" instead of "Dashboard Overview"
- "Flight Plan" instead of "Request Form"
- "Boarding Pass" instead of "Request Card"
- "Turbulence Alert" instead of "Conflict Warning"

---

## 🎨 Color Palette

### Primary Colors (Aviation Blue)

```css
/* Main Brand - Boeing Blue */
--color-primary-500: #0369a1;  /* Primary actions, headers */
--color-primary-600: #0284c7;  /* Hover states */
--color-primary-700: #0369a1;  /* Active states */

/* Usage */
- Primary buttons
- Active navigation items
- Important badges
- Brand elements
```

### Accent Colors (Aviation Gold)

```css
/* Premium Touch - Captain's Bars Gold */
--color-accent-500: #eab308;  /* Premium features */
--color-accent-600: #ca8a04;  /* Hover states */

/* Usage */
- Captain qualifications
- Premium pilot cards
- Achievement badges
- Important highlights
```

### Status Colors (FAA-Compliant)

```css
/* Success - Green (Current) */
--color-success-500: #22c55e;  /* Certifications current */

/* Warning - Yellow (Expiring Soon) */
--color-warning-500: #f59e0b;  /* ≤30 days to expiry */

/* Danger - Red (Expired) */
--color-danger-500: #ef4444;   /* Expired certifications */

/* Info - Blue (Informational) */
--color-primary-500: #0369a1;  /* General information */
```

### Neutral Colors (Professional Slate)

```css
/* Background Hierarchy */
--color-background: #ffffff;    /* Page background */
--color-card: #ffffff;          /* Card surfaces */
--color-muted: #f1f5f9;         /* Disabled states */

/* Text Hierarchy */
--color-foreground: #0f172a;    /* Primary text */
--color-muted-foreground: #64748b;  /* Secondary text */

/* Borders */
--color-border: #e2e8f0;        /* Dividers, borders */
```

### Dark Mode (Cockpit Theme)

```css
/* Night Flight Mode */
--color-background: #0f172a;    /* Deep blue-black */
--color-card: #1e293b;          /* Elevated surfaces */
--color-border: #334155;        /* Subtle dividers */

/* Reduced brightness for night operations */
--color-primary: #0284c7;       /* Softer blue */
--color-success: #4ade80;       /* Softer green */
```

---

## 📐 Spacing System

### 8-Point Grid

All spacing follows an 8px grid system:

```css
--spacing-1: 0.5rem;   /* 8px  - Tight spacing */
--spacing-2: 1rem;     /* 16px - Default spacing */
--spacing-3: 1.5rem;   /* 24px - Medium spacing */
--spacing-4: 2rem;     /* 32px - Large spacing */
--spacing-5: 2.5rem;   /* 40px - XL spacing */
--spacing-6: 3rem;     /* 48px - XXL spacing */
```

### Usage Guidelines

| Use Case | Spacing | Value |
|----------|---------|-------|
| Component padding | `spacing-2` | 16px |
| Card padding | `spacing-4` | 32px |
| Section gaps | `spacing-6` | 48px |
| Button padding (horizontal) | `spacing-3` | 24px |
| Button padding (vertical) | `spacing-2` | 16px |
| Form field gap | `spacing-2` | 16px |
| Grid columns gap | `spacing-3` | 24px |

---

## 🔤 Typography System

### Font Families

```css
/* Primary Font - Inter */
font-family: var(--font-inter), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

/* Monospace - JetBrains Mono (for data, codes) */
font-family: 'JetBrains Mono', 'Courier New', monospace;
```

### Type Scale

```css
/* Headings */
--text-4xl: 2.25rem;  /* 36px - Page titles */
--text-3xl: 1.875rem; /* 30px - Section headings */
--text-2xl: 1.5rem;   /* 24px - Card titles */
--text-xl: 1.25rem;   /* 20px - Subsections */
--text-lg: 1.125rem;  /* 18px - Large body */

/* Body */
--text-base: 1rem;    /* 16px - Default body */
--text-sm: 0.875rem;  /* 14px - Secondary text */
--text-xs: 0.75rem;   /* 12px - Captions, labels */
```

### Font Weights

```css
--font-normal: 400;    /* Body text */
--font-medium: 500;    /* Emphasized text */
--font-semibold: 600;  /* Headings */
--font-bold: 700;      /* Strong emphasis */
```

### Usage Guidelines

| Element | Size | Weight | Color |
|---------|------|--------|-------|
| Page title | `4xl` | `semibold` | `foreground` |
| Section heading | `3xl` | `semibold` | `foreground` |
| Card title | `2xl` | `semibold` | `foreground` |
| Body text | `base` | `normal` | `foreground` |
| Secondary text | `sm` | `normal` | `muted-foreground` |
| Captions | `xs` | `normal` | `muted-foreground` |
| Labels | `sm` | `medium` | `foreground` |

---

## 🎭 Component Patterns

### 1. Control Tower Widget (Dashboard Overview)

Replaces generic "Dashboard Stats" with aviation-inspired design:

```tsx
interface ControlTowerMetric {
  label: string
  value: number | string
  unit?: string
  status: 'normal' | 'warning' | 'critical'
  icon: LucideIcon
  trend?: 'up' | 'down' | 'stable'
}

<ControlTowerWidget
  metrics={[
    { label: 'Pilots Ready', value: 24, status: 'normal', icon: Users, trend: 'stable' },
    { label: 'Expiring Soon', value: 3, status: 'warning', icon: AlertTriangle, trend: 'down' },
    { label: 'Requests Pending', value: 12, status: 'critical', icon: Clock, trend: 'up' }
  ]}
  onRefresh={() => {}}
/>
```

**Visual Design**:
- Large metric numbers (48px font size)
- Color-coded status indicators
- Subtle gradient backgrounds
- Animated count-up on load
- Real-time refresh indicator

---

### 2. Boarding Pass Card (Request Display)

Replaces generic table rows with boarding pass-inspired cards:

```tsx
interface BoardingPassProps {
  pilotName: string
  employeeNumber: string
  rank: 'Captain' | 'First Officer'
  requestType: string
  dates: { from: string; to: string }
  status: RequestStatus
  rosterId: string
  onReview: () => void
}

<BoardingPassCard
  pilotName="Maurice Rondeau"
  employeeNumber="E12345"
  rank="Captain"
  requestType="Annual Leave"
  dates={{ from: '2026-01-15', to: '2026-01-22' }}
  status="PENDING"
  rosterId="RP02/2026"
  onReview={() => {}}
/>
```

**Visual Design**:
- Perforated edge styling (dashed border)
- QR code placeholder (for future mobile scanning)
- Barcode aesthetic for request ID
- Tear-off action buttons
- Color-coded status stripe on left edge
- "Gate" number = Roster period
- "Flight" number = Request ID

---

### 3. Flight Plan Form (Request Creation)

Replaces generic forms with flight plan-inspired layout:

```tsx
<FlightPlanForm
  onSubmit={handleSubmit}
  defaultValues={initialData}
  mode="create" // or "edit"
>
  <FlightPlanSection title="Departure" icon={PlaneTakeoff}>
    <DatePicker label="From" name="start_date" required />
    <Select label="Request Type" name="type" options={types} />
  </FlightPlanSection>

  <FlightPlanSection title="Arrival" icon={PlaneLanding}>
    <DatePicker label="To" name="end_date" required />
    <Textarea label="Notes" name="notes" />
  </FlightPlanSection>

  <FlightPlanSection title="Pre-Flight Checklist">
    <ConflictDetector dates={dates} pilotId={pilotId} />
    <CrewAvailabilityIndicator dates={dates} rank={rank} />
  </FlightPlanSection>
</FlightPlanForm>
```

**Visual Design**:
- Sectioned layout with icons
- Progress indicator (steps 1/2/3)
- Real-time validation indicators
- "Clearance" button instead of "Submit"
- "Abort" button instead of "Cancel"
- Auto-save draft functionality

---

### 4. Turbulence Alert (Conflict Warning)

Replaces generic warnings with aviation-themed alerts:

```tsx
<TurbulenceAlert
  severity="moderate" // light | moderate | severe
  conflicts={[
    { type: 'crew_shortage', message: 'Only 9 captains available' },
    { type: 'overlap', message: '2 other requests for same dates' }
  ]}
  onResolve={() => {}}
  onOverride={() => {}}
/>
```

**Visual Design**:
- Animated turbulence wave icon
- Color-coded severity (yellow, orange, red)
- "Fasten Seatbelt" icon for severe conflicts
- "Request Clearance" button for overrides
- Detailed conflict breakdown with timeline

---

### 5. Crew Availability Timeline

Visual timeline showing crew availability:

```tsx
<CrewAvailabilityTimeline
  rosterPeriod="RP02/2026"
  rank="Captain"
  showThreshold={true}
  highlightDates={selectedDates}
/>
```

**Visual Design**:
- Horizontal timeline with date markers
- Color-coded availability bars (green = available, yellow = near threshold, red = below threshold)
- Threshold line at 10 crew members
- Hover tooltips showing exact numbers
- Zoom controls for date range

---

### 6. Deadline Progress Ring

Circular progress indicator for deadlines:

```tsx
<DeadlineProgressRing
  daysRemaining={7}
  totalDays={21}
  milestones={[21, 14, 7, 3, 1, 0]}
  onMilestoneReached={(milestone) => console.log(`${milestone} days alert`)}
/>
```

**Visual Design**:
- Animated circular progress bar
- Large central countdown number
- Milestone markers on circle
- Color transitions (blue → yellow → red)
- Pulse animation when urgent

---

## 🎬 Animation System

### Micro-Interactions

```css
/* Smooth transitions for all interactive elements */
.interactive {
  transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
}

/* Button press effect */
.btn:active {
  transform: scale(0.98);
}

/* Hover lift effect for cards */
.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}
```

### Loading Animations

```css
/* Runway lights animation (for loading states) */
@keyframes runway-lights {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 1; }
}

.loading-dot:nth-child(1) { animation-delay: 0ms; }
.loading-dot:nth-child(2) { animation-delay: 150ms; }
.loading-dot:nth-child(3) { animation-delay: 300ms; }
```

### Page Transitions

```css
/* Smooth page transitions */
@keyframes slide-in-right {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.page-enter {
  animation: slide-in-right 300ms ease-out;
}
```

---

## 📱 Responsive Design

### Breakpoints

```css
/* Mobile-first approach */
--screen-sm: 640px;   /* Small tablets */
--screen-md: 768px;   /* Tablets */
--screen-lg: 1024px;  /* Small desktops */
--screen-xl: 1280px;  /* Large desktops */
--screen-2xl: 1536px; /* Extra large */
```

### Mobile Optimizations

1. **Bottom Navigation** (< 768px)
   - Fixed bottom bar with 5 primary actions
   - Icon + label for clarity
   - Active state indication
   - Safe area insets for notched devices

2. **Swipeable Actions** (< 768px)
   - Swipe left on request cards to reveal actions
   - Swipe right to approve
   - Swipe left to reject
   - Visual feedback during swipe

3. **Touch Targets** (< 768px)
   - Minimum 44px × 44px (Apple HIG)
   - 8px spacing between targets
   - Larger buttons on mobile

4. **Collapsible Filters**
   - Expandable filter panel on mobile
   - "Apply Filters" button to close panel
   - Filter count badge when collapsed

---

## ♿ Accessibility Standards

### WCAG AAA Compliance

#### Color Contrast

| Element | Contrast Ratio | Standard |
|---------|---------------|----------|
| Body text (16px) | 7:1 | AAA |
| Large text (18px+) | 4.5:1 | AAA |
| UI components | 3:1 | AA |
| Focus indicators | 3:1 | AA |

#### Keyboard Navigation

```tsx
// All interactive elements must be keyboard accessible
<button
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick()
    }
  }}
  aria-label="Approve request"
>
  Approve
</button>
```

#### Focus Indicators

```css
/* High contrast focus indicators */
*:focus-visible {
  outline: 2px solid #0891b2;
  outline-offset: 2px;
  border-radius: 4px;
}
```

#### Screen Reader Support

```tsx
// Proper ARIA labels for all components
<div role="region" aria-label="Deadline alerts">
  <h2 id="deadline-heading">Upcoming Deadlines</h2>
  <div aria-labelledby="deadline-heading">
    {/* Content */}
  </div>
</div>

// Live regions for dynamic content
<div aria-live="polite" aria-atomic="true">
  {statusMessage}
</div>
```

#### Skip Links

```tsx
// Skip to main content (first tab stop)
<a
  href="#main-content"
  className="skip-to-main sr-only focus:not-sr-only"
>
  Skip to main content
</a>
```

---

## 🎯 Implementation Checklist

### Phase 1: Foundation (4-5 hours)
- [x] Aviation color palette (already implemented in globals.css)
- [ ] Create `lib/design/aviation-theme.ts` with design tokens
- [ ] Add custom animations to globals.css
- [ ] Create `lib/design/animations.ts` helper functions
- [ ] Add aviation icon set (lucide-react + custom SVGs)

### Phase 2: Core Components (8-10 hours)
- [ ] ControlTowerWidget component
- [ ] BoardingPassCard component
- [ ] FlightPlanForm wrapper
- [ ] TurbulenceAlert component
- [ ] CrewAvailabilityTimeline component
- [ ] DeadlineProgressRing component

### Phase 3: Page Integration (6-8 hours)
- [ ] Update `/dashboard/requests` page with new components
- [ ] Integrate BoardingPassCard into RequestsTable
- [ ] Replace DeadlineWidget with ControlTowerWidget
- [ ] Add FlightPlanForm to quick-entry page
- [ ] Implement TurbulenceAlert in conflict detection

### Phase 4: Mobile Optimization (4-5 hours)
- [ ] Bottom navigation component
- [ ] Swipeable card actions
- [ ] Collapsible filter panel
- [ ] Touch target optimization
- [ ] Responsive layout testing

### Phase 5: Accessibility Audit (2-3 hours)
- [ ] Run WAVE accessibility checker
- [ ] Test keyboard navigation flow
- [ ] Verify screen reader compatibility (NVDA, JAWS)
- [ ] Test color contrast (all combinations)
- [ ] Add missing ARIA labels

---

## 📚 Design Resources

### Icon Library

**Primary**: [Lucide React](https://lucide.dev/) (already installed)

**Additional Aviation Icons**:
- `Plane` - Generic aircraft
- `PlaneTakeoff` - Departure
- `PlaneLanding` - Arrival
- `Radar` - Control tower
- `Radio` - Communication
- `Wind` - Weather conditions
- `MapPin` - Location
- `Clock` - Time
- `Calendar` - Dates
- `Users` - Crew

### Typography

**Primary Font**: Inter (Variable Font)
- Already configured via Next.js Font
- Excellent readability at all sizes
- Professional appearance

**Monospace Font**: JetBrains Mono
- For roster codes (RP01/2026)
- For employee numbers (E12345)
- For technical data

### Design Tools

**Recommended**:
- Figma (for mockups)
- Storybook (already configured for component development)
- React DevTools (for debugging)

---

## 🚀 Success Metrics

### Design Quality Metrics

1. **Task Completion Time**
   - Target: 30% reduction in time to approve requests
   - Measure: Track clicks and time from dashboard → approval

2. **Error Rate**
   - Target: 50% reduction in form submission errors
   - Measure: Track validation errors before/after redesign

3. **User Satisfaction**
   - Target: 8.5/10 average satisfaction score
   - Measure: Post-interaction surveys

4. **Accessibility Score**
   - Target: 100% WCAG AAA compliance
   - Measure: Lighthouse accessibility audit

5. **Mobile Usage**
   - Target: 40% of requests submitted via mobile
   - Measure: Device analytics

---

## 📝 Design Documentation

### Component Storybook

All components have Storybook stories with:
- Default state
- All variants
- Interactive controls
- Accessibility notes
- Code examples

### Usage Examples

Every component includes:
- TypeScript interface definitions
- Props documentation
- Usage examples (3-5 scenarios)
- Best practices notes
- Common pitfalls to avoid

---

**Version**: 1.0.0
**Status**: ✅ Foundation Complete - Ready for Component Implementation
**Next**: Implement Phase 2 core components

