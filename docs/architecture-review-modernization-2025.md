# Architecture Review & Modernization Plan
## Fleet Management V2 - B767 Pilot Management System

**Document Version**: 1.0
**Date**: October 24, 2025
**Author**: Maurice (Skycruzer)
**Reviewers**: BMad Master (Orchestrator), Sally (UX Expert)
**Project Type**: Brownfield (Comprehensive Modernization)
**Status**: Strategic Planning

---

## Executive Summary

### Purpose
This document provides a comprehensive architectural review of Fleet Management V2 and establishes a modernization roadmap to elevate the system to the highest modern standards. This is a strategic initiative to prepare the foundation for future feature additions while ensuring the existing system meets enterprise-grade quality standards.

### Current System Overview
Fleet Management V2 is a **production-ready B767 Pilot Management System** with:
- **27 active pilots** managed
- **607 certifications** tracked
- **34 check types** defined
- **Modern tech stack**: Next.js 15.5.4, React 19.1.0, TypeScript 5.7.3, Supabase PostgreSQL
- **Service-layer architecture** with 13 specialized services
- **119 application files** and **130 UI components**
- **Professional UI design system** implemented
- **PWA support** with offline capabilities
- **E2E testing** with Playwright

**Current Strengths**:
✅ Solid architectural foundation (service layer pattern)
✅ Modern tech stack (cutting-edge versions)
✅ Professional UI design system in place
✅ Comprehensive testing infrastructure
✅ Type-safe with strict TypeScript
✅ Production database with real data

**Modernization Opportunity**:
The system is **functionally complete** but requires systematic modernization to achieve:
1. **Highest code quality standards**
2. **Enterprise-grade performance**
3. **Best-in-class user experience**
4. **Scalability for future growth**
5. **Maintainability for long-term success**

### Proposed Changes
**Strategic Modernization Initiative** across 5 key dimensions:

1. **Architecture Excellence** - Optimize service layer, implement advanced patterns
2. **Performance Optimization** - Sub-100ms response times, 60fps interactions
3. **Code Quality** - Eliminate all technical debt, enforce highest standards
4. **User Experience** - Refine UI/UX to premium level
5. **DevOps & Infrastructure** - CI/CD, monitoring, deployment automation

**Timeline**: 8-12 weeks (phased approach)
**Impact**: Transform from "production-ready" to "best-in-class"
**ROI**: Foundation for rapid feature development and enterprise sales

---

## 1. System Context

### 1.1 Existing System Architecture

**Current Tech Stack**:

| Layer | Technology | Version | Status |
|-------|------------|---------|--------|
| **Frontend** | Next.js (App Router) | 15.5.4 | ✅ Latest |
| **UI Library** | React | 19.1.0 | ✅ Latest |
| **Language** | TypeScript (strict) | 5.7.3 | ✅ Latest |
| **Styling** | Tailwind CSS | 4.1.0 | ✅ Latest |
| **UI Components** | Radix UI (shadcn/ui) | Latest | ✅ Modern |
| **Backend** | Next.js API Routes + Server Actions | 15.5.4 | ✅ Latest |
| **Database** | Supabase PostgreSQL | 2.75.1 | ✅ Production |
| **State Management** | TanStack Query | 5.90.2 | ✅ Latest |
| **Forms** | React Hook Form + Zod | 7.65.0 + 4.1.12 | ✅ Latest |
| **Testing** | Playwright | 1.55.0 | ✅ Latest |
| **Build System** | Turbopack | Built-in | ✅ Latest |
| **PWA** | Serwist/Next | 9.2.1 | ✅ Modern |
| **Animation** | Framer Motion | 12.23.24 | ✅ Latest |

**Assessment**: ✅ **Excellent** - Using cutting-edge, stable versions across the board.

---

**Current System Boundaries**:

```
┌─────────────────────────────────────────────────────────────┐
│                    Fleet Management V2                       │
│                                                               │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐    │
│  │   Admin     │  │    Pilot     │  │   Public        │    │
│  │  Dashboard  │  │   Portal     │  │   Landing       │    │
│  └──────┬──────┘  └──────┬───────┘  └────────┬────────┘    │
│         │                 │                    │             │
│         └─────────────────┼────────────────────┘             │
│                           │                                  │
│                    ┌──────▼───────┐                          │
│                    │   API Layer  │                          │
│                    │  (Routes +   │                          │
│                    │   Actions)   │                          │
│                    └──────┬───────┘                          │
│                           │                                  │
│                    ┌──────▼───────┐                          │
│                    │ Service Layer│  ◄─ **13 Services**     │
│                    │  (Business   │                          │
│                    │   Logic)     │                          │
│                    └──────┬───────┘                          │
│                           │                                  │
│                    ┌──────▼───────┐                          │
│                    │   Supabase   │                          │
│                    │  PostgreSQL  │                          │
│                    │   Database   │                          │
│                    └──────────────┘                          │
└─────────────────────────────────────────────────────────────┘
         │                           │                    │
         │                           │                    │
    ┌────▼────┐              ┌──────▼──────┐     ┌──────▼──────┐
    │ Browser │              │   Upstash   │     │  External   │
    │ Storage │              │    Redis    │     │    APIs     │
    │  (PWA)  │              │(Rate Limit) │     │  (Future)   │
    └─────────┘              └─────────────┘     └─────────────┘
```

**Current Data Flow**:
1. User interaction (Admin/Pilot/Public)
2. Client Component → TanStack Query
3. API Route or Server Action
4. **Service Layer** (critical - ALL DB operations)
5. Supabase Client
6. PostgreSQL Database

**Existing Integrations**:
- ✅ Supabase Auth (authentication)
- ✅ Upstash Redis (rate limiting)
- ✅ Browser Storage (PWA offline support)
- 🔄 External APIs (planned for future)

---

### 1.2 Business Context

**Business Goals Driving Modernization**:

1. **Enterprise Readiness**
   - Prepare for larger airline customers (50+ pilots, 1000+ certifications)
   - Meet enterprise SLAs (99.9% uptime, <100ms response)
   - Support advanced compliance requirements

2. **Competitive Advantage**
   - Best-in-class UI/UX to differentiate from competitors
   - Industry-leading performance benchmarks
   - Rapid feature development capability

3. **Technical Excellence**
   - Zero technical debt for sustainable growth
   - Code quality that attracts top-tier developers
   - Architecture that supports 10x scale

4. **Future-Proof Foundation**
   - Platform for upcoming features (flight requests, disciplinary tracking, analytics)
   - Extensible for multi-aircraft type support
   - Ready for international expansion

**Stakeholders**:
- **Product Owner**: Maurice (Skycruzer)
- **End Users**: Fleet operations managers, pilots, administrators
- **Development Team**: Future developers joining the project
- **Business**: Sales prospects evaluating the system

**Success Criteria**:
1. **Performance**: All pages load <100ms, 60fps interactions
2. **Quality**: Zero linting errors, 100% type coverage, >80% test coverage
3. **UX**: Net Promoter Score >70, task completion time reduced 40%
4. **Maintainability**: New feature implementation time reduced 50%
5. **Scalability**: Support 100+ pilots without performance degradation

---

### 1.3 Constraints

