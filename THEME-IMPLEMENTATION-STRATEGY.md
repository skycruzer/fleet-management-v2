# Theme Implementation Strategy - Quick Reference

**Project**: Fleet Management V2
**Date**: October 25, 2025
**Purpose**: Step-by-step guide for implementing theme consistency across the application

---

## Executive Summary

**Problem**: 73 files use hardcoded Tailwind colors (purple, green, yellow, red, blue) instead of the centralized CSS variable theme system.

**Impact**:
- Inconsistent colors across application
- Dark mode breakage in multiple components
- Cannot change brand colors without updating 73 files
- Maintenance burden for future developers

**Solution**: Systematic migration to CSS variable-based theme system

**Estimated Effort**: 30-40 hours total

---

## Phase 1: Add Missing Colors to Theme (1 hour)

### Step 1.1: Update globals.css

**File**: `/app/globals.css`

**Add to `@theme` block** (after line 34):

```css
@theme {
  /* Existing colors... */

  /* NEW: Captain/Secondary Accent - Purple */
  --color-captain-50: #f5f3ff;
  --color-captain-100: #ede9fe;
  --color-captain-200: #ddd6fe;
  --color-captain-300: #c4b5fd;
  --color-captain-400: #a78bfa;
  --color-captain-500: #8b5cf6;
  --color-captain-600: #7c3aed;
  --color-captain-700: #6d28d9;
  --color-captain-800: #5b21b6;
  --color-captain-900: #4c1d95;

  --color-captain: #8b5cf6;
  --color-captain-foreground: #ffffff;

  /* Extend Success scale (add missing shades) */
  --color-success-50: #f0fdf4;
  --color-success-100: #dcfce7;
  --color-success-700: #15803d;
  --color-success-800: #166534;
  --color-success-900: #14532d;

  /* Extend Warning scale (add missing shades) */
  --color-warning-50: #fffbeb;
  --color-warning-100: #fef3c7;
  --color-warning-700: #b45309;
  --color-warning-800: #92400e;
  --color-warning-900: #78350f;

  /* Extend Destructive scale (add missing shades) */
  --color-destructive-50: #fef2f2;
  --color-destructive-100: #fee2e2;
  --color-destructive-700: #b91c1c;
  --color-destructive-800: #991b1b;
  --color-destructive-900: #7f1d1d;

  /* Extend Primary scale (add missing shades) */
  --color-primary-50: #eff6ff;
  --color-primary-100: #dbeafe;
}
```

### Step 1.2: Update Dark Mode Colors

**Add to `.dark` block** (after line 122):

```css
.dark {
  /* Existing dark mode colors... */

  /* NEW: Captain color for dark mode */
  --color-captain: #a78bfa;
  --color-captain-foreground: #1e1b4b;
}
```

### Step 1.3: Test Theme Variables

**Create test component** (`components/theme-test.tsx`):

```tsx
export function ThemeTest() {
  return (
    <div className="space-y-4 p-8">
      <h2 className="text-2xl font-bold">Theme Color Test</h2>

      {/* Primary */}
      <div className="bg-primary-50 p-4 border-primary-200 border">
        <p className="text-primary-700">Primary - Aviation Blue</p>
      </div>

      {/* Success */}
      <div className="bg-success-50 p-4 border-success-200 border">
        <p className="text-success-700">Success - FAA Compliant Green</p>
      </div>

      {/* Warning */}
      <div className="bg-warning-50 p-4 border-warning-200 border">
        <p className="text-warning-700">Warning - Expiring Soon Yellow</p>
      </div>

      {/* Destructive */}
      <div className="bg-destructive-50 p-4 border-destructive-200 border">
        <p className="text-destructive-700">Destructive - Expired Red</p>
      </div>

      {/* Captain (NEW) */}
      <div className="bg-captain-50 p-4 border-captain-200 border">
        <p className="text-captain-700">Captain - Secondary Accent Purple</p>
      </div>

      {/* Accent */}
      <div className="bg-accent-50 p-4 border-accent-200 border">
        <p className="text-accent-700">Accent - Aviation Gold</p>
      </div>
    </div>
  )
}
```

