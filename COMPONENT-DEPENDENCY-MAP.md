# Component Dependency Map - Dashboard Architecture

**Project**: Fleet Management V2
**Date**: October 25, 2025
**Purpose**: Visual reference for dashboard component relationships and data flow

---

## Dashboard Component Hierarchy

```
┌──────────────────────────────────────────────────────────────────────┐
│                     app/dashboard/page.tsx                           │
│                      (Server Component)                              │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │              DashboardContent (Server)                         │ │
│  │                                                                 │ │
│  │  ┌──────────────────────────────────────────────────────────┐  │ │
│  │  │  DATA FETCHING LAYER (Server Components)                 │  │ │
│  │  │                                                           │  │ │
│  │  │  ┌─────────────────────────────────────────────────────┐ │  │ │
│  │  │  │ HeroStatsServer                                     │ │  │ │
│  │  │  │                                                      │ │  │ │
│  │  │  │  getDashboardMetrics(useCache: true)                │ │  │ │
│  │  │  │         │                                            │ │  │ │
│  │  │  │         ├─> dashboard-service.ts                    │ │  │ │
│  │  │  │         └─> cache-service.ts (60s TTL)              │ │  │ │
│  │  │  │                                                      │ │  │ │
│  │  │  │  Returns: stats array                               │ │  │ │
│  │  │  │   [                                                  │ │  │ │
│  │  │  │     {title, value, icon, gradientFrom, gradientTo}  │ │  │ │
│  │  │  │   ]                                                  │ │  │ │
│  │  │  └─────────────────────────────────────────────────────┘ │  │ │
│  │  │                     │                                     │  │ │
│  │  │                     ▼                                     │  │ │
│  │  │  ┌─────────────────────────────────────────────────────┐ │  │ │
│  │  │  │ HeroStatsClient (Client Component)                  │ │  │ │
│  │  │  │                                                      │ │  │ │
│  │  │  │  - Framer Motion animations                         │ │  │ │
│  │  │  │  - Staggered entry (0.1s delay)                     │ │  │ │
│  │  │  │  - Hover effects (y: -4, scale: 1.02)               │ │  │ │
│  │  │  │  - Theme-compliant colors ✅                         │ │  │ │
│  │  │  └─────────────────────────────────────────────────────┘ │  │ │
│  │  │                                                           │  │ │
│  │  │  ┌─────────────────────────────────────────────────────┐ │  │ │
│  │  │  │ ComplianceOverviewServer                            │ │  │ │
│  │  │  │                                                      │ │  │ │
│  │  │  │  Promise.all([                                       │ │  │ │
│  │  │  │    getDashboardMetrics(true),                       │ │  │ │
│  │  │  │    getExpiringCertifications(60)                    │ │  │ │
│  │  │  │  ])                                                  │ │  │ │
│  │  │  │         │                                            │ │  │ │
│  │  │  │         ├─> dashboard-service.ts                    │ │  │ │
│  │  │  │         ├─> expiring-certifications-service.ts      │ │  │ │
│  │  │  │         └─> ⚠️  Direct Supabase call (VIOLATION)    │ │  │ │
│  │  │  │                                                      │ │  │ │
│  │  │  │  Returns: {overallCompliance, categories, actions}  │ │  │ │
│  │  │  └─────────────────────────────────────────────────────┘ │  │ │
│  │  │                     │                                     │  │ │
│  │  │                     ▼                                     │  │ │
│  │  │  ┌─────────────────────────────────────────────────────┐ │  │ │
│  │  │  │ ComplianceOverviewClient (Client)                   │ │  │ │
│  │  │  │                                                      │ │  │ │
│  │  │  │  - Animated progress circles (SVG)                  │ │  │ │
│  │  │  │  - Category breakdown bars                          │ │  │ │
│  │  │  │  - Action items list (top 10)                       │ │  │ │
│  │  │  │  - Theme-compliant colors ✅                         │ │  │ │
│  │  │  └─────────────────────────────────────────────────────┘ │  │ │
│  │  │                                                           │  │ │
│  │  │  ┌─────────────────────────────────────────────────────┐ │  │ │
│  │  │  │ RosterPeriodCarousel (Client Only)                  │ │  │ │
│  │  │  │                                                      │ │  │ │
│  │  │  │  - Uses roster-utils.ts                             │ │  │ │
│  │  │  │  - Real-time countdown (1s interval)                │ │  │ │
│  │  │  │  - Auto-scroll with pause on hover                  │ │  │ │
│  │  │  │  - ⚠️  Hardcoded blue/purple colors (VIOLATION)     │ │  │ │
│  │  │  └─────────────────────────────────────────────────────┘ │  │ │
│  │  │                                                           │  │ │
│  │  │  ┌─────────────────────────────────────────────────────┐ │  │ │
│  │  │  │ Legacy Components (⚠️  Consider Removing)           │ │  │ │
│  │  │  │                                                      │ │  │ │
│  │  │  │  - MetricCard (lines 217-250)                       │ │  │ │
│  │  │  │  - CertificationCard (lines 252-283)                │ │  │ │
│  │  │  │  - ActionCard (lines 285-310)                       │ │  │ │
│  │  │  │  - ⚠️  Hardcoded purple/green colors (VIOLATION)    │ │  │ │
│  │  │  └─────────────────────────────────────────────────────┘ │  │ │
│  │  └──────────────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                          USER REQUEST                               │
│                      GET /dashboard                                 │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     SERVER COMPONENTS                               │
│                   (Next.js Server Rendering)                        │
│                                                                     │
│  ┌────────────────────┐  ┌──────────────────┐  ┌─────────────────┐│
│  │ HeroStatsServer    │  │ ComplianceServer │  │ DashboardContent││
│  │                    │  │                  │  │                 ││
│  │ Fetches:           │  │ Fetches:         │  │ Orchestrates:   ││
│  │ - Pilot counts     │  │ - Compliance %   │  │ - Data fetching ││
│  │ - Cert counts      │  │ - Categories     │  │ - Error bounds  ││
│  │ - Leave pending    │  │ - Action items   │  │ - Layout        ││
│  └────────┬───────────┘  └────────┬─────────┘  └────────┬────────┘│
│           │                       │                      │         │
└───────────┼───────────────────────┼──────────────────────┼─────────┘
            │                       │                      │
            ▼                       ▼                      ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        SERVICE LAYER                                │
│                  (lib/services/*.ts)                                │
│                                                                     │
│  ┌────────────────────────────────────────────────────────────────┐│
│  │                  dashboard-service.ts                          ││
│  │                                                                ││
│  │  getDashboardMetrics(useCache: boolean)                       ││
│  │    ├─> Check cache first (if useCache = true)                 ││
│  │    ├─> Query database views:                                  ││
│  │    │     - dashboard_metrics                                  ││
│  │    │     - compliance_dashboard                               ││
│  │    │     - pilot_report_summary                               ││
│  │    └─> Aggregate and return metrics                           ││
│  │                                                                ││
│  └────────────────────────────────────────────────────────────────┘│
│                                │                                    │
│  ┌────────────────────────────────────────────────────────────────┐│
│  │           expiring-certifications-service.ts                   ││
│  │                                                                ││
│  │  getExpiringCertifications(daysAhead: number)                 ││
│  │    ├─> Query detailed_expiring_checks view                    ││
│  │    ├─> Filter by expiry date (today + daysAhead)              ││
│  │    ├─> Calculate status (expired, expiring, current)          ││
│  │    └─> Return sorted by urgency                               ││
│  │                                                                ││
│  └────────────────────────────────────────────────────────────────┘│
│                                │                                    │
│  ┌────────────────────────────────────────────────────────────────┐│
│  │                  cache-service.ts                              ││
│  │                                                                ││
│  │  getCachedData<T>(key: string): Promise<T | null>             ││
│  │  setCachedData<T>(key, data, ttl: number): Promise<void>      ││
│  │                                                                ││
│  │  Cache Keys:                                                  ││
│  │    - 'dashboard:metrics' (60s TTL)                            ││
│  │    - 'dashboard:expiring-certs:30' (60s TTL)                  ││
│  │                                                                ││
│  └────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────┘
            │                       │
            ▼                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       DATABASE LAYER                                │
│                    (Supabase PostgreSQL)                            │
│                                                                     │
│  Views (Optimized Queries):                                        │
│  ┌────────────────────────────────────────────────────────────────┐│
│  │ dashboard_metrics                                              ││
│  │   - Total pilots, active, captains, first officers            ││
│  │   - Total certifications, expired, expiring, current          ││
│  │   - Leave requests (pending, approved, rejected)              ││
│  │   - Flight requests (pending)                                 ││
│  └────────────────────────────────────────────────────────────────┘│
│                                                                     │
│  ┌────────────────────────────────────────────────────────────────┐│
│  │ detailed_expiring_checks                                       ││
│  │   - Joins pilots + pilot_checks + check_types                 ││
│  │   - Calculates days_until_expiry                              ││
│  │   - Includes pilot name, check description, dates             ││
│  └────────────────────────────────────────────────────────────────┘│
│                                                                     │
│  ┌────────────────────────────────────────────────────────────────┐│
│  │ compliance_dashboard                                           ││
│  │   - Fleet-wide compliance percentage                          ││
│  │   - Breakdown by check category                               ││
│  │   - Current vs total certifications                           ││
│  └────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      CLIENT HYDRATION                               │
│                   (Browser JavaScript)                              │
│                                                                     │
│  ┌────────────────────┐  ┌──────────────────┐  ┌─────────────────┐│
│  │ HeroStatsClient    │  │ ComplianceClient │  │ RosterCarousel  ││
│  │                    │  │                  │  │                 ││
│  │ Animations:        │  │ Animations:      │  │ Interactions:   ││
│  │ - Framer Motion    │  │ - SVG progress   │  │ - Auto-scroll   ││
│  │ - Stagger children │  │ - Animated bars  │  │ - Countdown     ││
│  │ - Hover effects    │  │ - Entry anims    │  │ - Pause hover   ││
│  └────────────────────┘  └──────────────────┘  └─────────────────┘│
└─────────────────────────────────────────────────────────────────────┘
```

