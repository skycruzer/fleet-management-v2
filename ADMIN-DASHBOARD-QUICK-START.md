# Admin Dashboard - Quick Start Guide

**Quick reference for developers working with the redesigned admin dashboard**

---

## 📁 File Location

```
app/dashboard/admin/page.tsx
```

---

## 🏗️ Architecture Overview

```
AdminPage (Server Component)
├── Parallel data fetching
├── Key Metrics (4 stat cards with trends)
├── Main Content Grid (lg:grid-cols-3)
│   ├── Left Sidebar (1/3)
│   │   ├── Quick Actions Card
│   │   └── Recent Activity Card
│   └── Right Content (2/3)
│       ├── SearchableUserTable
│       ├── CategoryStatsCard
│       ├── SearchableCheckTypesTable
│       └── SearchableContractTypesTable
```

---

## 🔧 Key Components

### 1. Main Page Component
```tsx
export default async function AdminPage() {
  // Parallel data fetching
  const [stats, users, checkTypes, contractTypes, categories] =
    await Promise.all([...])

  // Render layout with child components
}
```

### 2. SearchableUserTable
**Purpose**: Display and search admin/manager users
**Props**: `{ users: AdminUser[] }`
**Features**: Search, responsive columns, role badges

### 3. CategoryStatsCard
**Purpose**: Show color-coded category distribution
**Props**: `{ categories: string[], checkTypes: CheckType[] }`
**Features**: 6-color system, hover effects, icons

### 4. SearchableCheckTypesTable
**Purpose**: Display certification types with search
**Props**: `{ checkTypes: CheckType[] }`
**Features**: Search, progressive disclosure (10 items), color badges

### 5. SearchableContractTypesTable
**Purpose**: Display contract types
**Props**: `{ contractTypes: ContractType[] }`
**Features**: Search, status badges, responsive layout

---

## 🎨 Color System

```typescript
const CATEGORY_COLORS = {
  'Medical':   { bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200'   },
  'License':   { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  'Simulator': { bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-200'  },
  'Aircraft':  { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  'Training':  { bg: 'bg-pink-50',   text: 'text-pink-700',   border: 'border-pink-200'   },
  'Other':     { bg: 'bg-gray-50',   text: 'text-gray-700',   border: 'border-gray-200'   },
}
```

**All colors are WCAG 2.1 AA compliant (≥4.5:1 contrast ratio)**

---

## 📱 Responsive Breakpoints

| Breakpoint | Min Width | Usage |
|------------|-----------|-------|
| `sm:` | 640px | Show additional table columns, 2-column grids |
| `lg:` | 1024px | Show all columns, 3-4 column grids, sidebar layout |

**Example**:
```tsx
<th className="hidden sm:table-cell">Email</th>        // Hide on mobile
<th className="hidden lg:table-cell">Created</th>     // Hide on tablet
```

---

## 🔍 Search Pattern

**Reusable search input structure**:

```tsx
<div className="relative">
  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
  <Input
    placeholder="Search..."
    className="pl-9"
    type="search"
    id="unique-id"
    aria-label="Descriptive label"
  />
</div>
```

**Currently**: Visual-only (no filtering logic)
**Future**: Add client-side filtering or API-based search

---

## 📊 Stat Card Pattern

```tsx
<Card className="overflow-hidden">
  <CardHeader className="pb-3">
    <div className="flex items-center justify-between">
      <CardTitle className="text-sm font-medium text-muted-foreground">
        Metric Name
      </CardTitle>
      <div className="rounded-full bg-blue-100 p-2">
        <Icon className="h-4 w-4 text-blue-600" />
      </div>
    </div>
  </CardHeader>
  <CardContent>
    <div className="space-y-1">
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <div className="flex items-center gap-1 text-xs text-green-600">
        <TrendingUp className="h-3 w-3" />
        <span>+X this month</span>
      </div>
    </div>
  </CardContent>
</Card>
```

---

## 🏷️ Type Imports

```tsx
import {
  getAdminStats,
  getAdminUsers,
  getCheckTypes,
  getContractTypes,
  getCheckTypeCategories,
  type AdminUser,      // ✅ Import types
  type CheckType,
  type ContractType,
} from '@/lib/services/admin-service'
```

**Always import types** for component props to maintain type safety.

---

## 📋 Common Tasks

### Adding a New Search Field

1. Add search input in CardContent:
```tsx
<CardContent className="space-y-4">
  <div className="relative">
    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
    <Input
      placeholder="Search..."
      className="pl-9"
      type="search"
      id="new-search"
      aria-label="Search new data"
    />
  </div>
  {/* Table here */}
</CardContent>
```

2. (Optional) Add client-side filtering logic

### Adding a New Category Color

1. Add to `CATEGORY_COLORS` constant:
```tsx
const CATEGORY_COLORS = {
  // ...existing colors
  'NewCategory': {
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    border: 'border-indigo-200'
  },
}
```

2. Verify contrast ratio: https://webaim.org/resources/contrastchecker/

### Adding a New Stat Card

```tsx
<Card className="overflow-hidden">
  <CardHeader className="pb-3">
    <div className="flex items-center justify-between">
      <CardTitle className="text-sm font-medium text-muted-foreground">
        New Metric
      </CardTitle>
      <div className="rounded-full bg-teal-100 p-2">
        <YourIcon className="h-4 w-4 text-teal-600" />
      </div>
    </div>
  </CardHeader>
  <CardContent>
    <p className="text-2xl font-bold">{stats.newMetric}</p>
  </CardContent>
</Card>
```

