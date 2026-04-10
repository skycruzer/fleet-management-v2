# Accessibility Audit Report (WCAG 2.1 AA)

**Auditor**: Accessibility Review Agent
**Date**: February 7, 2026
**Scope**: Fleet Management V2 — Core UI components, navigation, forms, dialogs, data tables, status indicators, and global patterns
**Standard**: WCAG 2.1 Level AA

---

## Executive Summary

The application has a **solid accessibility foundation** with skip links, focus management, screen-reader announcer, ARIA live regions, and route-change focus management already in place. Several components use Radix UI primitives correctly (Dialog, AlertDialog, Switch), providing built-in keyboard and screen reader support. However, there are **critical gaps** in the Command/Combobox component (completely custom without ARIA roles), missing `aria-live` announcements on several key interactions, color-only status indicators without redundant text patterns, and inconsistent form error association patterns.

**Issue Counts**: 8 Critical | 12 Major | 9 Minor

---

## 1. CRITICAL Issues

### C1. Command Component Missing All ARIA Roles

**Severity**: Critical
**WCAG**: 4.1.2 Name, Role, Value (A); 1.3.1 Info and Relationships (A)
**File**: `components/ui/command.tsx`
**Lines**: 14-120

The custom Command component is a plain `<div>` hierarchy with zero ARIA roles. It lacks `role="listbox"`, `role="option"`, `aria-activedescendant`, `aria-expanded`, and keyboard navigation (Arrow keys, Enter, Escape). Screen readers cannot identify this as a combobox/listbox.

**Current code (line 18-29)**:

```tsx
<div ref={ref} className={cn('bg-popover...')} {...props} />
```

**CommandItem (line 102-118)**:

```tsx
<div ref={ref} className={cn('hover:bg-accent...')} onClick={...} />
```

**Fix**: Add proper ARIA roles and keyboard handling:

```tsx
// Command Root
<div ref={ref} role="listbox" aria-label="Command menu" {...props} />

// CommandInput
<input ref={ref} role="combobox" aria-expanded="true"
       aria-controls="command-list" aria-autocomplete="list" {...props} />

// CommandItem
<div ref={ref} role="option" tabIndex={0} aria-selected={isActive}
     onKeyDown={(e) => { if (e.key === 'Enter') onSelect?.(value) }} {...props} />
```

---

### C2. Global Search Combobox Missing ARIA Combobox Pattern

**Severity**: Critical
**WCAG**: 4.1.2 Name, Role, Value (A); 2.1.1 Keyboard (A)
**File**: `components/search/global-search.tsx`
**Lines**: 202-284

The search dialog implements a visually functional combobox but lacks the required ARIA combobox pattern. The `<Input>` has no `role="combobox"`, no `aria-controls` linking to the results list, no `aria-activedescendant` for tracking the selected item, and the results list has no `role="listbox"`. Screen readers will perceive this as a generic text input with no connection to the results.

**Current code (line 207-212)**:

```tsx
<Input
  value={query}
  onChange={(e) => setQuery(e.target.value)}
  placeholder="Search pages..."
  className="border-0 p-0 focus-visible:ring-0"
  autoFocus
/>
```

**Fix**:

```tsx
<Input value={query} onChange={(e) => setQuery(e.target.value)}
       placeholder="Search pages..." role="combobox"
       aria-expanded={results.length > 0} aria-controls="search-results"
       aria-activedescendant={results[selectedIndex] ? `search-result-${selectedIndex}` : undefined}
       aria-autocomplete="list" aria-label="Search pages" autoFocus />

// Results list:
<div id="search-results" role="listbox" aria-label="Search results" ...>
  {items.map((result, i) => (
    <button id={`search-result-${globalIndex}`} role="option"
            aria-selected={globalIndex === selectedIndex} ...>
```

---

### C3. Requests Table: Missing Accessible Labels on Checkboxes

**Severity**: Critical
**WCAG**: 1.3.1 Info and Relationships (A); 4.1.2 Name, Role, Value (A)
**File**: `components/requests/requests-table.tsx`
**Lines**: 417-419 (select-all), 491-495 (row checkboxes)

Both the "select all" checkbox and individual row checkboxes have no accessible labels. Screen readers will announce "checkbox, unchecked" with no context.

**Current code (line 417-419)**:

```tsx
<Checkbox
  checked={selectedIds.size === requests.length && requests.length > 0}
  onCheckedChange={handleSelectAll}
/>
```

