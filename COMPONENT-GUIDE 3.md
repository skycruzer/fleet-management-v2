# Component Guide

**Fleet Management V2 - Component Architecture**
**Last Updated**: October 22, 2025

---

## 📁 Component Structure

```
components/
├── accessibility/      # Accessibility utilities
├── certifications/     # Certification-specific components
├── dashboard/          # Dashboard-specific components
├── forms/              # Form components and wrappers
├── leave/              # Leave management components
├── navigation/         # Navigation components
├── pilots/             # Pilot-specific components
├── portal/             # Pilot portal components
├── settings/           # Settings and configuration components
├── ui/                 # Reusable UI primitives (shadcn/ui)
├── examples/           # Example implementations
├── theme-provider.tsx  # Theme context provider
└── theme-toggle.tsx    # Theme switcher component
```

---

## 🎯 Component Categories

### Accessibility Components (`/accessibility`)

Components focused on WCAG 2.1 Level AA compliance.

#### `Announcer.tsx` & `GlobalAnnouncer.tsx`
**Purpose**: Screen reader announcements for dynamic content updates

**Usage**:
```tsx
import { announce } from '@/components/accessibility/announcer'

// Announce success message
announce('Pilot saved successfully', 'polite')

// Announce urgent error
announce('Form submission failed', 'assertive')
```

**Props**:
- `message` (string) - Message to announce
- `priority` ('polite' | 'assertive') - Announcement priority

**Features**:
- ARIA live regions
- Automatic cleanup
- Priority-based announcements
- Global singleton pattern

---

#### `FocusTrap.tsx`
**Purpose**: Trap focus within modals and dialogs for keyboard navigation

**Usage**:
```tsx
import { FocusTrap } from '@/components/accessibility/focus-trap'

<FocusTrap active={isOpen}>
  <Modal>{/* Modal content */}</Modal>
</FocusTrap>
```

**Props**:
- `active` (boolean) - Whether focus trap is active
- `children` (ReactNode) - Content to wrap

**Features**:
- Keyboard navigation (Tab, Shift+Tab)
- Returns focus on unmount
- Escape key support
- Auto-focus first element

---

#### `SkipNav.tsx` & `SkipToNav.tsx`
**Purpose**: Skip to main content for keyboard users

**Usage**:
```tsx
import { SkipNav } from '@/components/accessibility/skip-nav'

<SkipNav />
<main id="main-content">{/* Content */}</main>
```

**Features**:
- Keyboard accessible (Tab to reveal)
- Screen reader compatible
- WCAG 2.1 compliance
- Smooth scroll behavior

---

### Certification Components (`/certifications`)

Components for displaying and managing pilot certifications.

#### `CertificationsTable.tsx`
**Purpose**: Sortable, filterable table of all certifications

**Features**:
- Client-side sorting (all columns)
- Search filtering (pilot, check type, category, status)
- Pagination (25 items per page default)
- Export to CSV
- Expiry status badges with color coding
- Mobile responsive

**Columns**:
- Pilot (with Employee ID)
- Rank
- Check Type (with description)
- Category
- Expiry Date
- Status (with days until expiry)
- Actions (View pilot)

---

#### `CertificationCategoryGroup.tsx`
**Purpose**: Grouped view of certifications by category

**Features**:
- Category-based organization
- Collapsible sections
- Count badges
- Empty states

---

### Dashboard Components (`/dashboard`)

Components specific to the admin dashboard.

#### `RosterPeriodCarousel.tsx`
**Purpose**: Visual carousel for roster period selection

**Features**:
- Previous/Next navigation
- Current period highlighting
- 28-day roster period logic
- Responsive design

---

### Form Components (`/forms`)

Reusable form wrappers and components.

#### `BaseFormCard.tsx`
**Purpose**: Consistent card wrapper for all forms

**Usage**:
```tsx
import { BaseFormCard } from '@/components/forms/base-form-card'

<BaseFormCard
  title="Add Pilot"
  description="Create a new pilot record"
>
  {/* Form content */}
</BaseFormCard>
```

**Props**:
- `title` (string) - Form title
- `description` (string) - Form description
- `children` (ReactNode) - Form content

