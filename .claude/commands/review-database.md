# /review-database

Review database migrations, models, and data operations for integrity.

## When to Use

Use this command for:

- Database migration reviews
- Schema change validation
- Data model updates
- Service layer database operations
- Transaction boundary verification
- RLS policy reviews

## What It Does

Invokes the **data-integrity-guardian** agent which:

- Reviews database migrations for safety
- Validates data constraints
- Ensures transaction boundaries are correct
- Verifies referential integrity
- Checks privacy requirements
- Validates Supabase RLS policies
- Reviews service layer database operations

## Usage

```bash
/review-database
```

Optional: Target specific changes

```
"Review the new pilot certification migration"
"Check data integrity for leave request updates"
"Validate RLS policies for pilot data"
```

## Example

After creating a migration:

```
You: "Created migration to add qualifications column"
Assistant: "Reviewing migration safety with /review-database"
```

## Critical for This Project

- ✅ Service layer pattern compliance (lib/services/)
- ✅ Supabase migration safety
- ✅ RLS policy correctness
- ✅ Data constraint validation
- ✅ Transaction handling in services
- ✅ Foreign key integrity

**REMEMBER**: All database operations MUST use service layer!

---

**Agent**: data-integrity-guardian
**Focus**: Database Safety & Integrity
**Project**: Fleet Management V2 (Supabase Production DB: wgdmgvonqysflwdiiols)
