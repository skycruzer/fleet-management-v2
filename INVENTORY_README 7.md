# Fleet Management V2 - Inventory Documentation

## Overview

This directory contains a comprehensive inventory of all existing features, components, services, and pages in the Fleet Management V2 project. Use these documents to avoid duplicating work and to understand the existing codebase architecture.

---

## Three Inventory Documents

### 1. EXISTING_INVENTORY.md (32 KB - Detailed Reference)

**Best for:** Detailed research, understanding specific systems, finding exact file paths

**Contains:**
- Complete listing of all pages and routes (20+ pages)
- All 85+ components with descriptions
- All 11 API routes with details
- All 14 services with their functions
- All 8 custom hooks
- 20+ utility modules
- 7 Zod validation schemas
- 15 E2E test files
- Complete database schema (8 tables + 6 views + 5 functions)
- Business logic rules and patterns
- Architecture overview

**Usage:**
```
Read this when you need to:
- Find exact file paths
- Understand what a specific service does
- See complete API route documentation
- Check database schema details
- Understand business logic rules
```

---

### 2. INVENTORY_QUICK_REFERENCE.md (9.3 KB - Fast Lookup)

**Best for:** Quick lookups while developing, command reference, architecture reminders

**Contains:**
- Quick tables of pages by section
- Component counts by category
- API routes quick reference
- Services list
- Hooks reference
- Validation schemas
- E2E test files
- Database table overview
- Business logic rules summary
- Command cheat sheet
- Don't duplicate checklist
- Architecture pattern overview

**Usage:**
```
Use this when you need to:
- Quickly find a command
- Remember how many components exist
- Recall the business logic rules
- Check if something already exists
- Find a file location quickly
```

---

### 3. INVENTORY_SUMMARY.txt (This file level)

**Best for:** Big picture overview, statistics, project assessment

**Contains:**
- Project statistics and counts
- Major feature coverage checklist
- File location reference
- Critical architecture rules
- What's already built
- What's not yet built
- Key takeaways
- Next steps for development

**Usage:**
```
Use this when you need to:
- Get a bird's eye view of the project
- Understand project scope
- See what's built vs. not built
- Remember critical architecture rules
- Get oriented before starting new work
```

---

## Quick Start Guide

### Before you build anything:

1. **First**: Check if it already exists
   ```bash
   # Ctrl+F in EXISTING_INVENTORY.md for your feature
   # Look for the exact name or functionality
   ```

2. **Second**: Understand the architecture
   ```bash
   # Read INVENTORY_QUICK_REFERENCE.md → "Architecture Pattern"
   # Remember: Service Layer + API Routes + Components
   ```

3. **Third**: Locate similar existing code
   ```bash
   # Use EXISTING_INVENTORY.md to find similar features
   # Copy structure and patterns from existing code
   ```

4. **Fourth**: Follow the pattern
   ```bash
   # Service → API Route → Component
   # Use existing services instead of creating new Supabase calls
   ```

---

## Project Statistics at a Glance

| Category | Count | Status |
|----------|-------|--------|
| Pages/Routes | 20+ | Complete |
| Components | 85+ | Complete |
| API Routes | 11 | Complete |
| Services | 14 | Complete |
| Custom Hooks | 8 | Complete |
| Utility Modules | 20+ | Complete |
| Validation Schemas | 7 | Complete |
| E2E Tests | 15 | Complete |
| Database Tables | 8 | Complete |
| Database Views | 6 | Complete |
| Database Functions | 5 | Complete |

---

## Critical Architecture Rules (MUST KNOW)

### Rule #1: Service Layer is Mandatory
```
❌ WRONG:
const { data } = await supabase.from('pilots').select('*')

✅ CORRECT:
import { getPilots } from '@/lib/services/pilot-service'
const data = await getPilots()
```

### Rule #2: Three Supabase Clients
```
lib/supabase/client.ts      ← Client Components ('use client')
lib/supabase/server.ts      ← Server Components & API Routes
lib/supabase/middleware.ts  ← middleware.ts only
```

### Rule #3: Maintain Business Logic
```
- 28-day roster periods (RP1-RP13, anchor: RP12/2025 = 2025-10-11)
- Certifications: Red (0 days) / Yellow (30 days) / Green (30+ days)
- Leave eligibility: Min 10 Captains + 10 First Officers per rank
- Rank separation: Captains and First Officers evaluated independently
- Seniority priority: Lower number = higher priority in approvals
- Captain qualifications: JSONB with 4 fields (line_captain, training_captain, examiner, rhs_captain_expiry)
```

---

## What's Already Built

### Admin Dashboard (100% Complete)
- Pilot Management (CRUD + captain qualifications)
- Certification Tracking (with FAA color coding)
- Leave Management (with eligibility checking)
- Analytics & Reports
- System Settings
- Check Type Management
- User Management

### Pilot Portal (100% Complete)
- Personal Dashboard
- Certifications View
- Leave Requests
- Flight Requests
- Feedback System

### Core Infrastructure (100% Complete)
- Authentication & Authorization
- Service Layer (14 services)
- API Routes (11 routes)
- Database Schema (8 tables)
- Error Handling
- Validation (Zod)
- Audit Logging
- Performance Caching
- Rate Limiting
- PWA Support
- Accessibility Features
- Dark Mode
- Mobile Responsive

---

## What's NOT Built (Enhancement Opportunities)

