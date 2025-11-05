# Spacing Standards Guide

**Fleet Management V2 - Consistent Spacing System**
**Last Updated**: October 22, 2025

---

## 🎯 Overview

This guide defines the standardized spacing system for the Fleet Management application. Consistent spacing improves visual hierarchy, readability, and overall user experience.

---

## 📐 Spacing Scale

Tailwind CSS default spacing scale (1 unit = 0.25rem = 4px):

| Class | Value | Pixels | Use Case |
|-------|-------|--------|----------|
| `0` | 0 | 0px | Reset spacing |
| `1` | 0.25rem | 4px | Minimal spacing |
| `2` | 0.5rem | 8px | Tight spacing |
| `3` | 0.75rem | 12px | Small spacing |
| `4` | 1rem | 16px | Default spacing |
| `5` | 1.25rem | 20px | Medium spacing |
| `6` | 1.5rem | 24px | Standard spacing |
| `8` | 2rem | 32px | Large spacing |
| `10` | 2.5rem | 40px | Extra large spacing |
| `12` | 3rem | 48px | Section spacing |
| `16` | 4rem | 64px | Major section spacing |

---

## 🎨 Component Spacing Standards

### Cards

**Standard Card Padding**: `p-6` (24px)

```tsx
<Card className="p-6">
  <CardHeader>...</CardHeader>
  <CardContent>...</CardContent>
</Card>
```

**Compact Card**: `p-4` (16px)

```tsx
<Card className="p-4">
  {/* Compact content */}
</Card>
```

**Large Card**: `p-8` (32px)

```tsx
<Card className="p-8">
  {/* Hero or featured content */}
</Card>
```

### Grids

**Default Grid Gap**: `gap-4` (16px)

```tsx
<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
  {/* Grid items */}
</div>
```

**Tight Grid**: `gap-2` (8px)

```tsx
<div className="grid grid-cols-2 gap-2">
  {/* Compact grid items */}
</div>
```

**Large Grid**: `gap-6` (24px)

```tsx
<div className="grid grid-cols-1 gap-6">
  {/* Feature cards or sections */}
</div>
```

### Vertical Stack (Flexbox)

**Default Stack**: `space-y-6` (24px)

```tsx
<div className="space-y-6">
  <Section1 />
  <Section2 />
  <Section3 />
</div>
```

**Tight Stack**: `space-y-2` (8px)

```tsx
<div className="space-y-2">
  <Label />
  <Input />
  <ErrorMessage />
</div>
```

**Large Stack**: `space-y-8` (32px)

```tsx
<div className="space-y-8">
  <HeroSection />
  <FeaturesSection />
  <FooterSection />
</div>
```

### Horizontal Stack (Flexbox)

**Default Horizontal**: `space-x-4` (16px)

```tsx
<div className="flex items-center space-x-4">
  <Icon />
  <Text />
  <Badge />
</div>
```

**Tight Horizontal**: `space-x-2` (8px)

```tsx
<div className="flex items-center space-x-2">
  <SmallIcon />
  <Label />
</div>
```

**Large Horizontal**: `space-x-6` (24px)

```tsx
<div className="flex items-center space-x-6">
  <Avatar />
  <UserInfo />
</div>
```

---

## 📦 Layout Spacing Standards

### Page Container Padding

**Desktop**: `p-6` (24px)

**Mobile**: `p-4` (16px)

```tsx
<div className="p-4 sm:p-6">
  {/* Page content */}
</div>
```

### Section Spacing

**Between Sections**: `space-y-8` or `space-y-12` (32-48px)

```tsx
<div className="space-y-12">
  <FeatureSection />
  <StatsSection />
  <TestimonialsSection />
</div>
```

### Form Spacing

**Form Field Groups**: `space-y-4` (16px)

```tsx
<form className="space-y-4">
  <div className="space-y-2">
    <Label>First Name</Label>
    <Input />
  </div>
  <div className="space-y-2">
    <Label>Last Name</Label>
    <Input />
  </div>
  <Button>Submit</Button>
</form>
```

**Form Field Internal**: `space-y-2` (8px)

```tsx
<div className="space-y-2">
  <Label htmlFor="email">Email</Label>
  <Input id="email" type="email" />
  <p className="text-sm text-muted-foreground">Enter your email address</p>
</div>
```

---

## 🎯 Specific Use Cases

### Dashboard Metrics Grid

```tsx
<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
  <MetricCard />
  <MetricCard />
  <MetricCard />
  <MetricCard />
</div>
```

**Spacing**: `gap-4` (16px)

### List Items

**Default List Spacing**: `space-y-2` (8px)

```tsx
<div className="space-y-2">
  <ListItem />
  <ListItem />
  <ListItem />
</div>
```

**Card List Spacing**: `space-y-4` (16px)

```tsx
<div className="space-y-4">
  <Card>...</Card>
  <Card>...</Card>
  <Card>...</Card>
</div>
```

### Button Groups

**Horizontal Button Group**: `space-x-2` (8px)

```tsx
<div className="flex space-x-2">
  <Button>Cancel</Button>
  <Button>Save</Button>
</div>
```

**Vertical Button Group**: `space-y-2` (8px)

```tsx
<div className="space-y-2">
  <Button className="w-full">Option 1</Button>
  <Button className="w-full">Option 2</Button>
</div>
```

### Icon + Text

**Default Icon Spacing**: `space-x-2` (8px)

```tsx
<div className="flex items-center space-x-2">
  <Icon className="h-4 w-4" />
  <span>Label</span>
</div>
```

**Large Icon Spacing**: `space-x-3` (12px)

