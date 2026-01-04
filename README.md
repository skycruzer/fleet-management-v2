# Fleet Management V2

Modern fleet management system built with Next.js 15, TypeScript, and Supabase for comprehensive B767 aircraft operations management.

## Features

- **Pilot Management**: Comprehensive pilot profiles with certification tracking and qualifications
- **Certification Tracking**: Track 38+ check types with automated expiry alerts
- **Analytics Dashboard**: Real-time fleet metrics and compliance statistics
- **Reports System**: 19 professional reports across 5 categories (Certifications, Fleet, Leave, Operational, System)
- **Progressive Web App**: Works offline, installable on mobile devices
- **Security First**: Built with Supabase RLS and role-based access control
- **Modern Stack**: Next.js 16, React 19, TypeScript, Tailwind CSS v4
- **Aviation Compliant**: FAA standards with color-coded status indicators

### ✨ Phase 0 Improvements (October 2025)

- **⚡ Instant UI Updates**: Optimistic mutations with automatic error rollback
- **🎨 No Blank Screens**: Skeleton loading components for all major pages
- **📊 100% Error Visibility**: Better Stack logging integration (server + client)
- **🚀 Professional UX**: Clean console, instant feedback, production-ready polish

## Tech Stack

- **Framework**: Next.js 15.5.4 with App Router
- **Language**: TypeScript 5.7.3 (strict mode)
- **UI Library**: React 19.1.0
- **Styling**: Tailwind CSS v4.1.0 with dark mode support
- **Components**: shadcn/ui with Radix UI primitives
- **Database**: Supabase PostgreSQL with Row Level Security
- **Authentication**: Supabase Auth with SSR support
- **State Management**: TanStack Query 5.90.2
- **Form Handling**: React Hook Form 7.63.0 with Zod 4.1.11
- **Testing**: Playwright 1.55.0 for E2E tests
- **Component Dev**: Storybook 8.5.11
- **PWA**: Serwist (next-pwa successor) with service worker caching
- **Code Quality**: ESLint, Prettier, Husky, lint-staged

## Prerequisites

- Node.js 18+ and npm 9+
- Supabase account and project
- Git for version control

## Getting Started

### 1. Clone and Install

```bash
git clone <repository-url>
cd fleet-management-v2
npm install
```

### 2. Environment Setup

Copy `.env.example` to `.env.local` and configure:

```bash
cp .env.example .env.local
```

Update the following variables:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Get your Supabase credentials from:
https://app.supabase.com/project/YOUR_PROJECT_ID/settings/api

### 3. Generate Database Types

```bash
npm run db:types
```

This generates TypeScript types from your Supabase schema.

### 4. Start Development Server

```bash
npm run dev
```

Visit http://localhost:3000

## Development Scripts

### Core Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run type-check   # Run TypeScript compiler check
npm run format       # Format code with Prettier
npm run format:check # Check code formatting
npm run validate     # Run type-check, lint, and format:check
```

### Testing Commands

```bash
npm test             # Run Playwright E2E tests
npm run test:ui      # Open Playwright UI mode
npm run test:headed  # Run tests with browser visible
npm run test:debug   # Run tests in debug mode
```

### Storybook Commands

```bash
npm run storybook       # Start Storybook dev server (port 6006)
npm run build-storybook # Build Storybook static site
```

### Database Commands

```bash
npm run db:types     # Generate TypeScript types from database
npm run db:migration # Create new database migration
npm run db:deploy    # Deploy migrations to production
```

## Project Structure

```
fleet-management-v2/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout with theme provider
│   ├── page.tsx           # Homepage
│   ├── globals.css        # Global styles with Tailwind v4
│   └── api/               # API routes
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── forms/            # Form components
│   ├── layout/           # Layout components
│   └── theme-provider.tsx # Theme provider
├── lib/                   # Utilities and configurations
│   ├── supabase/         # Supabase client configs
│   ├── utils.ts          # Utility functions
│   └── hooks/            # Custom React hooks
├── types/                 # TypeScript type definitions
│   └── supabase.ts       # Generated database types
├── e2e/                   # Playwright E2E tests
├── .storybook/           # Storybook configuration
├── public/               # Static assets
└── docs/                 # Documentation
```

## Database Setup

### Creating Tables

Use Supabase Studio or create migrations:

```bash
npm run db:migration create_pilots_table
```

### Row Level Security (RLS)

Ensure RLS is enabled on all tables for security:

```sql
ALTER TABLE pilots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view pilots"
  ON pilots FOR SELECT
  USING (auth.role() = 'authenticated');
```

### Generating Types

After any schema changes:

```bash
npm run db:types
```

## Adding Components

### Using shadcn/ui

```bash
npx shadcn@latest add dialog
npx shadcn@latest add dropdown-menu
npx shadcn@latest add table
```

### Creating Custom Components

1. Create component in `components/`
2. Add Storybook story in `components/**/*.stories.tsx`
3. Export from index file

Example:

```tsx
// components/my-component.tsx
export function MyComponent() {
  return <div>Hello World</div>
}

// components/my-component.stories.tsx
import type { Meta, StoryObj } from '@storybook/react'
import { MyComponent } from './my-component'

const meta = {
  title: 'Components/MyComponent',
  component: MyComponent,
  tags: ['autodocs'],
} satisfies Meta<typeof MyComponent>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
```

## Authentication

### Client Component

```tsx
'use client'
import { createClient } from '@/lib/supabase/client'

