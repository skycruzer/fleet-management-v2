# Leave Request System - Documentation Index

Complete reference documentation for the Fleet Management V2 leave request system.

## Quick Navigation

### For Quick Lookup
Start here if you need a quick answer:
- **File**: `LEAVE-REQUEST-QUICK-REFERENCE.md` (342 lines)
- **Contains**: File locations, interfaces, functions, business rules, API endpoints, validation rules, common tasks, testing checklist

### For Deep Understanding
Read this for comprehensive architecture knowledge:
- **File**: `LEAVE-REQUEST-SYSTEM-OVERVIEW.md` (1064 lines)
- **Contains**: Complete system overview, database schema, service layer architecture, API routes, UI components, validation, business rules, authentication, error handling, data flows

### For Development Workflow
Reference this for structure and dependencies:
- **File**: `LEAVE-REQUEST-FILE-STRUCTURE.txt` (204 lines)
- **Contains**: Directory tree, file dependencies, data flow examples, dependency graph, key patterns

---

## Document Details

### 1. LEAVE-REQUEST-QUICK-REFERENCE.md
**Purpose**: Fast lookup guide for developers  
**Best For**: Implementation, debugging, quick answers  
**Length**: ~342 lines

**Sections**:
- File Locations (organized by type: services, validation, API, pages, components)
- Key Interfaces (LeaveRequest, LeaveEligibilityCheck, ConflictingRequest)
- Service Function Reference (categorized by service)
- Business Rules Cheat Sheet
- API Endpoints Quick Reference
- Validation Rules Quick Check
- Common Tasks (step-by-step walkthroughs)
- Error Handling
- Testing Checklist
- Key Takeaways (10 critical points)

**Use When**:
- Implementing a new feature
- Debugging an issue
- Looking up an API endpoint
- Remembering validation rules
- Following a workflow

---

### 2. LEAVE-REQUEST-SYSTEM-OVERVIEW.md
**Purpose**: Comprehensive architecture documentation  
**Best For**: Understanding the system, planning changes, onboarding  
**Length**: ~1064 lines

**Sections**:
1. System Overview (purpose, key statistics)
2. Database Schema (table structure, indexes, constraints, relations)
3. Service Layer Architecture (3 services with detailed interfaces and functions)
4. API Routes (admin, pilot portal, legacy)
5. UI Components & Pages (structure, component types, features)
6. Validation & Type Safety (schemas, validation rules, type exports)
7. Business Rules & Logic (roster periods, crew minimums, seniority, conflicts, late requests, request methods)
8. Authentication & Authorization (layers, patterns)
9. Error Handling (custom types, standard responses, error messages)
10. Data Flow (4 major workflows with diagrams)
11. Summary Matrix (quick facts table)

**Use When**:
- Onboarding to the project
- Planning architectural changes
- Understanding complex business rules
- Learning about the system design
- Explaining to stakeholders
- Deep debugging of complex issues

---

### 3. LEAVE-REQUEST-FILE-STRUCTURE.txt
**Purpose**: Visual reference of file organization and dependencies  
**Best For**: Understanding relationships, following code paths  
**Length**: ~204 lines

**Sections**:
1. File Structure Tree (organized by layer: services, validation, API, pages, components, types, database)
2. Data Flow Examples (4 major workflows)
3. Dependency Graph (visual flow from UI to database)
4. Key Patterns (10 architectural patterns used)

**Use When**:
- Finding where code should go
- Understanding component relationships
- Tracing data flow through the system
- Checking dependencies before refactoring
- Visualizing the architecture

---

## Key Information by Topic

### If You Need to Know About...

#### Database
- Read: **OVERVIEW** → Database Schema section
- Then: **QUICK-REF** → Key Interfaces section

#### Services
- Read: **OVERVIEW** → Service Layer Architecture section
- Then: **QUICK-REF** → Service Function Reference section
- Also: **FILE-STRUCTURE** → Dependency Graph section

#### API Routes
- Read: **QUICK-REF** → API Endpoints Quick Reference
- Then: **FILE-STRUCTURE** → Data Flow Examples
- Deep: **OVERVIEW** → API Routes section

#### UI Components
- Read: **FILE-STRUCTURE** → File Structure Tree (components section)
- Then: **QUICK-REF** → Key Interfaces
- Deep: **OVERVIEW** → UI Components & Pages section

#### Business Rules
- Read: **QUICK-REF** → Business Rules Cheat Sheet
- Deep: **OVERVIEW** → Business Rules & Logic section
- Specific: **OVERVIEW** → Data Flow section for examples

#### Validation
- Read: **QUICK-REF** → Validation Rules Quick Check
- Then: **OVERVIEW** → Validation & Type Safety section
- Code: See validation files directly