- Advanced filtering/search (partially done)
- CSV/Excel export (partially done)
- Real-time collaboration
- Native mobile apps
- Advanced analytics
- ML-based predictions
- Video/document upload
- SMS notifications
- Email notifications (partially)
- Advanced reporting builder
- Third-party integrations
- Blockchain audit trail
- Advanced permission system

---

## File Location Quick Reference

| What | Where |
|------|-------|
| Pages | `/app/` |
| API Routes | `/app/api/` |
| Components | `/components/` |
| Services | `/lib/services/` |
| Hooks | `/lib/hooks/` |
| Utilities | `/lib/utils/` |
| Validation | `/lib/validations/` |
| Types | `/types/` |
| Tests | `/e2e/` |
| Styles | `/styles/` or Tailwind inline |
| Database | Supabase (wgdmgvonqysflwdiiols) |

---

## Development Workflow

### To Add a New Feature:

1. **Research** → Check EXISTING_INVENTORY.md
2. **Understand** → Read INVENTORY_QUICK_REFERENCE.md
3. **Plan** → Write out the feature plan
4. **Implement Order**:
   - Create service (if DB ops needed) → `/lib/services/`
   - Create validation schema → `/lib/validations/`
   - Create API route → `/app/api/`
   - Create components → `/components/`
   - Create page/route → `/app/`
   - Create E2E tests → `/e2e/`
5. **Validate** → `npm run validate`
6. **Test** → `npm test`

---

## Common Questions

### Q: Does this feature already exist?
**A:** Search EXISTING_INVENTORY.md for the feature name

### Q: Where should I put my new component?
**A:** Check the directory structure in INVENTORY_QUICK_REFERENCE.md, then place it in the appropriate `/components/` subdirectory

### Q: Can I call Supabase directly in my API route?
**A:** NO! Use a service from `/lib/services/` instead

### Q: Which Supabase client should I use?
**A:** Check INVENTORY_QUICK_REFERENCE.md → "Three Supabase Clients"

### Q: What commands should I run before committing?
**A:** Run `npm run validate` (includes lint, format check, and type check)

### Q: How do I understand the business logic?
**A:** See "Critical Architecture Rules" in INVENTORY_QUICK_REFERENCE.md

### Q: Can I create a new API route for pilots?
**A:** NO! `/api/pilots` already exists. Add functions to the service instead.

---

## How to Use These Documents

### Scenario 1: Starting a New Feature
```
1. Read: INVENTORY_SUMMARY.txt (context)
2. Search: EXISTING_INVENTORY.md (does it exist?)
3. Check: INVENTORY_QUICK_REFERENCE.md (where to put it)
4. Review: CLAUDE.md (development standards)
```

### Scenario 2: Need to Fix a Bug
```
1. Use: EXISTING_INVENTORY.md (find the file)
2. Check: INVENTORY_QUICK_REFERENCE.md (related files)
3. Follow: CLAUDE.md (testing requirements)
```

### Scenario 3: Adding to Existing Feature
```
1. Search: EXISTING_INVENTORY.md (find the feature)
2. Review: File path documentation
3. Check: INVENTORY_QUICK_REFERENCE.md (similar patterns)
4. Implement: Following existing patterns
```

### Scenario 4: Want to Understand a Service
```
1. Find: Service name in EXISTING_INVENTORY.md
2. Check: All exported functions listed
3. Find: File path in INVENTORY_QUICK_REFERENCE.md
4. Read: The service file itself for details
```

---

## Key Files to Read Next

1. **CLAUDE.md** (21 KB)
   - Development standards
   - Architecture patterns
   - Complete API documentation
   - Business logic rules in detail
   - Development workflow
   - Troubleshooting guide

2. **EXISTING_INVENTORY.md** (32 KB)
   - Detailed reference
   - Every file documented
   - Complete database schema
   - All services listed with functions

3. **INVENTORY_QUICK_REFERENCE.md** (9.3 KB)
   - Fast lookup tables
   - Command reference
   - Architecture overview
   - Don't duplicate checklist

---

## Project Information

**Project:** Fleet Management V2 - B767 Pilot Management System
**Framework:** Next.js 15.5.4 + React 19.1.0 + TypeScript 5.7.3
**Database:** Supabase PostgreSQL (Project: wgdmgvonqysflwdiiols)
**Build System:** Turbopack
**Styling:** Tailwind CSS 4.1.0
**UI Components:** shadcn/ui (53 components)
**State Management:** TanStack Query 5.90.2
**Form Handling:** React Hook Form 7.65.0 + Zod 4.1.12
**Testing:** Playwright 1.55.0
**Component Docs:** Storybook 8.5.11
**PWA:** Serwist 9.2.1

---

## Version & Date

- **Inventory Created:** October 22, 2025
- **Fleet Management V2 Version:** 0.1.0
- **Last Updated:** October 22, 2025
- **Maintainer:** Maurice (Skycruzer)

---

## Next Steps

1. **For new development**: Start with INVENTORY_QUICK_REFERENCE.md
2. **For detailed info**: Refer to EXISTING_INVENTORY.md
3. **For architecture**: Read CLAUDE.md
4. **For commands**: Check INVENTORY_QUICK_REFERENCE.md or CLAUDE.md

---

**Remember:** Before building anything, check if it already exists. Reuse existing code, patterns, and services. This saves time and keeps the codebase consistent.

Good luck with your development!
