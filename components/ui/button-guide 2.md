# Button Style Guide

**Fleet Management V2 - Standardized Button Usage**

## Button Variants

### Primary (Default)
**Use for**: Main actions, form submissions, primary CTAs
```tsx
<Button>Save Changes</Button>
<Button>Create Pilot</Button>
<Button>Submit Request</Button>
```

### Outline
**Use for**: Secondary actions, cancel buttons, navigation back
```tsx
<Button variant="outline">Cancel</Button>
<Button variant="outline">← Back</Button>
<Button variant="outline">View Details</Button>
```

### Ghost
**Use for**: Tertiary actions, icon-only buttons, minimal emphasis
```tsx
<Button variant="ghost" size="icon" aria-label="Close">
  <X className="h-4 w-4" />
</Button>
```

### Destructive
**Use for**: Delete actions, dangerous operations
```tsx
<Button variant="destructive">Delete Pilot</Button>
<Button variant="destructive">Remove Certification</Button>
```

### Link
**Use for**: Text-only links that look like buttons
```tsx
<Button variant="link">Learn More</Button>
```

## Button Sizes

### Default
Standard button size for most use cases
```tsx
<Button>Standard Size</Button>
```

### Small (sm)
Compact buttons for tables, cards
```tsx
<Button size="sm">Edit</Button>
```

### Large (lg)
Prominent CTAs, landing pages
```tsx
<Button size="lg">Get Started</Button>
```

### Icon
Icon-only buttons (must include aria-label)
```tsx
<Button size="icon" aria-label="Delete">
  <Trash className="h-4 w-4" />
</Button>
```

## Common Patterns

### Form Actions
```tsx
<div className="flex justify-end gap-2">
  <Button variant="outline" type="button">Cancel</Button>
  <Button type="submit">Save</Button>
</div>
```

### Loading State
```tsx
<Button disabled={isLoading}>
  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
  {isLoading ? 'Saving...' : 'Save'}
</Button>
```

### Icon with Text
```tsx
<Button>
  <Plus className="mr-2 h-4 w-4" />
  Add Pilot
</Button>
```

### Navigation
```tsx
<Link href="/dashboard/pilots">
  <Button variant="outline">
    ← Back to Pilots
  </Button>
</Link>
```

### Delete Confirmation
```tsx
<Button variant="destructive" onClick={handleDelete}>
  <Trash2 className="mr-2 h-4 w-4" />
  Delete
</Button>
```

## Accessibility Requirements

1. **All icon-only buttons MUST have aria-label**
2. **Loading buttons MUST have aria-busy**
3. **Disabled buttons should explain why** (via tooltip or helper text)
4. **Destructive actions should confirm** (via dialog)

## Standard Button Combinations

### Page Header Actions
```tsx
<div className="flex items-center justify-between">
  <div>
    <h2>Page Title</h2>
  </div>
  <Button>Primary Action</Button>
</div>
```

### Table Row Actions
```tsx
<div className="flex items-center gap-2">
  <Button size="sm" variant="ghost">
    <Eye className="h-4 w-4" />
  </Button>
  <Button size="sm" variant="ghost">
    <Pencil className="h-4 w-4" />
  </Button>
  <Button size="sm" variant="ghost">
    <Trash className="h-4 w-4" />
  </Button>
</div>
```

### Card Footer Actions
```tsx
<CardFooter className="flex justify-between">
  <Button variant="outline">Cancel</Button>
  <Button>Confirm</Button>
</CardFooter>
```