**Fix**:

```tsx
<Checkbox checked={...} onCheckedChange={handleSelectAll}
          aria-label="Select all requests" />

// Row checkbox:
<Checkbox checked={...} onCheckedChange={...}
          aria-label={`Select request from ${request.name}`} />
```

---

### C4. Requests Table: Sort Buttons Missing Accessible State

**Severity**: Critical
**WCAG**: 4.1.2 Name, Role, Value (A); 1.3.1 Info and Relationships (A)
**File**: `components/requests/requests-table.tsx`
**Lines**: 424-445

Sort buttons in the Requests table lack `aria-sort` on column headers and `aria-label` describing current sort state. Users cannot determine which column is sorted or in what direction.

**Fix**: Add `aria-sort` to `<TableHead>` elements:

```tsx
<TableHead
  aria-sort={
    sortColumn === 'name' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'
  }
>
  <Button
    variant="ghost"
    aria-label={`Sort by Pilot, currently ${sortColumn === 'name' ? `sorted ${sortDirection}ending` : 'unsorted'}`}
  >
    Pilot <ArrowUpDown className="ml-2 h-4 w-4" aria-hidden="true" />
  </Button>
</TableHead>
```

---

### C5. Expand/Collapse Buttons Missing State and Labels

**Severity**: Critical
**WCAG**: 4.1.2 Name, Role, Value (A)
**File**: `components/requests/requests-table.tsx`
**Lines**: 476-487

The expand/collapse chevron buttons lack `aria-expanded`, `aria-label`, and `aria-controls`. Screen readers announce "button" with no indication of purpose.

**Current code**:

```tsx
<Button variant="ghost" size="sm" onClick={() => toggleExpand(request.id)} className="h-8 w-8 p-0">
  {expandedRequest === request.id ? <ChevronUp /> : <ChevronDown />}
</Button>
```

**Fix**:

```tsx
<Button variant="ghost" size="sm" onClick={() => toggleExpand(request.id)}
        aria-expanded={expandedRequest === request.id}
        aria-label={`${expandedRequest === request.id ? 'Collapse' : 'Expand'} details for ${request.name}`}
        aria-controls={`request-details-${request.id}`} className="h-8 w-8 p-0">
```

---

### C6. Channel Icons Missing Accessible Names

**Severity**: Critical
**WCAG**: 1.1.1 Non-text Content (A)
**File**: `components/requests/requests-table.tsx`
**Lines**: 331-341, 540-543

Channel icons (`getChannelIcon`) render `<User>`, `<Mail>`, `<Phone>`, `<Globe>` icons without `aria-hidden="true"` and the accompanying text is just the raw enum value (e.g., "PILOT_PORTAL"). Icons convey meaning but are not hidden from screen readers, leading to double announcements.

**Fix**:

```tsx
const getChannelIcon = (channel: PilotRequest['submission_channel']) => {
  const labels: Record<PilotRequest['submission_channel'], string> = {
    PILOT_PORTAL: 'Pilot Portal',
    EMAIL: 'Email',
    PHONE: 'Phone',
    ORACLE: 'Oracle',
    ADMIN_PORTAL: 'Admin Portal',
  }
  const icons = {
    /* ... */
  }
  return (
    <>
      <span aria-hidden="true">{icons[channel]}</span>
      <span className="sr-only">{labels[channel]}</span>
    </>
  )
}
```

---

### C7. Support Contact Icon Links Missing `aria-hidden`

**Severity**: Critical
**WCAG**: 1.1.1 Non-text Content (A)
**File**: `components/support/support-contact-buttons.tsx`
**Lines**: 51-53

Contact channel icons (`Mail`, `Phone`, `MessageCircle`) are decorative but not marked `aria-hidden="true"`. Screen readers will announce the SVG content.

**Fix**:

```tsx
<Icon className={`h-6 w-6 ${channel.color}`} aria-hidden="true" />
```

---

### C8. Leave Request Form: Error Messages Not Associated with Fields

**Severity**: Critical
**WCAG**: 1.3.1 Info and Relationships (A); 3.3.1 Error Identification (A)
**File**: `app/dashboard/leave/new/page.tsx`
**Lines**: 246-248, 271-273, 296-298, etc.

Form error messages are rendered as `<p>` elements adjacent to fields but are not linked via `aria-describedby` or `aria-errormessage`. Screen readers won't associate the error with the specific field. The `<select>` elements also lack `aria-invalid` when in error state.

