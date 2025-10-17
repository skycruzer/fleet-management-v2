# Contributing to Fleet Management V2

Thank you for your interest in contributing to Fleet Management V2! This document provides guidelines and instructions for contributing.

## Code of Conduct

- Be respectful and constructive
- Follow the coding standards
- Write clear commit messages
- Document your changes

## Development Setup

1. **Fork and Clone**

```bash
git clone https://github.com/your-username/fleet-management-v2.git
cd fleet-management-v2
```

2. **Install Dependencies**

```bash
npm install
```

3. **Setup Environment**

```bash
cp .env.example .env.local
# Add your Supabase credentials
```

4. **Start Development Server**

```bash
npm run dev
```

## Development Workflow

### 1. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

Branch naming conventions:
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Adding tests
- `chore/` - Maintenance tasks

### 2. Make Your Changes

- Write clean, readable code
- Follow the existing code style
- Add comments for complex logic
- Update documentation as needed

### 3. Run Quality Checks

```bash
# Type check
npm run type-check

# Lint check
npm run lint

# Format check
npm run format:check

# Run all checks
npm run validate
```

### 4. Test Your Changes

```bash
# Run E2E tests
npm test

# Run specific test
npx playwright test e2e/your-test.spec.ts

# Test in UI mode
npm run test:ui
```

### 5. Commit Your Changes

Follow conventional commit format:

```bash
git commit -m "feat: add pilot dashboard view"
git commit -m "fix: resolve certification expiry calculation"
git commit -m "docs: update API documentation"
```

Commit types:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `style:` - Formatting
- `refactor:` - Code refactoring
- `test:` - Adding tests
- `chore:` - Maintenance

### 6. Push and Create PR

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub.

## Coding Standards

### TypeScript

- Use TypeScript strict mode
- Define explicit types for function parameters and return values
- Avoid `any` type - use `unknown` or proper types
- Use type inference where appropriate

```typescript
// Good
function getPilotName(pilot: Pilot): string {
  return pilot.name
}

// Avoid
function getPilotName(pilot: any) {
  return pilot.name
}
```

### React Components

- Use functional components with hooks
- Keep components small and focused
- Extract reusable logic into custom hooks
- Use proper component naming (PascalCase)

```tsx
// Good
export function PilotCard({ pilot }: { pilot: Pilot }) {
  return <div>{pilot.name}</div>
}

// Component file structure
import { useState } from 'react'
import { Card } from '@/components/ui/card'

interface PilotCardProps {
  pilot: Pilot
}

export function PilotCard({ pilot }: PilotCardProps) {
  const [expanded, setExpanded] = useState(false)
  // Component logic
  return (
    <Card>
      {/* Component JSX */}
    </Card>
  )
}
```

### Styling

- Use Tailwind CSS utility classes
- Follow mobile-first responsive design
- Use theme colors from globals.css
- Keep custom CSS minimal

```tsx
// Good
<div className="flex flex-col gap-4 p-6 rounded-lg border bg-card">
  <h2 className="text-2xl font-semibold">Title</h2>
</div>

// Avoid inline styles
<div style={{ padding: '1.5rem' }}>
```

### File Organization

```
component-name/
├── index.ts              # Export
├── component-name.tsx    # Component
├── component-name.stories.tsx  # Storybook
└── component-name.test.tsx     # Tests (if applicable)
```

## Pull Request Guidelines

### PR Title

Use conventional commit format:

```
feat: add pilot certification dashboard
fix: resolve date formatting in reports
docs: update deployment instructions
```

### PR Description

Include:

1. **What**: Brief description of changes
2. **Why**: Reason for the changes
3. **How**: Technical approach (if complex)
4. **Testing**: How you tested the changes
5. **Screenshots**: For UI changes

Example:

```markdown
## What
Adds a new pilot certification dashboard with expiry alerts.

## Why
Pilots need a centralized view of all their certifications and upcoming renewals.

## How
- Created new dashboard component
- Added Supabase queries for certification data
- Implemented filtering and sorting
- Added E2E tests

## Testing
- ✅ Manual testing on Chrome, Firefox, Safari
- ✅ E2E tests passing
- ✅ Type checks passing
- ✅ Responsive design verified

## Screenshots
[Attach screenshots]
```

### PR Checklist

Before submitting, ensure:

- [ ] Code follows project style guidelines
- [ ] TypeScript strict mode passes
- [ ] ESLint checks pass
- [ ] Tests are passing
- [ ] Documentation is updated
- [ ] Storybook stories added (for UI components)
- [ ] Commit messages follow conventions
- [ ] No console.log or debug code
- [ ] Branch is up to date with main

## Testing Guidelines

### E2E Tests with Playwright

```typescript
import { test, expect } from '@playwright/test'

test.describe('Pilot Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/pilots')
  })

  test('should display pilot list', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Pilots' })).toBeVisible()
    await expect(page.getByRole('table')).toBeVisible()
  })

  test('should filter pilots by status', async ({ page }) => {
    await page.getByLabel('Status').selectOption('active')
    await expect(page.getByRole('row')).toHaveCount(5)
  })
})
```

### Component Stories

```typescript
import type { Meta, StoryObj } from '@storybook/react'
import { PilotCard } from './pilot-card'

const meta = {
  title: 'Components/PilotCard',
  component: PilotCard,
  tags: ['autodocs'],
} satisfies Meta<typeof PilotCard>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    pilot: {
      id: '1',
      name: 'John Doe',
      status: 'active',
    },
  },
}
```

## Database Migrations

### Creating Migrations

```bash
npm run db:migration create_new_table
```

### Migration Guidelines

- One migration per logical change
- Include both up and down migrations
- Test migrations thoroughly
- Document breaking changes

### Example Migration

```sql
-- Create pilots table
CREATE TABLE pilots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE pilots ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view pilots"
  ON pilots FOR SELECT
  USING (auth.role() = 'authenticated');

-- Create indexes
CREATE INDEX idx_pilots_email ON pilots(email);
CREATE INDEX idx_pilots_status ON pilots(status);
```

## Documentation

### Code Comments

```typescript
/**
 * Calculates the days until a certification expires
 * @param expiryDate - The expiry date of the certification
 * @returns Number of days until expiry, negative if expired
 */
export function getDaysUntilExpiry(expiryDate: Date): number {
  const today = new Date()
  const diffTime = expiryDate.getTime() - today.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}
```

### README Updates

Update relevant sections when:
- Adding new features
- Changing configuration
- Updating dependencies
- Adding new scripts

## Getting Help

- **Questions**: Open a discussion on GitHub
- **Bugs**: Create an issue with reproduction steps
- **Features**: Create an issue describing the use case
- **Security**: Email security concerns privately

## Recognition

Contributors will be recognized in:
- CONTRIBUTORS.md file
- Release notes
- Project documentation

Thank you for contributing to Fleet Management V2!