```tsx
<div className="flex items-center space-x-3">
  <Icon className="h-6 w-6" />
  <span className="text-lg">Large Label</span>
</div>
```

---

## ✅ Standard Patterns

### Card Header + Content

```tsx
<Card className="p-6">
  <CardHeader className="pb-4">
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent className="space-y-4">
    {/* Content */}
  </CardContent>
</Card>
```

**Header Bottom Padding**: `pb-4` (16px)
**Content Spacing**: `space-y-4` (16px)

### Page Layout

```tsx
<div className="p-4 sm:p-6">
  <div className="space-y-6">
    {/* Page title and actions */}
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <h1>Page Title</h1>
      <Button>Action</Button>
    </div>

    {/* Main content */}
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Card className="p-6">...</Card>
      <Card className="p-6">...</Card>
      <Card className="p-6">...</Card>
    </div>
  </div>
</div>
```

**Container**: `p-4 sm:p-6`
**Content Wrapper**: `space-y-6`
**Header Gap**: `gap-4`
**Grid Gap**: `gap-4`

### Table Spacing

```tsx
<div className="rounded-md border">
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead className="p-4">Header</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      <TableRow>
        <TableCell className="p-4">Cell</TableCell>
      </TableRow>
    </TableBody>
  </Table>
</div>
```

**Cell Padding**: `p-4` (16px)

---

## 🎨 Responsive Spacing

### Mobile-First Approach

**Pattern**: Start with mobile spacing, increase for larger screens

```tsx
{/* Padding */}
<div className="p-4 sm:p-6 lg:p-8">

{/* Gap */}
<div className="gap-2 sm:gap-4 lg:gap-6">

{/* Space */}
<div className="space-y-4 sm:space-y-6 lg:space-y-8">
```

### Common Responsive Patterns

| Use Case | Mobile | Tablet | Desktop |
|----------|--------|--------|---------|
| Container Padding | `p-4` | `p-6` | `p-6` or `p-8` |
| Grid Gap | `gap-4` | `gap-4` | `gap-6` |
| Section Spacing | `space-y-6` | `space-y-8` | `space-y-12` |
| Button Groups | `space-y-2` | `space-x-2` | `space-x-4` |

---

## ❌ Common Mistakes

### ❌ Inconsistent Card Padding

```tsx
{/* Bad - Inconsistent */}
<Card className="p-4">...</Card>
<Card className="p-6">...</Card>
<Card className="p-8">...</Card>

{/* Good - Consistent */}
<Card className="p-6">...</Card>
<Card className="p-6">...</Card>
<Card className="p-6">...</Card>
```

### ❌ Mixing Spacing Methods

```tsx
{/* Bad - Mixing space-y and individual margins */}
<div className="space-y-4">
  <div>Item 1</div>
  <div className="mt-8">Item 2</div> {/* Breaks space-y */}
</div>

{/* Good - Consistent spacing */}
<div className="space-y-4">
  <div>Item 1</div>
  <div>Item 2</div>
</div>
```

### ❌ Over-Spacing

```tsx
{/* Bad - Too much spacing */}
<div className="space-y-16">
  <p>Short paragraph</p>
  <p>Another short paragraph</p>
</div>

{/* Good - Appropriate spacing */}
<div className="space-y-4">
  <p>Short paragraph</p>
  <p>Another short paragraph</p>
</div>
```

---

## 📏 Spacing Decision Tree

### Choosing the Right Spacing

**Very Tight (2px - 8px)**: `space-2` or `gap-2`
- Form labels and inputs
- Icon and adjacent text
- Inline elements
- Tight button groups

**Standard (16px)**: `space-4` or `gap-4`
- Default grid gaps
- Card content sections
- Form field groups
- List items

**Generous (24px - 32px)**: `space-6` or `space-8`
- Page sections
- Major content blocks
- Feature showcases
- Hero sections

**Large (48px+)**: `space-12` or `space-16`
- Between major page sections
- Above/below hero areas
- Landing page sections

---

## 🔍 Audit Checklist

### Component-Level

- [ ] All cards use consistent padding (`p-6`)
- [ ] All grids use consistent gap (`gap-4` or `gap-6`)
- [ ] Vertical stacks use appropriate `space-y-*`
- [ ] Horizontal stacks use appropriate `space-x-*`
- [ ] No mixing of spacing methods (space-* vs manual margins)
- [ ] Responsive spacing follows mobile-first approach

### Page-Level

- [ ] Container padding is responsive (`p-4 sm:p-6`)
- [ ] Major sections have adequate spacing (`space-y-8` or more)
- [ ] Grid layouts have consistent gaps
- [ ] Forms use standardized spacing (`space-y-4` for groups, `space-y-2` for fields)
- [ ] Button groups are consistently spaced

---

## 🎯 Quick Reference

### Most Common Patterns

```tsx
// Page Container
<div className="p-4 sm:p-6">

// Content Wrapper
<div className="space-y-6">

// Grid
<div className="grid grid-cols-1 gap-4 lg:grid-cols-3">

// Card
<Card className="p-6">

// Form
<form className="space-y-4">

// Form Field
<div className="space-y-2">

// Icon + Text
<div className="flex items-center space-x-2">

// Button Group
<div className="flex space-x-2">

// List
<div className="space-y-2">
```

---

## 📚 Resources

- [Tailwind Spacing Documentation](https://tailwindcss.com/docs/customizing-spacing)
- [Flexbox Gap Support](https://caniuse.com/flexbox-gap)
- [CSS Grid Gap](https://developer.mozilla.org/en-US/docs/Web/CSS/gap)

---

**Version**: 1.0.0
**Author**: Claude (Sprint 6: Final Polish)
**Status**: Active - Use these standards for all new components and refactoring