**Current code (line 232-248)**:

```tsx
;<select
  id="pilot_id"
  {...register('pilot_id')}
  className={`... ${errors.pilot_id ? 'border-red-500' : 'border-border'}`}
>
  ...
</select>
{
  errors.pilot_id && <p className="text-sm text-red-600">{errors.pilot_id.message}</p>
}
```

**Fix**:

```tsx
<select id="pilot_id" {...register('pilot_id')}
        aria-invalid={!!errors.pilot_id}
        aria-describedby={errors.pilot_id ? 'pilot_id-error' : undefined}
        className={...}>
  ...
</select>
{errors.pilot_id && (
  <p id="pilot_id-error" role="alert" className="text-sm text-red-600">
    {errors.pilot_id.message}
  </p>
)}
```

---

## 2. MAJOR Issues

### M1. Sidebar `<aside>` Missing Landmark Role Label

**Severity**: Major
**WCAG**: 1.3.1 Info and Relationships (A); 2.4.1 Bypass Blocks (A)
**File**: `components/layout/professional-sidebar-client.tsx`
**Lines**: 200-206

The sidebar `<motion.aside>` lacks `role="navigation"` and `aria-label`. When multiple `<aside>` elements exist, screen readers cannot distinguish them. The `<nav>` inside also lacks `aria-label`.

**Fix**:

```tsx
<motion.aside aria-label="Main navigation sidebar" ...>
  <nav aria-label="Main navigation" className="flex-1 ...">
```

---

### M2. Sidebar Link Wraps `<div>` — Incorrect Nesting

**Severity**: Major
**WCAG**: 4.1.1 Parsing (A); 2.1.1 Keyboard (A)
**File**: `components/layout/professional-sidebar-client.tsx`
**Lines**: 272-315

Each `<Link>` wraps a `<div>` instead of applying styles directly. The `<Link>` receives focus but the `<div>` has the visual active state. This creates two focusable elements for one logical link and violates interactive element nesting.

**Fix**: Apply styles directly to `<Link>` and remove the inner `<div>`.

---

### M3. Logout Button Missing Accessible Label

**Severity**: Major
**WCAG**: 2.4.6 Headings and Labels (AA)
**File**: `components/layout/professional-sidebar-client.tsx`
**Lines**: 363-369

The logout button has no `aria-label`. While the visible text "Logout" exists, the `<LogOut>` icon lacks `aria-hidden="true"`.

**Fix**:

```tsx
<button onClick={handleLogout} aria-label="Log out of the application" ...>
  <LogOut className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
  <span>Logout</span>
</button>
```

---

### M4. Audit Log Table Missing `<caption>` and Column Scope

**Severity**: Major
**WCAG**: 1.3.1 Info and Relationships (A)
**File**: `components/audit/AuditLogTable.tsx`
**Lines**: 58-113

The `<table>` lacks a `<caption>` for screen readers. While `<th scope="col">` is correctly used, the table has no `aria-label` or `<caption>` to describe its purpose.

**Fix**: Add a `<caption>`:

```tsx
<table className="w-full text-sm">
  <caption className="sr-only">Audit log entries showing timestamp, user, action, table, and description</caption>
```

---

### M5. Audit Log Pagination Buttons Missing Accessible Labels

**Severity**: Major
**WCAG**: 2.4.6 Headings and Labels (AA)
**File**: `components/audit/AuditLogTable.tsx`
**Lines**: 126-137

Pagination "Previous" and "Next" buttons lack `aria-label` attributes describing which page they navigate to (e.g., "Go to page 2 of 5").

**Fix**:

```tsx
<button aria-label={`Go to previous page, page ${pagination.page - 1}`} ...>Previous</button>
<button aria-label={`Go to next page, page ${pagination.page + 1}`} ...>Next</button>
```

---

### M6. Loading Spinners Not Announced to Screen Readers

**Severity**: Major
**WCAG**: 4.1.3 Status Messages (AA)
**File**: `components/requests/requests-table.tsx:355-364`, `app/dashboard/leave/new/page.tsx:157-168`

Loading states use visual spinners without `role="status"` or `aria-live`. Screen readers get no feedback that content is loading. The emoji spinner `⏳` is also not ideal for assistive tech.

**Fix**:

