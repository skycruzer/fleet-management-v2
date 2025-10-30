# Component Props Naming Standards

**Fleet Management V2 - Consistent Props Naming Conventions**
**Last Updated**: October 22, 2025

---

## 🎯 Overview

This guide defines standardized naming conventions for component props in the Fleet Management application. Consistent prop naming improves code readability, maintainability, and developer experience.

---

## 📐 General Naming Rules

### 1. Use CamelCase

**Always use camelCase for prop names**:

```tsx
// ✅ Good
<Button onClick={handleClick} isLoading={loading} />

// ❌ Bad
<Button onclick={handleClick} is-loading={loading} />
<Button OnClick={handleClick} IsLoading={loading} />
```

### 2. Be Descriptive

**Use clear, descriptive names**:

```tsx
// ✅ Good
<UserCard userName="John Doe" userRole="Captain" />

// ❌ Bad
<UserCard name="John Doe" role="Captain" /> // Ambiguous
<UserCard un="John Doe" ur="Captain" /> // Too abbreviated
```

### 3. Boolean Props

**Prefix boolean props with `is`, `has`, `should`, or `can`**:

```tsx
// ✅ Good
<Button isLoading={true} />
<Checkbox isChecked={false} />
<Modal isOpen={true} />
<Form hasErrors={true} />
<Input shouldFocus={true} />
<User canEdit={false} />

// ❌ Bad
<Button loading={true} /> // Not clearly boolean
<Checkbox checked={false} /> // Could be a string
<Modal open={true} /> // Ambiguous type
```

### 4. Event Handlers

**Use `on` prefix for event handler props**:

```tsx
// ✅ Good
<Button onClick={handleClick} />
<Form onSubmit={handleSubmit} />
<Input onChange={handleChange} onBlur={handleBlur} />
<Modal onClose={handleClose} />

// ❌ Bad
<Button click={handleClick} />
<Form submit={handleSubmit} />
<Input change={handleChange} />
```

### 5. Render Props

**Use `render` prefix or descriptive noun**:

```tsx
// ✅ Good
<List renderItem={(item) => <ListItem {...item} />} />
<DataTable renderCell={(cell) => <Cell {...cell} />} />
<Layout header={<Header />} footer={<Footer />} />

// ❌ Bad
<List item={(item) => <ListItem {...item} />} />
<DataTable cell={(cell) => <Cell {...cell} />} />
```

---

## 🎨 Common Prop Patterns

### Data Props

| Pattern | Example | Type |
|---------|---------|------|
| Single item | `user`, `pilot`, `certification` | Object |
| Collection | `users`, `pilots`, `certifications` | Array |
| ID | `userId`, `pilotId`, `certificationId` | string/number |
| Count | `userCount`, `totalItems` | number |
| Label/Title | `label`, `title`, `heading` | string |
| Description | `description`, `subtitle`, `helpText` | string |

```tsx
interface UserCardProps {
  user: User                    // Single object
  userId: string                // ID reference
  userName: string              // Name field
  userRole: 'Captain' | 'FO'   // Specific field
}
```

### State Props

| Pattern | Example | Type |
|---------|---------|------|
| Loading | `isLoading`, `isPending` | boolean |
| Disabled | `isDisabled`, `disabled` | boolean |
| Read-only | `isReadOnly`, `readOnly` | boolean |
| Selected | `isSelected`, `selected` | boolean |
| Active | `isActive`, `active` | boolean |
| Open/Closed | `isOpen`, `open` | boolean |
| Checked | `isChecked`, `checked` | boolean |
| Error | `hasError`, `error` | boolean/string |
| Success | `isSuccess`, `success` | boolean |

```tsx
interface ButtonProps {
  isLoading?: boolean
  isDisabled?: boolean
  isActive?: boolean
}
```

### Event Handler Props

| Pattern | Example | Signature |
|---------|---------|-----------|
| Click | `onClick` | `() => void` |
| Change | `onChange` | `(value: T) => void` |
| Submit | `onSubmit` | `(data: T) => void` |
| Close | `onClose` | `() => void` |
| Select | `onSelect` | `(item: T) => void` |
| Delete | `onDelete` | `(id: string) => void` |
| Page Change | `onPageChange` | `(page: number) => void` |

```tsx
interface FormProps {
  onSubmit: (data: FormData) => void
  onChange: (field: string, value: any) => void
  onCancel: () => void
  onError: (error: Error) => void
}
```

### Style Props