**Technical Constraints**:
- ✅ **Must maintain existing stack** (Next.js, React, TypeScript, Supabase)
- ✅ **Cannot break existing functionality** (27 pilots, 607 certifications in production)
- ✅ **Must preserve service-layer architecture** (core design principle)
- ✅ **Must maintain PWA capabilities** (offline support requirement)
- ⚠️ **Limited to Supabase free tier initially** (cost consideration)

**Business Constraints**:
- **Timeline**: 8-12 weeks for complete modernization
- **Budget**: Optimize existing infrastructure (no major new services)
- **Resources**: Solo developer (Maurice) + AI assistance
- **Continuity**: Zero downtime deployment required

**Organizational Constraints**:
- **Skills**: Full-stack TypeScript/React expertise available
- **Processes**: Agile, iterative development approach
- **Tools**: Claude Code, GitHub, Supabase, Vercel

**Regulatory/Compliance Constraints**:
- ⚠️ **Future**: Aviation compliance (FAA regulations for certification tracking)
- ⚠️ **Future**: Data privacy (GDPR if expanding internationally)
- ✅ **Current**: General security best practices

---

## 2. Architecture Goals & Principles

### 2.1 Modernization Goals

**Goal 1: Achieve Sub-100ms Response Times Across All Pages**
- **Current**: Dashboard ~500ms, Renewal Planning ~8s, Pilot List ~200ms
- **Target**: All pages <100ms initial load, <50ms interactions
- **Measurement**: Lighthouse performance score >95, Core Web Vitals all green
- **Impact**: Premium user experience, enterprise credibility

**Goal 2: Eliminate All Technical Debt**
- **Current**: Some inconsistencies, unused code, missing error handling
- **Target**: Zero ESLint errors/warnings, 100% type coverage, comprehensive error boundaries
- **Measurement**: Automated quality gates pass, code review checklist 100%
- **Impact**: Sustainable codebase, faster feature development

**Goal 3: Implement Enterprise-Grade Monitoring & Observability**
- **Current**: Basic error logging, no performance monitoring
- **Target**: Full APM, real-time dashboards, proactive alerts
- **Measurement**: Mean Time To Detection (MTTD) <5min, automated alerts for issues
- **Impact**: Production stability, rapid issue resolution

**Goal 4: Optimize for 10x Scale**
- **Current**: Handles 27 pilots comfortably
- **Target**: Support 270 pilots (10x) with same performance
- **Measurement**: Load testing passes at 10x volume, database query times unchanged
- **Impact**: Enterprise customer readiness

**Goal 5: Create World-Class Developer Experience**
- **Current**: Good development setup
- **Target**: Instant feedback loops, automated quality checks, comprehensive docs
- **Measurement**: New feature implementation time reduced 50%
- **Impact**: Rapid innovation, easier onboarding

---

### 2.2 Architectural Principles

**Principle 1: Service Layer Inviolability**
*"All database operations MUST go through the service layer"*

**Rationale**:
- Centralized business logic
- Consistent error handling
- Easy testing and mocking
- Clear separation of concerns

**Modernization Impact**: Strengthen service layer with:
- Consistent error handling patterns
- Comprehensive input validation
- Transaction management
- Audit logging

---

**Principle 2: Progressive Enhancement**
*"Core functionality works without JavaScript, enhanced with it"*

**Rationale**:
- Better accessibility
- Faster initial page loads
- Resilient to network issues
- SEO benefits

**Modernization Impact**:
- Server Components for initial render
- Client Components only where needed
- Streaming for long operations
- Optimistic UI updates

---

**Principle 3: Performance is a Feature**
*"Every interaction should feel instant (<100ms)"*

**Rationale**:
- User satisfaction directly correlates with speed
- Competitive advantage
- Reduces user frustration
- Increases task completion

**Modernization Impact**:
- Implement aggressive caching
- Optimize database queries
- Reduce bundle sizes
- Implement virtualization for large lists

---

**Principle 4: Type Safety Everywhere**
*"If it can be typed, it must be typed"*

**Rationale**:
- Catch errors at compile time
- Better IDE support
- Self-documenting code
- Refactoring confidence

**Modernization Impact**:
- 100% type coverage (no `any` types)
- Strict TypeScript configuration
- Runtime validation with Zod
- Type-safe database queries

---

**Principle 5: Observability First**
*"If we can't measure it, we can't improve it"*

**Rationale**:
- Data-driven decisions
- Proactive issue detection
- Performance optimization targets
- User behavior insights

**Modernization Impact**:
- Comprehensive logging
- Real-time monitoring
- Performance metrics
- User analytics (privacy-respecting)

---

### 2.3 Integration Strategy

**How Modernization Integrates with Existing System**:

1. **Phased Approach** - Modernize one module at a time
2. **Backward Compatibility** - All existing features continue working
3. **Feature Flags** - Progressive rollout of improvements
4. **Zero Downtime** - Blue-green deployment strategy
5. **Data Preservation** - Existing database untouched, schema migrations additive only

**Migration Strategy**:
- **Week 1-2**: Performance optimization (immediate wins)
- **Week 3-4**: Code quality improvements (refactoring)
- **Week 5-6**: Enhanced error handling & monitoring
- **Week 7-8**: Advanced patterns & optimizations
- **Week 9-10**: Testing & validation
- **Week 11-12**: Documentation & polish

**Backward Compatibility Considerations**:
- ✅ All existing API routes remain functional
- ✅ Database schema changes are additive only
- ✅ No breaking changes to service layer interfaces
- ✅ Existing PWA functionality preserved

---

## 3. Proposed Architecture Improvements

