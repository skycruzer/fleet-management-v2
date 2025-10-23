# /review-architecture

Analyze code changes from an architectural perspective and validate design decisions.

## When to Use

Use this command for:
- ✅ Architectural compliance reviews
- ✅ System design validation
- ✅ Component boundary checks
- ✅ Feature impact assessment
- ✅ Design pattern verification
- ✅ API specification reviews (OpenSpec)

## What It Does

Invokes the **architecture-strategist** agent which:
- Analyzes architectural decisions
- Evaluates system design changes
- Reviews component boundaries
- Validates design patterns
- Assesses feature impact on architecture
- Ensures architectural compliance
- Reviews API specifications

## Usage

```bash
/review-architecture
```

Optional: Target specific changes
```
"Review architecture of new service layer"
"Analyze impact of certification tracking feature"
"Validate API design for leave requests"
```

## Example

After major refactoring:
```
User: "Refactored authentication to use service layer"
Assistant: "Reviewing architectural changes with /review-architecture"
```

## Critical for This Project

**Service Layer Architecture:**
- ✅ Validates service layer pattern compliance
- ✅ Reviews component boundaries (services vs routes)
- ✅ Ensures proper separation of concerns
- ✅ Validates API route design

**API Design (OpenSpec):**
- ✅ Reviews API endpoint structure
- ✅ Validates RESTful patterns
- ✅ Checks OpenAPI specification compliance
- ✅ Ensures consistent API design

**System Architecture:**
- ✅ Next.js App Router patterns
- ✅ Server vs Client component boundaries
- ✅ Supabase integration architecture
- ✅ Service layer pattern enforcement

---

**Agent**: architecture-strategist
**Focus**: System Architecture & Design
**Project**: Fleet Management V2 (Service-Layer Architecture)
**Works With**: OpenSpec API specifications