| Pattern | Example | Type |
|---------|---------|------|
| ClassName | `className` | string |
| Style | `style` | CSSProperties |
| Variant | `variant` | 'default' \\| 'primary' \\| ... |
| Size | `size` | 'sm' \\| 'md' \\| 'lg' |
| Color | `color` | 'primary' \\| 'secondary' \\| ... |

```tsx
interface ButtonProps {
  variant?: 'default' | 'primary' | 'destructive' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}
```

---

## 🎯 Specific Use Cases

### Form Components

```tsx
interface InputProps {
  // Value & state
  value: string
  defaultValue?: string

  // Identity
  id?: string
  name: string

  // Display
  label?: string
  placeholder?: string
  helpText?: string

  // Validation
  error?: string
  hasError?: boolean
  isRequired?: boolean

  // State
  isDisabled?: boolean
  isReadOnly?: boolean

  // Events
  onChange: (value: string) => void
  onBlur?: () => void
  onFocus?: () => void
}
```

### Data Display Components

```tsx
interface DataTableProps<T> {
  // Data
  data: T[]
  columns: Column<T>[]

  // State
  isLoading?: boolean
  isEmpty?: boolean

  // Features
  enableSorting?: boolean
  enablePagination?: boolean
  enableFiltering?: boolean

  // Events
  onRowClick?: (row: T) => void
  onSort?: (column: string, direction: 'asc' | 'desc') => void

  // Display
  emptyMessage?: string
  loadingMessage?: string
}
```

### Modal/Dialog Components

```tsx
interface ModalProps {
  // State
  isOpen: boolean

  // Content
  title: string
  description?: string
  children: React.ReactNode

  // Actions
  onClose: () => void
  onConfirm?: () => void
  onCancel?: () => void

  // Display
  size?: 'sm' | 'md' | 'lg' | 'full'
  showCloseButton?: boolean

  // State
  isClosable?: boolean
  isLoading?: boolean
}
```

### List Components

```tsx
interface ListProps<T> {
  // Data
  items: T[]

  // Rendering
  renderItem: (item: T, index: number) => React.ReactNode
  keyExtractor?: (item: T) => string

  // Display
  emptyState?: React.ReactNode
  emptyMessage?: string

  // Events
  onItemClick?: (item: T) => void

  // Style
  orientation?: 'horizontal' | 'vertical'
  spacing?: 'sm' | 'md' | 'lg'
}
```

---

## ✅ Best Practices

### 1. Required vs Optional

**Mark required props with `required` or omit `?`**:

```tsx
interface UserCardProps {
  // Required
  user: User
  userId: string

  // Optional
  onEdit?: () => void
  className?: string
}
```

### 2. Default Values

**Document default values in prop comments**:

```tsx
interface ButtonProps {
  /**
   * Button variant
   * @default 'default'
   */
  variant?: 'default' | 'primary' | 'destructive'

  /**
   * Button size
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg'
}
```

### 3. Grouped Props

**Group related props using interfaces**:

```tsx
interface PaginationInfo {
  page: number
  pageSize: number
  totalPages: number
  totalCount: number
}

interface DataTableProps<T> {
  data: T[]
  pagination: PaginationInfo
  onPaginationChange: (pagination: Partial<PaginationInfo>) => void
}
```

### 4. Discriminated Unions

**Use discriminated unions for variant-specific props**:

```tsx
type AlertProps =
  | {
      variant: 'success'
      successMessage: string
    }
  | {
      variant: 'error'
      errorMessage: string
      errorCode?: string
    }
  | {
      variant: 'warning'
      warningText: string
    }
```

### 5. Children Prop

**Always use `children` for React node content**:

```tsx
interface CardProps {
  children: React.ReactNode

  // ✅ Good
  header?: React.ReactNode
  footer?: React.ReactNode

  // ❌ Bad - don't use "content"
  // content?: React.ReactNode
}
```

---

## 📊 Prop Naming Conventions Table

### Common Suffixes

| Suffix | Meaning | Example |
|--------|---------|---------|
| `Id` | Identifier | `userId`, `pilotId` |
| `Name` | Name/label | `userName`, `fileName` |
| `Count` | Number of items | `itemCount`, `totalCount` |
| `List` / `s` | Collection | `userList`, `users` |
| `Text` | Text content | `helpText`, `errorText` |
| `Message` | Message string | `errorMessage`, `successMessage` |
| `Label` | Label text | `buttonLabel`, `fieldLabel` |
| `Icon` | Icon component | `leftIcon`, `rightIcon` |
| `State` | State object | `formState`, `modalState` |

### Common Prefixes