export function ClientComponent() {
  const supabase = createClient()
  // Use supabase client
}
```

### Server Component

```tsx
import { createClient } from '@/lib/supabase/server'

export default async function ServerComponent() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  // Use supabase client
}
```

## Reports System

The Fleet Management V2 application includes a comprehensive reporting system with 19 professional reports across 5 categories.

### Report Categories

#### 1. Certification Reports (4 reports)

- **All Certifications Export** - Complete certification database (CSV, Excel)
- **Fleet Compliance Summary** - Compliance metrics and analysis (Excel, PDF\*)
- **Expiring Certifications** - Certifications approaching expiry (CSV, Excel, customizable threshold)
- **Renewal Schedule** - Calendar of certification renewals (iCal format)

#### 2. Fleet Reports (4 reports)

- **Active Roster** - Current pilot roster (CSV, Excel, filterable by rank)
- **Demographics Analysis** - Pilot demographics breakdown (Excel, PDF\*)
- **Retirement Forecast** - Retirement projections (Excel, PDF\*)
- **Succession Pipeline** - Succession planning report (Excel, PDF\*)

#### 3. Leave Reports (4 reports)

- **Annual Allocation** - Annual leave allocations by year (Excel)
- **Bid Summary** - Leave bid analysis by year (Excel)
- **Calendar Export** - Leave calendar in iCal format
- **Request Summary** - Leave request history (CSV, Excel, filterable by date/status)

#### 4. Operational Reports (3 reports)

- **Disciplinary Summary** - Disciplinary action summary with privacy redaction (CSV)
- **Flight Requests** - Flight request history (CSV, Excel)
- **Task Completion** - Task completion metrics (CSV, Excel)

#### 5. System Reports (4 reports)

- **Audit Log** - Complete audit trail (CSV, Excel, requires date range)
- **Feedback Summary** - User feedback analysis (CSV, Excel)
- **System Health** - System health metrics (JSON)
- **User Activity** - User activity report (CSV, Excel)

_\*PDF format pending implementation (returns 501 status)_

### Using Reports

**Access Reports Dashboard**:

```
http://localhost:3000/dashboard/reports
```

**Generate Report via API**:

```bash
curl -X POST http://localhost:3000/api/reports/certifications/all \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"format": "csv"}'
```

**Report Parameters**:

```typescript
{
  format: 'csv' | 'excel' | 'pdf' | 'ical',
  parameters?: {
    dateRange?: { start: string; end: string },
    threshold?: string,  // e.g., "90 days"
    filters?: any
  }
}
```

### Report Features

- **Multiple Formats**: CSV, Excel, PDF (pending), iCal
- **Smart Filtering**: Date ranges, status filters, rank filters
- **Privacy Protection**: Sensitive data automatically redacted
- **Authentication Required**: All reports require valid authentication
- **Audit Trail**: All report generation logged in audit log

### Testing Reports

Run E2E tests for all reports:

```bash
npx playwright test e2e/reports.spec.ts
```

Test specific report:

```bash
npx playwright test e2e/reports.spec.ts --grep "certification"
```

### Report Documentation

- **Implementation**: `REPORTS-SYSTEM-STATUS.md`
- **Security Audit**: `SECURITY-AUDIT-REPORTS-SYSTEM.md`
- **E2E Tests**: `e2e/reports.spec.ts`
- **Validation**: `VALIDATION-COMPLETE.md`

## Testing

### Writing E2E Tests

Create test files in `e2e/` directory:

```typescript
import { test, expect } from '@playwright/test'

test('should load homepage', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/Fleet Management/)
})
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npx playwright test e2e/example.spec.ts

# Run with UI mode
npm run test:ui
```

## Deployment

### Vercel (Recommended)

1. Connect your Git repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy with `git push`

### Manual Deployment

```bash
npm run build
npm run start
```

## Code Quality

### Pre-commit Hooks

Husky runs lint-staged before each commit:

- ESLint fixes
- Prettier formatting
- Type checking

### Git Hooks

```bash
# Setup Husky (done automatically on npm install)
npm run prepare
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Run `npm run validate` to check code quality
4. Commit with descriptive message
5. Push and create PR

## Environment Variables

| Variable                        | Description                    | Required |
| ------------------------------- | ------------------------------ | -------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase project URL           | Yes      |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key         | Yes      |
| `NEXT_PUBLIC_APP_URL`           | Application base URL           | Yes      |
| `SUPABASE_SERVICE_ROLE_KEY`     | Service role key (server-only) | No       |

## Troubleshooting

### Common Issues

**Issue**: TypeScript errors about Supabase types
**Solution**: Run `npm run db:types` to regenerate types

**Issue**: Tailwind classes not working
**Solution**: Check `postcss.config.js` and `app/globals.css`

**Issue**: Playwright tests failing
**Solution**: Install browsers with `npx playwright install`

**Issue**: Husky hooks not running
**Solution**: Run `npm run prepare` to setup hooks

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com)
- [Tailwind CSS v4](https://tailwindcss.com/docs)
- [Playwright Testing](https://playwright.dev)

## License

MIT

## Author

Maurice (Skycruzer)

## Support

For issues and questions:

- Create an issue in the repository
- Check existing documentation in `/docs`
- Review Storybook component examples

---

**Built with ❤️ using Next.js, TypeScript, and Supabase**
