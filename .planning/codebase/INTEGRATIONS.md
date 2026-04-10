# External Integrations

**Analysis Date:** 2026-03-14

## APIs & External Services

**Email Delivery:**

- Resend (https://resend.com)
  - What it's used for: Pilot registration approvals, certification expiry alerts, password resets, leave/flight request notifications
  - SDK/Client: `resend` 6.9.1
  - Implementation: `lib/services/pilot-email-service.ts` (Resend API)
  - Auth: `RESEND_API_KEY` env var (server-only)
  - Sender: `RESEND_FROM_EMAIL` env var (typically noreply@domain)

**Logging & Error Tracking:**

- Better Stack / Logtail (https://betterstack.com)
  - What it's used for: Structured server-side and client-side logging
  - SDK/Client: `@logtail/node` (server), `@logtail/browser` (client)
  - Auth: `LOGTAIL_SOURCE_TOKEN` (server), `NEXT_PUBLIC_LOGTAIL_SOURCE_TOKEN` (client)
  - Optional: Falls back to console if token not configured

**Web Analytics & Performance Monitoring:**

- Vercel Analytics (https://vercel.com/analytics)
  - What it's used for: Web analytics and Core Web Vitals tracking
  - SDK/Client: `@vercel/analytics` 1.6.1
  - Integration: Automatically included in Vercel deployments
  - Endpoint: `va.vercel-scripts.com`, `vitals.vercel-insights.com`

- Vercel Speed Insights (https://vercel.com/speed-insights)
  - What it's used for: Real User Monitoring (RUM) for performance metrics
  - SDK/Client: `@vercel/speed-insights` 1.3.1
  - Endpoint: `vitals.vercel-insights.com`

## Data Storage

**Databases:**

- PostgreSQL via Supabase (https://supabase.com)
  - Project ID: `wgdmgvonqysflwdiiols`
  - Connection: Environment variables `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - Client: `@supabase/supabase-js` 2.93.2 (browser + server)
  - Server-side rendering: `@supabase/ssr` 0.8.0
  - Admin operations: Service role key via `SUPABASE_SERVICE_ROLE_KEY`

**File Storage:**

- Supabase Storage (S3-compatible)
  - What it's used for: Avatar images, certificates, user-generated content
  - Client: Supabase SDK file storage endpoints
  - Integration: Image optimization via Next.js `remotePatterns` in `next.config.js` for domain `wgdmgvonqysflwdiiols.supabase.co`

**Caching:**

- Upstash Redis (https://upstash.com)
  - What it's used for: Sessions, rate limiting, query result caching, cache invalidation
  - SDK/Client: `@upstash/redis` 1.36.1
  - Connection: `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`
  - Fallback: No-op in development when Redis not configured
  - Session TTL: 24 hours
  - Rate limit TTL: Per endpoint (1 min to 1 hour)

## Authentication & Identity

**Admin Portal Auth:**

- Supabase Auth (built into Supabase)
  - Implementation: Server components use Supabase Auth client
  - Session management: Cookies managed by `@supabase/ssr`
  - Flow: `/auth/*` routes for sign-up/sign-in/password reset

**Pilot Portal Auth:**

- Custom auth (local database)
  - Table: `an_users` (aliased as `pilot_users`)
  - Password hashing: `bcryptjs` 3.0.3
  - Session storage: Redis via `redis-session-service.ts`
  - Session cookie: `pilot-session` (24h TTL)
  - Flow: `/portal/(public)/*` routes for login/register/password reset
  - Implementation: `lib/services/pilot-portal-service.ts`, `lib/auth/pilot-session.ts`

**Dual Auth Architecture:**

- Admin: Supabase Auth + fallback admin-session cookie
- Pilot: Custom Redis-backed sessions (no Supabase Auth)
- Never mixed between portals

**CSRF Protection:**

- Double-submit cookie strategy via `csrf` 3.1.0 package
- Implementation: `lib/middleware/csrf-middleware.ts`
- Token validation: All mutation API routes

## Monitoring & Observability

**Error Tracking:**

- Logtail / Better Stack (optional)
  - Server errors logged via `@logtail/node`
  - Client errors logged via `@logtail/browser`
  - Token: `LOGTAIL_SOURCE_TOKEN`

**Logs:**

- Server: Structured logging via `lib/services/logging-service.ts` (Logtail + console)
- Client: Browser console + Logtail (if configured)
- Database: Audit logging for sensitive operations via `audit_log` table
- Rate Limits: Analytics enabled on Upstash rate limiters

**Performance Metrics:**

- Web Vitals: Vercel Speed Insights (automatic)
- Page load: Built into Vercel deployment
- Real User Monitoring: Via Speed Insights

## CI/CD & Deployment

**Hosting:**

- Vercel (default for Next.js 16)
  - Deployment: Git push triggers automatic builds
  - Environment variables: Configured in Vercel Dashboard
  - Scheduled jobs: Cron routes (e.g., `/api/cron/certification-expiry-alerts`)

**CI Pipeline:**

- Vercel CI (implicit on git push)
- Pre-commit hooks: Husky + lint-staged
  - Eslint --fix, Prettier format on `*.{js,jsx,ts,tsx}`
  - Prettier format on `*.{json,md,mdx,css,yaml,yml}`

**Build Validation:**

- Type check: `npm run type-check` (tsc)
- Linting: `npm run lint` (eslint)
- Format check: `npm run format:check` (prettier)
- Comprehensive: `npm run validate` (all three)

## Environment Configuration

**Required env vars:**

- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Anonymous key for browser clients
- `UPSTASH_REDIS_REST_URL` - Redis connection URL
- `UPSTASH_REDIS_REST_TOKEN` - Redis authentication
- `RESEND_API_KEY` - Email service API key
- `RESEND_FROM_EMAIL` - Email sender address

**Optional env vars:**

- `NEXT_PUBLIC_APP_URL` - App base URL (defaults to http://localhost:3000)
- `SUPABASE_SERVICE_ROLE_KEY` - Admin key for RLS bypass (server-only)
- `CRON_SECRET` - Vercel cron job authentication
- `LOGTAIL_SOURCE_TOKEN` - Server logging (Better Stack)
- `NEXT_PUBLIC_LOGTAIL_SOURCE_TOKEN` - Client logging (Better Stack)
- `SUPPORT_EMAIL` - Contact email for support
- `FLEET_MANAGER_EMAIL` - Fleet manager email for notifications

**Secrets location:**

- Development: `.env.local` (gitignored)
- Tests: `.env.test.local` (gitignored)
- Production: Vercel Environment Variables dashboard
- Never commit `.env` files or credentials

**Validation:**

- All vars validated at startup via `lib/env.ts` (Zod schema)
- App fails fast on missing/invalid configuration
- Missing Redis falls back to no-op in development

## Webhooks & Callbacks

**Incoming:**

- None currently implemented
- Ready for future integrations (Supabase webhooks, third-party APIs)

**Outgoing:**

- Scheduled cron routes:
  - `/api/cron/certification-expiry-alerts` - Daily 6 AM UTC (sends emails to pilots with expiring certs)
  - `/api/cron/pilot-retirement-check` - Scheduled retirement forecast updates
  - Triggered by Vercel scheduler; auth via `CRON_SECRET`

**Email Notifications (Outbound):**

- Pilot registration approvals: `sendRegistrationApprovalEmail()` in `pilot-email-service.ts`
- Certification expiry: `sendCertificationExpiryEmail()` (via cron)
- Leave request approval/denial: `sendLeaveRequestNotificationEmail()`
- Flight request approval/denial: `sendFlightRequestNotificationEmail()`
- Password resets: `sendPasswordResetEmail()`
- Admin notifications: Via bell notifications + optional email (fire-and-forget pattern)

## Image & Asset Delivery

**Remote Image Sources:**

- Supabase Storage: `wgdmgvonqysflwdiiols.supabase.co/storage/v1/object/public/**`
- Dev placeholders: `i.pravatar.cc` (avatars), `picsum.photos` (images)
- Optimization: Next.js Image component with WebP/AVIF formats

## Third-Party Components & Fonts

**Icon Libraries:**

- Lucide React: 575+ SVG icons
- Radix UI Icons: Additional icon set

**Fonts:**

- Geist (Vercel font): Included via `geist` 1.5.1

**Chart Visualizations:**

- Tremor React: Dashboard charts and data visualizations (analytics)

## Security & Content Delivery

**Content Security Policy (CSP):**

- Configured in `next.config.js`
- Allows: Vercel scripts, Supabase WebSocket, images from Supabase/pravatar/picsum
- Blocks: Unsafe-eval in some contexts, cross-origin frame embedding

**CORS:**

- Supabase-managed (implicit in SDK)
- No explicit CORS headers needed for same-origin requests

**Session Security:**

- HTTP-only cookies for session tokens
- SameSite=Lax (default Next.js behavior)
- HTTPS-only in production (Vercel enforces)

---

_Integration audit: 2026-03-14_