### 3.1 High-Level Modernization Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    MODERNIZED FLEET MANAGEMENT V2                    │
│                                                                       │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐           │
│  │   Admin     │  │    Pilot     │  │   Public        │           │
│  │  Dashboard  │  │   Portal     │  │   Landing       │           │
│  │             │  │              │  │                 │           │
│  │ + Optimized │  │ + Enhanced   │  │ + Performance   │           │
│  │ + Real-time │  │ + Mobile     │  │ + SEO           │           │
│  └──────┬──────┘  └──────┬───────┘  └────────┬────────┘           │
│         │                 │                    │                    │
│         └─────────────────┼────────────────────┘                    │
│                           │                                         │
│  ┌────────────────────────┼──────────────────────────┐             │
│  │      PRESENTATION LAYER (Enhanced)                 │             │
│  │  • Server Components (default)                     │             │
│  │  • Client Components (minimal, strategic)          │             │
│  │  • Streaming & Suspense                            │             │
│  │  • Optimistic UI updates                           │             │
│  │  • Error boundaries (comprehensive)                │             │
│  └────────────────────────┬──────────────────────────┘             │
│                           │                                         │
│  ┌────────────────────────┼──────────────────────────┐             │
│  │        API LAYER (Modernized)                      │             │
│  │  • Rate limiting (Upstash Redis)                   │             │
│  │  • Request validation (Zod)                        │             │
│  │  • Error handling (standardized)                   │             │
│  │  • Logging (structured)                            │             │
│  │  • Monitoring (APM integration)                    │             │
│  └────────────────────────┬──────────────────────────┘             │
│                           │                                         │
│  ┌────────────────────────┼──────────────────────────┐             │
│  │     SERVICE LAYER (Strengthened) ◄─ 13+ Services  │             │
│  │  • Consistent error handling                       │             │
│  │  • Transaction management                          │             │
│  │  • Audit logging (all mutations)                   │             │
│  │  • Input validation (Zod schemas)                  │             │
│  │  • Performance monitoring                          │             │
│  │  • Caching layer (Redis + in-memory)               │             │
│  └────────────────────────┬──────────────────────────┘             │
│                           │                                         │
│  ┌────────────────────────┼──────────────────────────┐             │
│  │      DATA ACCESS LAYER (Optimized)                 │             │
│  │  • Query optimization                              │             │
│  │  • Connection pooling                              │             │
│  │  • Prepared statements                             │             │
│  │  • Database indexes (strategic)                    │             │
│  │  • Read replicas (future)                          │             │
│  └────────────────────────┬──────────────────────────┘             │
│                           │                                         │
│                    ┌──────▼───────┐                                │
│                    │   Supabase   │                                │
│                    │  PostgreSQL  │  ◄─ Production Data            │
│                    │   Database   │     27 pilots, 607 certs       │
│                    └──────────────┘                                │
└─────────────────────────────────────────────────────────────────────┘
         │                    │                    │           │
    ┌────▼────┐        ┌──────▼──────┐     ┌──────▼──────┐   │
    │ Browser │        │   Upstash   │     │  Monitoring │   │
    │ Storage │        │    Redis    │     │   (New!)    │   │
    │  (PWA)  │        │  (Cache +   │     │  - APM      │   │
    │         │        │   Limit)    │     │  - Alerts   │   │
    └─────────┘        └─────────────┘     │  - Metrics  │   │
                                            └─────────────┘   │
                                                              │
                                            ┌─────────────────▼──┐
                                            │  Observability     │
                                            │  Platform          │
                                            │  - Logs            │
                                            │  - Traces          │
                                            │  - Metrics         │
                                            └────────────────────┘
```

**Key Modernization Components**:

1. **Enhanced Presentation Layer**
   - Server Components by default
   - Strategic Client Components
   - Streaming for long operations
   - Comprehensive error boundaries

2. **Strengthened Service Layer**
   - Consistent patterns across all 13+ services
   - Transaction management
   - Audit logging
   - Caching layer

3. **Optimized Data Access**
   - Query optimization
   - Database indexes
   - Connection pooling

4. **NEW: Observability Stack**
   - Application Performance Monitoring (APM)
   - Structured logging
   - Real-time alerts
   - Performance metrics

---

### 3.2 Component Improvements

#### Component A: Service Layer Strengthening

**Purpose**: Ensure all 13 services follow consistent, best-practice patterns

**Current State**:
- 13 services implemented: pilot, certification, leave, dashboard, analytics, PDF, cache, audit, admin, user, portal, leave-eligibility, expiring-certifications
- Basic error handling
- Some inconsistencies between services

**Modernization**:

```typescript
// Standard Service Pattern (Apply to all 13 services)

import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { auditLog } from '@/lib/services/audit-service'
import { cache } from '@/lib/services/cache-service'

// 1. Define Input/Output Schemas (Zod)
const GetPilotSchema = z.object({
  pilotId: z.string().uuid()
})

const PilotResponseSchema = z.object({
  id: z.string().uuid(),
  firstName: z.string(),
  lastName: z.string(),
  // ... complete type definition
})

// 2. Consistent Error Types
class ServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: unknown
  ) {
    super(message)
    this.name = 'ServiceError'
  }
}

// 3. Service Function Template
export async function getPilot(params: unknown) {
  try {
    // 3a. Input Validation
    const validated = GetPilotSchema.parse(params)

    // 3b. Check Cache
    const cacheKey = `pilot:${validated.pilotId}`
    const cached = await cache.get(cacheKey)
    if (cached) return PilotResponseSchema.parse(cached)

    // 3c. Database Operation
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('pilots')
      .select('*')
      .eq('id', validated.pilotId)
      .single()

    if (error) {
      throw new ServiceError(
        'Failed to fetch pilot',
        'PILOT_FETCH_ERROR',
        500,
        error
      )
    }

    if (!data) {
      throw new ServiceError(
        'Pilot not found',
        'PILOT_NOT_FOUND',
        404
      )
    }

    // 3d. Validate Output
    const result = PilotResponseSchema.parse(data)

    // 3e. Cache Result
    await cache.set(cacheKey, result, 300) // 5 min TTL

    // 3f. Return Result
    return result

  } catch (error) {
    // 3g. Error Handling
    if (error instanceof z.ZodError) {
      throw new ServiceError(
        'Invalid input parameters',
        'VALIDATION_ERROR',
        400,
        error.errors
      )
    }

    if (error instanceof ServiceError) {
      throw error // Re-throw service errors
    }

    // Unknown errors
    console.error('Unexpected error in getPilot:', error)
    throw new ServiceError(
      'An unexpected error occurred',
      'UNKNOWN_ERROR',
      500,
      error
    )
  }
}

// 4. Mutation with Audit Logging
export async function updatePilot(params: unknown) {
  const validated = UpdatePilotSchema.parse(params)

  const supabase = await createClient()

  // Get current user for audit
  const { data: { user } } = await supabase.auth.getUser()

  // Perform update
  const { data, error } = await supabase
    .from('pilots')
    .update(validated.updates)
    .eq('id', validated.pilotId)
    .select()
    .single()

  if (error) throw new ServiceError('Update failed', 'UPDATE_ERROR', 500, error)

  // Audit log
  await auditLog({
    action: 'UPDATE_PILOT',
    entityType: 'pilot',
    entityId: validated.pilotId,
    userId: user?.id,
    changes: validated.updates
  })

  // Invalidate cache
  await cache.delete(`pilot:${validated.pilotId}`)

  return PilotResponseSchema.parse(data)
}
```

**Technology**: TypeScript 5.7.3, Zod 4.1.12, Existing services
**Interfaces**: Consistent API across all services
**Data**: Same database schema, improved access patterns
**Integration Points**: All 13 services follow this pattern

---

#### Component B: Performance Optimization Layer

**Purpose**: Achieve sub-100ms response times and 60fps interactions

**Technology Stack**:
- React 19 Concurrent Features
- TanStack Query 5.90.2 (advanced patterns)
- Redis caching (Upstash)
- Database query optimization

**Interfaces**: Transparent to consumers (same APIs)

**Key Optimizations**:

1. **Database Query Optimization**
```sql
-- Add strategic indexes
CREATE INDEX CONCURRENTLY idx_pilot_checks_pilot_id_date
  ON pilot_checks(pilot_id, check_date DESC);

CREATE INDEX CONCURRENTLY idx_pilot_checks_expiry_date
  ON pilot_checks(expiry_date)
  WHERE expiry_date > CURRENT_DATE;

-- Optimize expensive queries
-- Before: 8 seconds
-- After: <1 second
```

2. **Multi-Level Caching**
```typescript
// L1: Browser cache (React Query)
// L2: Redis cache (5-15 min TTL)
// L3: Supabase (database)

