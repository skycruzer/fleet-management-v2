# Pagination Implementation Guide

**Fleet Management V2 - Data Table Pagination**

---

## Overview

The application includes a comprehensive pagination system for displaying large datasets in manageable chunks, improving performance and user experience.

**Features:**
- 📄 Client-side data pagination with customizable page sizes
- 🔢 Page navigation (First, Previous, Next, Last)
- 📊 Page info display ("Showing X to Y of Z items")
- 📏 Configurable page sizes (10, 25, 50, 100)
- 📱 Mobile responsive with compact mode
- ⌨️ Keyboard accessible
- 🌙 Dark mode support
- ♿ ARIA labels for accessibility

---

## Components

### Pagination Component

**Location**: `/components/ui/pagination.tsx`

Full-featured pagination UI component with all controls:

```tsx
import { Pagination } from '@/components/ui/pagination'

<Pagination
  currentPage={1}
  totalPages={10}
  totalItems={250}
  pageSize={25}
  pageSizeOptions={[10, 25, 50, 100]}
  onPageChange={(page) => setCurrentPage(page)}
  onPageSizeChange={(size) => setPageSize(size)}
  showPageSize={true}
  showPageInfo={true}
  showFirstLast={true}
  compact={false}
/>
```

**Props**:
- `currentPage` (number, required): Current page number (1-indexed)
- `totalPages` (number, required): Total number of pages
- `totalItems` (number, required): Total number of items across all pages
- `pageSize` (number, required): Items per page
- `pageSizeOptions` (number[], optional): Available page size options (default: [10, 25, 50, 100])
- `onPageChange` (function, required): Callback when page changes
- `onPageSizeChange` (function, optional): Callback when page size changes
- `showPageSize` (boolean, optional): Show page size selector (default: true)
- `showPageInfo` (boolean, optional): Show "Showing X to Y of Z" text (default: true)
- `showFirstLast` (boolean, optional): Show first/last page buttons (default: true)
- `compact` (boolean, optional): Compact mode for mobile (default: false)

### usePagination Hook

**Location**: `/components/ui/pagination.tsx`

Client-side pagination hook for managing pagination state:

```tsx
import { usePagination } from '@/components/ui/pagination'

function MyComponent() {
  const data = [/* ... array of items ... */]

  const {
    currentPage,
    pageSize,
    totalPages,
    paginatedData,
    setCurrentPage,
    setPageSize,
  } = usePagination(data, 25) // 25 = initial page size

  return (
    <div>
      {paginatedData.map(item => (
        <div key={item.id}>{item.name}</div>
      ))}

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={data.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
      />
    </div>
  )
}
```

**Parameters**:
- `data` (T[], required): Full array of data to paginate
- `initialPageSize` (number, optional): Initial page size (default: 10)

**Returns**:
- `currentPage` (number): Current page number (1-indexed)
- `pageSize` (number): Current page size
- `totalPages` (number): Calculated total pages
- `paginatedData` (T[]): Sliced data for current page
- `setCurrentPage` (function): Update current page
- `setPageSize` (function): Update page size (auto-resets to page 1)

**Auto-Reset Behavior**:
- Automatically resets to page 1 when data length changes
- Automatically resets to page 1 when page size changes

### DataTable with Pagination

**Location**: `/components/ui/data-table.tsx`

Enhanced DataTable component with built-in pagination support:

```tsx
import { DataTable } from '@/components/ui/data-table'

<DataTable
  data={data}
  columns={columns}
  enablePagination={true}
  initialPageSize={25}
  pageSizeOptions={[10, 25, 50, 100]}
/>
```

**Pagination Props**:
- `enablePagination` (boolean, optional): Enable pagination (default: false)
- `initialPageSize` (number, optional): Initial page size (default: 10)
- `pageSizeOptions` (number[], optional): Page size options (default: [10, 25, 50, 100])

