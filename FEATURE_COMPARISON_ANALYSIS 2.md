# Feature Comparison Analysis: air-niugini-pms vs fleet-management-v2

**Analysis Date**: October 22, 2025
**Analyst**: Maurice (Skycruzer) via Claude Code
**Purpose**: Identify missing features and plan migration path

---

## Executive Summary

This document provides a comprehensive comparison between the legacy **air-niugini-pms** (Next.js 14) and the modern **fleet-management-v2** (Next.js 15) systems. The analysis excludes Documents and Forms pages per project requirements.

**Key Findings**:
- ✅ **17 missing features** identified in fleet-management-v2
- 🎨 **Theme mismatch**: air-niugini-pms uses brand colors (Red/Gold), fleet-management-v2 uses generic sky blue
- 🏗️ **Architecture advantage**: fleet-management-v2 has superior modern stack (Next.js 15, React 19, Turbopack)
- 📊 **Migration effort**: Estimated 3-4 weeks for full feature parity

---

## 1. Project Overview Comparison

### air-niugini-pms (Legacy Production System)

| Aspect | Details |
|--------|---------|
| **Framework** | Next.js 14.2.33, React 18.3.1, TypeScript 5.9.2 |
| **Build System** | Webpack with extensive optimization |
| **Database** | Supabase (Project: wgdmgvonqysflwdiiols) |
| **Status** | ✅ Production v1.0 (27 pilots, 571 certifications) |
| **PWA** | next-pwa 5.6.0 (offline support) |
| **Theme** | Air Niugini brand colors (Red #E4002B, Gold #FFC72C) |
| **Key Features** | Complete feature set with documents, forms, tasks, audit |

### fleet-management-v2 (Modern Rewrite)

| Aspect | Details |
|--------|---------|
| **Framework** | Next.js 15.5.4, React 19.1.0, TypeScript 5.7.3 |
| **Build System** | Turbopack (faster builds, instant HMR) |
| **Database** | Same Supabase (wgdmgvonqysflwdiiols) |
| **Status** | 🚧 Development (modern architecture foundation) |
| **PWA** | Serwist (modern PWA support) |
| **Theme** | Generic sky blue (#0EA5E9) |
| **Key Features** | Core features only (pilots, certifications, leave, analytics) |

---

## 2. Feature Matrix (Excluding Documents & Forms)

### ✅ Features in BOTH Systems

| Feature | air-niugini-pms | fleet-management-v2 | Notes |
|---------|-----------------|---------------------|-------|
| **Dashboard** | `/dashboard` | `/dashboard` | ✅ Both implemented |
| **Pilots List** | `/dashboard/pilots` | `/dashboard/pilots` | ✅ Both implemented |
| **Pilot Detail** | `/dashboard/pilots/[id]` | `/dashboard/pilots/[id]` | ✅ Both implemented |
| **Pilot Create** | Inline form | `/dashboard/pilots/new` | Different approach |
| **Pilot Edit** | Inline edit | `/dashboard/pilots/[id]/edit` | Different approach |
| **Certifications List** | `/dashboard/certifications` | `/dashboard/certifications` | ✅ Both implemented |
| **Certification Create** | Inline form | `/dashboard/certifications/new` | Different approach |
| **Certification Edit** | Inline edit | `/dashboard/certifications/[id]/edit` | Different approach |
| **Leave Requests** | `/dashboard/leave` | `/dashboard/leave` | ✅ Both implemented |
| **Leave Create** | Inline form | `/dashboard/leave/new` | Different approach |
| **Analytics** | `/dashboard/analytics` | `/dashboard/analytics` | ✅ Both implemented |
| **Admin Dashboard** | `/dashboard/admin` | `/dashboard/admin` | ✅ Both implemented |
| **Admin Settings** | `/dashboard/admin/system` | `/dashboard/admin/settings` | ✅ Both implemented |
| **Admin Users** | Via system page | `/dashboard/admin/users/new` | Different approach |
| **Admin Check Types** | Via system page | `/dashboard/admin/check-types` | Different approach |
| **Portal** | `/portal/*` (limited) | `/portal/*` (extensive) | ✅ fleet-management-v2 better |

### ❌ Features MISSING in fleet-management-v2

#### 🔴 HIGH PRIORITY (Regulatory/Operational Critical)

| # | Feature | Path | Purpose | Complexity |
|---|---------|------|---------|------------|
| 1 | **Audit System** | `/dashboard/audit` | View system audit trail (regulatory requirement) | Medium |
| 2 | **Audit Detail** | `/dashboard/audit/[id]` | Detailed audit log view | Low |
| 3 | **Disciplinary Actions** | `/dashboard/disciplinary` | Track disciplinary matters (regulatory) | High |
| 4 | **Disciplinary Create** | `/dashboard/disciplinary/new` | Create new disciplinary action | Medium |
| 5 | **Disciplinary Detail** | `/dashboard/disciplinary/[id]` | View disciplinary action details | Medium |
| 6 | **Flight Requests** | `/dashboard/flight-requests` | Pilot flight request submissions | Medium |

#### 🟡 MEDIUM PRIORITY (Operational Efficiency)

| # | Feature | Path | Purpose | Complexity |
|---|---------|------|---------|------------|
| 7 | **Tasks Management** | `/dashboard/tasks` | Task tracking and assignment | Medium |
| 8 | **Task Create** | `/dashboard/tasks/new` | Create new task | Low |
| 9 | **Task Detail** | `/dashboard/tasks/[id]` | View task details | Low |
| 10 | **Admin Pilot Registrations** | `/dashboard/admin/pilot-registrations` | Manage pilot registration requests | Medium |
| 11 | **Admin Feedback Moderation** | `/dashboard/admin/feedback-moderation` | Moderate pilot feedback | Low |

#### 🟢 LOW PRIORITY (Enhanced Features)

| # | Feature | Path | Purpose | Complexity |
|---|---------|------|---------|------------|
| 12 | **Reports Section** | `/dashboard/reports` | Centralized reports hub | Medium |
| 13 | **Settings (User)** | `/dashboard/settings` | User-level settings (theme, notifications) | Low |
| 14 | **Advanced Analytics** | `/dashboard/analytics/advanced` | Enhanced analytics dashboards | Medium |
| 15 | **Certifications Bulk** | `/dashboard/certifications/bulk` | Bulk certification operations | Medium |
| 16 | **Certifications Calendar** | `/dashboard/certifications/calendar` | Calendar view of certifications | Medium |
| 17 | **Certifications Expiry Planning** | `/dashboard/certifications/expiry-planning` | Proactive expiry planning | Low |
| 18 | **Leave Calendar** | `/dashboard/leave/calendar` | Visual leave calendar | Medium |
| 19 | **Leave Roster Planning** | `/dashboard/leave/roster-planning` | Interactive roster planning | High |
| 20 | **Pilot Certifications Sub-page** | `/dashboard/pilots/[id]/certifications` | Dedicated certifications page per pilot | Low |
| 21 | **Pilot Certifications Timeline** | `/dashboard/pilots/[id]/certifications/timeline` | Timeline view of certifications | Medium |

**Total Missing Features**: 21 features (excluding Documents & Forms)

---

## 3. Theme & Design System Comparison

### air-niugini-pms Theme (Air Niugini Brand)

**Primary Colors**:
```css
--air-niugini-red: #E4002B        /* Primary brand color */
--air-niugini-red-dark: #C00020   /* Hover states */
--air-niugini-gold: #FFC72C       /* Accent color */
--air-niugini-gold-dark: #E6A500  /* Gold hover */
```

**Typography**:
- Primary: Inter (Google Fonts)
- Monospace: JetBrains Mono
- Professional aviation industry styling

**Design Philosophy**:
- Aviation industry standard
- FAA compliance color coding (Red/Yellow/Green for cert status)
- Professional slate/gray neutrals
- Brand consistency with Air Niugini corporate identity

### fleet-management-v2 Theme (Generic)

**Primary Colors**:
```css
--color-primary: #0EA5E9          /* Sky blue */
--color-secondary: #64748B        /* Slate gray */
--color-accent: #8B5CF6           /* Purple */
```

**Typography**:
- System fonts (no specific font imports)
- Tailwind CSS 4.1.0 with @theme directive

**Design Philosophy**:
- Modern, clean interface
- Generic SaaS application styling
- No brand-specific colors
- Optimized for dark mode

---

## 4. Recommended Theme Template

### 🎨 **Recommendation: Adopt Air Niugini Brand Theme**

**Rationale**:
1. ✅ **Brand Compliance**: Matches corporate identity
2. ✅ **Aviation Industry Standard**: Professional appearance for regulatory contexts
3. ✅ **User Familiarity**: Existing users recognize brand colors
4. ✅ **Differentiation**: Stands out from generic blue SaaS apps
5. ✅ **Already Proven**: Tested and validated in production

**Implementation Plan**:

```css
/* Tailwind CSS 4.1.0 @theme Configuration */
@theme {
  /* Air Niugini Primary Colors */
  --color-primary: #E4002B;
  --color-primary-foreground: #FFFFFF;
  --color-primary-hover: #C00020;
  --color-primary-light: #FF1A47;

  /* Air Niugini Gold Accent */
  --color-accent: #FFC72C;
  --color-accent-foreground: #000000;
  --color-accent-hover: #E6A500;

  /* Professional Neutrals (Slate) */
  --color-background: #FFFFFF;
  --color-foreground: #000000;
  --color-muted: #F1F5F9;
  --color-muted-foreground: #64748B;
  --color-border: #E2E8F0;

  /* FAA Status Colors (KEEP AS-IS) */
  --color-success: #10B981;     /* Green - Current */
  --color-warning: #F59E0B;     /* Amber - Expiring */
  --color-destructive: #EF4444; /* Red - Expired */

  /* Dark Mode Adjustments */
  &.dark {
    --color-background: #020617;
    --color-foreground: #F8FAFC;
    --color-primary: #FF1A47;    /* Lighter red for dark mode */
    --color-accent: #FFD75C;     /* Lighter gold for dark mode */
  }
}

/* Typography - Import Inter Font */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

@layer base {
  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  }
}
```

**Key Changes Required**:
1. Update `app/globals.css` with Air Niugini theme
2. Replace all primary color usages (#0EA5E9 → #E4002B)
3. Add accent color usages for gold highlights
4. Import Inter font family
5. Update component library (buttons, badges, navigation)
6. Test dark mode compatibility

---

## 5. Architecture Advantages of fleet-management-v2

Despite missing features, fleet-management-v2 has significant technical advantages:

| Advantage | air-niugini-pms | fleet-management-v2 | Impact |
|-----------|-----------------|---------------------|--------|
| **Next.js Version** | 14.2.33 | 15.5.4 | Turbopack, async cookies, improved App Router |
| **React Version** | 18.3.1 | 19.1.0 | React Compiler optimizations |
| **TypeScript** | 5.9.2 | 5.7.3 | Latest type safety features |
| **Build Speed** | Webpack | Turbopack | 5-10x faster builds, instant HMR |
| **PWA** | next-pwa | Serwist | Modern service worker API |
| **Testing** | Playwright | Playwright | Same E2E framework |
| **Storybook** | Not configured | 8.5.11 | Component development workflow |
| **Service Layer** | Partial | Comprehensive | Better architecture pattern |

**Recommendation**: **DO NOT** abandon fleet-management-v2. Add missing features instead.

---

## 6. Migration Strategy

### Phase 1: High Priority Features (Week 1-2)

**Regulatory & Compliance**:

1. ✅ **Audit System** (3 days)
   - Leverage existing `audit-service.ts`
   - Create UI components for log viewer
   - Implement filtering (user, action, date, entity)
   - Add export functionality (CSV/PDF)

2. ✅ **Disciplinary Actions** (5 days)
   - New database table: `disciplinary_actions`
   - Service layer: `disciplinary-service.ts`
   - UI: List, detail, create/edit forms
   - Integration with pilot profiles
   - Pilot acknowledgment workflow

3. ✅ **Flight Requests** (4 days)
   - New database table: `flight_requests`
   - Service layer: `flight-request-service.ts`
   - UI: Submission form, admin review, status tracking
   - Notifications for status changes

**Estimated Effort**: 12 days (2 weeks with testing)

### Phase 2: Operational Features (Week 3)

**Task & Admin Management**:

4. ✅ **Tasks Management** (4 days)
   - New database table: `tasks`
   - Service layer: `task-service.ts`
   - UI: Task list, detail, create/edit
   - Assignment workflow, due dates
   - Email notifications integration

5. ✅ **Admin Enhancements** (3 days)
   - Pilot Registrations page
   - Feedback Moderation page
   - Enhanced system settings

**Estimated Effort**: 7 days (1.5 weeks)

### Phase 3: Enhanced Features (Week 4)

**Enhanced Capabilities**:

6. ✅ **Reports Section** (3 days)
   - Centralized reports hub
   - Pre-built report templates
   - Export functionality (PDF/Excel/CSV)

7. ✅ **Certification Enhancements** (3 days)
   - Bulk operations UI
   - Calendar view component
   - Expiry planning dashboard

8. ✅ **Leave Enhancements** (2 days)
   - Calendar view component
   - Interactive roster planning UI

9. ✅ **User Settings** (2 days)
   - User profile management
   - Notification preferences
   - Theme customization

10. ✅ **Analytics Advanced** (2 days)
    - Enhanced analytics dashboards
    - Custom report builder

**Estimated Effort**: 12 days (2.5 weeks)

### Phase 4: Theme Migration (Week 4)

11. ✅ **Air Niugini Theme Implementation** (2 days)
    - Update `app/globals.css` with brand colors
    - Import Inter font family
    - Update all components for new theme
    - Test dark mode compatibility
    - Accessibility testing (WCAG 2.1 AA)

**Estimated Effort**: 2 days

---

## 7. Database Schema Requirements

### New Tables Required

#### disciplinary_actions
```sql
CREATE TABLE disciplinary_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pilot_id UUID REFERENCES pilots(id) ON DELETE CASCADE,
  matter_id TEXT UNIQUE NOT NULL,
  action_type TEXT NOT NULL, -- 'Warning', 'Suspension', 'Termination'
  action_date DATE NOT NULL,
  description TEXT,
  issued_by UUID REFERENCES an_users(id),
  status TEXT DEFAULT 'Active', -- 'Active', 'Resolved', 'Under Appeal'
  acknowledged_by_pilot BOOLEAN DEFAULT FALSE,
  acknowledgment_date DATE,
  appeal_deadline DATE,
  effective_date DATE,
  expiry_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_disciplinary_pilot ON disciplinary_actions(pilot_id);
CREATE INDEX idx_disciplinary_status ON disciplinary_actions(status);
```

#### tasks
```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  assigned_to UUID REFERENCES an_users(id),
  created_by UUID REFERENCES an_users(id),
  status TEXT DEFAULT 'Pending', -- 'Pending', 'In Progress', 'Completed'
  priority TEXT DEFAULT 'Medium', -- 'Low', 'Medium', 'High', 'Critical'
  category TEXT,
  due_date DATE,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_tasks_assigned ON tasks(assigned_to);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
```

#### flight_requests (Already exists in air-niugini-pms)
```sql
CREATE TABLE flight_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pilot_id UUID REFERENCES pilots(id) ON DELETE CASCADE,
  request_type TEXT NOT NULL, -- 'Additional Flight', 'Route Change', 'Schedule Preference'
  requested_date DATE NOT NULL,
  preferred_route TEXT,
  reason TEXT,
  status TEXT DEFAULT 'Pending', -- 'Pending', 'Approved', 'Denied'
  reviewed_by UUID REFERENCES an_users(id),
  review_date TIMESTAMP,
  review_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_flight_requests_pilot ON flight_requests(pilot_id);
CREATE INDEX idx_flight_requests_status ON flight_requests(status);
```

### RLS Policies Required

All new tables need RLS policies:

```sql
-- Audit logs (read-only for all authenticated, no inserts via UI)
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY audit_read ON audit_logs
  FOR SELECT TO authenticated
  USING (true);

-- Disciplinary actions (admins only)
ALTER TABLE disciplinary_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY disciplinary_admin ON disciplinary_actions
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

-- Tasks (assigned users can read, admins can manage)
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY tasks_read ON tasks
  FOR SELECT TO authenticated
  USING (
    assigned_to = auth.uid() OR
    auth.jwt() ->> 'role' IN ('admin', 'manager')
  );

CREATE POLICY tasks_manage ON tasks
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'role' IN ('admin', 'manager'));

-- Flight requests (pilots can read own, admins/managers can manage)
ALTER TABLE flight_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY flight_requests_read ON flight_requests
  FOR SELECT TO authenticated
  USING (
    pilot_id IN (SELECT id FROM pilots WHERE id = auth.uid()) OR
    auth.jwt() ->> 'role' IN ('admin', 'manager')
  );

CREATE POLICY flight_requests_create ON flight_requests
  FOR INSERT TO authenticated
  WITH CHECK (pilot_id IN (SELECT id FROM pilots WHERE id = auth.uid()));

CREATE POLICY flight_requests_manage ON flight_requests
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'role' IN ('admin', 'manager'));
```

---

## 8. Testing Requirements

### E2E Tests Required (Playwright)

For each new feature:

```typescript
// e2e/disciplinary.spec.ts
test.describe('Disciplinary Actions', () => {
  test('should create new disciplinary action', async ({ page }) => {
    await page.goto('/dashboard/disciplinary');
    await page.click('text=New Action');
    await page.fill('[name="matter_id"]', 'D-2025-001');
    await page.selectOption('[name="action_type"]', 'Warning');
    // ... continue test
    await expect(page.locator('text=D-2025-001')).toBeVisible();
  });
});

// e2e/tasks.spec.ts
test.describe('Task Management', () => {
  test('should assign task to user', async ({ page }) => {
    // Test implementation
  });
});

// e2e/flight-requests.spec.ts
test.describe('Flight Requests', () => {
  test('pilot should submit flight request', async ({ page }) => {
    // Test implementation
  });
});
```

**Total New Tests**: ~30 E2E tests across all new features

---

## 9. Quality Assurance Checklist

### Functional Testing

- [ ] All 21 missing features implemented
- [ ] Service layer pattern followed consistently
- [ ] RLS policies working correctly
- [ ] Database migrations deployed successfully
- [ ] All API endpoints tested
- [ ] All UI components responsive (mobile/tablet/desktop)
- [ ] Dark mode compatibility verified
- [ ] Accessibility WCAG 2.1 AA compliant

### Performance Testing

- [ ] Page load times < 2 seconds
- [ ] API response times < 500ms
- [ ] Service worker caching working
- [ ] PWA installation functional
- [ ] No memory leaks in long-running sessions

### Security Testing

- [ ] RLS policies prevent unauthorized access
- [ ] Input validation on all forms
- [ ] XSS protection enabled
- [ ] CSRF tokens implemented
- [ ] SQL injection prevention verified

### Integration Testing

- [ ] Supabase connection stable
- [ ] Email notifications working
- [ ] PDF generation functional
- [ ] Export features (CSV/Excel) working
- [ ] Real-time updates functioning

---

## 10. Documentation Requirements

### User Documentation

- [ ] User guides for all new features
- [ ] Admin manual updated
- [ ] Pilot portal guide updated
- [ ] FAQ section expanded

### Developer Documentation

- [ ] API documentation complete
- [ ] Database schema documented
- [ ] Service layer patterns documented
- [ ] Component library updated
- [ ] CLAUDE.md updated with new features

### Deployment Documentation

- [ ] Migration guide created
- [ ] Rollback procedures documented
- [ ] Environment setup guide updated
- [ ] Testing procedures documented

---

## 11. Risk Assessment & Mitigation

### Technical Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Database migration failure | High | Low | Test in dev, create rollback scripts |
| Breaking existing features | High | Medium | Comprehensive testing, feature flags |
| Performance degradation | Medium | Low | Performance testing, lazy loading |
| Third-party dependency issues | Low | Low | Lock dependency versions |

### Operational Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| User training required | Medium | High | Create training materials, phased rollout |
| Data migration from old system | Medium | Low | Migration scripts, validation |
| Deployment downtime | High | Low | Deploy during low-usage window |

---

## 12. Success Metrics

### Feature Completion Metrics

- **Target**: 21/21 features implemented (100%)
- **Timeline**: 4 weeks
- **Quality**: 100% test coverage for critical paths

### Performance Metrics

- **Page Load**: < 2 seconds (95th percentile)
- **API Response**: < 500ms average
- **Build Time**: < 30 seconds (Turbopack advantage)
- **Bundle Size**: < 500 KB gzipped

### User Adoption Metrics

- **Training Completion**: 100% of users trained
- **Feature Usage**: 80% adoption within 1 month
- **User Satisfaction**: 4.5/5 average rating

---

## 13. Conclusion & Recommendations

### ✅ Recommended Approach: Feature Migration to fleet-management-v2

**Rationale**:
1. ✅ Superior modern architecture (Next.js 15, React 19, Turbopack)
2. ✅ Better performance and build times
3. ✅ Comprehensive service layer already in place
4. ✅ Modern testing infrastructure (Playwright + Storybook)
5. ✅ Progressive Web App support with Serwist

**Action Items**:

1. **Adopt Air Niugini Brand Theme** (Week 1)
   - Replace generic sky blue with brand Red/Gold
   - Import Inter font family
   - Update all components for new theme

2. **Implement High Priority Features** (Week 1-2)
   - Audit system UI
   - Disciplinary actions
   - Flight requests

3. **Add Operational Features** (Week 3)
   - Tasks management
   - Admin enhancements

4. **Enhanced Capabilities** (Week 4)
   - Reports section
   - Certification enhancements
   - Leave enhancements
   - User settings
   - Advanced analytics

5. **Quality Assurance** (Ongoing)
   - E2E testing for all new features
   - Performance testing
   - Security audit
   - Accessibility compliance

**Timeline**: 4 weeks total for full feature parity + brand theme

**Outcome**: Modern, performant system with complete feature set and Air Niugini brand identity

---

**Document Version**: 1.0
**Last Updated**: October 22, 2025
**Analyst**: Maurice (Skycruzer)
**Status**: Ready for Implementation
