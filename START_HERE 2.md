# Fleet Management V2 - START HERE

Welcome! You now have a comprehensive inventory of the entire Fleet Management V2 project.

---

## What You Have

Four detailed inventory documents created October 22, 2025:

1. **EXISTING_INVENTORY.md** (32 KB)
   - Complete detailed reference of all features
   - Every page, component, API route, service documented
   - Best for: Finding exact file paths, understanding specific features

2. **INVENTORY_QUICK_REFERENCE.md** (9.3 KB)  
   - Quick lookup tables and command reference
   - Architecture overview and patterns
   - Best for: Fast lookups while coding

3. **INVENTORY_README.md** (10 KB)
   - Guide to using the inventory documents
   - FAQ section
   - Common scenarios and workflows
   - Best for: Understanding how to use the other documents

4. **INVENTORY_SUMMARY.txt** (13 KB)
   - Big picture overview with statistics
   - What's built vs. what's not built
   - Critical architecture rules
   - Best for: Project assessment and orientation

---

## Recommended Reading Order

### If you have 5 minutes:
1. Read: INVENTORY_SUMMARY.txt (this file, ~5 min)

### If you have 15 minutes:
1. Read: INVENTORY_SUMMARY.txt (~5 min)
2. Read: INVENTORY_QUICK_REFERENCE.md "Critical Architecture Rules" (~5 min)
3. Skim: EXISTING_INVENTORY.md table of contents (~5 min)

### If you have 30 minutes:
1. Read: INVENTORY_README.md (this guide, ~5 min)
2. Read: INVENTORY_QUICK_REFERENCE.md (~10 min)
3. Read: INVENTORY_SUMMARY.txt (~10 min)
4. Skim: EXISTING_INVENTORY.md sections you care about (~5 min)

### If you have 1 hour+:
1. Read: INVENTORY_README.md (guide, ~5 min)
2. Read: INVENTORY_QUICK_REFERENCE.md (fast reference, ~10 min)
3. Read: INVENTORY_SUMMARY.txt (big picture, ~10 min)
4. Read: EXISTING_INVENTORY.md completely (~30+ min)
5. Review: CLAUDE.md (development standards, ~15 min)

---

## Key Takeaways

**Fleet Management V2 is FEATURE-COMPLETE for core pilot management:**

✓ 20+ pages for admin dashboard and pilot portal
✓ 85+ production-ready React components
✓ 14 business logic services
✓ 11 API routes
✓ 8 database tables with proper schema
✓ 15 E2E test suites
✓ Accessibility features (WCAG compliance)
✓ PWA support (offline functionality)
✓ Dark mode and mobile responsive
✓ Complete authentication & authorization

---

## Critical Architecture Rule

**MANDATORY**: All database operations MUST go through services in `/lib/services/`

```typescript
// ❌ WRONG - Never do this
const { data } = await supabase.from('pilots').select('*')

// ✅ CORRECT - Always do this
import { getPilots } from '@/lib/services/pilot-service'
const data = await getPilots()
```

---

## Before Building Anything

### Follow This Checklist:

1. **Check if it exists**
   - Search EXISTING_INVENTORY.md for your feature
   - Use Ctrl+F to search quickly

2. **Understand the pattern**
   - Read INVENTORY_QUICK_REFERENCE.md "Architecture Pattern"
   - Service → API Route → Component

3. **Find similar code**
   - Use EXISTING_INVENTORY.md to find similar features
   - Copy existing patterns

4. **Implement correctly**
   - Create/use service first
   - Follow existing code patterns
   - Write E2E tests
   - Run `npm run validate` before committing

---

## Document Quick Links

| File | Size | Purpose | Read When |
|------|------|---------|-----------|
| EXISTING_INVENTORY.md | 32 KB | Complete reference | Need file paths or detailed info |
| INVENTORY_QUICK_REFERENCE.md | 9.3 KB | Fast lookup | Developing new features |
| INVENTORY_README.md | 10 KB | How-to guide | Confused about using inventory |
| INVENTORY_SUMMARY.txt | 13 KB | Big picture | Assessing project scope |
| CLAUDE.md | 21 KB | Dev standards | Understanding patterns |

---

## What's Already Built (Don't Duplicate!)

### Admin Dashboard
- Pilot Management (CRUD + captain qualifications)
- Certification Tracking (FAA color coding: Red/Yellow/Green)
- Leave Management (with eligibility checking)
- Analytics & Reports
- System Settings
- Check Type Management
- User Management

### Pilot Portal
- Personal Dashboard
- Certifications View
- Leave Requests
- Flight Requests
- Feedback System

### Core Infrastructure
- Authentication & Authorization
- 14 Business Logic Services
- 11 API Routes
- 8 Database Tables
- Error Handling & Validation
- Audit Logging
- Performance Caching
- Rate Limiting
- PWA/Offline Support
- Dark Mode
- Mobile Responsive
- Accessibility Features

---

## What You Can Still Add

These features are partially done or not yet built:

- Advanced filtering/search on tables
- CSV/Excel export
- Real-time collaboration
- Native mobile apps
- Machine learning analytics
- Video/document upload
- SMS/Email notifications
- Advanced reporting builder
- Third-party integrations
- Blockchain audit trail
- Advanced permission system