**Add to dashboard temporarily**:
```tsx
// app/dashboard/page.tsx
import { ThemeTest } from '@/components/theme-test'

export default function DashboardPage() {
  return (
    <div>
      <ThemeTest />
      {/* ... rest of dashboard */}
    </div>
  )
}
```

**Verify**:
- All colors render correctly in light mode
- Toggle dark mode → All colors adapt
- No console errors

**Remove test component** after verification.

---

## Phase 2: Color Mapping Reference (30 minutes)

### Step 2.1: Create Color Mapping Document

**File**: `docs/COLOR-MAPPING.md`

```markdown
# Color Mapping - Hardcoded to Theme Variables

## Purple → Captain

| Hardcoded Class | Theme Variable | Usage |
|----------------|----------------|-------|
| `bg-purple-50` | `bg-captain-50` | Captain stat cards, light backgrounds |
| `bg-purple-100` | `bg-captain-100` | Notification badges, highlights |
| `bg-purple-200` | `bg-captain-200` | Borders, dividers |
| `text-purple-600` | `text-captain-600` | Primary captain text |
| `text-purple-700` | `text-captain-700` | Emphasized captain text |
| `text-purple-800` | `text-captain-800` | High contrast captain text |
| `border-purple-200` | `border-captain-200` | Captain card borders |
| `from-purple-50` | `from-captain-50` | Gradient start |
| `to-purple-50` | `to-captain-50` | Gradient end |

## Green → Success

| Hardcoded Class | Theme Variable | Usage |
|----------------|----------------|-------|
| `bg-green-50` | `bg-success-50` | Success alerts, active certifications |
| `bg-green-100` | `bg-success-100` | Success badges |
| `text-green-600` | `text-success-600` | Success messages, current status |
| `text-green-700` | `text-success-700` | Emphasized success |
| `text-green-800` | `text-success-800` | High contrast success |
| `border-green-200` | `border-success-200` | Success borders |

## Yellow → Warning

| Hardcoded Class | Theme Variable | Usage |
|----------------|----------------|-------|
| `bg-yellow-50` | `bg-warning-50` | Warning alerts, expiring items |
| `bg-yellow-100` | `bg-warning-100` | Warning badges |
| `text-yellow-600` | `text-warning-600` | Warning text, expiring soon |
| `text-yellow-700` | `text-warning-700` | Emphasized warnings |
| `text-yellow-800` | `text-warning-800` | High contrast warnings |
| `border-yellow-200` | `border-warning-200` | Warning borders |

## Red → Destructive

| Hardcoded Class | Theme Variable | Usage |
|----------------|----------------|-------|
| `bg-red-50` | `bg-destructive-50` | Error alerts, expired items |
| `bg-red-100` | `bg-destructive-100` | Error badges |
| `text-red-600` | `text-destructive-600` | Error text, expired status |
| `text-red-700` | `text-destructive-700` | Emphasized errors |
| `text-red-800` | `text-destructive-800` | High contrast errors |
| `border-red-200` | `border-destructive-200` | Error borders |

## Blue → Primary

| Hardcoded Class | Theme Variable | Usage |
|----------------|----------------|-------|
| `bg-blue-50` | `bg-primary-50` | Primary backgrounds |
| `bg-blue-100` | `bg-primary-100` | Primary highlights |
| `text-blue-600` | `text-primary-600` | Primary text, links |
| `text-blue-700` | `text-primary-700` | Emphasized primary |
| `text-blue-900` | `text-primary-900` | High contrast primary |
| `border-blue-200` | `border-primary-200` | Primary borders |
| `from-blue-50` | `from-primary-50` | Gradient start |
| `to-blue-50` | `to-primary-50` | Gradient end |
```

---

## Phase 3: Automated Refactoring (8 hours)

### Step 3.1: Create Migration Script

**File**: `scripts/migrate-colors.sh`