| Prefix | Meaning | Example |
|--------|---------|---------|
| `is` | Boolean state | `isLoading`, `isOpen` |
| `has` | Boolean property | `hasError`, `hasPermission` |
| `should` | Boolean directive | `shouldFocus`, `shouldValidate` |
| `can` | Boolean capability | `canEdit`, `canDelete` |
| `on` | Event handler | `onClick`, `onChange` |
| `show` | Boolean visibility | `showModal`, `showError` |
| `enable` | Boolean feature | `enableSorting`, `enablePagination` |
| `default` | Default value | `defaultValue`, `defaultPage` |
| `initial` | Initial value | `initialValue`, `initialPage` |
| `current` | Current value | `currentPage`, `currentUser` |
| `total` | Total count | `totalPages`, `totalItems` |
| `max` / `min` | Limits | `maxLength`, `minValue` |

---

## ❌ Common Mistakes

### ❌ Inconsistent Boolean Naming

```tsx
// Bad - Inconsistent patterns
<Component loading={true} disabled={true} open={true} />

// Good - Consistent `is` prefix
<Component isLoading={true} isDisabled={true} isOpen={true} />
```

### ❌ Abbreviated Props

```tsx
// Bad - Hard to understand
<User fn="John" ln="Doe" sn={123} />

// Good - Descriptive names
<User firstName="John" lastName="Doe" seniorityNumber={123} />
```

### ❌ Ambiguous Event Handlers

```tsx
// Bad - What does this do?
<Form submit={handleSubmit} />

// Good - Clear event handler
<Form onSubmit={handleSubmit} />
```

### ❌ Mixing Naming Styles

```tsx
// Bad - Inconsistent styles
<Component isLoading={true} disabled={true} on-click={handleClick} />

// Good - Consistent camelCase
<Component isLoading={true} isDisabled={true} onClick={handleClick} />
```

---

## 🎨 Component Examples

### Button Component

```tsx
interface ButtonProps {
  // Content
  children: React.ReactNode
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode

  // Style
  variant?: 'default' | 'primary' | 'destructive' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  className?: string

  // State
  isLoading?: boolean
  isDisabled?: boolean
  isActive?: boolean

  // Behavior
  type?: 'button' | 'submit' | 'reset'
  asChild?: boolean

  // Events
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void
}
```

### Card Component

```tsx
interface CardProps {
  // Content
  children: React.ReactNode
  title?: string
  description?: string
  header?: React.ReactNode
  footer?: React.ReactNode

  // Style
  variant?: 'default' | 'outlined' | 'elevated'
  className?: string

  // State
  isLoading?: boolean
  isClickable?: boolean

  // Events
  onClick?: () => void
}
```

### Pagination Component

```tsx
interface PaginationProps {
  // State
  currentPage: number
  totalPages: number
  pageSize: number
  totalItems: number

  // Options
  pageSizeOptions?: number[]
  showPageSize?: boolean
  showPageInfo?: boolean
  showFirstLast?: boolean

  // Events
  onPageChange: (page: number) => void
  onPageSizeChange?: (size: number) => void

  // Display
  className?: string
}
```

---

## 🔍 Review Checklist

### Component Props Audit

- [ ] All props use camelCase
- [ ] Boolean props have `is/has/should/can` prefix
- [ ] Event handlers have `on` prefix
- [ ] Required props are clearly marked
- [ ] Optional props have `?` suffix in TypeScript
- [ ] Props are grouped logically (data, state, events, style)
- [ ] Prop names are descriptive and clear
- [ ] No abbreviations (unless industry standard)
- [ ] Consistent naming across similar components
- [ ] TypeScript interfaces are well-documented

---

## 📚 Resources

- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
- [TypeScript Do's and Don'ts](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)
- [Airbnb React Style Guide](https://github.com/airbnb/javascript/tree/master/react)
- [Google TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html)

---

## 🎯 Quick Reference

### Template for New Component Props

```tsx
interface ComponentNameProps {
  // ===== Content =====
  children?: React.ReactNode

  // ===== Data =====
  data?: DataType
  items?: ItemType[]

  // ===== Identity =====
  id?: string
  name?: string

  // ===== State =====
  isLoading?: boolean
  isDisabled?: boolean
  isOpen?: boolean

  // ===== Display =====
  title?: string
  description?: string
  label?: string
  placeholder?: string

  // ===== Style =====
  variant?: 'default' | 'primary'
  size?: 'sm' | 'md' | 'lg'
  className?: string

  // ===== Events =====
  onClick?: () => void
  onChange?: (value: T) => void
  onSubmit?: (data: T) => void
}
```

---

**Version**: 1.0.0
**Author**: Claude (Sprint 6: Final Polish)
**Status**: Active - Use these standards for all component props