---

#### Form Field Wrappers

All form wrappers integrate with React Hook Form and provide consistent error handling.

**`FormFieldWrapper.tsx`** - Input fields
**`FormSelectWrapper.tsx`** - Select dropdowns
**`FormCheckboxWrapper.tsx`** - Checkboxes
**`FormTextareaWrapper.tsx`** - Textareas
**`FormDatePickerWrapper.tsx`** - Date pickers

**Usage**:
```tsx
import { FormFieldWrapper } from '@/components/forms/form-field-wrapper'

<FormFieldWrapper
  name="first_name"
  label="First Name"
  control={form.control}
  placeholder="John"
/>
```

---

#### `PilotForm.tsx`
**Purpose**: Create/edit pilot records

**Features**:
- Full pilot profile fields
- Rank selection (Captain/First Officer)
- Date validations
- Contract type selection
- Captain qualifications (JSONB)

---

#### `CertificationForm.tsx`
**Purpose**: Create/edit pilot certifications

**Features**:
- Pilot selection
- Check type selection
- Expiry date picker
- Validation

---

#### `LeaveRequestForm.tsx`
**Purpose**: Create/edit leave requests

**Features**:
- Pilot selection
- Date range picker
- Request type selection
- Roster period calculation
- Days count auto-calculation

---

### Leave Components (`/leave`)

Components for leave request management.

#### `LeaveRequestGroup.tsx`
**Purpose**: Grouped view of leave requests by status

**Features**:
- Status-based grouping (Pending, Approved, Denied)
- Count badges
- Collapsible sections
- Empty states

---

### Navigation Components (`/navigation`)

Components for site navigation.

#### `DashboardNavLink.tsx`
**Purpose**: Navigation link with active state highlighting

**Usage**:
```tsx
import { DashboardNavLink } from '@/components/navigation/dashboard-nav-link'

<DashboardNavLink
  href="/dashboard/pilots"
  icon={Users}
  label="Pilots"
/>
```

**Features**:
- Active route detection
- Pathname-based highlighting
- Icon support
- Accessible (aria-current)

---

#### `MobileNav.tsx`
**Purpose**: Mobile drawer navigation

**Features**:
- Slide-in/out animations
- Body scroll locking
- Overlay with click-to-close
- Theme toggle integration
- Auto-close on route change

---

#### `PageBreadcrumbs.tsx`
**Purpose**: Auto-generating breadcrumbs

**Usage**:
```tsx
import { PageBreadcrumbs } from '@/components/navigation/page-breadcrumbs'

<PageBreadcrumbs />
```

**Features**:
- Auto-generates from pathname
- Custom breadcrumb support
- Home link
- Current page (not clickable)

---

### Pilot Components (`/pilots`)

Components for pilot management.

#### `PilotsTable.tsx`
**Purpose**: Sortable, filterable table of all pilots

**Features**:
- Client-side sorting (all columns)
- Search filtering (name, rank, seniority)
- Pagination (25 items per page default)
- Export to CSV
- Mobile responsive

**Columns**:
- Seniority
- Name
- Rank
- Commencement Date
- Status (Active/Inactive)
- Actions (View, Edit)

---

#### `PilotRankGroup.tsx`
**Purpose**: Grouped view of pilots by rank

**Features**:
- Rank-based organization (Captains, First Officers)
- Count badges
- Seniority ordering
- Empty states

---

### Portal Components (`/portal`)

Components for the pilot self-service portal.

#### `PortalFormWrapper.tsx`
**Purpose**: Consistent wrapper for portal forms

**Features**:
- Card-based layout
- Loading states
- Error handling
- Success messages

---

#### `FlightRequestForm.tsx`
**Purpose**: Flight request submission form

**Features**:
- Request type selection
- Date picker
- Description field
- Validation

---

#### `LeaveRequestForm.tsx` (Portal version)
**Purpose**: Leave request submission form for pilots

**Features**:
- Auto-filled pilot info
- Date range selection
- Request type
- Roster period display

---

#### `FeedbackForm.tsx`
**Purpose**: Pilot feedback submission