const cacheStrategy = {
  dashboard: { ttl: 60, staleTime: 30 },      // 1 min cache, 30s stale
  pilots: { ttl: 300, staleTime: 120 },       // 5 min cache, 2min stale
  certifications: { ttl: 180, staleTime: 60 }, // 3 min cache, 1min stale
  renewalPlans: { ttl: 600, staleTime: 300 }  // 10 min cache, 5min stale
}
```

3. **Code Splitting & Bundle Optimization**
```typescript
// Lazy load heavy components
const RenewalPlanning = dynamic(() => import('@/components/renewal-planning'))
const AnalyticsDashboard = dynamic(() => import('@/components/analytics'))

// Route-based code splitting (automatic with Next.js App Router)
// Target: <150KB initial bundle, <50KB per route
```

4. **Virtualization for Large Lists**
```typescript
// Before: Render all 27 pilots → slow scrolling
// After: Render only visible pilots → 60fps smooth

import { useVirtualizer } from '@tanstack/react-virtual'

// Handles lists of 1000+ items efficiently
```

**Integration Points**: All pages, all data fetching, all lists

---

#### Component C: Comprehensive Error Handling

**Purpose**: Never show users technical error messages, always graceful degradation

**Technology**: React Error Boundaries, Zod validation, Standardized error responses

**Error Boundary Hierarchy**:
```
RootLayout
  ├─ GlobalErrorBoundary (top-level crashes)
  │   ├─ DashboardErrorBoundary (dashboard errors)
  │   │   ├─ PilotListErrorBoundary (pilot list errors)
  │   │   └─ CertificationErrorBoundary (cert errors)
  │   └─ PortalErrorBoundary (portal errors)
```

**User-Friendly Error Messages**:
```typescript
// Before
Error: Database connection failed

// After
We're having trouble loading pilot information.
Please try again in a moment.
[Retry Button] [Contact Support]
```

**Integration Points**: All components, all API routes, all service functions

---

### 3.3 Data Architecture Improvements

**Current Database Schema**: Production-ready, well-designed

**Modernization Enhancements**:

1. **Strategic Indexes** (additive only, no schema changes)
```sql
-- Performance indexes
CREATE INDEX CONCURRENTLY idx_pilots_rank_seniority
  ON pilots(rank, seniority_number);

CREATE INDEX CONCURRENTLY idx_leave_requests_status_dates
  ON leave_requests(status, start_date, end_date);

-- Partial indexes for common queries
CREATE INDEX CONCURRENTLY idx_active_pilots
  ON pilots(id) WHERE status = 'active';
```

2. **Query Optimization**
- Use database views for complex aggregations
- Implement prepared statements for common queries
- Leverage Supabase's connection pooling

3. **Data Migration Strategy**
- **Phase 1**: Add indexes (zero downtime)
- **Phase 2**: Optimize views (zero downtime)
- **Phase 3**: Monitor query performance

4. **Caching Strategy**
```
Redis (Upstash)
├─ dashboard:metrics (60s TTL)
├─ pilot:{id} (300s TTL)
├─ certifications:expiring (180s TTL)
└─ renewal:plans:{year} (600s TTL)
```

5. **State Management**
```typescript
// TanStack Query for server state
// React Context for UI state only (minimal)
// URL state for filters/pagination
// Local storage for user preferences
```

---

### 3.4 Integration Architecture

**Current Integrations**:
- ✅ Supabase Auth
- ✅ Upstash Redis (rate limiting)

**Enhanced Integrations**:

1. **API Integration Pattern**
```typescript
// Standardized API client
import { createApiClient } from '@/lib/api-client'

const api = createApiClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
  timeout: 30000,
  retries: 3,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Automatic error handling, retries, logging
```

2. **Event Integration** (Future)
```typescript
// Event-driven architecture for real-time updates
// Supabase Realtime for live data
// Webhooks for external integrations
```

3. **Data Integration**
- Current: Direct database access via service layer
- Future: GraphQL layer for complex queries (optional)

4. **Authentication/Authorization**
```typescript
// Enhanced auth middleware
// Role-based access control (RBAC)
// Permission-based UI rendering
```

---

## 4. Technology Decisions

### 4.1 Technology Stack (Confirmed & Enhanced)

| Layer | Technology | Version | Justification | Compatibility |
|-------|------------|---------|---------------|---------------|
| **Frontend** | Next.js | 15.5.4 | Latest App Router, Server Components, Streaming | ✅ Existing stack |
| **UI Library** | React | 19.1.0 | Concurrent features, automatic batching, Suspense | ✅ Existing stack |
| **Language** | TypeScript | 5.7.3 | Strict mode, latest features, best type safety | ✅ Existing stack |
| **Styling** | Tailwind CSS | 4.1.0 | Latest version, best DX, smallest builds | ✅ Existing stack |
| **Components** | Radix UI + shadcn/ui | Latest | Accessible, composable, customizable | ✅ Existing stack |
| **State** | TanStack Query | 5.90.2 | Best server state management, caching | ✅ Existing stack |
| **Forms** | React Hook Form | 7.65.0 | Performance, DX, validation integration | ✅ Existing stack |
| **Validation** | Zod | 4.1.12 | Runtime validation, TypeScript inference | ✅ Existing stack |
| **Database** | Supabase PostgreSQL | 2.75.1 | Managed, real-time, auth, storage | ✅ Existing stack |
| **Caching** | Upstash Redis | Latest | Serverless, pay-per-use, low latency | ✅ Enhanced usage |
| **Testing** | Playwright | 1.55.0 | Best E2E testing, cross-browser | ✅ Existing stack |
| **Build** | Turbopack | Built-in | Fastest builds, HMR, production-ready | ✅ Existing stack |
| **Deployment** | Vercel | Latest | Best Next.js hosting, edge network | ✅ Existing stack |
| **Monitoring** | **NEW: Vercel Analytics** | Latest | Zero-config, real-time, Web Vitals | ➕ New addition |
| **Logging** | **NEW: Better Stack** | Latest | Structured logging, search, alerts | ➕ New addition |

**Assessment**: ✅ **Perfect Stack** - No technology changes needed, only enhanced usage.

---

### 4.2 Key Technology Choices

#### Choice 1: Stay with Next.js 15 App Router

**Options Considered**:
- A) Stay with Next.js 15 App Router
- B) Migrate to another framework (Remix, SvelteKit)
- C) Use Next.js Pages Router

**Decision**: ✅ **A) Stay with Next.js 15 App Router**

**Rationale**:
- Already on the latest version
- App Router is the future of Next.js
- Server Components provide performance benefits
- Turbopack build system is fastest available
- Vercel deployment is seamless

**Trade-offs**:
- ✅ Gained: Best performance, latest features, excellent DX
- ➖ Gave up: Nothing (already on this stack)

**Compatibility**: ✅ Perfect - already implemented

---

#### Choice 2: TanStack Query for State Management

**Options Considered**:
- A) TanStack Query (current)
- B) Redux Toolkit
- C) Zustand
- D) Jotai

**Decision**: ✅ **A) TanStack Query**

**Rationale**:
- Best-in-class server state management
- Built-in caching, invalidation, refetching
- Optimistic updates support
- DevTools for debugging
- Minimal client state needed (server-first approach)

**Trade-offs**:
- ✅ Gained: Automatic caching, background refetching, optimistic updates
- ➖ Gave up: Nothing (this is the right tool)

**Compatibility**: ✅ Already using, just enhance patterns

---

#### Choice 3: Zod for Validation

**Options Considered**:
- A) Zod (current)
- B) Yup
- C) Joi
- D) Custom validation

**Decision**: ✅ **A) Zod**

**Rationale**:
- TypeScript-first design
- Type inference (types flow automatically)
- Runtime validation matches compile-time types
- Best DX, smallest bundle

**Trade-offs**:
- ✅ Gained: Type safety, runtime validation, great DX
- ➖ Gave up: Nothing

**Compatibility**: ✅ Already using, expand to all service inputs/outputs

---

#### Choice 4: Vercel Analytics for Monitoring

**Options Considered**:
- A) Vercel Analytics (free tier)
- B) Google Analytics
- C) Plausible Analytics
- D) Custom solution

**Decision**: ✅ **A) Vercel Analytics**

**Rationale**:
- Zero-config integration with Next.js
- Privacy-friendly (no cookies)
- Real Web Vitals monitoring
- Free for moderate traffic
- Vercel-native (already using Vercel)

**Trade-offs**:
- ✅ Gained: Instant setup, Web Vitals, real user monitoring
- ➖ Gave up: Advanced features (acceptable for now)

**Compatibility**: ✅ Add to existing Vercel deployment

---

#### Choice 5: Better Stack for Logging

**Options Considered**:
- A) Better Stack (Logtail)
- B) Datadog
- C) New Relic
- D) CloudWatch

**Decision**: ✅ **A) Better Stack**

**Rationale**:
- Generous free tier (500MB/month)
- Structured logging support
- Fast search and filtering
- Alert integration
- SQL-like query language

**Trade-offs**:
- ✅ Gained: Structured logs, fast search, alerts
- ➖ Gave up: Advanced APM features (can add later if needed)

**Compatibility**: ✅ Simple integration, no breaking changes

---

## 5. Quality Attributes

### 5.1 Performance

**Requirements**:

| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| **Dashboard Load** | 500ms | <100ms | Lighthouse, RUM |
| **Pilot List Scroll** | Janky | 60fps | Chrome DevTools Performance |
| **Renewal Planning** | 8 seconds | <1 second | Custom timing |
| **Time to Interactive (TTI)** | 2.1s | <1.5s | Lighthouse |
| **First Contentful Paint (FCP)** | 1.2s | <1.0s | Lighthouse |
| **Largest Contentful Paint (LCP)** | 1.8s | <1.2s | Lighthouse |
| **Cumulative Layout Shift (CLS)** | 0.05 | <0.1 | Lighthouse |

**Performance Testing Strategy**:

1. **Automated Performance Testing**
```bash
# Lighthouse CI (on every deploy)
npm run lighthouse-ci