**Behavior**:
- When `enablePagination={false}`: Shows all data, no pagination controls
- When `enablePagination={true}`: Shows paginated data with full controls
- Sorting works on the current page's data (not full dataset)
- Filtering works before pagination

---

## Usage Patterns

### Pattern 1: Basic Pagination

Simple pagination with default settings:

```tsx
import { DataTable } from '@/components/ui/data-table'

export function MyTable({ items }: { items: Item[] }) {
  return (
    <DataTable
      data={items}
      columns={columns}
      enablePagination={true}
    />
  )
}
```

### Pattern 2: Custom Page Size

Control initial page size and available options:

```tsx
<DataTable
  data={largeDataset}
  columns={columns}
  enablePagination={true}
  initialPageSize={50}
  pageSizeOptions={[25, 50, 100, 250]}
/>
```

### Pattern 3: Pagination with Search/Filter

Combine pagination with search functionality:

```tsx
import { DataTable, DataTableSearch, useTableFilter } from '@/components/ui/data-table'

export function SearchableTable({ items }: { items: Item[] }) {
  const filterFn = (item: Item, query: string) => {
    return item.name.toLowerCase().includes(query.toLowerCase())
  }

  const { filteredData, filterQuery, setFilterQuery } = useTableFilter(items, filterFn)

  return (
    <div className="space-y-4">
      <DataTableSearch
        value={filterQuery}
        onChange={setFilterQuery}
        placeholder="Search items..."
      />

      <DataTable
        data={filteredData}
        columns={columns}
        enablePagination={true}
        initialPageSize={25}
      />
    </div>
  )
}
```

### Pattern 4: Manual Pagination Control

Use the hook directly for custom pagination UI:

```tsx
import { usePagination, Pagination } from '@/components/ui/pagination'

export function CustomPaginatedList({ items }: { items: Item[] }) {
  const {
    currentPage,
    pageSize,
    totalPages,
    paginatedData,
    setCurrentPage,
    setPageSize,
  } = usePagination(items, 20)

  return (
    <div className="space-y-4">
      {/* Custom item rendering */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {paginatedData.map(item => (
          <div key={item.id} className="rounded-lg border p-4">
            <h3>{item.name}</h3>
            <p>{item.description}</p>
          </div>
        ))}
      </div>

      {/* Pagination controls */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={items.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
        showPageSize
        showPageInfo
        showFirstLast
      />
    </div>
  )
}
```

### Pattern 5: Conditional Pagination

Only show pagination when data exceeds threshold:

```tsx
export function SmartTable({ items }: { items: Item[] }) {
  const shouldPaginate = items.length > 25

  return (
    <DataTable
      data={items}
      columns={columns}
      enablePagination={shouldPaginate}
      initialPageSize={25}
    />
  )
}
```

---

## Current Implementations

### Pilots Table

**File**: `/components/pilots/pilots-table.tsx`

```tsx
<DataTable
  data={filteredData}
  columns={columns}
  emptyMessage="No pilots found."
  enablePagination={true}
  initialPageSize={25}
  pageSizeOptions={[10, 25, 50, 100]}
/>
```

**Features**:
- 25 pilots per page default
- Combines with search functionality
- Sorts by seniority, name, rank, date, status
- Page size options: 10, 25, 50, 100

### Certifications Table

**File**: `/components/certifications/certifications-table.tsx`

```tsx
<DataTable
  data={filteredData}
  columns={columns}
  emptyMessage="No certifications found."
  enablePagination={true}
  initialPageSize={25}
  pageSizeOptions={[10, 25, 50, 100]}
/>
```

**Features**:
- 25 certifications per page default
- Search by pilot, check type, category, status
- Color-coded status badges (expired, expiring, current)
- Page size options: 10, 25, 50, 100

---

## Page Number Display Logic

The pagination component intelligently displays page numbers:

### Small Page Counts (≤5 pages)
Shows all page numbers:
```
< 1 2 3 4 5 >
```

