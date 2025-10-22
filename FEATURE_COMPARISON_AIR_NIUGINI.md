# Feature Comparison: air-niugini-pms vs fleet-management-v2

**Date**: October 22, 2025
**Purpose**: Identify features from air-niugini-pms to port to fleet-management-v2
**Author**: Claude Code

---

## Overview

Both projects are B767 Pilot Management Systems connecting to the same Supabase database (`wgdmgvonqysflwdiiols`), but with different feature sets and technology stacks.

### Technology Stack Comparison

| Feature | air-niugini-pms | fleet-management-v2 |
|---------|----------------|---------------------|
| **Next.js** | 14.2.33 | 15.5.4 ✅ More modern |
| **React** | 18.3.1 | 19.1.0 ✅ Latest |
| **TypeScript** | 5.9.2 | 5.7.3 ✅ Newer |
| **Tailwind** | 3.4.17 | 4.1.0 ✅ Latest major version |
| **Testing** | Playwright + Jest | Playwright only |
| **Component Dev** | None | Storybook 8.5.11 ✅ |
| **PWA Support** | ✅ next-pwa 5.6.0 | ❌ Missing |
| **Charts** | Chart.js 4.5.0 | None |
| **PDF Generation** | @react-pdf/renderer 4.3.1 | None |

---

## Features in air-niugini-pms NOT in fleet-management-v2

### 🔴 HIGH PRIORITY (Production Critical)

#### 1. PWA Support (Progressive Web App)
- **Status**: Production-ready in air-niugini-pms
- **Components**:
  - `next-pwa` configuration
  - Service worker with caching strategies
  - Offline fallback page (`app/offline.tsx`)
  - Offline indicator component (`components/offline/OfflineIndicator.tsx`)
  - App manifest for installability
- **Benefits**:
  - Works offline
  - Installable on mobile devices
  - Faster load times with caching
  - Better mobile UX
- **Port Effort**: Medium (2-3 days)

#### 2. Audit Logging System
- **Location**: `components/audit/`
- **Purpose**: Track all CRUD operations with user attribution
- **Features**:
  - Comprehensive audit trail
  - User action tracking
  - Change history
- **Port Effort**: Medium (2-3 days)

#### 3. Notifications System
- **Location**: `components/notifications/`
- **Purpose**: System-wide notification management
- **Features**:
  - Real-time notifications
  - Email notifications for expiring certifications
  - Notification preferences
  - Notification history
- **Port Effort**: High (4-5 days)

#### 4. PDF Reporting
- **Library**: @react-pdf/renderer 4.3.1
- **Location**: `components/reports/`
- **Purpose**: Generate professional PDF reports
- **Reports**:
  - Pilot certification reports
  - Fleet compliance reports
  - Leave request summaries
  - Roster reports
- **Port Effort**: High (3-4 days)

### 🟡 MEDIUM PRIORITY (Operational Improvements)

#### 5. Flight Requests System
- **Location**: `components/flight-requests/`
- **Database**: `flight_requests` table
- **Purpose**: Pilots can request additional flights or route changes
- **Features**:
  - Submission form
  - Admin review dashboard
  - Status tracking
  - Approval workflow
- **Port Effort**: High (4-5 days)

#### 6. Disciplinary Actions Tracking
- **Location**: `components/disciplinary/`
- **Database**: `disciplinary_actions` table
- **Purpose**: Track disciplinary matters and incidents
- **Features**:
  - Incident reporting
  - Warning levels
  - Automatic escalation
  - Privacy controls
- **Port Effort**: Medium (3-4 days)

#### 7. Document Management
- **Location**: `components/documents/`
- **Purpose**: Store and manage pilot documents
- **Features**:
  - Upload documents
  - Version control
  - Document expiry tracking
  - Secure access
- **Port Effort**: High (4-5 days)

#### 8. Feedback Platform
- **Location**: `components/feedback/`
- **Purpose**: Pilot feedback collection and management
- **Features**:
  - Feedback submission
  - Admin review
  - Response system
  - Analytics
- **Port Effort**: Medium (2-3 days)

#### 9. Task Management System
- **Location**: `components/tasks/`
- **Purpose**: Manage administrative tasks and to-dos
- **Features**:
  - Task creation
  - Assignment
  - Status tracking
  - Deadlines
- **Port Effort**: Medium (3-4 days)

### 🟢 LOW PRIORITY (Nice to Have)

#### 10. Calendar Components
- **Location**: `components/calendar/`
- **Purpose**: Visual calendar for roster periods and leave
- **Features**:
  - Calendar view
  - Event display
  - Interactive date selection
- **Port Effort**: Low (1-2 days)