---

## Key Statistics

- **Pages/Routes**: 20+
- **Components**: 85+
- **API Routes**: 11
- **Services**: 14
- **Custom Hooks**: 8
- **Utility Modules**: 20+
- **Validation Schemas**: 7
- **E2E Tests**: 15
- **Database Tables**: 8
- **Database Views**: 6
- **Database Functions**: 5

---

## Project Info

- **Project**: Fleet Management V2 (B767 Pilot Management System)
- **Framework**: Next.js 15.5.4 + React 19.1.0 + TypeScript 5.7.3
- **Database**: Supabase PostgreSQL (wgdmgvonqysflwdiiols)
- **UI Library**: shadcn/ui (53 components)
- **State Management**: TanStack Query
- **Forms**: React Hook Form + Zod
- **Testing**: Playwright E2E
- **Build**: Turbopack
- **Version**: 0.1.0

---

## Business Logic You Must Know

1. **28-Day Roster Periods**: RP1-RP13 cycles
   - Anchor: RP12/2025 = 2025-10-11
   - All leave aligned to period boundaries

2. **Certification Colors** (FAA Standards):
   - 🔴 Red: Expired (0 days)
   - 🟡 Yellow: ≤30 days until expiry
   - 🟢 Green: >30 days until expiry

3. **Leave Eligibility**:
   - Minimum 10 Captains available
   - Minimum 10 First Officers available
   - Captains and First Officers evaluated separately
   - Approval by seniority number (lower = higher priority)

4. **Captain Qualifications** (JSONB):
   - line_captain (bool)
   - training_captain (bool)
   - examiner (bool)
   - rhs_captain_expiry (date)

---

## Commands You'll Use

```bash
# Development
npm run dev          # Start dev server
npm run build        # Production build
npm start           # Start prod server

# Testing
npm test            # Run E2E tests
npm run test:ui     # Open Playwright UI

# Quality
npm run validate    # Type check + lint + format check (required before commit)
npm run lint        # Run ESLint
npm run type-check  # TypeScript validation
npm run format      # Format code

# Database
npm run db:types    # Generate types from schema
npm run db:migration # Create migration
npm run db:deploy   # Deploy migrations

# Storybook
npm run storybook   # Component dev environment
npm run build-storybook  # Build static site
```

---

## Next Steps

### For New Features:
1. Check EXISTING_INVENTORY.md (does it exist?)
2. Read INVENTORY_QUICK_REFERENCE.md (where to put it)
3. Create in correct location following patterns
4. Write tests, validate, commit

### For Bug Fixes:
1. Find file in EXISTING_INVENTORY.md
2. Review patterns in INVENTORY_QUICK_REFERENCE.md
3. Fix using existing patterns
4. Test with `npm test`

### For Understanding Codebase:
1. Read INVENTORY_SUMMARY.txt (big picture)
2. Skim EXISTING_INVENTORY.md (find what interests you)
3. Read CLAUDE.md (architecture details)
4. Explore actual files in the codebase

---

## File Locations

| What | Where |
|------|-------|
| Pages | `/app/` |
| API Routes | `/app/api/` |
| Components | `/components/` |
| Services (IMPORTANT!) | `/lib/services/` |
| Custom Hooks | `/lib/hooks/` |
| Utilities | `/lib/utils/` |
| Validation Schemas | `/lib/validations/` |
| Type Definitions | `/types/` |
| E2E Tests | `/e2e/` |
| Config Files | root directory |

---

## Questions?

### Q: Does feature X already exist?
**A:** Search EXISTING_INVENTORY.md for it

### Q: Where should I put my new code?
**A:** Check INVENTORY_QUICK_REFERENCE.md "File Location Reference"

### Q: Can I call Supabase directly?
**A:** NO! Use a service from `/lib/services/`

### Q: What's the architecture pattern?
**A:** Read INVENTORY_QUICK_REFERENCE.md "Architecture Overview"

### Q: How do I run tests?
**A:** `npm test` for E2E tests

### Q: What must I do before committing?
**A:** `npm run validate` (includes lint, type check, format check)

---

## Remember

✓ Before building → Check EXISTING_INVENTORY.md
✓ Reuse existing services, components, and utilities
✓ Follow established architecture patterns
✓ Maintain business logic rules
✓ Run `npm run validate` before committing
✓ Write tests for new functionality

---

## Document Overview

```
START_HERE.md ← You are here
    ↓
INVENTORY_README.md ← How to use the inventory
    ↓
INVENTORY_QUICK_REFERENCE.md ← Fast lookup while coding
    ↓
EXISTING_INVENTORY.md ← Detailed reference
    ↓
CLAUDE.md ← Development standards & patterns
```

---

**Generated**: October 22, 2025  
**Project**: Fleet Management V2 v0.1.0  
**Ready to develop!**

---

## Start Reading Now

Choose one:

- **5 minutes?** → Read INVENTORY_SUMMARY.txt
- **15 minutes?** → Read this file + INVENTORY_QUICK_REFERENCE.md  
- **30+ minutes?** → Read all files in order above
- **Need answers?** → Check INVENTORY_README.md FAQ section

Good luck! 🚀