### Large Page Counts (>5 pages)
Shows ellipsis for condensed view:

**At beginning**:
```
< 1 2 3 ... 20 >
```

**In middle**:
```
< 1 ... 8 9 10 ... 20 >
```

**At end**:
```
< 1 ... 18 19 20 >
```

### Mobile Compact Mode
On small screens, shows simplified display:
```
< 5 / 20 >
```

---

## Accessibility

All pagination components are fully accessible:

### Keyboard Navigation
- `Tab` / `Shift+Tab` - Navigate between controls
- `Enter` / `Space` - Activate focused button
- `Arrow keys` - Navigate through page size dropdown

### Screen Reader Support
```tsx
// Button labels
aria-label="Go to first page"
aria-label="Go to previous page"
aria-label="Go to page 5"
aria-label="Go to next page"
aria-label="Go to last page"
aria-label="Select page size"

// Current page indicator
aria-current="page"

// Page info
<div className="text-sm" role="status" aria-live="polite">
  Showing 1 to 25 of 250 items
</div>
```

### ARIA Attributes
- All buttons have descriptive `aria-label` attributes
- Current page has `aria-current="page"`
- Page info has `role="status"` and `aria-live="polite"` for announcements
- Disabled state properly communicated with `disabled` attribute

---

## Responsive Design

### Desktop (lg and above)
- Full navigation controls visible
- Page number buttons displayed
- First/Last buttons shown
- Page size selector visible

### Tablet (md to lg)
- All controls visible
- Slightly condensed spacing
- Page numbers shown

### Mobile (< md)
- Compact mode automatically enabled
- Page numbers hidden
- Shows "Page X / Y" indicator
- First/Last buttons optional
- Touch-friendly button sizes (h-8 w-8)

**Responsive Classes**:
```tsx
className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
```

---

## Dark Mode

Pagination fully supports dark mode through CSS variables:

```css
/* Light Mode */
.Pagination {
  background: var(--color-background);
  color: var(--color-foreground);
  border: var(--color-border);
}

/* Dark Mode */
.dark .Pagination {
  background: var(--color-background); /* #020617 */
  color: var(--color-foreground); /* #f8fafc */
  border: var(--color-border); /* #1e293b */
}
```

**Button States**:
- Active page: `variant="default"` (primary blue)
- Inactive page: `variant="outline"` (border only)
- Disabled: `disabled={true}` (grayed out)

---

## Performance Considerations

### Client-Side Pagination

**Pros**:
- ✅ Instant page changes (no server round-trip)
- ✅ Works with filtered/sorted data
- ✅ Simple implementation
- ✅ No additional API calls

**Cons**:
- ❌ All data loaded upfront
- ❌ Not suitable for very large datasets (>10,000 items)
- ❌ Increased initial load time for large datasets

**When to Use**:
- Datasets < 1,000 items (current use case: 27 pilots, 607 certifications)
- Data that doesn't change frequently
- When combined with client-side search/filter

### Server-Side Pagination (Future Enhancement)

For very large datasets, consider server-side pagination:

```tsx
// Future implementation
const { data, total } = await fetchPilots({
  page: currentPage,
  pageSize: 25,
  filters: { ... },
  sort: { ... }
})
```

---

## Data Flow

### Pagination with Filtering and Sorting

Data flows through multiple stages:

1. **Raw Data**: Full dataset from API/database
2. **Filtering**: Apply search/filter (client-side)
3. **Pagination**: Slice filtered data into pages
4. **Sorting**: Sort current page's data
5. **Display**: Render sorted, paginated, filtered data

```typescript
// Step 1: Raw data
const allPilots = [/* 27 pilots */]

// Step 2: Filter by search query
const filteredPilots = allPilots.filter(pilot =>
  pilot.name.includes(searchQuery)
) // e.g., 15 pilots

// Step 3: Paginate (page 1, size 10)
const paginatedPilots = filteredPilots.slice(0, 10) // 10 pilots

// Step 4: Sort by seniority
const sortedPilots = paginatedPilots.sort((a, b) =>
  a.seniority - b.seniority
) // 10 pilots, sorted

// Step 5: Display
return <DataTable data={sortedPilots} />
```