# Bundle size monitoring
npm run analyze-bundle

# Performance budget enforcement
# Fail build if budgets exceeded
```

2. **Real User Monitoring (RUM)**
- Vercel Analytics for production
- Track Core Web Vitals
- Monitor by page and user segment

3. **Load Testing**
```bash
# Artillery for API load testing
npm run load-test

# k6 for scenario-based testing
npm run scenario-test
```

4. **Performance Budgets**
```javascript
// next.config.js performance budgets
module.exports = {
  experimental: {
    performanceBudget: {
      maxInitialLoad: 150 * 1024,  // 150KB initial JS
      maxPerRoute: 50 * 1024,      // 50KB per route
      maxCSS: 30 * 1024            // 30KB CSS
    }
  }
}
```

---

### 5.2 Security

**Authentication/Authorization Approach**:
- ✅ Supabase Auth (existing)
- ✅ Row Level Security (RLS) policies
- ➕ Enhanced: Role-based access control (RBAC)
- ➕ Enhanced: Permission-based UI rendering

**Data Encryption Requirements**:
- ✅ HTTPS everywhere (Vercel automatic)
- ✅ Database encryption at rest (Supabase)
- ✅ Encrypted connections (TLS)

**Security Testing Strategy**:

1. **Automated Security Scanning**
```bash
# npm audit on every install
npm audit

# Snyk for vulnerability scanning
npm run security-scan

# OWASP ZAP for penetration testing
npm run pen-test
```

2. **Security Checklist** (pre-deployment)
- [ ] No secrets in code
- [ ] All env vars validated
- [ ] RLS policies tested
- [ ] Input validation on all endpoints
- [ ] Rate limiting enabled
- [ ] CORS configured correctly
- [ ] CSP headers set
- [ ] XSS protection enabled

**Compliance Requirements**:
- ✅ General security best practices
- 🔄 Future: FAA compliance (aviation certification tracking)
- 🔄 Future: GDPR (if international expansion)

---

### 5.3 Reliability & Availability

**Uptime Requirements**:
- **Target**: 99.9% uptime (8.76 hours downtime/year)
- **Current**: Vercel's 99.99% SLA
- **Monitoring**: Uptime Robot + Vercel monitoring

**Fault Tolerance Mechanisms**:

1. **Error Boundaries** (comprehensive)
```typescript
// Graceful degradation at every level
// User never sees white screen of death
```

2. **Retry Logic**
```typescript
// Automatic retries for transient failures
// Exponential backoff for API calls
```

3. **Fallback UI**
```typescript
// Cached data shown while refetching
// Skeleton screens for loading states
// Offline mode for PWA
```

**Disaster Recovery Strategy**:

1. **Database Backups**
- Supabase automatic daily backups
- Point-in-time recovery (7 days)

2. **Deployment Rollback**
- Vercel instant rollback to previous deploy
- Git-based version control

3. **Monitoring & Alerts**
- Vercel monitors uptime
- Better Stack alerts on errors
- PagerDuty integration (future)

**Monitoring and Alerting**:

```yaml
Alerts:
  - Error rate > 1% for 5 minutes → Email + Slack
  - Response time > 1 second → Email
  - Uptime < 99.9% → Immediate notification
  - Database connection errors → Immediate notification
```

---

### 5.4 Maintainability

**Code Organization Standards**:

```
app/                    # Next.js App Router
├── (admin)/           # Admin routes (grouped)
├── (portal)/          # Pilot portal routes (grouped)
├── api/               # API routes
└── layout.tsx         # Root layout

components/            # React components
├── ui/                # shadcn/ui components
├── forms/             # Form components
├── layout/            # Layout components
└── {feature}/         # Feature-specific components

lib/                   # Core utilities
├── services/          # Service layer (13+ services)
│   ├── pilot-service.ts
│   ├── certification-service.ts
│   └── ...
├── utils/             # Utility functions
├── validations/       # Zod schemas
└── supabase/          # Supabase clients

types/                 # TypeScript types
└── supabase.ts        # Generated DB types
```

**Documentation Requirements**:

1. **Code Documentation**
   - TSDoc comments for all public functions
   - README in each major directory
   - Architecture diagrams (Mermaid)

2. **API Documentation**
   - OpenAPI spec for all API routes
   - Example requests/responses
   - Error codes documented

3. **User Documentation**
   - User guide (existing: USER-GUIDE.md)
   - Admin guide (existing: ADMIN-GUIDE.md)
   - FAQ and troubleshooting

**Testing Strategy**:

```
Testing Pyramid:
├── E2E Tests (Playwright)        [20%] - Critical user flows
├── Integration Tests (Vitest)    [30%] - Service layer tests
└── Unit Tests (Vitest)           [50%] - Utility functions, hooks

