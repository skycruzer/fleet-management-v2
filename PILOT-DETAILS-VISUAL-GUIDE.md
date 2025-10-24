# Pilot Details Page - Visual Design Guide

**Version**: 3.0.0
**Design System**: Aviation-Inspired Professional UI

---

## Color System

### Primary Gradient (Hero Section)
```css
background: linear-gradient(to bottom right, #0284c7, #0369a1, #075985)
/* sky-600 → primary → sky-800 */
```

### Status Color Coding

**Current Certifications (Green)**
```css
Background: linear-gradient(to bottom right, #f0fdf4, #d1fae5)
Border: #bbf7d0
Icon Background: #22c55e20 (green-500/20)
Icon Color: #16a34a (green-600)
Text Color: #14532d (green-900)
```

**Expiring Soon (Yellow)**
```css
Background: linear-gradient(to bottom right, #fefce8, #fef3c7)
Border: #fde68a
Icon Background: #eab30820 (yellow-500/20)
Icon Color: #ca8a04 (yellow-600)
Text Color: #713f12 (yellow-900)
```

**Expired (Red)**
```css
Background: linear-gradient(to bottom right, #fef2f2, #ffe4e6)
Border: #fecaca
Icon Background: #ef444420 (red-500/20)
Icon Color: #dc2626 (red-600)
Text Color: #7f1d1d (red-900)
```

### Information Card Headers

**Personal Information (Primary Blue)**
```css
Icon Background: #0369a110 (primary/10)
Icon Color: #0369a1 (primary)
```

**Employment Details (Green)**
```css
Icon Background: #22c55e10 (green-500/10)
Icon Color: #16a34a (green-600)
```

**Passport Information (Blue)**
```css
Icon Background: #3b82f610 (blue-500/10)
Icon Color: #2563eb (blue-600)
```

**Contact Information (Purple)**
```css
Icon Background: #a855f710 (purple-500/10)
Icon Color: #9333ea (purple-600)
```

**Captain Qualifications (Gold)**
```css
Badge Background: linear-gradient(to right, #eab308, #f59e0b)
Icon Color: #ffffff (white)
Text Color: #ffffff (white)
```

**System Information (Gray)**
```css
Icon Background: #6b728010 (gray-500/10)
Icon Color: #4b5563 (gray-600)
```

---

## Typography Scale

### Hero Section
```css
Pilot Name: text-4xl font-bold (36px, 700 weight)
Badges: text-sm font-semibold (14px, 600 weight)
Quick Stats Label: text-sm font-medium (14px, 500 weight)
Quick Stats Value: text-2xl font-bold (24px, 700 weight)
```

### Certification Status Cards
```css
Card Label: text-sm font-medium (14px, 500 weight)
Card Value: text-4xl font-bold (36px, 700 weight)
Card Subtitle: text-xs (12px)
```

### Information Cards
```css
Section Title: text-lg font-semibold (18px, 600 weight)
Info Label: text-xs font-medium (12px, 500 weight)
Info Value: text-sm font-semibold (14px, 600 weight)
```

---

## Spacing System

### Card Padding
```css
Information Cards: p-6 (24px padding)
Certification Status Cards: p-6 (24px padding)
Hero Section: p-8 (32px padding)
Modal Content: p-4 (16px padding)
```

### Grid Gaps
```css
Main Layout: space-y-6 (24px vertical gap)
Information Grid: gap-6 (24px gap between cards)
Certification Cards: gap-4 (16px gap)
Hero Stats Grid: gap-4 (16px gap)
InfoRow Spacing: space-y-4 (16px vertical spacing)
```

### Border Radius
```css
Hero Section: rounded-2xl (16px)
Cards: rounded-lg (8px)
Badges: rounded-full (9999px)
Icon Containers: rounded-lg (8px)
Avatar: rounded-full (9999px)
```

---

## Icon System (Lucide React)

### Icon Sizes

**Hero Section**
- Avatar Icon: h-10 w-10 (40px)

**Certification Cards**
- Status Icon: h-7 w-7 (28px)

**Card Headers**
- Section Icon: h-5 w-5 (20px)