**Features**:
- Anonymous posting option
- Category selection
- Rich text editor
- Tag support

---

#### `SubmitButton.tsx`
**Purpose**: Reusable submit button with loading state

**Usage**:
```tsx
import { SubmitButton } from '@/components/portal/submit-button'

<SubmitButton loading={isSubmitting}>
  Submit Request
</SubmitButton>
```

---

#### `FormErrorAlert.tsx`
**Purpose**: Consistent error display for portal forms

**Features**:
- Error icon
- Error message
- Dismissible
- Accessible

---

### Settings Components (`/settings`)

Components for system configuration.

#### `CertificationCategoryManager.tsx`
**Purpose**: Manage certification categories

**Features**:
- Add/edit/delete categories
- Reordering
- Active/inactive toggle
- Color picker

---

### UI Components (`/ui`)

Reusable UI primitives, mostly from shadcn/ui.

#### Core Components

**`Button.tsx`** - Button component with variants
**`Card.tsx`** - Card container
**`Dialog.tsx`** - Modal dialog
**`Alert.tsx`** - Alert messages
**`Badge.tsx`** - Status badges
**`Input.tsx`** - Text input
**`Select.tsx`** - Dropdown select
**`Checkbox.tsx`** - Checkbox input
**`Calendar.tsx`** - Date picker calendar
**`Skeleton.tsx`** - Loading skeleton
**`Spinner.tsx`** - Loading spinner

#### Compound Components

**`AlertDialog.tsx`** - Confirmation dialog primitive
**`ConfirmDialog.tsx`** - Confirmation dialog with hook
**`DataTable.tsx`** - Sortable data table
**`Pagination.tsx`** - Pagination controls
**`EmptyState.tsx`** - Empty state display
**`ErrorAlert.tsx`** - Error message display
**`Toast.tsx` & `Toaster.tsx`** - Toast notifications
**`Breadcrumb.tsx`** - Breadcrumb navigation

#### Specialized Components

**`NetworkStatusIndicator.tsx`** - Online/offline status
**`RetryIndicator.tsx`** - Retry action indicator
**`RouteChangeFocus.tsx`** - Focus management on route change
**`AccessibleForm.tsx`** - Form with accessibility enhancements

---

### Theme Components (root level)

#### `ThemeProvider.tsx`
**Purpose**: Global theme context

**Features**:
- Light/Dark/System themes
- Persistent theme selection
- SSR-safe
- next-themes integration

---

#### `ThemeToggle.tsx`
**Purpose**: Theme switcher UI

**Features**:
- Dropdown menu
- Three options (Light, Dark, System)
- Animated icons
- Current theme indicator

---

## 📦 Component Patterns

### Pattern 1: Data Display Components

**Purpose**: Display lists of data with sorting, filtering, pagination

**Examples**:
- `PilotsTable.tsx`
- `CertificationsTable.tsx`

**Features**:
- `DataTable` component
- `useTableFilter` hook
- `usePagination` hook
- CSV export
- Search
- Empty states

---

### Pattern 2: Form Components

**Purpose**: Create/edit records with validation

**Examples**:
- `PilotForm.tsx`
- `CertificationForm.tsx`
- `LeaveRequestForm.tsx`

**Features**:
- React Hook Form
- Zod validation
- Form field wrappers
- Error handling
- Loading states

---

### Pattern 3: Grouped Views

**Purpose**: Display data grouped by category/status/rank

**Examples**:
- `PilotRankGroup.tsx`
- `CertificationCategoryGroup.tsx`
- `LeaveRequestGroup.tsx`

**Features**:
- Collapsible sections
- Count badges
- Empty states
- Status indicators

---

## 🎨 Styling Conventions

### Tailwind Classes

**Responsive Design**:
```tsx
// Mobile-first approach
<div className="flex-col gap-4 sm:flex-row sm:items-center lg:gap-6">
```

**Dark Mode**:
```tsx
<div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
```

**Component Variants**:
```tsx
// Use cn() utility for conditional classes
<Button className={cn(
  "base-classes",
  variant === 'destructive' && "destructive-classes",
  disabled && "disabled-classes"
)}>
```

---

### Color Coding