Target: >80% code coverage
```

**Deployment Process**:

```
1. Local Development
   ├─ npm run dev
   ├─ Make changes
   └─ npm run validate (type-check + lint + format)

2. Pre-commit
   ├─ Husky runs linters
   └─ Tests run (fast tests only)

3. Push to GitHub
   ├─ GitHub Actions CI
   ├─ Full test suite
   ├─ Build verification
   └─ Security scan

4. Deploy to Vercel (automatic)
   ├─ Preview deploy (for PRs)
   └─ Production deploy (on merge to main)

5. Post-deploy
   ├─ Smoke tests run
   ├─ Monitoring active
   └─ Rollback if issues detected
```

---

## 6. Migration & Deployment Strategy

### 6.1 Migration Approach

**Phased Modernization** (8-12 weeks):

**Phase 1: Performance Optimization** (Weeks 1-2)
- **Tasks**:
  - Add database indexes
  - Implement Redis caching layer
  - Optimize expensive queries
  - Code splitting and bundle optimization
  - Virtualization for large lists
- **Deliverables**:
  - Dashboard loads <100ms
  - Renewal planning <1 second
  - Lighthouse score >90
- **Success Criteria**:
  - All pages meet performance targets
  - Core Web Vitals all green
  - User-perceived speed improvement

**Phase 2: Code Quality & Consistency** (Weeks 3-4)
- **Tasks**:
  - Refactor all 13 services to standard pattern
  - Add Zod validation to all service inputs
  - Implement comprehensive error boundaries
  - Remove all ESLint warnings
  - Achieve 100% type coverage
- **Deliverables**:
  - Zero linting errors
  - All services follow pattern
  - Error boundaries everywhere
- **Success Criteria**:
  - ESLint passes with zero errors
  - TypeScript strict mode passes
  - No `any` types in codebase

**Phase 3: Enhanced Error Handling & Monitoring** (Weeks 5-6)
- **Tasks**:
  - Implement Better Stack logging
  - Add Vercel Analytics
  - Create comprehensive error boundaries
  - Standardize error messages
  - Add performance monitoring
- **Deliverables**:
  - Real-time monitoring dashboard
  - Structured logging active
  - User-friendly error messages
- **Success Criteria**:
  - All errors logged to Better Stack
  - MTTD (Mean Time To Detection) <5 min
  - Zero technical errors shown to users

**Phase 4: Advanced Patterns & Optimizations** (Weeks 7-8)
- **Tasks**:
  - Implement optimistic UI updates
  - Add Server Components where beneficial
  - Streaming for long operations
  - Advanced caching patterns
  - Query optimization round 2
- **Deliverables**:
  - Instant UI feedback
  - Streaming for slow operations
  - Multi-level caching working
- **Success Criteria**:
  - All mutations feel instant
  - No loading spinners >1 second
  - Cache hit rate >70%

**Phase 5: Testing & Validation** (Weeks 9-10)
- **Tasks**:
  - Expand E2E test coverage to >80%
  - Add integration tests for all services
  - Performance testing with 10x load
  - Security audit
  - Accessibility audit (WCAG 2.1 AA)
- **Deliverables**:
  - Comprehensive test suite
  - Security audit report
  - Accessibility compliance
- **Success Criteria**:
  - >80% test coverage
  - Zero critical security issues
  - WCAG 2.1 AA compliant

**Phase 6: Documentation & Polish** (Weeks 11-12)
- **Tasks**:
  - Update all documentation
  - Create architecture diagrams
  - Write migration guides
  - Final performance tuning
  - Create demo/marketing materials
- **Deliverables**:
  - Complete documentation
  - Architecture diagrams
  - Demo videos
- **Success Criteria**:
  - All docs up to date
  - System demo-ready
  - Sales-ready presentation

---

### 6.2 Deployment Strategy

**Blue-Green Deployment** (Zero Downtime):

```
Current State (Blue):
└─ Production @ fleet-management-v2.vercel.app
   └─ Serving traffic

Modernization (Green):
└─ Preview deploys @ {branch}.fleet-management-v2.vercel.app
   ├─ Phase 1 → preview-phase-1.vercel.app
   ├─ Phase 2 → preview-phase-2.vercel.app
   └─ ... testing in isolation

Cutover:
└─ Merge to main → instant deploy to production
   └─ If issues: Instant rollback to previous deploy