```bash
#!/bin/bash

# Color Migration Script
# Replaces hardcoded Tailwind colors with theme variables

echo "Starting color migration..."

# Purple → Captain
echo "Migrating purple to captain..."
find components -name "*.tsx" -type f -exec sed -i '' \
  -e 's/bg-purple-50/bg-captain-50/g' \
  -e 's/bg-purple-100/bg-captain-100/g' \
  -e 's/bg-purple-200/bg-captain-200/g' \
  -e 's/text-purple-600/text-captain-600/g' \
  -e 's/text-purple-700/text-captain-700/g' \
  -e 's/text-purple-800/text-captain-800/g' \
  -e 's/border-purple-200/border-captain-200/g' \
  -e 's/from-purple-50/from-captain-50/g' \
  -e 's/to-purple-50/to-captain-50/g' \
  {} \;

# Green → Success
echo "Migrating green to success..."
find components -name "*.tsx" -type f -exec sed -i '' \
  -e 's/bg-green-50/bg-success-50/g' \
  -e 's/bg-green-100/bg-success-100/g' \
  -e 's/text-green-600/text-success-600/g' \
  -e 's/text-green-700/text-success-700/g' \
  -e 's/text-green-800/text-success-800/g' \
  -e 's/border-green-200/border-success-200/g' \
  {} \;

# Yellow → Warning
echo "Migrating yellow to warning..."
find components -name "*.tsx" -type f -exec sed -i '' \
  -e 's/bg-yellow-50/bg-warning-50/g' \
  -e 's/bg-yellow-100/bg-warning-100/g' \
  -e 's/text-yellow-600/text-warning-600/g' \
  -e 's/text-yellow-700/text-warning-700/g' \
  -e 's/text-yellow-800/text-warning-800/g' \
  -e 's/border-yellow-200/border-warning-200/g' \
  {} \;

# Red → Destructive
echo "Migrating red to destructive..."
find components -name "*.tsx" -type f -exec sed -i '' \
  -e 's/bg-red-50/bg-destructive-50/g' \
  -e 's/bg-red-100/bg-destructive-100/g' \
  -e 's/text-red-600/text-destructive-600/g' \
  -e 's/text-red-700/text-destructive-700/g' \
  -e 's/text-red-800/text-destructive-800/g' \
  -e 's/border-red-200/border-destructive-200/g' \
  {} \;

# Blue → Primary
echo "Migrating blue to primary..."
find components -name "*.tsx" -type f -exec sed -i '' \
  -e 's/bg-blue-50/bg-primary-50/g' \
  -e 's/bg-blue-100/bg-primary-100/g' \
  -e 's/text-blue-600/text-primary-600/g' \
  -e 's/text-blue-700/text-primary-700/g' \
  -e 's/text-blue-900/text-primary-900/g' \
  -e 's/border-blue-200/border-primary-200/g' \
  -e 's/from-blue-50/from-primary-50/g' \
  -e 's/to-blue-50/to-primary-50/g' \
  {} \;

echo "Color migration complete!"
echo "Files modified: $(find components -name "*.tsx" -type f | wc -l)"
```

**Make executable**:
```bash
chmod +x scripts/migrate-colors.sh
```

### Step 3.2: Dry Run Test

**Create backup first**:
```bash
# Create backup branch
git checkout -b feature/theme-migration
git commit -am "Backup before theme migration"

# Test on single file first
sed -i '' 's/bg-purple-50/bg-captain-50/g' components/dashboard/roster-period-carousel.tsx

# Verify changes
git diff components/dashboard/roster-period-carousel.tsx

# If looks good, restore and run full script
git restore components/dashboard/roster-period-carousel.tsx
./scripts/migrate-colors.sh
```

### Step 3.3: Review Changes

```bash
# See all modified files
git status

# Review changes file by file
git diff components/dashboard/dashboard-content.tsx
git diff components/portal/dashboard-stats.tsx
git diff components/dashboard/roster-period-carousel.tsx

# Check for any missed colors (should be empty)
grep -r "text-purple-\|bg-purple-\|text-green-\|bg-green-\|text-yellow-\|bg-yellow-\|text-red-\|bg-red-\|text-blue-\|bg-blue-" components --include="*.tsx" | grep -v "dark:" | wc -l
```

---

## Phase 4: Manual Review & Edge Cases (12 hours)

### Priority Files for Manual Review