```tsx
<div role="status" aria-live="polite">
  <div className="...animate-spin..." aria-hidden="true" />
  <p className="text-muted-foreground text-sm">Loading requests...</p>
</div>
```

---

### M7. Error/Warning Alerts in Leave Form Missing `role="alert"`

**Severity**: Major
**WCAG**: 4.1.3 Status Messages (AA)
**File**: `app/dashboard/leave/new/page.tsx`
**Lines**: 187-191, 194-209, 212-220

Error, validation summary, and conflict warning divs lack `role="alert"` or `aria-live="assertive"`. When errors appear after submission, screen readers won't automatically announce them.

**Fix**: Add `role="alert"` to error containers:

```tsx
{
  error && (
    <div role="alert" className="border-destructive/20 rounded-lg border bg-red-50 p-4">
      <p className="text-sm text-red-600">{error}</p>
    </div>
  )
}
```

---

### M8. Quick Entry Button Missing Accessible Name in Compact Mode

**Severity**: Major
**WCAG**: 4.1.2 Name, Role, Value (A)
**File**: `components/requests/quick-entry-button.tsx`
**Lines**: 69-76, 82-84

When `compact={true}`, the button renders only a `<Plus>` icon with no accessible name. The icon lacks `aria-hidden` and the button lacks `aria-label`.

**Fix**:

```tsx
<Button
  variant={variant}
  size={size}
  className={className}
  aria-label={compact ? 'Quick entry: Submit new leave request' : undefined}
>
  <Plus className="h-4 w-4" aria-hidden="true" />
  {!compact && <span className="ml-2">Quick Entry</span>}
</Button>
```

---

### M9. `GlobalAnnouncer` Not Included in Root Layout

**Severity**: Major
**WCAG**: 4.1.3 Status Messages (AA)
**File**: `app/layout.tsx`, `components/accessibility/announcer.tsx`

The `GlobalAnnouncer` component exists but is **not mounted** in the root layout. The `announce()` function will log a warning and fail silently. Toast notifications rely on the Toaster component (which has its own live region), but other dynamic content changes have no global announcement mechanism.

**Fix**: Add `<GlobalAnnouncer />` to `app/layout.tsx`:

```tsx
import { GlobalAnnouncer } from '@/components/accessibility/announcer'
// Inside <Providers>:
;<GlobalAnnouncer />
```

---

### M10. Color-Only Status Indicators (Compliance Overview)

**Severity**: Major
**WCAG**: 1.4.1 Use of Color (A)
**File**: `components/dashboard/compliance-overview-client.tsx`
**Lines**: 31-52, `components/dashboard/pilot-requirements-card.tsx:107-117`

Compliance statuses (excellent/good/warning/critical) and pilot staffing statuses (success/warning/danger) use color as the **only** visual differentiator on progress bars and stat cards. While `pilot-requirements-card.tsx` includes `sr-only` status text and `TrendingUp`/`TrendingDown` icons, the compliance overview progress bars rely solely on color (green/yellow/red gradients).

**Fix**: Add text labels or icons next to the colored elements:

```tsx
// Add visible status text next to progress bars
<span className={cn('text-xs font-medium', ...)}>
  {status === 'excellent' ? 'Excellent' : status === 'warning' ? 'Needs Attention' : 'Critical'}
</span>
```

---

### M11. Dialog Content: Custom Focus Trap May Conflict with Radix

**Severity**: Major
**WCAG**: 2.4.3 Focus Order (A)
**File**: `components/ui/dialog.tsx`
**Lines**: 52-59

The Dialog component imports `useFocusTrap` from a custom hook and applies it in addition to Radix UI's built-in focus trap. Radix `DialogPrimitive.Content` already manages focus trapping. Running two focus traps simultaneously can cause focus flickering, double-trapping, or focus escaping neither trap.

**Fix**: Remove the custom `useFocusTrap` since Radix already handles it:

```tsx
// Remove these lines:
const contentRef = React.useRef<HTMLDivElement>(null)
const [isOpen, setIsOpen] = React.useState(false)
useFocusTrap(contentRef, isOpen)
```

---

### M12. Data Table Sort Announcements Missing for Screen Readers

**Severity**: Major
**WCAG**: 4.1.3 Status Messages (AA); 1.3.1 Info and Relationships (A)
**File**: `components/ui/data-table.tsx`
**Lines**: 127-146

While the DataTable component has good `aria-label` on sort buttons (line 136), it does not add `aria-sort` to `<TableHead>` elements. Per WAI-ARIA table practices, sorted columns should have `aria-sort="ascending"` or `aria-sort="descending"`.