---

## Portal Components Data Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                    PILOT PORTAL DASHBOARD                           │
│                  app/portal/dashboard/page.tsx                      │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     DashboardStats Component                        │
│              components/portal/dashboard-stats.tsx                  │
│                                                                     │
│  useEffect(() => {                                                 │
│    fetchStats()  ────────────────────────────────────────┐         │
│  }, [pilotId])                                            │         │
└───────────────────────────────────────────────────────────┼─────────┘
                                                            │
                                                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      API ROUTE HANDLER                              │
│                   app/api/portal/stats/route.ts                     │
│                                                                     │
│  export async function GET(request: Request) {                     │
│    const session = await getSession()  // Authenticate pilot       │
│    const pilotId = session.user.pilot_id                           │
│                                                                     │
│    const stats = await getPortalStats(pilotId)  ──────────┐        │
│                                                            │        │
│    return NextResponse.json({                             │        │
│      success: true,                                       │        │
│      data: stats                                          │        │
│    })                                                     │        │
│  }                                                        │        │
└───────────────────────────────────────────────────────────┼────────┘
                                                            │
                                                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      SERVICE LAYER                                  │
│            lib/services/pilot-portal-service.ts                     │
│                                                                     │
│  export async function getPortalStats(pilotId: string) {           │
│    const supabase = await createClient()                           │
│                                                                     │
│    // Parallel queries for performance                             │
│    const [                                                          │
│      activeCerts,      // Count of current certifications          │
│      upcomingChecks,   // Count of checks expiring < 60 days       │
│      pendingLeave,     // Count of pending leave requests          │
│      pendingFlights,   // Count of pending flight requests         │
│      totalPilots       // Total active pilots                      │
│    ] = await Promise.all([                                         │
│      certificationService.getActiveCertifications(pilotId),        │
│      certificationService.getUpcomingChecks(pilotId, 60),          │
│      leaveService.getPendingRequests(pilotId),                     │
│      flightService.getPendingRequests(pilotId),                    │
│      pilotService.getTotalActivePilots()                           │
│    ])                                                               │
│                                                                     │
│    return {                                                         │
│      active_certifications: activeCerts,                           │
│      upcoming_checks: upcomingChecks,                              │
│      pending_leave_requests: pendingLeave,                         │
│      pending_flight_requests: pendingFlights,                      │
│      total_pilots: totalPilots                                     │
│    }                                                                │
│  }                                                                  │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENT COMPONENT                             │
│              components/portal/dashboard-stats.tsx                  │
│                                                                     │
│  const statCards = [                                                │
│    {                                                                │
│      title: 'Active Certifications',                               │
│      value: stats.active_certifications,                           │
│      icon: Award,                                                  │
│      color: 'text-green-600',  ⚠️  VIOLATION (should be success)   │
│    },                                                               │
│    {                                                                │
│      title: 'Upcoming Checks',                                     │
│      value: stats.upcoming_checks,                                 │
│      icon: AlertCircle,                                            │
│      color: 'text-yellow-600',  ⚠️  VIOLATION (should be warning)  │
│    },                                                               │
│    // ... more cards                                               │
│  ]                                                                  │
│                                                                     │
│  return (                                                           │
│    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">     │
│      {statCards.map((stat) => (                                    │
│        <Card>                                                       │
│          <CardHeader>                                              │
│            <Icon className={stat.color} />                         │
│          </CardHeader>                                             │
│          <CardContent>                                             │
│            <div className={stat.color}>{stat.value}</div>          │
│          </CardContent>                                            │
│        </Card>                                                      │
│      ))}                                                            │
│    </div>                                                           │
│  )                                                                  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Form Components Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                      FORM COMPONENT HIERARCHY                       │
│                   components/forms/*.tsx                            │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                     Base Form Card                                  │
│                  base-form-card.tsx                                 │
│                                                                     │
│  Provides:                                                          │
│  - Card wrapper with title and description                         │
│  - Form context provider                                           │
│  - Error boundary                                                  │
│  - Theme-compliant styling ✅                                       │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Form Field Wrappers                              │
│              (Reusable form input components)                       │
│                                                                     │
│  ┌────────────────────────────────────────────────────────────────┐│
│  │ FormFieldWrapper                                               ││
│  │   - Text inputs with label, error, success states             ││
│  │   - Uses theme variables ✅                                     ││
│  │   - Accessibility attributes (aria-required, aria-invalid)     ││
│  └────────────────────────────────────────────────────────────────┘│
│                                                                     │
│  ┌────────────────────────────────────────────────────────────────┐│
│  │ FormSelectWrapper                                              ││
│  │   - Dropdown selects with validation                          ││
│  │   - Placeholder support                                        ││
│  │   - Theme-compliant ✅                                          ││
│  └────────────────────────────────────────────────────────────────┘│
│                                                                     │
│  ┌────────────────────────────────────────────────────────────────┐│
│  │ FormDatePickerWrapper                                          ││
│  │   - Date inputs with calendar picker                          ││
│  │   - Min/max date validation                                   ││
│  │   - Theme-compliant ✅                                          ││
│  └────────────────────────────────────────────────────────────────┘│
│                                                                     │
│  ┌────────────────────────────────────────────────────────────────┐│
│  │ FormCheckboxWrapper                                            ││
│  │   - Checkbox with label and description                       ││
│  │   - Theme-compliant ✅                                          ││
│  └────────────────────────────────────────────────────────────────┘│
│                                                                     │
│  ┌────────────────────────────────────────────────────────────────┐│
│  │ FormTextareaWrapper                                            ││
│  │   - Multi-line text with character count                      ││
│  │   - Theme-compliant ✅                                          ││
│  └────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   Domain-Specific Forms                             │
│                                                                     │
│  ┌────────────────────────────────────────────────────────────────┐│
│  │ PilotForm (pilot-form.tsx)                                     ││
│  │                                                                ││
│  │  Uses:                                                         ││
│  │  - FormFieldWrapper (employee_id, names)                      ││
│  │  - FormSelectWrapper (role, contract_type)                    ││
│  │  - FormDatePickerWrapper (dob, commencement, passport)        ││
│  │  - FormCheckboxWrapper (is_active, captain qualifications)    ││
│  │                                                                ││
│  │  Validation: PilotCreateSchema / PilotUpdateSchema (Zod)      ││
│  │  Deduplication: useDeduplicatedSubmit hook                    ││
│  │  Theme: ✅ Fully compliant                                     ││
│  └────────────────────────────────────────────────────────────────┘│
│                                                                     │
│  ┌────────────────────────────────────────────────────────────────┐│
│  │ CertificationForm (certification-form.tsx)                     ││
│  │                                                                ││
│  │  Uses:                                                         ││
│  │  - FormSelectWrapper (pilot, check_type)                      ││
│  │  - FormDatePickerWrapper (check_date, expiry_date)            ││
│  │  - FormFieldWrapper (notes, examiner)                         ││
│  │                                                                ││
│  │  Theme: ✅ Fully compliant                                     ││
│  └────────────────────────────────────────────────────────────────┘│
│                                                                     │
│  ┌────────────────────────────────────────────────────────────────┐│
│  │ LeaveRequestForm (leave-request-form.tsx)                      ││
│  │                                                                ││
│  │  Uses:                                                         ││
│  │  - Input (start_date, end_date, roster_period)                ││
│  │  - Textarea (reason)                                           ││
│  │  - Select (request_type)                                       ││
│  │                                                                ││
│  │  Validation: leaveRequestSchema (Zod)                         ││
│  │  Hook: usePortalForm                                           ││
│  │  Theme: ⚠️  Mixed (uses border-blue-200, text-blue-900)        ││
│  └────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────┘
```

---

## Theme Color Mapping

```
┌─────────────────────────────────────────────────────────────────────┐
│                     CURRENT COLOR USAGE                             │
│                  (Hardcoded Tailwind Colors)                        │
└─────────────────────────────────────────────────────────────────────┘

Purple (18 files):
  dashboard-content.tsx:        bg-purple-50, text-purple-600
  roster-period-carousel.tsx:   to-purple-50, text-purple-700, bg-purple-600
  portal/dashboard-stats.tsx:   text-purple-600
  settings-quick-actions.tsx:   bg-purple-100, text-purple-600
  tasks/TaskList.tsx:           bg-purple-100, text-purple-800
  audit/AuditLogTable.tsx:      bg-purple-100, text-purple-800
  [12 more files...]

Green (25 files):
  dashboard-content.tsx:        text-green-600, bg-green-50
  portal/dashboard-stats.tsx:   text-green-600
  certifications-table.tsx:     bg-green-100, text-green-800
  [22 more files...]

Yellow (20 files):
  dashboard-content.tsx:        text-yellow-600, bg-yellow-50
  portal/dashboard-stats.tsx:   text-yellow-600
  expiring-certifications.tsx:  bg-yellow-100, text-yellow-800
  [17 more files...]

Red (30 files):
  dashboard-content.tsx:        text-red-600, bg-red-50
  error-alert.tsx:              bg-red-100, text-red-800
  [28 more files...]

Blue (28 files):
  roster-period-carousel.tsx:   from-blue-50, text-blue-700, border-blue-200
  leave-request-form.tsx:       border-blue-200, bg-blue-50, text-blue-900
  [26 more files...]

                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      TARGET COLOR USAGE                             │
│                    (CSS Theme Variables)                            │
└─────────────────────────────────────────────────────────────────────┘

Purple → Captain/Secondary Accent:
  bg-purple-50        →  bg-captain-50
  bg-purple-100       →  bg-captain-100
  text-purple-600     →  text-captain-600
  text-purple-700     →  text-captain-700
  border-purple-200   →  border-captain-200

Green → Success:
  bg-green-50         →  bg-success-50
  bg-green-100        →  bg-success-100
  text-green-600      →  text-success-600
  text-green-700      →  text-success-700
  text-green-800      →  text-success-800

Yellow → Warning:
  bg-yellow-50        →  bg-warning-50
  bg-yellow-100       →  bg-warning-100
  text-yellow-600     →  text-warning-600
  text-yellow-700     →  text-warning-700
  text-yellow-800     →  text-warning-800

Red → Destructive:
  bg-red-50           →  bg-destructive-50
  bg-red-100          →  bg-destructive-100
  text-red-600        →  text-destructive-600
  text-red-700        →  text-destructive-700
  text-red-800        →  text-destructive-800

Blue → Primary:
  from-blue-50        →  from-primary-50
  bg-blue-50          →  bg-primary-50
  text-blue-600       →  text-primary-600
  text-blue-700       →  text-primary-700
  border-blue-200     →  border-primary-200
```

---

## Service Layer Dependency Graph

```
┌─────────────────────────────────────────────────────────────────────┐
│                      DASHBOARD SERVICES                             │
│                                                                     │
│  ┌────────────────────────────────────────────────────────────────┐│
│  │                   dashboard-service.ts                         ││
│  │                                                                ││
│  │  getDashboardMetrics(useCache: boolean)                       ││
│  │    │                                                           ││
│  │    ├─> cache-service.ts                                       ││
│  │    │     getCachedData('dashboard:metrics')                   ││
│  │    │     setCachedData('dashboard:metrics', data, 60)         ││
│  │    │                                                           ││
│  │    ├─> Supabase Views:                                        ││
│  │    │     - dashboard_metrics                                  ││
│  │    │     - compliance_dashboard                               ││
│  │    │     - pilot_report_summary                               ││
│  │    │                                                           ││
│  │    └─> Aggregates:                                            ││
│  │          - pilots: {total, active, captains, firstOfficers}   ││
│  │          - certifications: {total, expired, expiring, etc}    ││
│  │          - leave: {pending, approved, rejected}               ││
│  │          - compliance: percentage calculation                 ││
│  └────────────────────────────────────────────────────────────────┘│
│                                                                     │
│  ┌────────────────────────────────────────────────────────────────┐│
│  │          expiring-certifications-service.ts                    ││
│  │                                                                ││
│  │  getExpiringCertifications(daysAhead: number)                 ││
│  │    │                                                           ││
│  │    ├─> Supabase Views:                                        ││
│  │    │     - detailed_expiring_checks                           ││
│  │    │                                                           ││
│  │    ├─> Filters:                                               ││
│  │    │     WHERE expiry_date BETWEEN today AND today+daysAhead  ││
│  │    │                                                           ││
│  │    └─> Calculates:                                            ││
│  │          - daysUntilExpiry (expiry_date - today)              ││
│  │          - status: {color, label, priority}                   ││
│  │          - isExpired, isExpiringSoon, isCurrent               ││
│  │                                                                ││
│  │  Returns: ExpiringCertification[]                             ││
│  │    [                                                           ││
│  │      {                                                         ││
│  │        pilotName, employeeId, checkCode, checkDescription,    ││
│  │        expiryDate, status: {daysUntilExpiry, color, label}    ││
│  │      }                                                         ││
│  │    ]                                                           ││
│  └────────────────────────────────────────────────────────────────┘│
│                                                                     │
│  ┌────────────────────────────────────────────────────────────────┐│
│  │                    cache-service.ts                            ││
│  │                                                                ││
│  │  In-memory Map cache with TTL                                 ││
│  │                                                                ││
│  │  getCachedData<T>(key: string): Promise<T | null>             ││
│  │    ├─> Check if key exists in cache                           ││
│  │    ├─> Check if TTL expired                                   ││
│  │    ├─> Return data if valid, null if expired/missing          ││
│  │    └─> Clean up expired entries                               ││
│  │                                                                ││
│  │  setCachedData<T>(key: string, data: T, ttl: number)          ││
│  │    ├─> Store data in Map                                      ││
│  │    ├─> Set expiration timestamp (Date.now() + ttl*1000)       ││
│  │    └─> Return void                                            ││
│  │                                                                ││
│  │  clearCache(keyPattern?: string)                              ││
│  │    ├─> Clear all if no pattern                                ││
│  │    └─> Clear matching keys if pattern provided                ││
│  │                                                                ││
│  │  Cache Keys Used:                                             ││
│  │    - 'dashboard:metrics' (60s)                                ││
│  │    - 'dashboard:expiring-certs:30' (60s)                      ││
│  └────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────┘
```

---

## Error Boundary Protection

```
┌─────────────────────────────────────────────────────────────────────┐
│                  ERROR BOUNDARY HIERARCHY                           │
│                                                                     │
│  app/dashboard/page.tsx                                            │
│    │                                                                │
│    └─> <ErrorBoundary>  ─────────────────────────────────┐         │
│          │                                                │         │
│          └─> DashboardContent                             │         │
│                │                                          │         │
│                ├─> <ErrorBoundary>                        │         │
│                │     └─> HeroStatsServer                  │         │
│                │           └─> HeroStatsClient            │         │
│                │                                          │         │
│                ├─> <ErrorBoundary>                        │         │
│                │     └─> ComplianceOverviewServer         │         │
│                │           └─> ComplianceOverviewClient   │         │
│                │                                          │         │
│                ├─> <ErrorBoundary>                        │         │
│                │     └─> RosterPeriodCarousel             │         │
│                │                                          │         │
│                └─> <ErrorBoundary>                        │         │
│                      └─> [Legacy Components]              │         │
│                                                           │         │
│  If any component throws error:                          │         │
│    ├─> Error caught by nearest ErrorBoundary             │         │
│    ├─> Component tree below boundary unmounts            │         │
│    ├─> Fallback UI rendered (error message)              │         │
│    └─> Other sibling components continue working ✅       │         │
│                                                           │         │
│  Benefits:                                                │         │
│    ✅ Partial dashboard failure (not complete crash)      │         │
│    ✅ User sees what's working + error for what's broken  │         │
│    ✅ Error logged to console for debugging               │         │
│    ✅ Production-safe (no stack trace exposure)           │         │
└───────────────────────────────────────────────────────────┴─────────┘
```

---

## Component File Relationships

```
components/
├── dashboard/
│   ├── compliance-overview-client.tsx      [304 lines] ✅ Theme
│   ├── compliance-overview-server.tsx      [116 lines] ⚠️  Direct DB
│   ├── dashboard-content.tsx               [311 lines] ⚠️  Hardcoded colors
│   ├── hero-stats-client.tsx               [133 lines] ✅ Theme
│   ├── hero-stats-server.tsx               [56 lines]  ✅ Theme
│   ├── roster-period-carousel.tsx          [264 lines] ⚠️  Hardcoded colors
│   └── index.ts                            [Exports]
│
├── portal/
│   ├── dashboard-stats.tsx                 [135 lines] ⚠️  Hardcoded colors
│   ├── leave-request-form.tsx              [275 lines] ⚠️  Hardcoded blue
│   ├── flight-request-form.tsx             [Similar to leave form]
│   ├── feedback-form.tsx
│   ├── form-error-alert.tsx                ✅ Theme
│   └── submit-button.tsx                   ✅ Theme
│
├── forms/
│   ├── base-form-card.tsx                  ✅ Theme ✅
│   ├── pilot-form.tsx                      [261 lines] ✅ Theme ✅
│   ├── certification-form.tsx              ✅ Theme ✅
│   ├── leave-request-form.tsx              ✅ Theme ✅
│   ├── form-field-wrapper.tsx              ✅ Theme ✅
│   ├── form-select-wrapper.tsx             ✅ Theme ✅
│   ├── form-date-picker-wrapper.tsx        ✅ Theme ✅
│   ├── form-checkbox-wrapper.tsx           ✅ Theme ✅
│   └── form-textarea-wrapper.tsx           ✅ Theme ✅
│
└── ui/
    ├── card.tsx                            ✅ Theme ✅
    ├── button.tsx                          ✅ Theme ✅
    ├── input.tsx                           ✅ Theme ✅
    ├── select.tsx                          ✅ Theme ✅
    ├── badge.tsx                           ✅ Theme ✅
    ├── alert.tsx                           ✅ Theme ✅
    └── [48+ more shadcn components]        ✅ All theme-compliant
```

**Legend**:
- ✅ Fully theme-compliant
- ⚠️  Has violations (hardcoded colors or architecture issues)

---

## Key Takeaways

### ✅ Architecture Strengths
1. **Clean server/client separation** - Data fetching isolated from presentation
2. **Service layer compliance** - 90% of code uses proper abstraction
3. **Excellent caching** - Reduces database load with smart TTL
4. **Error boundaries** - Graceful degradation on component failure
5. **Modern React patterns** - Hooks, suspense, streaming
6. **Form architecture** - Reusable wrappers, consistent validation

### ⚠️  Areas for Improvement
1. **Theme consistency** - 73 files use hardcoded colors
2. **Service layer violation** - ComplianceOverviewServer bypasses service
3. **Purple color undefined** - Used in 18 files but not in theme
4. **Legacy components** - Duplication in dashboard-content.tsx
5. **Dark mode support** - Hardcoded colors break dark mode
6. **Portal components** - Inconsistent color usage

### 🎯 Immediate Actions
1. Move category breakdown logic to certification-service.ts
2. Add purple (captain) colors to theme
3. Create color migration plan for 73 files
4. Remove legacy dashboard components after validation
5. Update portal components to use theme variables

---

**Document Version**: 1.0.0
**Last Updated**: October 25, 2025
**Companion Document**: DASHBOARD-ARCHITECTURE-REVIEW.md