**Status Colors**:
- 🟢 Success/Active: `bg-green-100 text-green-800`
- 🔴 Error/Expired: `bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100`
- 🟡 Warning/Expiring Soon: `bg-yellow-100 text-yellow-800`
- 🔵 Info/Current: `bg-blue-100 text-blue-800`
- ⚫ Neutral/Inactive: `bg-gray-100 text-gray-800`

---

## 🧪 Testing

### Storybook Stories

Components with Storybook stories:
- `Button.tsx` ✅
- `Card.tsx` ✅
- `Spinner.tsx` ✅
- `Skeleton.tsx` ✅
- `Toast.tsx` ✅
- `Toaster.tsx` ✅
- `NetworkStatusIndicator.tsx` ✅
- `ThemeProvider.tsx` ✅
- `ErrorBoundary.tsx` ✅

**Run Storybook**:
```bash
npm run storybook
```

---

### Component Testing Checklist

For each new component:
- [ ] Props are typed with TypeScript
- [ ] Has JSDoc comments
- [ ] Handles loading states
- [ ] Handles error states
- [ ] Handles empty states
- [ ] Is keyboard accessible
- [ ] Has ARIA labels
- [ ] Works in dark mode
- [ ] Is mobile responsive
- [ ] Has Storybook story (if reusable)

---

## 📚 Import Patterns

### Barrel Exports

Components with index files:
- `forms/index.ts` ✅
- `portal/index.ts` ✅

**Usage**:
```tsx
import { PilotForm, CertificationForm } from '@/components/forms'
import { FlightRequestForm, LeaveRequestForm } from '@/components/portal'
```

---

### Direct Imports

For UI components:
```tsx
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
```

For feature components:
```tsx
import { PilotsTable } from '@/components/pilots/pilots-table'
import { CertificationsTable } from '@/components/certifications/certifications-table'
```

---

## 🔄 Component Lifecycle

### Server Components (Default)
```tsx
// app/dashboard/pilots/page.tsx
export default async function PilotsPage() {
  const pilots = await getPilots()
  return <PilotsTable pilots={pilots} />
}
```

### Client Components
```tsx
'use client'

export function PilotForm() {
  const [loading, setLoading] = useState(false)
  // Client-side state and interactions
}
```

---

## 🚀 Best Practices

### 1. Component Composition

**✅ Good**:
```tsx
<BaseFormCard title="Add Pilot">
  <PilotForm mode="create" />
</BaseFormCard>
```

**❌ Bad**:
```tsx
<div className="card">
  <h2>Add Pilot</h2>
  {/* Inline form code */}
</div>
```

---

### 2. Prop Drilling

**✅ Good**: Use context for deeply nested state
```tsx
<ThemeProvider>
  <App />
</ThemeProvider>
```

**❌ Bad**: Pass props through 5+ levels

---

### 3. TypeScript

**✅ Good**: Explicit types
```tsx
interface PilotFormProps {
  mode: 'create' | 'edit'
  initialData?: Pilot
  onSuccess: () => void
}
```

**❌ Bad**: `any` types
```tsx
function PilotForm(props: any) { }
```

---

### 4. Accessibility

**✅ Good**:
```tsx
<button aria-label="Close dialog" onClick={onClose}>
  <X className="h-4 w-4" aria-hidden="true" />
</button>
```

**❌ Bad**:
```tsx
<div onClick={onClose}>×</div>
```

---

## 📖 Related Documentation

- [ACCESSIBILITY.md](./ACCESSIBILITY.md) - Accessibility guidelines
- [DARK-MODE.md](./DARK-MODE.md) - Dark mode implementation
- [CONFIRMATION-DIALOGS.md](./CONFIRMATION-DIALOGS.md) - Confirmation dialogs
- [PAGINATION.md](./PAGINATION.md) - Pagination implementation
- [components/ui/button-guide.md](./components/ui/button-guide.md) - Button standards
- [components/ui/toast-guide.md](./components/ui/toast-guide.md) - Toast usage

---

**Version**: 1.0.0
**Last Updated**: October 22, 2025
**Maintainer**: Maurice (Skycruzer)