**Fix**:

```tsx
<TableHead key={column.id} aria-sort={
  sortColumn === column.id
    ? sortDirection === 'asc' ? 'ascending' : 'descending'
    : undefined
}>
```

---

## 3. MINOR Issues

### m1. Redundant `<span className="sr-only">Close</span>` in Dialog

**Severity**: Minor
**File**: `components/ui/dialog.tsx:91-94`
The close button has both `aria-label="Close dialog"` and a `<span className="sr-only">Close</span>`. Screen readers will announce both. Remove the sr-only span since the aria-label is sufficient.

### m2. Login Page Missing `<main>` Landmark

**Severity**: Minor
**WCAG**: 1.3.1 Info and Relationships (A)
**File**: `app/auth/login/page.tsx`
The login page has no `<main>` element wrapping the content. Add `<main id="main-content">` to ensure skip links work on this page.

### m3. Pilot Requirements Card: Header Icon Missing `aria-hidden` (Second Instance)

**Severity**: Minor
**File**: `components/dashboard/pilot-requirements-card.tsx:174`
The second `<Users>` icon in the populated header (line 174) lacks `aria-hidden="true"` unlike its counterpart in the empty state (line 133).

### m4. Search Trigger Button Missing `aria-label`

**Severity**: Minor
**WCAG**: 4.1.2 Name, Role, Value (A)
**File**: `components/search/global-search.tsx:190-199`
While the button has visible text "Quick search..." it should have `aria-label="Open search (Command+K)"` for clarity with the keyboard shortcut.

### m5. `<kbd>` Element Accessibility

**Severity**: Minor
**File**: `components/search/global-search.tsx:196-198`
The `<kbd>` showing "⌘K" is hidden on mobile with `hidden sm:inline-block` but has no `aria-hidden`. On macOS with screen readers, this may announce oddly. Add `aria-hidden="true"` since the shortcut info is supplementary.

### m6. Certification Form Dialog: Required Fields Not Marked

**Severity**: Minor
**WCAG**: 3.3.2 Labels or Instructions (A)
**File**: `components/certifications/certification-form-dialog.tsx`
Required fields (Pilot, Check Type, Expiry Date) are not visually marked with asterisks or `aria-required="true"`. The ShadCN `FormLabel` + `FormMessage` pattern handles errors but doesn't indicate required state upfront.

### m7. Live Chat Link is `href="#"`

**Severity**: Minor
**WCAG**: 2.1.1 Keyboard (A)
**File**: `components/support/support-contact-buttons.tsx:38`
The "Start Chat" link has `href="#"` which navigates to the top of the page. Use `href="#"` with `onClick` and `e.preventDefault()`, or use a `<button>` element instead.

### m8. `suppressHydrationWarning` on App Title

**Severity**: Minor
**File**: `components/layout/professional-sidebar-client.tsx:215`
While not an a11y violation, `suppressHydrationWarning` on the `<h1>` suggests server/client mismatch which could affect screen reader announcements if the title differs.

### m9. Animated Sidebar May Cause Motion Sensitivity Issues

**Severity**: Minor
**WCAG**: 2.3.3 Animation from Interactions (AAA, but good practice)
**File**: `components/layout/professional-sidebar-client.tsx:200-206`
The sidebar slides in with `initial={{ x: -240 }}`. Consider respecting `prefers-reduced-motion` to disable this animation for users who are sensitive to motion.

---

## 4. Positive Findings (Already Done Well)