### Adding Real Trend Data

Replace simulated trends:
```tsx
// BEFORE (simulated)
const userTrend = { change: 2, direction: 'up' as const }

// AFTER (real data from service)
const userTrend = await getUserTrendData() // Implement this service function
```

---

## 🧪 Testing Guidelines

### Manual Testing Checklist

```bash
# 1. View on different screen sizes
- [ ] Mobile (375px width)
- [ ] Tablet (768px width)
- [ ] Desktop (1920px width)

# 2. Verify all components render
- [ ] Stat cards show data
- [ ] Tables populate correctly
- [ ] Search inputs appear
- [ ] Category colors display

# 3. Test interactions
- [ ] Hover effects work
- [ ] Links navigate correctly
- [ ] Responsive columns adapt
- [ ] Progressive disclosure shows "View All"
```

### E2E Test Example

```typescript
test('admin dashboard displays correctly', async ({ page }) => {
  await page.goto('/dashboard/admin')

  // Check header
  await expect(page.getByRole('heading', { name: 'Admin Dashboard' })).toBeVisible()

  // Check stat cards
  await expect(page.getByText('System Status')).toBeVisible()
  await expect(page.getByText('Operational')).toBeVisible()

  // Check search inputs
  await expect(page.getByPlaceholder('Search by name or email...')).toBeVisible()

  // Check tables
  await expect(page.getByRole('table')).toHaveCount(3)
})
```

---

## 🚨 Common Issues & Solutions

### Issue: Colors not displaying
**Cause**: Category name mismatch
**Solution**: Verify category names in database match `CATEGORY_COLORS` keys exactly

### Issue: Table columns not hiding on mobile
**Cause**: Missing responsive classes
**Solution**: Add `hidden sm:table-cell` or `hidden lg:table-cell` to `<th>` and `<td>`

### Issue: Search input overlapping icon
**Cause**: Missing left padding
**Solution**: Add `className="pl-9"` to Input component

### Issue: Type errors on component props
**Cause**: Missing type imports
**Solution**: Import types from admin-service: `type AdminUser`, etc.

---

## 📚 Related Documentation

- **Full Redesign Details**: `ADMIN-DASHBOARD-REDESIGN-SUMMARY.md`
- **Before/After Analysis**: `BEFORE-AFTER-COMPARISON.md`
- **Completion Report**: `REDESIGN-COMPLETION-REPORT.md`
- **Project Setup**: `CLAUDE.md`
- **Service Layer**: `lib/services/admin-service.ts`

---

## 🔗 Quick Links

### Component References
- [Card Components](components/ui/card.tsx)
- [Input Component](components/ui/input.tsx)
- [Button Component](components/ui/button.tsx)
- [Badge Component](components/ui/badge.tsx)

### Service Layer
- [Admin Service](lib/services/admin-service.ts)
- [Type Definitions](types/supabase.ts)

### Utilities
- [Metadata Utils](lib/utils/metadata.ts)
- [Tailwind Utils](lib/utils.ts)

---

## 💡 Best Practices

### 1. Always Use Semantic Cards
```tsx
// ✅ GOOD
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>Content</CardContent>
</Card>

// ❌ BAD
<Card className="p-6">
  <h2>Title</h2>
  <div>Content</div>
</Card>
```

### 2. Type Your Component Props
```tsx
// ✅ GOOD
function MyTable({ users }: { users: AdminUser[] }) { }

// ❌ BAD
function MyTable({ users }: { users: any[] }) { }
```

### 3. Use Responsive Classes
```tsx
// ✅ GOOD
<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

// ❌ BAD
<div className="grid gap-4 grid-cols-4">
```

### 4. Add ARIA Labels
```tsx
// ✅ GOOD
<Input aria-label="Search users" />

// ❌ BAD
<Input placeholder="Search..." />
```

### 5. Extract Reusable Components
```tsx
// ✅ GOOD
function SearchableTable({ data }: Props) { }

// ❌ BAD
// 100 lines of JSX in main component
```

---

## 🎯 Performance Tips

1. **Use Progressive Disclosure**: Show 10 items, load more on demand
2. **Parallel Data Fetching**: Use `Promise.all()` for multiple queries
3. **Server Components**: Render on server for faster initial load
4. **Lazy Load Heavy Components**: Use `dynamic()` for charts/complex UI

---

## 🔄 Future Enhancements

### Phase 1: Functionality
- [ ] Client-side search filtering
- [ ] Sortable table columns
- [ ] Pagination for large datasets
- [ ] Data export (CSV/PDF)

### Phase 2: Data
- [ ] Real trend data from database
- [ ] Real-time activity feed
- [ ] Historical comparison charts
- [ ] Advanced analytics

### Phase 3: UX
- [ ] Customizable dashboard
- [ ] Dark mode support
- [ ] Keyboard shortcuts
- [ ] Bulk actions

---

**Quick Start Version**: 1.0
**Last Updated**: October 25, 2025
**Maintainer**: Development Team

**Need Help?** Check the full documentation in `ADMIN-DASHBOARD-REDESIGN-SUMMARY.md`