**InfoRow**
- Row Icon: h-4 w-4 (16px)

**Buttons**
- Button Icon: h-4 w-4 (16px)

**Qualification Badges**
- Badge Star Icon: h-4 w-4 (16px)

### Icon Mapping Reference

```typescript
import {
  User,           // Personal info, First Officer avatar, Full Name
  Star,           // Captain avatar, Seniority, Qualifications
  Briefcase,      // Employment card header, Contract Type
  Calendar,       // Dates (DOB, Commencement, Created, Updated)
  MapPin,         // Nationality
  Mail,           // Contact card header, Email
  Phone,          // Phone number
  Shield,         // Passport card header, Employee ID, Passport Number
  Award,          // Rank, Qualifications card header
  TrendingUp,     // Age
  Clock,          // Years in Service, System Info header
  CheckCircle2,   // Current certifications
  AlertCircle,    // Expiring certifications
  XCircle,        // Expired certifications, Error state
  ArrowLeft,      // Back button
  Edit,           // Edit button
  Trash2,         // Delete button
  FileText,       // View Certifications button
  Plane,          // Loading state
} from 'lucide-react'
```

---

## Animation Specifications

### Framer Motion Variants

**fadeIn**
```typescript
{
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}
```

**staggerContainer**
```typescript
{
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}
```

### Animation Timeline

```
Hero Section:        0ms    → fade in from top (y: -20)
Certification Cards: 100ms  → stagger 0.1s between each card
View Cert Button:    300ms  → fade in
Information Grid:    100ms  → stagger 0.1s between each card
Captain Quals:       400ms  → fade in from bottom
System Info:         500ms  → fade in from bottom
```

### Hover Effects

**Certification Cards**
```css
Hover: shadow-lg
Transition: transition-all
```

**Information Cards**
```css
Hover: shadow-md
Transition: transition-all
```

**View Certifications Button**
```css
Hover: from-sky-700 to-primary/90, shadow-xl
Transition: transition-all
```

---

## Component Structure

### Hero Section Layout

```
┌─────────────────────────────────────────────────────────────┐
│  [Gradient Background: sky-600 → primary → sky-800]         │
│                                                              │
│  ┌──────┐  John Doe Smith                  [Back] [Edit]    │
│  │ ⭐   │  ○ Captain  ○ Active  ○ Seniority #3  [Delete]   │
│  └──────┘                                                    │
│                                                              │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌──────────┐│
│  │Employee ID │ │Years in    │ │Contract    │ │Nationality││
│  │    PX123   │ │Service: 8  │ │Type: Local │ │   PNG    ││
│  └────────────┘ └────────────┘ └────────────┘ └──────────┘│
└─────────────────────────────────────────────────────────────┘
```

### Certification Status Cards Layout

```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ Current         │  │ Expiring Soon   │  │ Expired         │
│                ✓│  │                ⚠│  │                ✗│
│    15          │  │      3          │  │      0          │
│ Certifications  │  │ Within 30 days  │  │ Needs renewal   │
└─────────────────┘  └─────────────────┘  └─────────────────┘
   [Green]              [Yellow]              [Red]
```

### Information Grid Layout (Desktop: 2 columns)

```
┌────────────────────────────┐  ┌────────────────────────────┐
│ 👤 Personal Information    │  │ 💼 Employment Details      │
│ ─────────────────────────  │  │ ─────────────────────────  │
│ 👤 Full Name               │  │ 🛡️  Employee ID            │
│ 📅 Date of Birth           │  │ 🏆 Rank                    │
│ 📈 Age                     │  │ ⭐ Seniority Number        │
│ 📍 Nationality             │  │ 💼 Contract Type           │
│                            │  │ 📅 Commencement Date       │
│                            │  │ ⏱️  Years in Service        │
└────────────────────────────┘  └────────────────────────────┘

┌────────────────────────────┐  ┌────────────────────────────┐
│ 🛡️  Passport Information    │  │ 📧 Contact Information     │
│ ─────────────────────────  │  │ ─────────────────────────  │
│ 🛡️  Passport Number         │  │ 📧 Email Address           │
│ 📅 Expiry Date             │  │ 📞 Phone Number            │
└────────────────────────────┘  └────────────────────────────┘
```