#### Authorization
- Read: **OVERVIEW** → Authentication & Authorization section
- Patterns: **QUICK-REF** → Key Takeaways (#1, #10)

#### Error Handling
- Read: **QUICK-REF** → Error Handling section
- Deep: **OVERVIEW** → Error Handling section

#### Implementation Steps
- Read: **QUICK-REF** → Common Tasks section
- Technical: **FILE-STRUCTURE** → Data Flow Examples

---

## Cross-References

### Leave Service (leave-service.ts)
- QUICK-REF: Service Function Reference section
- OVERVIEW: Service Layer Architecture → Section 1
- FILE-STRUCTURE: Dependency Graph (top left)

### Leave Eligibility Service (leave-eligibility-service.ts)
- QUICK-REF: Business Rules Cheat Sheet + Service Function Reference
- OVERVIEW: Service Layer Architecture → Section 2 + Business Rules & Logic
- FILE-STRUCTURE: Dependency Graph + Data Flow Examples

### Validation Schemas
- QUICK-REF: Validation Rules Quick Check
- OVERVIEW: Validation & Type Safety section
- See files directly: lib/validations/

### API Routes
- QUICK-REF: API Endpoints Quick Reference
- OVERVIEW: API Routes section
- FILE-STRUCTURE: Data Flow Examples

### Components
- QUICK-REF: File Locations (components section)
- OVERVIEW: UI Components & Pages section
- FILE-STRUCTURE: File Structure Tree (components section)

### Business Rules
- QUICK-REF: Business Rules Cheat Sheet
- OVERVIEW: Business Rules & Logic section
- FILE-STRUCTURE: Key Patterns (✓ items)

---

## Reading Paths

### For New Team Members
1. Start: LEAVE-REQUEST-QUICK-REFERENCE.md (all sections)
2. Deep-dive: LEAVE-REQUEST-SYSTEM-OVERVIEW.md (sections 1-2, 7)
3. Build understanding: LEAVE-REQUEST-FILE-STRUCTURE.txt (dependency graph)
4. Practice: QUICK-REF → Common Tasks section

**Time**: ~2-3 hours

### For Implementing a Feature
1. Start: QUICK-REF → Key Interfaces + Common Tasks
2. Reference: OVERVIEW → relevant sections (Business Rules, API Routes, etc.)
3. Build: Use FILE-STRUCTURE → Dependency Graph to understand relationships
4. Test: QUICK-REF → Testing Checklist

**Time**: Varies by complexity

### For Debugging an Issue
1. Quick lookup: QUICK-REF → Error Handling + Validation Rules
2. Service investigation: OVERVIEW → Service Layer Architecture
3. Data flow: FILE-STRUCTURE → Data Flow Examples matching your scenario
4. Reference: OVERVIEW → Database Schema + Business Rules

**Time**: 15-60 minutes

### For Code Review
1. Checklist: QUICK-REF → Key Takeaways (10 points)
2. Patterns: FILE-STRUCTURE → Key Patterns section
3. Validation: QUICK-REF → Validation Rules Quick Check
4. Business Rules: QUICK-REF → Business Rules Cheat Sheet

**Time**: 10-30 minutes per review

---

## Documentation Stats

| Document | Lines | Sections | Tables | Code Examples |
|----------|-------|----------|--------|--------------|
| Quick Reference | 342 | 10 | 4 | ~30 |
| Overview | 1064 | 10 | 1 | ~50 |
| File Structure | 204 | 4 | 0 | 0 |
| **Total** | **1610** | **24** | **5** | **~80** |

---

## Maintenance Notes

### When to Update Documentation

- **Add new service**: Update both QUICK-REF and OVERVIEW
- **Change API endpoint**: Update QUICK-REF → API Endpoints
- **Modify business rule**: Update QUICK-REF → Business Rules + OVERVIEW → Business Rules & Logic
- **Refactor components**: Update FILE-STRUCTURE → File Structure Tree
- **Add new validation**: Update QUICK-REF → Validation Rules
- **Major architecture change**: Update all three documents

### Version History

- **Created**: October 26, 2025
- **Last Updated**: October 26, 2025
- **Author**: Claude Code (Anthropic)
- **Status**: Complete & Comprehensive

---

## Quick Links to Code

### Services
```
lib/services/leave-service.ts                  → CORE operations
lib/services/leave-eligibility-service.ts      → Complex logic
lib/services/pilot-leave-service.ts            → Pilot wrapper
```

### Validation
```
lib/validations/leave-validation.ts            → Admin schemas
lib/validations/pilot-leave-schema.ts          → Pilot schemas
```

### API Routes
```
app/api/leave-requests/route.ts                → Admin routes
app/api/leave-requests/[id]/review/route.ts    → Review endpoint
app/api/portal/leave-requests/route.ts         → Pilot portal routes
app/api/pilot/leave/route.ts                   → Legacy pilot routes
```

### Pages
```
app/dashboard/leave/page.tsx                   → Admin main page
app/portal/(protected)/leave-requests/page.tsx → Pilot list
```

### Components
```
components/leave/leave-requests-client.tsx     → Admin filtering
components/leave/leave-request-group.tsx       → Request group
components/leave/leave-review-modal.tsx        → Review modal
components/forms/leave-request-form.tsx        → Admin form
components/portal/leave-request-form.tsx       → Pilot form
```

---

## Summary

This documentation provides three complementary views of the leave request system:

1. **QUICK-REF**: For looking things up quickly
2. **OVERVIEW**: For deep understanding
3. **FILE-STRUCTURE**: For architectural clarity

Together, they form a complete reference that covers every aspect of the leave request system from database to UI, with detailed code examples and workflows.

**Start here**: LEAVE-REQUEST-QUICK-REFERENCE.md for immediate needs, then explore OVERVIEW for deeper understanding.

---

**Generated**: October 26, 2025  
**For**: Fleet Management V2 - B767 Pilot Management System  
**Status**: Complete & Ready for Use