| Feature                                                                | Location                                       | Standard   |
| ---------------------------------------------------------------------- | ---------------------------------------------- | ---------- |
| Skip links in root layout                                              | `app/layout.tsx:97-100`                        | WCAG 2.4.1 |
| `SkipToMainContent` + `SkipToNavigation`                               | `components/ui/skip-link.tsx`                  | WCAG 2.4.1 |
| `#main-content` IDs on all layout pages                                | `app/dashboard/layout.tsx:154`, portal layouts | WCAG 2.4.1 |
| Route change focus manager                                             | `components/ui/route-change-focus.tsx`         | WCAG 2.4.3 |
| Screen reader announcer component                                      | `components/accessibility/announcer.tsx`       | WCAG 4.1.3 |
| `AccessibleForm` with auto-focus                                       | `components/ui/accessible-form.tsx`            | WCAG 2.4.3 |
| Error/Success message components with `role="alert"` / `role="status"` | `accessible-form.tsx:127,176`                  | WCAG 4.1.3 |
| DataTable row keyboard support (Enter/Space)                           | `data-table.tsx:166-171`                       | WCAG 2.1.1 |
| DataTable sort button `aria-label` with state                          | `data-table.tsx:136`                           | WCAG 4.1.2 |
| Sidebar section toggle `aria-expanded`/`aria-controls`                 | `professional-sidebar-client.tsx:236-238`      | WCAG 4.1.2 |
| Nav badges with descriptive `aria-label`                               | `professional-sidebar-client.tsx:304-310`      | WCAG 1.1.1 |
| Icons consistently marked `aria-hidden="true"` on dashboard            | `pilot-requirements-card.tsx`                  | WCAG 1.1.1 |
| Pilot requirements cards with `role="region"` and descriptive labels   | `pilot-requirements-card.tsx:201-202`          | WCAG 1.3.1 |
| `sr-only` status announcements on staffing cards                       | `pilot-requirements-card.tsx:205`              | WCAG 1.4.1 |
| Radix AlertDialog for destructive confirmations                        | `confirm-dialog.tsx`                           | WCAG 2.1.1 |
| `html lang="en"` set correctly                                         | `app/layout.tsx:84`                            | WCAG 3.1.1 |
| Viewport allows user scaling (`maximumScale: 5, userScalable: true`)   | `app/layout.tsx:77`                            | WCAG 1.4.4 |
| Toaster component with proper dismissal                                | `hooks/use-toast.ts`                           | WCAG 4.1.3 |

---

## 5. Quick Wins (Highest Impact, Lowest Effort)

| #   | Fix                                                          | Impact | Effort | Files     |
| --- | ------------------------------------------------------------ | ------ | ------ | --------- |
| 1   | Add `aria-hidden="true"` to all decorative icons             | High   | 15 min | ~10 files |
| 2   | Add `aria-label` to all checkboxes in requests table         | High   | 5 min  | 1 file    |
| 3   | Add `role="alert"` to error containers in leave form         | High   | 5 min  | 1 file    |
| 4   | Add `aria-label` to compact QuickEntryButton                 | Medium | 2 min  | 1 file    |
| 5   | Add `<caption>` to audit log table                           | Medium | 2 min  | 1 file    |
| 6   | Mount `<GlobalAnnouncer />` in root layout                   | Medium | 2 min  | 1 file    |
| 7   | Add `role="status"` to loading spinners                      | Medium | 5 min  | 3 files   |
| 8   | Add `aria-sort` to sorted table columns                      | Medium | 10 min | 2 files   |
| 9   | Add `aria-invalid` + `aria-describedby` to leave form fields | High   | 15 min | 1 file    |
| 10  | Remove duplicate focus trap from Dialog                      | Medium | 2 min  | 1 file    |

---

## 6. Recommended Priority Order

### Phase 1: Critical Fixes (Sprint 1)

1. **C8** — Form error association (leave form) — affects form usability for all screen reader users
2. **C1** — Command component ARIA roles — foundational component used across app
3. **C2** — Global search combobox pattern — high-frequency interaction
4. **C3** — Checkbox labels in requests table — critical admin workflow
5. **C5** — Expand/collapse button states
6. **C4** — Sort button accessible states in requests table

### Phase 2: Major Fixes (Sprint 2)

7. **M9** — Mount GlobalAnnouncer
8. **M6** — Loading state announcements
9. **M7** — Error alert roles
10. **M1** — Sidebar landmark labels
11. **M2** — Fix link/div nesting in sidebar
12. **M10** — Color-only status indicators
13. **M11** — Remove duplicate focus trap
14. **M12** — `aria-sort` on data table columns

### Phase 3: Polish (Sprint 3)

15. All minor issues (m1-m9)
16. Comprehensive automated testing with axe-core in Playwright

---

## 7. Testing Recommendations

1. **Add axe-core to Playwright E2E tests** — `@axe-core/playwright` for automated WCAG scanning
2. **Test with VoiceOver** (macOS) on key flows: login, create leave request, navigate sidebar, search, review requests
3. **Test keyboard-only navigation** — Tab through entire dashboard without mouse
4. **Test with high contrast mode** and `prefers-reduced-motion`
5. **Validate color contrast ratios** — especially white text on colored status backgrounds