### InfoRow Component Structure

```
┌──────────────────────────────────────┐
│ ┌────┐  Label (muted)                │
│ │icon│  Value (semibold)             │
│ └────┘                                │
└──────────────────────────────────────┘
```

---

## Responsive Breakpoints

### Mobile (< 640px)

```
Hero Section:
  - Title: text-2xl (24px)
  - Stats: 1 column grid
  - Action buttons: Stack vertically

Certification Cards:
  - 1 column grid
  - Full width

Information Grid:
  - 1 column
  - Full width cards
```

### Tablet (640px - 1024px)

```
Hero Section:
  - Title: text-3xl (30px)
  - Stats: 2 column grid

Certification Cards:
  - 3 column grid

Information Grid:
  - 1 column
```

### Desktop (> 1024px)

```
Hero Section:
  - Title: text-4xl (36px)
  - Stats: 4 column grid

Certification Cards:
  - 3 column grid

Information Grid:
  - 2 column grid
```

---

## Glass-morphism Effects

### Hero Section Badges

```css
Background: bg-white/20
Backdrop Filter: backdrop-blur-sm
Ring: ring-1 ring-white/30 (for status badges)
```

### Quick Stats Cards

```css
Background: bg-white/10
Backdrop Filter: backdrop-blur-sm
Text: text-white/80 (labels), font-bold (values)
```

---

## Shadow System

### Cards

**Default (Resting)**
```css
shadow-sm (subtle shadow)
```

**Hover - Certification Cards**
```css
shadow-lg (pronounced shadow)
```

**Hover - Information Cards**
```css
shadow-md (medium shadow)
```

**Hero Section**
```css
shadow-2xl (dramatic shadow)
```

**View Certifications Button**
```css
Default: shadow-lg
Hover: shadow-xl
```

**Qualification Badges**
```css
shadow-md (subtle depth)
```

---

## Accessibility Features

### Color Contrast Ratios

All text meets WCAG AA standards:

- Hero text on gradient: > 7:1 (AAA)
- Card headers: > 4.5:1 (AA)
- Body text: > 4.5:1 (AA)
- Status indicators: Color + icon (not color-only)

### Focus States

All interactive elements have visible focus rings:

```css
focus:ring-2 focus:ring-primary focus:ring-offset-2
```

### Screen Reader Support

- Semantic HTML (`<h1>`, `<h2>`, `<h3>`)
- Descriptive button labels
- Alt text for visual elements
- ARIA labels where needed

### Keyboard Navigation

- Tab order follows visual flow
- All buttons keyboard accessible
- Modal can be dismissed with Escape
- Focus trapped in modal when open

---

## Print Styles (Future Enhancement)

Recommended print CSS:

```css
@media print {
  .gradient-bg { background: white; color: black; }
  .shadow { box-shadow: none; }
  .animation { animation: none; }
  .button { display: none; } /* Hide action buttons */
}
```

---

## Implementation Checklist

- [x] Hero section with gradient background
- [x] Glass-morphism badges
- [x] Avatar placeholder with conditional icons
- [x] Quick stats grid
- [x] Professional certification status cards
- [x] Gradient backgrounds on status cards
- [x] Lucide React icons throughout
- [x] Information cards with colored headers
- [x] InfoRow reusable component
- [x] Captain qualifications with gradient badges
- [x] System information card
- [x] Framer Motion animations
- [x] Stagger effects
- [x] Hover shadows
- [x] Responsive grid layouts
- [x] Mobile-friendly design
- [x] Loading state with Plane icon
- [x] Error state with XCircle icon
- [x] Professional modal styling
- [x] TypeScript type safety
- [x] Accessibility features
- [x] Color contrast compliance
- [x] Keyboard navigation support

---

**Design Philosophy**: Professional, clean, aviation-inspired design that balances information density with visual appeal. Every element serves a purpose while maintaining aesthetic excellence.

**Inspiration**: Boeing 767 flight deck aesthetics, modern SaaS applications, professional aviation software.

**Target Audience**: Fleet managers, administrators, and aviation professionals who need quick access to comprehensive pilot information.

