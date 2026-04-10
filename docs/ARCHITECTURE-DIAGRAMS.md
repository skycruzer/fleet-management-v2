# Fleet Management V2 - Architecture Diagrams

**Version**: 2.0.0
**Last Updated**: October 27, 2025
**Author**: Maurice (Skycruzer)

This document contains visual architecture diagrams for Fleet Management V2 using Mermaid syntax.

---

## Table of Contents

1. [System Architecture Overview](#system-architecture-overview)
2. [Dual Authentication Flow](#dual-authentication-flow)
3. [Service Layer Architecture](#service-layer-architecture)
4. [Leave Eligibility Logic Flow](#leave-eligibility-logic-flow)
5. [API Request Flow](#api-request-flow)
6. [Database Schema Relationships](#database-schema-relationships)
7. [Component Hierarchy](#component-hierarchy)
8. [Deployment Architecture](#deployment-architecture)
9. [Data Flow Diagrams](#data-flow-diagrams)
10. [PWA Caching Strategy](#pwa-caching-strategy)

---

## System Architecture Overview

```mermaid
graph TB
    subgraph "Client Layer"
        A1[Admin Dashboard<br/>Supabase Auth]
        A2[Pilot Portal<br/>Custom Auth]
    end

    subgraph "Presentation Layer"
        B1[React 19 Components]
        B2[shadcn/ui Library]
        B3[Tailwind CSS]
    end

    subgraph "API Layer - 67 Routes"
        C1[Admin APIs<br/>/api/pilots<br/>/api/certifications]
        C2[Portal APIs<br/>/api/portal/*]
        C3[Analytics APIs<br/>/api/analytics/*]
    end

    subgraph "Service Layer - 30 Services"
        D1[pilot-service.ts]
        D2[certification-service.ts]
        D3[leave-eligibility-service.ts]
        D4[leave-service.ts]
        D5[pilot-portal-service.ts]
        D6[analytics-service.ts]
    end

    subgraph "Data Layer"
        E1[(Supabase PostgreSQL)]
        E2[RLS Policies]
        E3[Database Functions]
        E4[Views]
    end

    subgraph "External Services"
        F1[Better Stack<br/>Logging]
        F2[Upstash Redis<br/>Rate Limiting]
        F3[Resend<br/>Email]
    end

    A1 --> B1
    A2 --> B1
    B1 --> B2
    B1 --> B3

    B1 --> C1
    B1 --> C2
    B1 --> C3

    C1 --> D1
    C1 --> D2
    C1 --> D6
    C2 --> D5
    C2 --> D4
    C3 --> D6

    D1 --> E1
    D2 --> E1
    D3 --> E1
    D4 --> E1
    D5 --> E1
    D6 --> E1

    E1 --> E2
    E1 --> E3
    E1 --> E4

    C1 -.Log Errors.-> F1
    C2 -.Log Errors.-> F1
    C1 -.Rate Limit.-> F2
    C2 -.Rate Limit.-> F2
    D2 -.Send Emails.-> F3

    style A1 fill:#4299e1
    style A2 fill:#48bb78
    style D3 fill:#ed8936
    style E1 fill:#9f7aea
```

---

## Dual Authentication Flow

### Admin Portal Authentication (Supabase Auth)

```mermaid
sequenceDiagram
    actor Admin as Admin User
    participant Login as /auth/login
    participant API as Supabase Auth API
    participant Session as Session Store
    participant Dashboard as /dashboard/*

    Admin->>Login: Visit login page
    Login->>Admin: Display login form
    Admin->>Login: Submit email + password
    Login->>API: supabase.auth.signInWithPassword()
    API->>API: Validate credentials
    API-->>Login: Return JWT + Session
    Login->>Session: Store session cookie
    Login->>Dashboard: Redirect to dashboard
    Dashboard->>Session: Verify session
    Session-->>Dashboard: Valid session
    Dashboard->>Admin: Display dashboard

    Note over API,Session: Session auto-refreshed by middleware
```

### Pilot Portal Authentication (Custom Auth)

```mermaid
sequenceDiagram
    actor Pilot as Pilot User
    participant Login as /portal/login
    participant API as /api/portal/login
    participant Service as pilot-portal-service.ts
    participant DB as pilot_users table
    participant Session as Custom Session
    participant Portal as /portal/*

    Pilot->>Login: Visit login page
    Login->>Pilot: Display aviation-themed form
    Pilot->>Login: Submit email + password
    Login->>API: POST credentials
    API->>Service: pilotLogin(credentials)
    Service->>DB: Query pilot_users by email
    DB-->>Service: Return pilot user + password_hash
    Service->>Service: bcrypt.compare(password, hash)
    Service->>Service: Check registration_approved
    Service-->>API: Return { success, user, session }
    API->>Session: Create custom session cookie
    API-->>Login: Success response
    Login->>Portal: Redirect to portal dashboard
    Portal->>Session: Verify custom session
    Session-->>Portal: Valid session
    Portal->>Pilot: Display portal

    Note over Service,DB: Isolated from Supabase Auth
```

### Pilot Registration Flow

```mermaid
sequenceDiagram
    actor Pilot as Pilot
    participant Reg as /portal/register
    participant API as /api/portal/register
    participant Service as pilot-portal-service.ts
    participant DB as pilot_users table
    participant Admin as Admin Dashboard
    participant Approve as /dashboard/admin/pilot-registrations

    Pilot->>Reg: Fill registration form
    Reg->>Reg: Validate with Zod schema
    Pilot->>Reg: Submit form
    Reg->>API: POST registration data
    API->>Service: registerPilot(data)
    Service->>Service: bcrypt.hash(password)
    Service->>DB: INSERT with status='pending_approval'
    DB-->>Service: New pilot_user created
    Service-->>API: Success
    API-->>Reg: Registration successful
    Reg->>Pilot: Show "Pending approval" message

    Admin->>Approve: View pending registrations
    Approve->>Admin: Display pending pilots
    Admin->>Approve: Click "Approve"
    Approve->>API: PUT approval
    API->>Service: approvePilotRegistration(id)
    Service->>DB: UPDATE registration_approved=true
    DB-->>Service: Updated
    Service-->>API: Approved
    API-->>Approve: Success
    Approve->>Admin: Show success message

    Note over Pilot: Can now login
```

---

## Service Layer Architecture

```mermaid
graph TB
    subgraph "API Routes"
        A1[GET /api/pilots]
        A2[POST /api/pilots]
        A3[PUT /api/pilots/id]
        A4[DELETE /api/pilots/id]
    end

    subgraph "Service Layer"
        S1[pilot-service.ts]
        S2[certification-service.ts]
        S3[leave-service.ts]
        S4[leave-eligibility-service.ts]
        S5[cache-service.ts]
        S6[audit-service.ts]
    end

    subgraph "Supabase Client"
        C1[createClient]
        C2[Server SSR]
    end

    subgraph "Database"
        D1[(pilots)]
        D2[(pilot_checks)]
        D3[(leave_requests)]
        D4[(audit_logs)]
        D5[(cache_entries)]
    end

    A1 --> S1
    A2 --> S1
    A3 --> S1
    A4 --> S1

    S1 --> C1
    S2 --> C1
    S3 --> C1
    S4 --> C1
    S5 --> C1
    S6 --> C1

    C1 --> C2
    C2 --> D1
    C2 --> D2
    C2 --> D3

    S1 -.Log Actions.-> S6
    S1 -.Cache Results.-> S5
    S6 --> D4
    S5 --> D5

    style S1 fill:#4299e1
    style S4 fill:#ed8936
    style C1 fill:#48bb78
    style D1 fill:#9f7aea
```

### Service Implementation Pattern

```mermaid
flowchart LR
    A[API Route Handler] --> B{Authentication Check}
    B -->|Unauthorized| C[Return 401]
    B -->|Authorized| D{Validate Input with Zod}
    D -->|Invalid| E[Return 400]
    D -->|Valid| F[Call Service Function]
    F --> G[Service: await createClient]
    G --> H[Service: Database Query]
    H --> I{Database Error?}
    I -->|Yes| J[Log Error]
    J --> K[Throw Error]
    I -->|No| L[Return Data]
    L --> M[API: Log to Audit Service]
    M --> N[API: Cache Invalidation]
    N --> O[API: Return Success 200]
    K --> P[API: Return Error 500]

    style F fill:#4299e1
    style G fill:#48bb78
    style H fill:#9f7aea
```

---

## Leave Eligibility Logic Flow

```mermaid
flowchart TB
    Start([Pilot Submits Leave Request]) --> GetPilot[Get Pilot by ID]
    GetPilot --> GetRank{Pilot Rank?}

    GetRank -->|Captain| CheckCaptains[Check Captain Availability]
    GetRank -->|First Officer| CheckFOs[Check FO Availability]

    CheckCaptains --> CalcAvail1[Calculate Day-by-Day<br/>Captain Availability]
    CheckFOs --> CalcAvail2[Calculate Day-by-Day<br/>FO Availability]

    CalcAvail1 --> GetConflicts1[Get Conflicting Pending<br/>Captain Requests]
    CalcAvail2 --> GetConflicts2[Get Conflicting Pending<br/>FO Requests]

    GetConflicts1 --> HasConflicts1{Any Conflicts?}
    GetConflicts2 --> HasConflicts2{Any Conflicts?}

    HasConflicts1 -->|No| Scenario1A[Scenario 1: Solo Captain Request]
    HasConflicts2 -->|No| Scenario1B[Scenario 1: Solo FO Request]

    Scenario1A --> CheckMin1{Remaining Captains >= 10?}
    Scenario1B --> CheckMin2{Remaining FOs >= 10?}

    CheckMin1 -->|Yes| Approve1[✅ Approve Request]
    CheckMin1 -->|No| Deny1[❌ Deny Request]
    CheckMin2 -->|Yes| Approve2[✅ Approve Request]
    CheckMin2 -->|No| Deny2[❌ Deny Request]

    HasConflicts1 -->|Yes| Scenario2A[Scenario 2: Multiple Captain Requests]
    HasConflicts2 -->|Yes| Scenario2B[Scenario 2: Multiple FO Requests]

    Scenario2A --> CheckMinMulti1{If all approved,<br/>remaining >= 10?}
    Scenario2B --> CheckMinMulti2{If all approved,<br/>remaining >= 10?}

    CheckMinMulti1 -->|Yes| ApproveAll1[✅ Approve All Requests<br/>Status: GREEN]
    CheckMinMulti2 -->|Yes| ApproveAll2[✅ Approve All Requests<br/>Status: GREEN]

    CheckMinMulti1 -->|No| SenioritySort1[Sort by Seniority Number<br/>Lower = Higher Priority]
    CheckMinMulti2 -->|No| SenioritySort2[Sort by Seniority Number<br/>Lower = Higher Priority]

    SenioritySort1 --> ApproveBySen1[✅ Approve Until Min=10<br/>❌ Deny Rest<br/>Status: YELLOW]
    SenioritySort2 --> ApproveBySen2[✅ Approve Until Min=10<br/>❌ Deny Rest<br/>Status: YELLOW]

    Approve1 --> AuditLog[Log to Audit Service]
    Approve2 --> AuditLog
    Deny1 --> AuditLog
    Deny2 --> AuditLog
    ApproveAll1 --> AuditLog
    ApproveAll2 --> AuditLog
    ApproveBySen1 --> AuditLog
    ApproveBySen2 --> AuditLog

    AuditLog --> SendNotif[Send Notification<br/>to Pilot]
    SendNotif --> End([End])

    style Scenario1A fill:#4299e1
    style Scenario1B fill:#4299e1
    style Scenario2A fill:#ed8936
    style Scenario2B fill:#ed8936
    style SenioritySort1 fill:#f56565
    style SenioritySort2 fill:#f56565
    style Approve1 fill:#48bb78
    style Approve2 fill:#48bb78
    style ApproveAll1 fill:#48bb78
    style ApproveAll2 fill:#48bb78
```

### Rank-Separated Evaluation

```mermaid
graph TB
    subgraph "Captain Pool - 27 Total"
        C1[Captain #1<br/>Seniority: 1]
        C2[Captain #2<br/>Seniority: 2]
        C3[Captain #3<br/>Seniority: 3]
        C4[...]
        C5[Captain #15<br/>Seniority: 15]
    end

    subgraph "First Officer Pool - 27 Total"
        F1[FO #1<br/>Seniority: 16]
        F2[FO #2<br/>Seniority: 17]
        F3[FO #3<br/>Seniority: 18]
        F4[...]
        F5[FO #12<br/>Seniority: 27]
    end

    subgraph "Leave Requests - Same Dates"
        L1[Leave Request:<br/>Captain #3<br/>Seniority: 3]
        L2[Leave Request:<br/>Captain #7<br/>Seniority: 7]
        L3[Leave Request:<br/>FO #5<br/>Seniority: 20]
    end

    subgraph "Eligibility Check"
        E1[Check Captain Availability<br/>Independent of FOs]
        E2[Check FO Availability<br/>Independent of Captains]
    end

    L1 --> E1
    L2 --> E1
    L3 --> E2

    C1 --> E1
    C2 --> E1
    C3 --> E1
    C4 --> E1
    C5 --> E1

    F1 --> E2
    F2 --> E2
    F3 --> E2
    F4 --> E2
    F5 --> E2

    E1 --> R1[Result: Approve Captain #3<br/>Higher seniority = priority]
    E1 --> R2[Result: Approve Captain #7<br/>If remaining >= 10]
    E2 --> R3[Result: Approve FO #5<br/>Independent check]

    style E1 fill:#4299e1
    style E2 fill:#48bb78
    style L1 fill:#ed8936
    style L2 fill:#ed8936
    style L3 fill:#ed8936
```

---

## API Request Flow

### Complete Request Lifecycle

```mermaid
sequenceDiagram
    actor User
    participant Browser
    participant Middleware as Next.js Middleware
    participant Route as API Route Handler
    participant Auth as Authentication
    participant Valid as Zod Validation
    participant Service as Service Layer
    participant Supabase as Supabase Client
    participant DB as PostgreSQL
    participant Cache as Cache Service
    participant Audit as Audit Service
    participant Response

    User->>Browser: Submit form
    Browser->>Middleware: HTTP Request
    Middleware->>Middleware: Check session
    Middleware->>Middleware: Refresh if needed
    Middleware->>Route: Forward request

    Route->>Auth: Verify authentication
    Auth-->>Route: User authenticated

    Route->>Valid: Validate request body
    Valid->>Valid: Zod schema parse
    Valid-->>Route: Validation passed

    Route->>Service: Call service function
    Service->>Supabase: await createClient()
    Supabase-->>Service: Client instance

    Service->>Cache: Check cache
    Cache-->>Service: Cache miss

    Service->>DB: Execute query
    DB-->>Service: Return data

    Service->>Cache: Store in cache (TTL: 5min)
    Service->>Audit: Log action
    Audit->>DB: Insert audit_logs

    Service-->>Route: Return data
    Route->>Route: revalidatePath()
    Route->>Response: JSON response
    Response->>Browser: 200 OK
    Browser->>User: Display result

    Note over Middleware,Route: Rate limiting checked here
    Note over Service,DB: RLS policies enforced
    Note over Cache: Performance optimization
```

### Error Handling Flow

```mermaid
flowchart TB
    Start([API Request]) --> Auth{Authenticated?}
    Auth -->|No| E401[Return 401 Unauthorized]
    Auth -->|Yes| Valid{Valid Input?}
    Valid -->|No| E400[Return 400 Bad Request]
    Valid -->|Yes| Service[Call Service Function]
    Service --> DBOp[Database Operation]
    DBOp --> Error{Error?}

    Error -->|DB Constraint| Constraint[handleConstraintError]
    Error -->|Network Error| Network[Retry Logic]
    Error -->|RLS Policy| RLS[Return 403 Forbidden]
    Error -->|Generic Error| Generic[Log Error]

    Constraint --> E400B[Return 400 with Details]
    Network --> Retry{Retry Count < 3?}
    Retry -->|Yes| DBOp
    Retry -->|No| E500A[Return 500 Server Error]
    RLS --> E403[Return 403 Forbidden]
    Generic --> LogStack[console.error]
    LogStack --> LogTail[Better Stack Logging]
    LogTail --> E500B[Return 500 Server Error]

    Error -->|No Error| Success[Return Data]
    Success --> Audit[Log to Audit Service]
    Audit --> Cache[Cache Invalidation]
    Cache --> Return200[Return 200 Success]

    E401 --> End([End])
    E400 --> End
    E400B --> End
    E403 --> End
    E500A --> End
    E500B --> End
    Return200 --> End

    style E401 fill:#f56565
    style E400 fill:#ed8936
    style E400B fill:#ed8936
    style E403 fill:#f56565
    style E500A fill:#fc8181
    style E500B fill:#fc8181
    style Return200 fill:#48bb78
```

---

## Database Schema Relationships

```mermaid
erDiagram
    pilots ||--o{ pilot_checks : has
    pilots ||--o{ leave_requests : submits
    pilots ||--o{ flight_requests : submits
    pilots ||--o{ disciplinary_actions : has
    pilots ||--o{ leave_bids : submits
    pilots }o--|| contract_types : has

    pilot_users ||--|| pilots : linked_by_employee_number

    check_types ||--o{ pilot_checks : defines

    leave_bids ||--o{ leave_bid_options : contains

    users ||--o{ audit_logs : creates
    users ||--o{ notifications : receives
    users ||--o{ tasks : assigned

    pilots {
        uuid id PK
        string employee_number UK
        string first_name
        string last_name
        enum rank
        date commencement_date
        jsonb qualifications
        int seniority_number
        date retirement_date
        uuid contract_type_id FK
    }

    pilot_users {
        uuid id PK
        string email UK
        string password_hash
        string employee_number FK
        boolean registration_approved
        timestamp created_at
    }

    pilot_checks {
        uuid id PK
        uuid pilot_id FK
        uuid check_type_id FK
        date check_date
        date expiry_date
        date issue_date
        enum status
    }

    check_types {
        uuid id PK
        string check_code UK
        string description
        int validity_period
        enum category
    }

    leave_requests {
        uuid id PK
        uuid pilot_id FK
        enum leave_type
        date start_date
        date end_date
        string roster_period
        enum status
        uuid approved_by FK
    }

    leave_bids {
        uuid id PK
        uuid pilot_id FK
        int year
        enum status
        timestamp submitted_at
    }

    leave_bid_options {
        uuid id PK
        uuid leave_bid_id FK
        date start_date
        date end_date
        int priority
        string roster_period
    }

    flight_requests {
        uuid id PK
        uuid pilot_id FK
        enum request_type
        date start_date
        date end_date
        enum status
    }

    contract_types {
        uuid id PK
        string name UK
        string description
    }

    disciplinary_actions {
        uuid id PK
        uuid pilot_id FK
        string action_type
        text description
        date date
        boolean resolved
    }

    audit_logs {
        uuid id PK
        uuid user_id FK
        string action
        string table_name
        uuid record_id
        jsonb old_values
        jsonb new_values
        timestamp timestamp
    }

    notifications {
        uuid id PK
        uuid user_id FK
        string title
        text message
        enum type
        boolean read
        timestamp created_at
    }

    tasks {
        uuid id PK
        string title
        text description
        uuid assigned_to FK
        date due_date
        enum status
        enum priority
    }
```

### Database Views

```mermaid
graph TB
    subgraph "Base Tables"
        T1[(pilots)]
        T2[(pilot_checks)]
        T3[(check_types)]
        T4[(leave_requests)]
    end

    subgraph "Database Views"
        V1[expiring_checks<br/>Simplified expiry data]
        V2[detailed_expiring_checks<br/>FAA color coding]
        V3[compliance_dashboard<br/>Fleet metrics]
        V4[pilot_report_summary<br/>Comprehensive summaries]
        V5[captain_qualifications_summary<br/>Captain quals]
        V6[dashboard_metrics<br/>Real-time stats]
    end

    subgraph "Database Functions"
        F1[calculate_years_to_retirement]
        F2[calculate_years_in_service]
        F3[get_fleet_compliance_summary]
        F4[get_fleet_expiry_statistics]
        F5[get_pilot_dashboard_metrics]
    end

    T1 --> V1
    T2 --> V1
    T3 --> V1

    T1 --> V2
    T2 --> V2
    T3 --> V2

    T1 --> V3
    T2 --> V3

    T1 --> V4
    T2 --> V4
    T4 --> V4

    T1 --> V5

    V2 --> V6
    V3 --> V6

    T1 --> F1
    T1 --> F2
    T1 --> F3
    T2 --> F3
    T1 --> F4
    T2 --> F4
    T1 --> F5
    T2 --> F5

    style V1 fill:#4299e1
    style V2 fill:#4299e1
    style V3 fill:#48bb78
    style V4 fill:#48bb78
    style F1 fill:#9f7aea
    style F3 fill:#9f7aea
```

---

## Component Hierarchy

### Admin Dashboard Structure

```mermaid
graph TB
    App[App Layout<br/>app/layout.tsx] --> Dashboard[Dashboard Layout<br/>app/dashboard/layout.tsx]

    Dashboard --> Header[Professional Header<br/>components/layout/professional-header.tsx]
    Dashboard --> Sidebar[Professional Sidebar<br/>components/layout/professional-sidebar.tsx]
    Dashboard --> Content[Page Content]

    Content --> Overview[Dashboard Overview<br/>app/dashboard/page.tsx]
    Content --> Pilots[Pilots Section<br/>app/dashboard/pilots/page.tsx]
    Content --> Certs[Certifications<br/>app/dashboard/certifications/page.tsx]
    Content --> Leave[Leave Management<br/>app/dashboard/leave/page.tsx]
    Content --> Admin[Admin Section<br/>app/dashboard/admin/page.tsx]

    Overview --> HeroStats[Hero Stats Client<br/>components/dashboard/hero-stats-client.tsx]
    Overview --> Compliance[Compliance Overview<br/>components/dashboard/compliance-overview-client.tsx]
    Overview --> Alerts[Urgent Alert Banner<br/>components/dashboard/urgent-alert-banner.tsx]
    Overview --> Expiring[Expiring Certifications Banner<br/>components/dashboard/expiring-certifications-banner.tsx]

    Pilots --> PilotTable[Pilot Table<br/>TanStack Table]
    Pilots --> PilotForm[Pilot Form<br/>React Hook Form + Zod]

    Certs --> CertTable[Certification Table]
    Certs --> CertForm[Certification Form]

    Leave --> LeaveCalendar[Leave Calendar<br/>components/leave/leave-calendar.tsx]
    Leave --> LeaveRequests[Leave Requests Client<br/>components/leave/leave-requests-client.tsx]
    Leave --> LeaveGroups[Leave Request Groups<br/>components/leave/leave-request-group.tsx]

    style Dashboard fill:#4299e1
    style Overview fill:#48bb78
    style Pilots fill:#ed8936
    style Certs fill:#9f7aea
    style Leave fill:#f6ad55
```

### Pilot Portal Structure

```mermaid
graph TB
    App[App Layout<br/>app/layout.tsx] --> Portal[Portal Layout<br/>app/portal/layout.tsx]

    Portal --> Public{Route Type}
    Public -->|Public| PubLayout[Public Layout<br/>app/portal/\(public\)/layout.tsx]
    Public -->|Protected| ProtLayout[Protected Layout<br/>app/portal/\(protected\)/layout.tsx]

    PubLayout --> Login[Login Page<br/>app/portal/login/page.tsx]
    PubLayout --> Register[Register Page<br/>app/portal/register/page.tsx]
    PubLayout --> Forgot[Forgot Password<br/>app/portal/forgot-password/page.tsx]

    Login --> LoginForm[Pilot Login Form<br/>components/pilot/PilotLoginForm.tsx]
    Register --> RegForm[Pilot Register Form<br/>components/pilot/PilotRegisterForm.tsx]

    ProtLayout --> PortalHeader[Portal Header<br/>Aviation Theme]
    ProtLayout --> PortalSidebar[Portal Sidebar<br/>components/layout/pilot-portal-sidebar.tsx]
    ProtLayout --> PortalContent[Page Content]

    PortalContent --> PDash[Portal Dashboard<br/>app/portal/dashboard/page.tsx]
    PortalContent --> PProfile[Profile<br/>app/portal/profile/page.tsx]
    PortalContent --> PCerts[Certifications<br/>app/portal/certifications/page.tsx]
    PortalContent --> PLeave[Leave Requests<br/>app/portal/leave-requests/page.tsx]
    PortalContent --> PFlight[Flight Requests<br/>app/portal/flight-requests/page.tsx]
    PortalContent --> PFeedback[Feedback<br/>app/portal/feedback/page.tsx]
    PortalContent --> PNotif[Notifications<br/>app/portal/notifications/page.tsx]

    PDash --> DashStats[Dashboard Stats<br/>components/portal/dashboard-stats.tsx]
    PDash --> DashContent[Pilot Dashboard Content<br/>components/pilot/PilotDashboardContent.tsx]

    PLeave --> LeaveForm[Leave Request Form<br/>components/portal/leave-request-form.tsx]
    PLeave --> LeaveBidForm[Leave Bid Form<br/>components/portal/leave-bid-form.tsx]

    PFlight --> FlightForm[Flight Request Form<br/>components/portal/flight-request-form.tsx]

    PFeedback --> FeedbackForm[Feedback Form<br/>components/portal/feedback-form.tsx]

    PNotif --> NotifBell[Notification Bell<br/>components/portal/notification-bell.tsx]

    style Portal fill:#48bb78
    style ProtLayout fill:#4299e1
    style PDash fill:#ed8936
```

---

## Deployment Architecture

```mermaid
graph TB
    subgraph "Client Devices"
        Desktop[Desktop Browser<br/>Chrome, Firefox, Safari]
        Mobile[Mobile Browser<br/>iOS Safari, Android Chrome]
        PWA[PWA Installed<br/>Offline Support]
    end

    subgraph "CDN Layer - Vercel Edge Network"
        Edge1[Edge Node<br/>US East]
        Edge2[Edge Node<br/>US West]
        Edge3[Edge Node<br/>Europe]
    end

    subgraph "Application Layer - Vercel"
        NextJS[Next.js 16 Server<br/>React 19 SSR]
        API[API Routes<br/>67 Endpoints]
        SW[Service Worker<br/>Serwist PWA]
    end

    subgraph "Service Layer"
        Services[30 Service Modules<br/>Business Logic]
    end

    subgraph "Data Layer"
        Supabase[(Supabase PostgreSQL<br/>wgdmgvonqysflwdiiols)]
        Storage[Supabase Storage<br/>File Uploads]
    end

    subgraph "External Services"
        Redis[Upstash Redis<br/>Rate Limiting + Cache]
        Logtail[Better Stack<br/>Error Logging]
        Resend[Resend<br/>Email Service]
    end

    Desktop --> Edge1
    Mobile --> Edge2
    PWA --> Edge3

    Edge1 --> NextJS
    Edge2 --> NextJS
    Edge3 --> NextJS

    NextJS --> API
    NextJS --> SW
    API --> Services
    Services --> Supabase
    Services --> Storage

    API -.Rate Limit.-> Redis
    API -.Cache.-> Redis
    API -.Log Errors.-> Logtail
    Services -.Send Emails.-> Resend

    style NextJS fill:#4299e1
    style Supabase fill:#9f7aea
    style Services fill:#48bb78
    style Redis fill:#ed8936
```

### CI/CD Pipeline

```mermaid
flowchart LR
    Dev[Developer] --> Commit[Git Commit]
    Commit --> Husky[Husky Pre-commit Hook]

    Husky --> Lint[ESLint + Prettier]
    Husky --> TypeCheck[TypeScript Check]
    Husky --> Tests[Unit Tests]

    Lint --> Pass1{Pass?}
    TypeCheck --> Pass2{Pass?}
    Tests --> Pass3{Pass?}

    Pass1 -->|No| Block1[❌ Commit Blocked]
    Pass2 -->|No| Block2[❌ Commit Blocked]
    Pass3 -->|No| Block3[❌ Commit Blocked]

    Pass1 -->|Yes| Allow1[✅ Checks Pass]
    Pass2 -->|Yes| Allow1
    Pass3 -->|Yes| Allow1

    Allow1 --> Push[Git Push]
    Push --> GitHub[GitHub Repository]

    GitHub --> Vercel[Vercel Webhook]
    Vercel --> Build[Build Process]

    Build --> Install[npm install]
    Install --> Generate[Generate Types<br/>npm run db:types]
    Generate --> BuildApp[npm run build<br/>Turbopack]

    BuildApp --> BuildPass{Build Success?}
    BuildPass -->|No| BuildFail[❌ Deployment Failed<br/>Notify Developer]
    BuildPass -->|Yes| E2E[Playwright E2E Tests]

    E2E --> E2EPass{Tests Pass?}
    E2EPass -->|No| E2EFail[❌ Deployment Failed<br/>Roll Back]
    E2EPass -->|Yes| Deploy[Deploy to Vercel Edge]

    Deploy --> Prod[Production Environment]
    Prod --> Health[Health Check]
    Health --> Monitor[Better Stack Monitoring]

    style Allow1 fill:#48bb78
    style Deploy fill:#48bb78
    style Prod fill:#4299e1
    style Block1 fill:#f56565
    style Block2 fill:#f56565
    style Block3 fill:#f56565
    style BuildFail fill:#f56565
    style E2EFail fill:#f56565
```

---

## Data Flow Diagrams

### Pilot Creates Leave Request

```mermaid
sequenceDiagram
    actor Pilot
    participant Portal as Pilot Portal UI
    participant API as /api/portal/leave-requests
    participant Valid as Zod Validation
    participant Service as leave-service.ts
    participant Eligibility as leave-eligibility-service.ts
    participant DB as PostgreSQL
    participant Cache as cache-service.ts
    participant Audit as audit-service.ts
    participant Notif as notification-service.ts

    Pilot->>Portal: Fill leave request form
    Portal->>Portal: Client-side validation
    Pilot->>Portal: Submit request

    Portal->>API: POST leave request data
    API->>Valid: Validate with LeaveRequestSchema
    Valid-->>API: Validation passed

    API->>Service: createLeaveRequest(data)
    Service->>Eligibility: checkLeaveEligibility(pilotId, dates)

    Eligibility->>DB: Get pilot by ID
    Eligibility->>DB: Get conflicting requests
    Eligibility->>DB: Calculate crew availability
    Eligibility->>Eligibility: Apply rank-separated logic
    Eligibility-->>Service: Return eligibility result

    Service->>DB: INSERT into leave_requests
    Service->>Cache: Invalidate leave cache
    Service->>Audit: Log action
    Service->>Notif: Create notification for admins

    Service-->>API: Return created request
    API-->>Portal: Success response
    Portal->>Pilot: Show success message + status

    Note over Eligibility: Most complex business logic
    Note over Service,DB: Transaction ensures atomicity
```

### Admin Approves Leave Request

```mermaid
sequenceDiagram
    actor Admin
    participant Dashboard as Admin Dashboard
    participant API as /api/leave-requests/[id]
    participant Service as leave-service.ts
    participant Eligibility as leave-eligibility-service.ts
    participant DB as PostgreSQL
    participant Audit as audit-service.ts
    participant Email as Resend Email
    participant Cache as Next.js Cache

    Admin->>Dashboard: View pending leave requests
    Dashboard->>API: GET /api/leave-requests?status=pending
    API->>Service: getPendingLeaveRequests()
    Service->>DB: SELECT with eligibility data
    DB-->>Service: Return requests with status
    Service-->>API: Requests with color coding
    API-->>Dashboard: Display requests (Green/Yellow/Red)

    Admin->>Dashboard: Click "Approve" button
    Dashboard->>API: PUT /api/leave-requests/[id]<br/>{ status: "approved" }

    API->>Service: updateLeaveRequest(id, { status: "approved" })
    Service->>DB: SELECT current request
    Service->>Eligibility: Re-check eligibility

    Eligibility->>Eligibility: Verify still eligible
    Eligibility-->>Service: Eligible ✅

    Service->>DB: UPDATE leave_requests<br/>SET status="approved", approved_by=admin_id
    Service->>Audit: Log approval action
    Audit->>DB: INSERT audit_log

    Service->>Email: Send approval email to pilot
    Email-->>Service: Email sent

    Service-->>API: Return updated request
    API->>Cache: revalidatePath("/dashboard/leave")
    API->>Cache: revalidatePath("/portal/leave-requests")
    API-->>Dashboard: Success

    Dashboard->>Admin: Show success toast
    Dashboard->>Dashboard: Refresh leave request list

    Note over Service,Eligibility: Re-check prevents race conditions
    Note over Cache: Invalidate both admin and pilot caches
```

### Certification Expiry Notification

```mermaid
sequenceDiagram
    participant Cron as Vercel Cron Job<br/>Daily at 6am UTC
    participant API as /api/cron/check-expiring
    participant Service as expiring-certifications-service.ts
    participant DB as PostgreSQL
    participant Email as Resend Email
    participant Notif as notification-service.ts

    Cron->>API: Trigger daily job
    API->>Service: getExpiringCertifications(30)

    Service->>DB: SELECT from detailed_expiring_checks<br/>WHERE days_until_expiry <= 30
    DB-->>Service: Return expiring certifications

    Service->>Service: Group by pilot
    Service->>Service: Calculate FAA color status

    loop For each pilot with expiring certs
        Service->>Email: Send expiry warning email
        Email-->>Service: Email sent

        Service->>Notif: Create in-app notification
        Notif->>DB: INSERT notification
    end

    Service->>DB: Log notification job in audit_logs
    Service-->>API: Return summary
    API-->>Cron: Job completed

    Note over Service,Email: Sent to both pilot and manager
    Note over Service: Includes renewal planning suggestions
```

---

## PWA Caching Strategy

```mermaid
graph TB
    subgraph "Browser"
        App[Next.js App]
    end

    subgraph "Service Worker - Serwist"
        SW[Service Worker<br/>app/sw.ts]
        Cache[Cache Storage]
    end

    subgraph "Caching Strategies"
        Fonts[Fonts<br/>CacheFirst<br/>1 year TTL]
        Images[Images<br/>StaleWhileRevalidate<br/>24 hours TTL]
        API[API Calls<br/>NetworkFirst<br/>1 minute TTL]
        Static[Static Assets<br/>CacheFirst<br/>Immutable]
        Supabase[Supabase API<br/>NetworkFirst<br/>1 minute fallback]
    end

    subgraph "Network"
        Server[Vercel Server]
        SupabaseDB[Supabase Database]
    end

    App --> SW

    SW --> Fonts
    SW --> Images
    SW --> API
    SW --> Static
    SW --> Supabase

    Fonts -.Check Cache First.-> Cache
    Fonts -.Fallback to Network.-> Server

    Images -.Return Stale.-> Cache
    Images -.Revalidate in Background.-> Server

    API -.Try Network First.-> Server
    API -.Fallback to Cache.-> Cache

    Static -.Cache Only.-> Cache

    Supabase -.Try Network First.-> SupabaseDB
    Supabase -.Fallback to Cache.-> Cache

    Server --> Cache
    SupabaseDB --> Cache

    style Fonts fill:#48bb78
    style Images fill:#4299e1
    style API fill:#ed8936
    style Supabase fill:#9f7aea
```

### PWA Installation Flow

```mermaid
sequenceDiagram
    actor User
    participant Browser
    participant PWA as Next.js App
    participant SW as Service Worker
    participant Cache as Cache Storage
    participant Manifest as manifest.json

    User->>Browser: Visit fleet-management-v2.com
    Browser->>PWA: Load application
    PWA->>Manifest: Check manifest.json
    Manifest-->>PWA: PWA criteria met ✅

    PWA->>Browser: Register service worker
    Browser->>SW: Install service worker
    SW->>Cache: Precache critical assets
    Cache-->>SW: Assets cached

    SW-->>Browser: Service worker active
    Browser->>User: Show "Install App" prompt

    User->>Browser: Click "Install"
    Browser->>Browser: Install PWA
    Browser->>User: Add icon to home screen

    Note over User,Browser: App now installable on desktop/mobile

    User->>PWA: Open installed app
    PWA->>SW: Request resource
    SW->>Cache: Check cache first

    alt Resource in cache
        Cache-->>SW: Return cached resource
        SW-->>PWA: Serve from cache (fast!)
    else Resource not in cache
        SW->>Browser: Fetch from network
        Browser-->>SW: Network response
        SW->>Cache: Store in cache
        SW-->>PWA: Serve from network
    end

    PWA->>User: Display content

    Note over SW,Cache: Offline support enabled
```

### Offline Indicator

```mermaid
stateDiagram-v2
    [*] --> Online: App Loads

    Online --> CheckingConnection: Periodic Check
    CheckingConnection --> Online: navigator.onLine = true
    CheckingConnection --> Offline: navigator.onLine = false

    Online --> Offline: Network Lost Event
    Offline --> Online: Network Restored Event

    Offline --> ShowIndicator: Display Offline Banner
    ShowIndicator --> ServeFromCache: User Interaction
    ServeFromCache --> CacheHit: Resource Available
    ServeFromCache --> CacheMiss: Resource Unavailable

    CacheHit --> DisplayCachedData: Show Data
    CacheMiss --> ShowOfflineMessage: "Available when online"

    Online --> NormalOperation: Full Functionality

    note right of ShowIndicator
        Yellow banner at top:
        "You are offline. Some features may be limited."
    end note

    note right of NormalOperation
        All features available:
        - CRUD operations
        - Real-time updates
        - File uploads
    end note

    note right of DisplayCachedData
        View-only mode:
        - View pilots
        - View certifications
        - View leave requests (cached)
    end note
```

---

## Conclusion

These diagrams provide a visual representation of Fleet Management V2's architecture, covering:

- ✅ **System architecture** - High-level component interaction
- ✅ **Authentication flows** - Dual auth with detailed sequences
- ✅ **Service layer** - 30 services with database interactions
- ✅ **Leave eligibility** - Complex rank-separated logic
- ✅ **API request flow** - Complete request lifecycle with error handling
- ✅ **Database schema** - Entity relationships with 3,837 typed fields
- ✅ **Component hierarchy** - Admin dashboard and pilot portal structures
- ✅ **Deployment architecture** - Vercel + Supabase with CI/CD
- ✅ **Data flows** - Real-world scenarios (leave requests, approvals, notifications)
- ✅ **PWA caching** - Intelligent caching strategies and offline support

These Mermaid diagrams can be rendered in:

- GitHub (native support)
- GitLab (native support)
- VS Code (with Mermaid extension)
- Notion (with Mermaid blocks)
- Confluence (with Mermaid macro)
- Documentation sites (Docusaurus, VitePress, etc.)

---

**Document Version**: 2.0.0
**Generated**: October 27, 2025
**Generated By**: BMad Master Agent
**For**: Maurice (Skycruzer)