**Important**: The DataTable component handles steps 3-5 internally when pagination is enabled.

---

## Customization

### Custom Page Size Options

Define specific page sizes for your use case:

```tsx
// Small datasets
pageSizeOptions={[5, 10, 20]}

// Medium datasets
pageSizeOptions={[10, 25, 50, 100]}

// Large datasets
pageSizeOptions={[25, 50, 100, 250, 500]}
```

### Hide Controls Selectively

```tsx
<Pagination
  {...props}
  showPageSize={false}    // Hide page size selector
  showPageInfo={false}    // Hide "Showing X to Y" text
  showFirstLast={false}   // Hide first/last buttons
/>
```

### Custom Page Info Format

Modify the Pagination component to customize the info text:

```tsx
// Current format
"Showing 1 to 25 of 250 items"

// Custom format (requires editing component)
"Page 1 of 10 (250 total)"
"Rows 1-25 of 250"
```

---

## Testing

### Manual Testing Checklist

- [ ] Page navigation works (first, previous, next, last)
- [ ] Page number buttons navigate correctly
- [ ] Page size selector changes page size
- [ ] Page info displays correct counts
- [ ] Pagination resets to page 1 when data changes
- [ ] Pagination resets to page 1 when page size changes
- [ ] Disabled state on first page (previous/first buttons)
- [ ] Disabled state on last page (next/last buttons)
- [ ] Keyboard navigation works (Tab, Enter, Space)
- [ ] Screen reader announces page changes
- [ ] Dark mode styling correct
- [ ] Mobile responsive (compact mode)
- [ ] Works with search/filter
- [ ] Works with sorting

### Edge Cases

- [ ] Empty dataset (0 items)
- [ ] Single item (1 item)
- [ ] Single page (items ≤ page size)
- [ ] Large datasets (1000+ items)
- [ ] Changing page size when on last page
- [ ] Filtering reduces results to single page

---

## Future Enhancements

Potential improvements:

1. **Server-Side Pagination**: For datasets >10,000 items
2. **URL State Sync**: Persist page/size in URL query params
3. **Jump to Page**: Input field to jump to specific page
4. **Items per Page Persistence**: Remember user's page size preference
5. **Infinite Scroll**: Alternative UI pattern for mobile
6. **Virtual Scrolling**: Render only visible items for very large datasets
7. **Export All**: Export all data across all pages
8. **Batch Operations**: Select items across multiple pages

---

## Troubleshooting

### Pagination Not Showing

**Issue**: Pagination controls not visible
**Solution**: Ensure `enablePagination={true}` and `data.length > 0`

### Wrong Page Count

**Issue**: Total pages calculation incorrect
**Solution**: Verify `totalItems` prop matches actual data length

### Page Reset Issues

**Issue**: Page doesn't reset when filtering
**Solution**: usePagination hook automatically resets when `data.length` changes. Ensure you're passing the filtered data.

### Sorting Not Working

**Issue**: Sorting doesn't affect paginated data
**Solution**: Sorting is applied to the current page's data. For full dataset sorting, disable pagination or sort before pagination.

### Performance Issues

**Issue**: Slow pagination with large datasets
**Solution**: Consider server-side pagination for datasets >5,000 items

---

## Files Created/Modified

**Created**:
- `/components/ui/pagination.tsx` - Pagination component and usePagination hook

**Modified**:
- `/components/ui/data-table.tsx` - Added pagination support
- `/components/pilots/pilots-table.tsx` - Enabled pagination
- `/components/certifications/certifications-table.tsx` - Enabled pagination

---

**Version**: 1.0.0
**Last Updated**: October 22, 2025
**Maintainer**: Maurice (Skycruzer)
