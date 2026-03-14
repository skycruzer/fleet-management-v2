# Technology Stack

**Analysis Date:** 2026-03-14

## Languages

**Primary:**

- TypeScript 5.9 - Full codebase strict mode
- TSX/JSX - React components with type safety
- JavaScript/MJS - Build scripts and configuration

**Secondary:**

- SQL - Supabase PostgreSQL schemas and migrations

## Runtime

**Environment:**

- Node.js 22 (specified in `.nvmrc`) - Server runtime and build tooling

**Package Manager:**

- npm - Version ≥9.0.0
- Lockfile: `package-lock.json` present

## Frameworks

**Core:**

- Next.js 16.1.6 - App Router with React Compiler enabled
- React 19.2.4 - UI library with concurrent rendering

**Web Framework Utilities:**

- React Router/Navigation: Built into Next.js App Router
- Form State: React Hook Form 7.71.1 with Zod resolvers
- State Management: TanStack Query (React Query) 5.90.20 - Server state caching
- Client State: nuqs 2.8.8 - URL-based state management (tabs, filters, pagination)
- CSS Framework: Tailwind CSS 4.0.7 with `@tailwindcss/postcss`

**Testing:**

- Playwright 1.58.0 - E2E testing (Chromium only, sequential workers)
- Vitest 2.1.9 - Unit testing with jsdom environment
- Storybook 8.6.14+ / 10.2.1 - Component development and documentation

**Build/Dev:**

- Next.js (Webpack mode) - Dev server uses Webpack, not Turbopack
- Webpack (implicit) - Configured via Next.js `--webpack` flag
- Vite - Vitest runner for unit tests
- TypeScript Compiler (tsc) - Type checking via `npm run type-check`

## Key Dependencies

**Critical:**

- `@supabase/supabase-js` 2.93.2 - PostgreSQL database + auth client
- `@supabase/ssr` 0.8.0 - Server-side rendering support for Supabase
- `zod` 3.25.76 - Schema validation for forms and API inputs
- `resend` 6.9.1 - Email service for notifications and alerts

**Infrastructure:**

- `@upstash/redis` 1.36.1 - Distributed Redis client (Upstash)
- `@upstash/ratelimit` 2.0.8 - Rate limiting via Redis
- `next-themes` 0.4.6 - Dark/light mode with CSS class strategy

**UI Components & Styling:**

- `@radix-ui/*` (14 packages) - Accessible headless component primitives (accordion, dialog, dropdown, tabs, etc.)
- `lucide-react` 0.575.0 - Icon library (SVG icons)
- `@radix-ui/react-icons` 1.3.2 - Additional Radix icons
- `class-variance-authority` 0.7.1 - Type-safe component variants
- `clsx` 2.1.1 - Conditional CSS class utility
- `tailwind-merge` 3.4.0 - Merge Tailwind CSS classes without conflicts
- `tailwindcss-animate` 1.0.7 - Tailwind animation utilities

**Animations & Motion:**

- `framer-motion` 12.29.2 - React animation library
- `motion-variants` (custom) - Centralized animation definitions in `lib/animations/motion-variants.ts`

**Data Visualization & Reporting:**

- `@tremor/react` 3.18.7 - React data visualization components
- `jspdf` 4.0.0 - PDF generation (client/server)
- `jspdf-autotable` 5.0.7 - Table rendering in PDFs
- `pdfjs-dist` 5.4.624 - PDF viewing and manipulation
- `puppeteer` 24.36.1 - Headless browser for PDF generation (fallback)

**Utilities & Helpers:**

- `date-fns` 4.1.0 - Date manipulation and formatting
- `bcryptjs` 3.0.3 - Password hashing for pilot portal auth
- `csrf` 3.1.0 - CSRF token generation and validation
- `papaparse` 5.5.3 - CSV parsing and generation
- `isomorphic-dompurify` 3.0.0 - HTML/XSS sanitization (browser + server)
- `sharp` 0.34.5 - Image processing and optimization
- `@svgr/webpack` 8.1.0 - Convert SVG imports to React components
- `server-only` 0.0.1 - TypeScript marker for server-only modules
- `geist` 1.5.1 - Font family (Vercel Geist)
- `sonner` 2.0.7 - Toast notifications
- `cmdk` 1.1.1 - Command menu component
- `@dnd-kit/core` 6.3.1, `@dnd-kit/sortable` 10.0.0 - Drag-and-drop library
- `@tanstack/react-table` 8.21.3 - Headless table logic
- `@tanstack/react-virtual` 3.13.18 - Virtual scrolling for large lists

**Logging & Monitoring:**

- `@logtail/node` 0.5.6 - Server-side structured logging (Better Stack)
- `@logtail/browser` 0.5.6 - Client-side structured logging
- `@vercel/analytics` 1.6.1 - Vercel Web Analytics (automatically included)
- `@vercel/speed-insights` 1.3.1 - Vercel Speed Insights

**Form & Validation:**

- `@hookform/resolvers` 3.10.0 - Zod/Yup resolvers for React Hook Form
- `react-day-picker` 9.13.0 - Date picker component
- `@types/papaparse` 5.5.2 - TypeScript types for PapaParse

**Miscellaneous:**

- `@t3-oss/env-nextjs` 0.13.10 - Environment variable validation (not used; using custom Zod schema instead)
- `babel-plugin-react-compiler` 1.0.0 - React Compiler for automatic memoization (enabled)
- `@alloc/quick-lru` 5.2.0 - In-memory LRU cache utility
- `@thednp/dommatrix` 3.0.2 - DOM matrix transformation utility

## Configuration

**Environment:**

- Validated via `lib/env.ts` using Zod schema
- Public vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_APP_NAME`, `NEXT_PUBLIC_APP_VERSION`
- Server vars: `SUPABASE_SERVICE_ROLE_KEY`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `CRON_SECRET`, `LOGTAIL_SOURCE_TOKEN`
- Optional: `SUPPORT_EMAIL`, `FLEET_MANAGER_EMAIL`, `NEXT_PUBLIC_LOGTAIL_SOURCE_TOKEN`
- Env vars validated at startup; app fails fast on missing/invalid configuration

**Build:**

- `next.config.js` - Next.js configuration with CSP headers, image optimization, and route redirects
- `tsconfig.json` - TypeScript strict mode with `@/*` path alias
- `.prettierrc` - Prettier config: 2-space indent, single quotes, 100-char line width, Tailwind class sorting
- `eslint.config.mjs` - FlatConfig ESLint with TypeScript, React, and Next.js rules
- `vitest.config.mts` - Vitest with jsdom, coverage via v8
- `playwright.config.ts` - Playwright E2E with Chromium only, port 3005, sequential workers
- `.storybook/main.ts` - Storybook 8.6+ / 10.2+ with Next.js integration

**Styling:**

- Tailwind CSS v4 with PostCSS plugin
- Dark mode via `next-themes` with `class` strategy
- Class sorting via `prettier-plugin-tailwindcss`

## Platform Requirements

**Development:**

- Node.js 22+ (LTS)
- npm ≥9.0.0
- Webpack (implicit, via `npm run dev --webpack`)
- PostCSS and Tailwind CSS toolchain

**Production:**

- Vercel (default platform for Next.js 16 deployments)
- Edge runtime support (optional, not currently in use)
- PostgreSQL database (Supabase)
- Redis/Upstash (for sessions and rate limiting)
- SMTP provider via Resend (for email delivery)

**Server Actions:**

- Body size limit: 2MB (`serverActions.bodySizeLimit`)
- Disabled: Turbopack (uses Webpack for stability)

---

_Stack analysis: 2026-03-14_