#### 🔴 Critical - Review First (2 hours)

1. **components/dashboard/dashboard-content.tsx**
   - Lines 232-235: `colorClasses` object
   - Lines 86-94: Icon colors
   - Lines 108, 130-143: Conditional colors

   **Before**:
   ```typescript
   const colorClasses = {
     purple: 'bg-purple-50 border-purple-200',
     green: 'bg-green-50 border-green-200',
     // ...
   }
   ```

   **After**:
   ```typescript
   const colorClasses = {
     captain: 'bg-captain-50 border-captain-200',
     success: 'bg-success-50 border-success-200',
     warning: 'bg-warning-50 border-warning-200',
     destructive: 'bg-destructive-50 border-destructive-200',
     primary: 'bg-primary-50 border-primary-200',
   }
   ```

2. **components/dashboard/roster-period-carousel.tsx**
   - Line 120: Gradient colors
   - Line 159: Text colors
   - Line 212: Badge colors

   **Before**:
   ```typescript
   className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200"
   ```

   **After**:
   ```typescript
   className="bg-gradient-to-r from-primary-50 to-captain-50 border-primary-200"
   ```

3. **components/portal/dashboard-stats.tsx**
   - Lines 83-112: `statCards` array

   **Before**:
   ```typescript
   color: 'text-green-600',
   color: 'text-yellow-600',
   color: 'text-blue-600',
   color: 'text-indigo-600',  // ← No theme equivalent
   color: 'text-purple-600',
   ```

   **After**:
   ```typescript
   color: 'text-success-600',
   color: 'text-warning-600',
   color: 'text-primary-600',
   color: 'text-primary-600',  // Consolidate indigo → primary
   color: 'text-captain-600',
   ```

#### 🟡 High Priority - Review Second (4 hours)

4. **components/portal/leave-request-form.tsx**
   - Line 115: `focus:ring-blue-500`
   - Lines 175-180: Days count display

5. **components/certifications/certifications-table.tsx**
   - Status badge colors (multiple instances)

6. **components/leave/leave-request-group.tsx**
   - Badge variants

7. **components/pilot/PilotDashboardContent.tsx**
   - Stat card colors

#### 🟢 Medium Priority - Review Third (6 hours)

8-20. All remaining files from grep results

### Edge Cases to Handle Manually

#### Case 1: Dynamic Color Assignment

**Before**:
```typescript
className={`text-${color}-600`}  // ❌ Won't work with theme variables
```

**After**:
```typescript
className={cn(
  color === 'success' && 'text-success-600',
  color === 'warning' && 'text-warning-600',
  color === 'destructive' && 'text-destructive-600',
  color === 'primary' && 'text-primary-600',
  color === 'captain' && 'text-captain-600'
)}
```

#### Case 2: Conditional Colors with Ternary

**Before**:
```typescript
className={isActive ? 'text-green-600' : 'text-red-600'}
```

**After**:
```typescript
className={isActive ? 'text-success-600' : 'text-destructive-600'}
```

#### Case 3: Multiple Colors in Same String

**Before**:
```typescript
className="bg-green-50 text-green-800 border-green-200"
```

**After**:
```typescript
className="bg-success-50 text-success-800 border-success-200"
```

#### Case 4: Focus/Hover States

**Before**:
```typescript
className="hover:bg-blue-100 focus:ring-blue-500"
```

**After**:
```typescript
className="hover:bg-primary-100 focus:ring-primary"
```

#### Case 5: Dark Mode Variants

**Before**:
```typescript
className="text-green-600 dark:text-green-400"
```

**After**:
```typescript
className="text-success-600 dark:text-success-400"
```

---

## Phase 5: Testing (8 hours)

### Step 5.1: Visual Regression Testing

**Test Pages**:
1. `/dashboard` - Main dashboard
2. `/dashboard/pilots` - Pilots table
3. `/dashboard/certifications` - Certifications
4. `/dashboard/leave-requests` - Leave requests
5. `/portal/dashboard` - Pilot portal
6. `/portal/leave` - Leave request form

**Test Scenarios**:

```bash
# Start dev server
npm run dev

# Test light mode
# - Visit each page
# - Verify all colors render correctly
# - Check hover states
# - Verify focus states

# Test dark mode
# - Toggle to dark mode
# - Revisit all pages
# - Verify colors adapt properly
# - Check contrast ratios

# Take screenshots for comparison
# Before migration (from git stash)
# After migration (current state)
```

### Step 5.2: Component-Level Testing

**Dashboard Components**:
```bash
# Test HeroStatsServer
curl http://localhost:3000/dashboard
# Verify: Primary, success, accent, warning colors visible

# Test ComplianceOverviewServer
# Verify: Success, warning, destructive colors in compliance rings

# Test RosterPeriodCarousel
# Verify: Primary and captain gradient, countdown colors
```

**Portal Components**:
```bash
# Test DashboardStats
curl http://localhost:3000/api/portal/stats
# Verify: Success, warning, primary, captain colors in stat cards
```

### Step 5.3: Automated Testing

**Add color tests** (`e2e/theme.spec.ts`):

```typescript
import { test, expect } from '@playwright/test'

test.describe('Theme Implementation', () => {
  test('dashboard uses theme colors', async ({ page }) => {
    await page.goto('/dashboard')

    // Check HeroStats uses theme variables
    const statCard = page.locator('[data-testid="hero-stat-card"]').first()
    const bgColor = await statCard.evaluate((el) =>
      window.getComputedStyle(el).backgroundColor
    )

    // Should NOT be hardcoded purple/green/blue
    expect(bgColor).not.toBe('rgb(243, 232, 255)') // purple-50
    expect(bgColor).not.toBe('rgb(240, 253, 244)') // green-50
    expect(bgColor).not.toBe('rgb(239, 246, 255)') // blue-50

    // Should use theme variables (actual RGB values from CSS variables)
    // This validates theme is being applied
  })

  test('dark mode applies theme colors', async ({ page, context }) => {
    // Enable dark mode
    await context.addInitScript(() => {
      localStorage.setItem('theme', 'dark')
    })

    await page.goto('/dashboard')

    // Verify dark mode colors are applied
    const body = page.locator('body')
    await expect(body).toHaveClass(/dark/)

    // Check that colors adapt to dark mode
    const statCard = page.locator('[data-testid="hero-stat-card"]').first()
    const bgColor = await statCard.evaluate((el) =>
      window.getComputedStyle(el).backgroundColor
    )

    // Dark mode background should be dark (not light)
    expect(bgColor).toMatch(/rgb\(30, 41, 59\)/) // slate-800
  })
})
```

**Run tests**:
```bash
npx playwright test e2e/theme.spec.ts
```

### Step 5.4: Accessibility Testing

**Contrast Ratio Validation**:

```bash
# Install axe-core
npm install -D @axe-core/playwright

# Add to Playwright config
# playwright.config.ts
import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test('dashboard meets WCAG AA contrast', async ({ page }) => {
  await page.goto('/dashboard')

  const accessibilityScanResults = await new AxeBuilder({ page })
    .withTags(['wcag2aa'])
    .analyze()

  expect(accessibilityScanResults.violations).toEqual([])
})
```

**Manual Contrast Checks**:
- Use browser DevTools → Lighthouse → Accessibility
- Check all color combinations:
  - `text-success-700` on `bg-success-50` → ✅ Pass (4.5:1 minimum)
  - `text-warning-700` on `bg-warning-50` → ✅ Pass
  - `text-destructive-700` on `bg-destructive-50` → ✅ Pass
  - `text-captain-700` on `bg-captain-50` → ⚠️  Verify

---

## Phase 6: Documentation & Enforcement (4 hours)

### Step 6.1: Update Component Documentation

**Create** `docs/COMPONENT-COLOR-GUIDE.md`:

```markdown
# Component Color Guide

## Dashboard Components

### Hero Stats Cards
- Background: `bg-white dark:bg-card`
- Border: `border-slate-200 dark:border-slate-700`
- Gradient icons:
  - Total Pilots: `from-primary-500 to-primary-700`
  - Certifications: `from-success-500 to-success-700`
  - Compliance: `from-accent-500 to-accent-700`
  - Leave Requests: `from-warning-500 to-warning-700`

### Compliance Overview
- Success ring: `text-success-500`
- Warning ring: `text-warning-500`
- Critical ring: `text-destructive-500`
- Category bars:
  - Excellent: `bg-success-500`
  - Good: `bg-primary-500`
  - Warning: `bg-warning-500`
  - Critical: `bg-destructive-500`

### Roster Carousel
- Current roster: `from-primary-50 to-captain-50`
- Countdown: `text-primary-700`
- Days remaining: `text-captain-700`
- Next roster badge: `bg-captain-600`

## Portal Components

### Dashboard Stats
- Active Certifications: `text-success-600`
- Upcoming Checks: `text-warning-600`
- Leave Requests: `text-primary-600`
- Flight Requests: `text-primary-600`
- Fleet Pilots: `text-captain-600`

## Form Components

### Input States
- Default: `border-input bg-background`
- Focus: `ring-primary`
- Error: `border-destructive text-destructive`
- Success: `border-success text-success`

### Buttons
- Primary: `bg-primary text-primary-foreground hover:bg-primary/90`
- Destructive: `bg-destructive text-destructive-foreground`
- Secondary: `bg-secondary text-secondary-foreground`
```

### Step 6.2: ESLint Rule (Future Prevention)

**Install plugin**:
```bash
npm install -D eslint-plugin-tailwindcss
```

**Update** `.eslintrc.js`:
```javascript
module.exports = {
  extends: [
    'next/core-web-vitals',
    'plugin:tailwindcss/recommended',
  ],
  rules: {
    // Warn on hardcoded colors
    'tailwindcss/no-custom-classname': 'warn',

    // Custom rule: Disallow hardcoded color classes
    'no-restricted-syntax': [
      'error',
      {
        selector: 'Literal[value=/bg-(purple|green|yellow|red|blue)-/]',
        message: 'Use theme variables instead of hardcoded colors (e.g., bg-primary instead of bg-blue-50)',
      },
      {
        selector: 'Literal[value=/text-(purple|green|yellow|red|blue)-/]',
        message: 'Use theme variables instead of hardcoded colors (e.g., text-success-600 instead of text-green-600)',
      },
      {
        selector: 'Literal[value=/border-(purple|green|yellow|red|blue)-/]',
        message: 'Use theme variables instead of hardcoded colors (e.g., border-primary instead of border-blue-200)',
      },
    ],
  },
}
```

**Test linting**:
```bash
npm run lint

# Should show errors for any remaining hardcoded colors
```

### Step 6.3: Pre-commit Hook

**Update** `.husky/pre-commit`:
```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Run linter
npm run lint

# Check for hardcoded colors
if grep -r "text-purple-\|bg-purple-\|text-green-\|bg-green-\|text-yellow-\|bg-yellow-\|text-red-\|bg-red-\|text-blue-\|bg-blue-" components --include="*.tsx" | grep -v "dark:" > /dev/null; then
  echo "❌ Error: Hardcoded Tailwind colors detected!"
  echo "Use theme variables instead (bg-primary, text-success-600, etc.)"
  exit 1
fi

echo "✅ Theme compliance check passed"
```

**Make executable**:
```bash
chmod +x .husky/pre-commit
```

---

## Phase 7: Deployment & Monitoring (2 hours)

### Step 7.1: Staged Rollout

```bash
# Step 1: Deploy to development environment
npm run build
npm run start

# Step 2: Test in dev for 24 hours
# - Monitor error logs
# - Check user feedback
# - Verify no visual regressions

# Step 3: Deploy to staging
git push origin feature/theme-migration
# Create PR → Staging deployment

# Step 4: Final QA in staging
# - Full regression test
# - Dark mode testing
# - Accessibility audit

# Step 5: Production deployment
# Merge PR → Production deployment
```

### Step 7.2: Monitoring Plan

**Track Metrics**:
```javascript
// Add to analytics
analytics.track('Theme Migration Complete', {
  files_modified: 73,
  colors_migrated: {
    purple: 18,
    green: 25,
    yellow: 20,
    red: 30,
    blue: 28
  },
  deployment_date: new Date().toISOString()
})
```