#### 11. Command Palette
- **Location**: `components/command/`
- **Purpose**: Quick navigation and actions via keyboard shortcuts
- **Features**:
  - Keyboard-driven navigation
  - Quick actions
  - Search functionality
- **Port Effort**: Low (1-2 days)

#### 12. Presence System
- **Location**: `components/presence/`
- **Purpose**: Real-time user presence indicators
- **Features**:
  - Online/offline status
  - Active users display
  - Last seen timestamps
- **Port Effort**: Low (1-2 days)

#### 13. Performance Monitoring
- **Location**: `components/performance/`
- **Purpose**: Track application performance metrics
- **Features**:
  - Performance analytics
  - Load time tracking
  - Error tracking
- **Port Effort**: Low (1-2 days)

#### 14. Enhanced Error Boundaries
- **Location**: `components/error/`
- **Purpose**: Better error handling and user feedback
- **Features**:
  - Global error boundary
  - Component-level error boundaries
  - Error reporting
  - Fallback UI
- **Port Effort**: Low (1 day)

#### 15. Chart.js Analytics
- **Library**: Chart.js 4.5.0 + react-chartjs-2 5.3.0
- **Purpose**: Interactive charts and data visualization
- **Charts**:
  - Line charts for trends
  - Bar charts for comparisons
  - Pie charts for distributions
  - Radar charts for multi-dimensional data
- **Port Effort**: Medium (2-3 days)

#### 16. Jest Unit Testing
- **Library**: Jest 29.7.0
- **Purpose**: Unit test coverage for critical functions
- **Coverage**:
  - Service layer tests
  - Utility function tests
  - Component tests
  - Integration tests
- **Port Effort**: Medium (ongoing)

---

## Features in fleet-management-v2 NOT in air-niugini-pms

### ✅ Modern Architecture Advantages

1. **Storybook Integration** - Component development and documentation
2. **Next.js 15** - Latest framework features
3. **React 19** - Latest React features
4. **Tailwind v4** - Modern CSS framework
5. **Better TypeScript** - Stricter configuration
6. **Pilot Portal** - Dedicated pilot-facing interface (`app/portal/`)
7. **Better API Organization** - More structured API routes

---

## Recommended Porting Strategy

### Phase 1: Critical Infrastructure (Week 1-2)
1. ✅ **PWA Support** - Offline capability and mobile installation
2. ✅ **Audit Logging** - Track all system changes
3. ✅ **PDF Reporting** - Professional report generation
4. ✅ **Error Boundaries** - Better error handling

**Estimated Effort**: 10-12 days

### Phase 2: Operational Features (Week 3-4)
1. ✅ **Notifications System** - Real-time alerts
2. ✅ **Flight Requests** - Pilot request workflow
3. ✅ **Feedback Platform** - Pilot feedback collection
4. ✅ **Chart.js Analytics** - Data visualization

**Estimated Effort**: 12-15 days

### Phase 3: Advanced Features (Week 5-6)
1. ✅ **Disciplinary Actions** - Incident tracking
2. ✅ **Document Management** - Document storage
3. ✅ **Task Management** - Administrative tasks
4. ✅ **Calendar Components** - Visual roster planning

**Estimated Effort**: 10-12 days

### Phase 4: Enhancements (Week 7-8)
1. ✅ **Command Palette** - Quick navigation
2. ✅ **Presence System** - User status
3. ✅ **Performance Monitoring** - Analytics
4. ✅ **Jest Testing** - Unit test coverage

**Estimated Effort**: 6-8 days

---

## Implementation Notes

### Code Compatibility Considerations

**Upgrade Paths Needed**:
- ❌ next-pwa may need updates for Next.js 15
- ❌ Chart.js integration may need adjustment for React 19
- ❌ @react-pdf/renderer compatibility check needed
- ✅ Most React components should work with minimal changes

**Architecture Alignment**:
- ✅ Both use same Supabase database
- ✅ Both use service layer pattern
- ✅ Both use TypeScript strict mode
- ✅ Both use TailwindCSS
- ⚠️ Need to align folder structure (`src/` vs `app/`)

---

## Conclusion

The air-niugini-pms project has 16 significant features that would enhance fleet-management-v2, with the highest priority being:

1. **PWA Support** (offline capability)
2. **Audit Logging** (compliance)
3. **PDF Reporting** (professional reports)
4. **Notifications System** (alerts)
5. **Flight Requests** (pilot workflow)

**Total Estimated Effort**: 38-47 days (7.6-9.4 weeks) for all features

**Recommended Approach**:
- Start with Phase 1 (critical infrastructure)
- Test thoroughly after each phase
- Deploy incrementally to production