```

**Rollback Strategy**:
1. **Instant Rollback** - Vercel's instant rollback feature (30 seconds)
2. **Database Migrations** - All migrations reversible (down migrations)
3. **Feature Flags** - Gradual rollout, instant disable if needed

**Data Migration Plan**:
- **No data migration needed** - only additive changes (indexes)
- All existing data remains intact
- Zero downtime for data changes

**Cutover Strategy**:
- **Continuous Deployment** - Every phase merges to main when ready
- **Feature Flags** - New features can be toggled on/off
- **Progressive Rollout** - New patterns adopted incrementally

---

### 6.3 Backward Compatibility

**How Existing Functionality is Preserved**:

1. **Service Layer Interfaces** - Never changed, only enhanced internally
2. **API Routes** - All existing routes work identically
3. **Database Schema** - No breaking changes, only additions (indexes)
4. **Component APIs** - Props interfaces unchanged (or backward compatible)

**Deprecation Timeline**: N/A - No deprecations planned

**Support for Legacy Integrations**: All existing integrations continue working

---

## 7. Risks & Mitigations

| Risk | Impact | Probability | Mitigation Strategy |
|------|--------|-------------|---------------------|
| **Performance improvements break functionality** | High | Medium | Comprehensive E2E testing after each phase, preview deploys for validation |
| **Database query optimization causes regressions** | High | Low | Extensive testing, gradual rollout of query changes, monitoring query performance |
| **New error handling hides real issues** | Medium | Low | Structured logging captures all errors, Better Stack monitors error rates |
| **Caching introduces stale data issues** | Medium | Medium | Conservative TTLs, cache invalidation on mutations, real-time updates where needed |
| **Timeline slips (8-12 weeks)** | Low | Medium | Phased approach allows partial completion, prioritize high-impact improvements first |
| **Third-party service failures (Better Stack, Vercel)** | Medium | Low | Fallback logging to console, Vercel has 99.99% SLA, Better Stack has redundancy |
| **Breaking changes in dependencies** | Medium | Low | Lock versions in package.json, test updates in preview environment first |
| **Scope creep during modernization** | Low | Medium | Strict phase boundaries, resist adding new features during modernization |

---

## 8. Implementation Plan

### 8.1 Development Phases

**Phase 1: Performance Optimization** (2 weeks)

**Timeline**: Week 1-2

**Tasks**:
- [ ] Day 1-2: Add database indexes for top 10 queries
- [ ] Day 3-4: Implement Redis caching layer with Upstash
- [ ] Day 5-6: Optimize Renewal Planning query (8s → <1s)
- [ ] Day 7-8: Implement code splitting for heavy components
- [ ] Day 9-10: Add virtualization to pilot and certification lists
- [ ] Day 11-12: Bundle size optimization and tree-shaking
- [ ] Day 13-14: Performance testing and validation

**Success Criteria**:
- ✅ Dashboard loads <100ms
- ✅ Renewal Planning <1 second
- ✅ Lighthouse Performance score >90
- ✅ All Core Web Vitals green
- ✅ Bundle size <150KB initial, <50KB per route

**Deliverables**:
- Database indexes SQL script
- Redis caching configuration
- Optimized queries documentation
- Performance test results
- Lighthouse CI reports

---

**Phase 2: Code Quality & Consistency** (2 weeks)

**Timeline**: Week 3-4

**Tasks**:
- [ ] Day 1-3: Create standard service pattern template
- [ ] Day 4-8: Refactor all 13 services to standard pattern
- [ ] Day 9-10: Add Zod schemas for all service inputs/outputs
- [ ] Day 11-12: Implement comprehensive error boundaries
- [ ] Day 13-14: ESLint/TypeScript cleanup (zero errors)

**Success Criteria**:
- ✅ All 13 services follow standard pattern
- ✅ 100% Zod validation coverage
- ✅ Error boundaries on all routes
- ✅ Zero ESLint errors/warnings
- ✅ Zero TypeScript `any` types

**Deliverables**:
- Service pattern documentation
- Zod schema library
- Error boundary hierarchy
- Type coverage report
- Code quality metrics

---

**Phase 3: Monitoring & Observability** (2 weeks)

**Timeline**: Week 5-6

**Tasks**:
- [ ] Day 1-2: Set up Better Stack logging
- [ ] Day 3-4: Add Vercel Analytics
- [ ] Day 5-6: Implement structured logging across all services
- [ ] Day 7-8: Create monitoring dashboards
- [ ] Day 9-10: Set up alerts and notifications
- [ ] Day 11-12: Add performance tracking
- [ ] Day 13-14: Create runbooks for common issues

**Success Criteria**:
- ✅ All logs flowing to Better Stack
- ✅ Real-time Web Vitals monitoring
- ✅ Alerts configured for critical issues
- ✅ MTTD (Mean Time To Detection) <5 minutes
- ✅ Dashboards accessible to team

**Deliverables**:
- Logging infrastructure
- Monitoring dashboards
- Alert configuration
- Runbook documentation
- Performance metrics baseline

---

**Phase 4: Advanced Patterns** (2 weeks)

**Timeline**: Week 7-8

**Tasks**:
- [ ] Day 1-3: Implement optimistic UI updates for mutations
- [ ] Day 4-6: Convert components to Server Components where beneficial
- [ ] Day 7-8: Add streaming for long operations
- [ ] Day 9-10: Implement advanced caching patterns
- [ ] Day 11-12: Second round query optimization
- [ ] Day 13-14: Performance testing and refinement

**Success Criteria**:
- ✅ All mutations have optimistic updates
- ✅ Strategic use of Server Components
- ✅ No loading spinner >1 second
- ✅ Cache hit rate >70%
- ✅ All performance targets met

**Deliverables**:
- Optimistic update patterns
- Server/Client Component guide
- Streaming implementation
- Caching strategy doc
- Performance benchmarks

---

**Phase 5: Testing & Validation** (2 weeks)

**Timeline**: Week 9-10

**Tasks**:
- [ ] Day 1-3: Expand E2E test coverage to >80%
- [ ] Day 4-6: Add integration tests for all services
- [ ] Day 7-8: Performance testing with 10x load
- [ ] Day 9-10: Security audit (OWASP, dependency scan)
- [ ] Day 11-12: Accessibility audit (WCAG 2.1 AA)
- [ ] Day 13-14: Fix any issues found

**Success Criteria**:
- ✅ >80% E2E test coverage
- ✅ 100% service integration tests
- ✅ Handles 10x load without degradation
- ✅ Zero critical security vulnerabilities
- ✅ WCAG 2.1 AA compliant

**Deliverables**:
- Comprehensive test suite
- Security audit report
- Accessibility audit report
- Load test results
- Compliance certification

---

**Phase 6: Documentation & Polish** (2 weeks)

**Timeline**: Week 11-12

**Tasks**:
- [ ] Day 1-3: Update all technical documentation
- [ ] Day 4-5: Create architecture diagrams (Mermaid)
- [ ] Day 6-7: Write migration guides for developers
- [ ] Day 8-9: Create demo videos and screenshots
- [ ] Day 10-11: Final performance tuning
- [ ] Day 12-14: Sales/marketing material preparation

**Success Criteria**:
- ✅ All documentation current and accurate
- ✅ Architecture diagrams complete
- ✅ Demo-ready system
- ✅ Sales presentation ready
- ✅ All performance targets exceeded

**Deliverables**:
- Updated documentation suite
- Architecture diagrams
- Migration guides
- Demo videos
- Sales presentation deck

---

### 8.2 Testing Strategy

**Testing Approach**:

```
Testing Pyramid:
├── E2E Tests (Playwright)        [20%] - 50+ critical flows
├── Integration Tests (Vitest)    [30%] - All services tested
└── Unit Tests (Vitest)           [50%] - Utils, hooks, functions

Target: >80% overall code coverage
```

**Test Categories**:

1. **Unit Testing**
   - All utility functions
   - All custom React hooks
   - Validation schemas
   - Pure business logic

2. **Integration Testing**
   - All 13 services end-to-end
   - API routes with database
   - Caching layer behavior
   - Error handling flows

3. **E2E Testing** (Playwright)
   - Critical user flows (login, add pilot, track certification, etc.)
   - Cross-browser (Chrome, Firefox, Safari)
   - Mobile responsiveness
   - PWA functionality

4. **Performance Testing**
   - Lighthouse CI (automated)
   - Load testing (Artillery, k6)
   - Query performance benchmarks
   - Bundle size monitoring

5. **Security Testing**
   - npm audit (dependency vulnerabilities)
   - OWASP ZAP (penetration testing)
   - Authentication/authorization tests
   - Input validation tests

**Continuous Testing**:
```yaml
# GitHub Actions workflow
on: [push, pull_request]
  - Run ESLint
  - Run TypeScript type check
  - Run unit tests
  - Run integration tests
  - Run E2E tests (critical paths)
  - Run Lighthouse CI
  - Check bundle sizes
  - Security scan
