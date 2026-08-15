# Documentation

Reference documentation for the Air Niugini fleet/pilot management app. Project
conventions and architecture rules live in [`CLAUDE.md`](../CLAUDE.md) at the repo
root — read that first.

## Architecture

- [Architecture diagrams](ARCHITECTURE-DIAGRAMS.md) — system and data-flow diagrams
- [Service layer architecture](SERVICE-LAYER-ARCHITECTURE.md) — how `lib/services/` is structured; all DB access goes through it
- [Project documentation](PROJECT-DOCUMENTATION.md) — feature-level overview
- [Transaction boundaries](TRANSACTION-BOUNDARIES.md) — where multi-write operations are made atomic

## Database and security

- [RLS policy documentation](RLS-POLICY-DOCUMENTATION.md) — Row Level Security policies per table
- [Database audit report](DATABASE-AUDIT-REPORT.md) — schema review findings
- [Security audit report](SECURITY-AUDIT-REPORT.md) — security review findings
- [Rate limiting](RATE-LIMITING.md) — Upstash Redis limiter setup and the per-instance fallback

## Features

- [Renewal planning guide](RENEWAL_PLANNING_GUIDE.md) — certification renewal planning, for users
- [Renewal planning technical](RENEWAL_PLANNING_TECHNICAL.md) — the implementation behind it
- [Toast notifications](TOAST-NOTIFICATIONS.md) — notification patterns

## Operations

- [Deployment guide](DEPLOYMENT-GUIDE.md) — deploying to Vercel
- [Post-deployment verification](POST-DEPLOYMENT-VERIFICATION.md) — what to check after a release
- [Monitoring dashboard](MONITORING-DASHBOARD.md) — dashboards and alerts
- [Better Stack setup](BETTER-STACK-SETUP.md) — log aggregation and uptime monitoring
- [Error handling guide](ERROR-HANDLING-GUIDE.md) — error boundaries and API error shapes

## Testing

- [Comprehensive testing guide](COMPREHENSIVE-TESTING-GUIDE.md) — Playwright E2E and Vitest unit tests

## Reviews and research

Point-in-time assessments. Useful as history; verify against the code before
acting on them.

- [Project review 2026-06-10](PROJECT-REVIEW-2026-06-10.md)
- [Codebase quality report](CODEBASE-QUALITY-REPORT.md)
- [UX review report](UX-REVIEW-REPORT.md)
- [Workflow analysis report](WORKFLOW-ANALYSIS-REPORT.md)
- [Market research](market-research.md)
