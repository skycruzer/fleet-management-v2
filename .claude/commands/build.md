---
description: Quick workflow - Analyze codebase, plan implementation, and build the feature
---

# /build - Quick Development Workflow

Execute the complete "Analyze → Plan → Implement" workflow for a feature or bug fix.

## Usage

```bash
/build <description of what to build>
```

## What This Command Does

### Step 1: Analyze (REQUIRED)

- Use Task tool with Explore agent to understand relevant codebase areas
- Identify all files, components, and dependencies involved
- Understand existing patterns and architecture
- Note any constraints or special considerations

### Step 2: Plan (REQUIRED)

- Create TodoWrite task list breaking down the work
- Design the solution architecture
- Identify all files to create/modify
- Plan database changes if needed
- Consider edge cases and error handling
- Outline testing approach

### Step 3: Implement (REQUIRED)

- Execute the plan step by step, updating todos as you go
- Follow existing code patterns and conventions
- Use service layer for all database operations (MANDATORY)
- Test thoroughly after implementation
- Run quality checks (npm run validate)
- Update documentation as needed

## Examples

```bash
# New feature
/build Add vehicle status tracking to the fleet dashboard

# Bug fix
/build Fix the certification expiry date calculation bug

# Enhancement
/build Improve the pilot search with filters for rank and status

# Database change
/build Add a new table for flight hours tracking
```

## Important Rules

1. **ALWAYS analyze first** - Never skip codebase exploration
2. **ALWAYS plan before coding** - Create task list and design
3. **Use service layer** - All DB ops go through lib/services/
4. **Follow patterns** - Match existing code style and architecture
5. **Test thoroughly** - Verify your changes work
6. **Mark todos complete** - Update task list as you progress

## Quality Gates

Before marking implementation complete:

- ✅ All todos marked as completed
- ✅ Code follows project conventions
- ✅ All database operations use service layer
- ✅ TypeScript compilation succeeds (npm run type-check)
- ✅ ESLint passes (npm run lint)
- ✅ Changes tested and verified
- ✅ Documentation updated if needed

---

**This command follows the global standards in CLAUDE.md and ensures high-quality implementation.**