**Monitor**:
- Error rate (should not increase)
- Page load time (should not change)
- Lighthouse score (should improve)
- User feedback (visual issues)

### Step 7.3: Rollback Plan

**If issues arise**:
```bash
# Immediate rollback
git revert <commit-hash>
git push origin main

# Or revert to backup branch
git checkout main
git reset --hard backup-before-migration
git push --force origin main
```

---

## Success Criteria

### ✅ Definition of Done

- [ ] All 73 files migrated to theme variables
- [ ] No hardcoded colors remain (purple, green, yellow, red, blue)
- [ ] Captain color added to theme (`--color-captain`)
- [ ] Extended color scales for success, warning, destructive
- [ ] All components render correctly in light mode
- [ ] All components render correctly in dark mode
- [ ] Lighthouse accessibility score ≥ 90
- [ ] No WCAG AA contrast violations
- [ ] ESLint rules prevent future violations
- [ ] Pre-commit hook blocks hardcoded colors
- [ ] Documentation complete (component color guide)
- [ ] Tests passing (visual, accessibility, E2E)
- [ ] Zero production errors post-deployment

---

## Quick Command Reference

```bash
# Phase 1: Add theme colors
# Edit app/globals.css manually

# Phase 2: Create mapping doc
# Create docs/COLOR-MAPPING.md manually

# Phase 3: Automated migration
chmod +x scripts/migrate-colors.sh
./scripts/migrate-colors.sh

# Phase 4: Review changes
git diff components/dashboard/dashboard-content.tsx
git diff components/portal/dashboard-stats.tsx

# Phase 5: Testing
npm run dev  # Manual testing
npx playwright test e2e/theme.spec.ts  # Automated testing

# Phase 6: Enforcement
npm run lint  # Check for violations

# Phase 7: Deploy
npm run build
npm run start
git commit -am "feat: migrate to theme-based color system"
git push origin feature/theme-migration
```

---

## Troubleshooting

### Issue 1: Colors Look Wrong After Migration

**Problem**: Components show unexpected colors

**Solution**:
```bash
# Clear Next.js cache
rm -rf .next
npm run dev

# Clear browser cache
# Chrome: Cmd+Shift+Delete → Clear cache
```

### Issue 2: Dark Mode Not Working

**Problem**: Colors don't change in dark mode

**Solution**:
```tsx
// Verify dark mode toggle is working
// Check: Does <html> have class="dark"?

// If not, update theme provider
// app/layout.tsx
<html className={theme}>
```

### Issue 3: Contrast Violations

**Problem**: Lighthouse reports contrast issues

**Solution**:
```css
/* Adjust color shades in globals.css */
/* Increase contrast by using darker text colors */
--color-success-700: #0f5a2a;  /* Darker for better contrast */
```

### Issue 4: ESLint False Positives

**Problem**: ESLint flags legitimate uses

**Solution**:
```tsx
// Add exception comment
// eslint-disable-next-line no-restricted-syntax
className="bg-blue-500"  // Only if truly necessary
```

---

## Timeline Summary

| Phase | Duration | Tasks |
|-------|----------|-------|
| Phase 1 | 1 hour | Add theme colors to globals.css |
| Phase 2 | 30 min | Create color mapping reference |
| Phase 3 | 8 hours | Automated migration script |
| Phase 4 | 12 hours | Manual review & edge cases |
| Phase 5 | 8 hours | Visual, automated, accessibility testing |
| Phase 6 | 4 hours | Documentation & ESLint rules |
| Phase 7 | 2 hours | Deployment & monitoring |
| **TOTAL** | **35.5 hours** | **Complete theme migration** |

**Recommended Schedule**:
- Week 1: Phases 1-3 (10 hours)
- Week 2: Phase 4 (12 hours)
- Week 3: Phases 5-7 (14 hours)

---

**Document Version**: 1.0.0
**Last Updated**: October 25, 2025
**Companion Documents**:
- DASHBOARD-ARCHITECTURE-REVIEW.md
- COMPONENT-DEPENDENCY-MAP.md