```

---

### 8.3 Documentation Deliverables

**Technical Documentation**:
1. ✅ **Architecture Document** (this document)
2. ✅ **Service Layer Guide** (existing SERVICE-MIGRATION-GUIDE.md)
3. ➕ **Caching Strategy Guide** (new)
4. ➕ **Error Handling Guide** (new)
5. ➕ **Performance Optimization Guide** (new)
6. ➕ **Testing Guide** (new)
7. ➕ **Deployment Guide** (enhanced from existing)

**API Documentation**:
1. ➕ **OpenAPI Specification** (all routes)
2. ➕ **Service Function Reference** (all 13 services)
3. ➕ **Error Code Reference** (standardized codes)
4. ➕ **Rate Limiting Guide**

**Deployment Guides**:
1. ✅ **Setup Guide** (existing SETUP.md)
2. ➕ **Environment Setup Guide** (enhanced)
3. ➕ **Production Deployment Guide** (new)
4. ➕ **Rollback Procedures** (new)
5. ➕ **Monitoring Setup Guide** (new)

**Runbooks**:
1. ➕ **Performance Issues Runbook**
2. ➕ **Database Issues Runbook**
3. ➕ **Authentication Issues Runbook**
4. ➕ **Caching Issues Runbook**

---

## 9. Operations & Maintenance

### 9.1 Monitoring

**Metrics to Monitor**:

**Application Performance**:
- Response time (p50, p95, p99)
- Throughput (requests/second)
- Error rate (errors/minute)
- Cache hit rate (%)
- Database query time (ms)

**Infrastructure**:
- CPU usage (%)
- Memory usage (MB)
- Database connections (count)
- Redis memory (MB)
- Network latency (ms)

**User Experience**:
- Core Web Vitals (LCP, FID, CLS)
- Time to Interactive (TTI)
- First Contentful Paint (FCP)
- User session duration
- Task completion rate

**Business Metrics**:
- Active users (daily, monthly)
- Pilot certifications tracked
- Leave requests processed
- System uptime (%)

---

**Logging Strategy**:

```typescript
// Structured logging with Better Stack
import { logger } from '@/lib/logger'

logger.info('Pilot created', {
  pilotId: pilot.id,
  userId: user.id,
  timestamp: new Date().toISOString(),
  metadata: { rank: pilot.rank, seniority: pilot.seniority }
})

logger.error('Database query failed', {
  query: 'getPilots',
  error: error.message,
  stack: error.stack,
  userId: user.id
})
```

**Log Levels**:
- `DEBUG`: Development only, detailed execution flow
- `INFO`: General informational messages, important events
- `WARN`: Warning messages, potential issues
- `ERROR`: Error messages, requires attention
- `CRITICAL`: Critical issues, immediate action required

---

**Alerting Thresholds**:

| Alert | Condition | Severity | Action |
|-------|-----------|----------|--------|
| High Error Rate | >1% of requests fail for 5 min | Critical | Page on-call engineer |
| Slow Response Time | p95 >1 second for 5 min | High | Email team |
| Database Connection Errors | Any connection error | Critical | Immediate notification |
| Cache Failures | Cache unavailable for 2 min | Medium | Email team |
| Deployment Failure | Build or deploy fails | High | Email team |
| Uptime Drop | <99.9% uptime | Critical | Immediate notification |
| Security Alert | Suspicious activity detected | Critical | Immediate notification |

---

**Dashboards**:

1. **Application Performance Dashboard**
   - Real-time response times
   - Error rates by endpoint
   - Cache hit rates
   - Database query performance

2. **User Experience Dashboard**
   - Core Web Vitals trends
   - Page load times by route
   - User flow completion rates
   - Device/browser breakdown

3. **Infrastructure Dashboard**
   - CPU/memory usage
   - Database connections
   - Redis performance
   - Network metrics

4. **Business Metrics Dashboard**
   - Active users (DAU, MAU)
   - Feature usage statistics
   - Certification tracking trends
   - Leave request patterns

---

### 9.2 Support & Maintenance

**Ongoing Maintenance Requirements**:

**Daily**:
- Monitor error logs for new issues
- Review performance metrics
- Check uptime status

**Weekly**:
- Review and address non-critical issues
- Update dependencies (security patches)
- Performance optimization opportunities

**Monthly**:
- Security audit
- Performance review
- Backup verification
- Cost optimization review

**Quarterly**:
- Major dependency updates
- Architecture review
- Scalability assessment
- Disaster recovery drill

---

**Support Escalation Process**:

```
Level 1: Self-Service
└─ Documentation, FAQs, User Guide

Level 2: Standard Support
└─ Email: support@fleet-management.com
   Response: 24 hours

Level 3: Priority Support
└─ Slack/Phone for critical issues
   Response: 4 hours

Level 4: On-Call Engineer
└─ PagerDuty for production outages
   Response: 15 minutes
```

---

**Update/Patch Strategy**:

**Security Updates**: Immediate
- Apply critical security patches within 24 hours
- Test in preview environment first
- Deploy to production with monitoring

**Feature Updates**: Bi-weekly
- Release new features every 2 weeks
- Follow full testing and validation process
- Announce in release notes

**Dependency Updates**: Monthly
- Update non-critical dependencies monthly
- Test compatibility in preview
- Gradual rollout

**Major Updates**: Quarterly
- Plan major version upgrades
- Comprehensive testing
- Communication plan
- Rollback strategy prepared

---

## 10. Appendices

### Appendix A: Glossary

- **App Router**: Next.js 15's routing system using the `app/` directory
- **Core Web Vitals**: Google's metrics for page performance (LCP, FID, CLS)
- **PWA**: Progressive Web App - installable, offline-capable web application
- **RLS**: Row Level Security - Supabase database security feature
- **Server Components**: React components that render on the server
- **Service Layer**: Architecture pattern separating business logic from data access
- **SSR**: Server-Side Rendering - rendering React on the server
- **TTL**: Time To Live - cache expiration time
- **Zod**: TypeScript-first schema validation library

### Appendix B: References

**Documentation**:
- Next.js 15 Documentation: https://nextjs.org/docs
- React 19 Documentation: https://react.dev
- Supabase Documentation: https://supabase.com/docs
- TanStack Query Documentation: https://tanstack.com/query

**Internal Documentation**:
- CLAUDE.md - Development guidelines
- PROFESSIONAL-UI-DESIGN-SYSTEM.md - UI/UX standards
- UX-PERFORMANCE-IMPROVEMENTS.md - Performance targets
- SERVICE-MIGRATION-GUIDE.md - Service layer patterns

**Standards & Guidelines**:
- TypeScript Strict Mode
- ESLint Configuration
- Prettier Configuration
- WCAG 2.1 AA Accessibility Standards

### Appendix C: Decision Log

| Date | Decision | Rationale | Decision Maker |
|------|----------|-----------|----------------|
| 2025-10-24 | Comprehensive modernization initiative | Prepare foundation for future growth, achieve enterprise readiness | Maurice |
| 2025-10-24 | Keep existing tech stack | Already on latest versions, excellent DX, best performance | Maurice + BMad Master |
| 2025-10-24 | Phased 8-12 week timeline | Allows validation at each phase, minimizes risk | Maurice + BMad Master |
| 2025-10-24 | Add Vercel Analytics + Better Stack | Zero-config monitoring, comprehensive logging | Maurice + BMad Master |
| 2025-10-24 | Target >80% test coverage | Balance between quality and development speed | Maurice + BMad Master |
| 2025-10-24 | Maintain service layer pattern | Proven architecture, clear separation of concerns | Maurice |

---

**Document Control**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-10-24 | Maurice (Skycruzer) | Initial comprehensive architecture review and modernization plan |

---

*Generated using BMAD Method - Brownfield Architecture Template*
*Fleet Management V2 - B767 Pilot Management System*
*Strategic Modernization Initiative - Foundation for Future Growth*
