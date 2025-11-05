# Fleet Management V2 - OpenSpec Documentation

**OpenSpec Version**: 1.0
**Project**: Fleet Management V2 (B767 Pilot Management System)
**Initialized**: October 22, 2025

---

## What is OpenSpec?

OpenSpec is a **spec-driven development workflow** that separates:
- **What IS built** (`specs/`) - Existing capabilities and their requirements
- **What SHOULD change** (`changes/`) - Proposed changes with deltas

This ensures:
- Clear requirements before implementation
- Traceable changes to existing functionality
- Validation of proposals before coding
- Living documentation that stays up-to-date

---

## Directory Structure

```
openspec/
├── README.md                 # This file
├── project.md                # System overview and context
├── specs/                    # Capability specifications (what IS built)
│   └── (empty - specs created via changes/)
├── changes/                  # Active change proposals (what SHOULD change)
│   └── add-missing-core-features/
│       ├── proposal.md       # Why, What, Impact
│       ├── tasks.md          # Implementation checklist
│       ├── design.md         # Technical architecture
│       ├── data-model.md     # Database schema
│       ├── research.md       # Background research
│       ├── quickstart.md     # Quick reference
│       └── specs/            # Spec deltas (ADDED/MODIFIED/REMOVED)
│           ├── pilot-portal/spec.md
│           ├── flight-requests/spec.md
│           ├── audit-logging/ (TODO)
│           ├── task-management/ (TODO)
│           ├── disciplinary-tracking/ (TODO)
│           ├── feedback-community/ (TODO)
│           └── pilot-registration/ (TODO)
└── changes/archive/          # Completed and deployed changes
    └── (empty - changes move here after deployment)
```

---

## Quick Start

### List Active Changes
```bash
openspec list
```

### View Change Details
```bash
openspec show add-missing-core-features
```

### Validate Change
```bash
openspec validate add-missing-core-features --strict
```

### Show Spec Deltas
```bash
openspec diff add-missing-core-features
```

### View Project Context
```bash
cat openspec/project.md
```

---

## Current Changes

### `add-missing-core-features` (ACTIVE)

**Status**: Draft
**Priority**: P1 (Critical - Core Functionality)
**Created**: 2025-10-22

**Summary**: Add 7 missing capability areas from air-niugini-pms reference system:
1. Pilot Portal (8 pages) - Self-service access
2. Flight Request System - Pilot submissions + admin approval
3. Audit Logging - Compliance tracking
4. Task Management - Kanban + assignment
5. Disciplinary Tracking - HR matter management
6. Feedback Community - Pilot discussions
7. Pilot Registration - Self-registration with approval

**Impact**:
- 8 new database tables
- 8 new services
- 15+ API routes
- 20+ UI pages
- 30+ components

**Timeline**: 4-5 weeks (phased rollout)

**Validation**: ✅ Passes `openspec validate --strict`

**Files**:
- `changes/add-missing-core-features/proposal.md` - Full proposal
- `changes/add-missing-core-features/tasks.md` - 150 implementation tasks
- `changes/add-missing-core-features/design.md` - Technical architecture
- `changes/add-missing-core-features/specs/pilot-portal/spec.md` - Pilot portal requirements
- `changes/add-missing-core-features/specs/flight-requests/spec.md` - Flight request requirements

---

## OpenSpec Workflow

### 1. Create Change Proposal

**When**: Adding features, breaking changes, architecture modifications

**Process**:
```bash
# Create change directory
mkdir -p openspec/changes/<change-id>

# Create required files
touch openspec/changes/<change-id>/proposal.md
touch openspec/changes/<change-id>/tasks.md

# Create spec delta directories
mkdir -p openspec/changes/<change-id>/specs/<capability>
touch openspec/changes/<change-id>/specs/<capability>/spec.md
```

**Proposal Template**:
```markdown
# Change Proposal: <Title>

**Change ID**: `<change-id>`
**Created**: YYYY-MM-DD
**Status**: Draft
**Priority**: P1/P2/P3

## Why This Change?
[Problem statement, business impact]

## What Changes?
[Summary of changes]

## Impact Analysis
[Affected capabilities, database, services, API, UI, testing]

## Risks & Mitigation
[Identified risks and mitigation strategies]

## Timeline Estimate
[Effort estimate and milestones]
```

### 2. Write Spec Deltas

**Format**: Each affected capability gets a delta file in `changes/<change-id>/specs/<capability>/spec.md`

**Delta Operations**:
- `## ADDED Requirements` - New requirements
- `## MODIFIED Requirements` - Changed requirements (include COMPLETE updated requirement)
- `## REMOVED Requirements` - Deleted requirements (with reason and migration)
- `## RENAMED Requirements` - Renamed requirements (FROM/TO format)

**Requirement Format**:
```markdown
### Requirement: Feature Name

The system SHALL provide [normative requirement].

**Rationale**: Why this requirement exists.

**Business Rules**:
- MUST/SHALL for mandatory rules
- SHOULD for recommendations

#### Scenario: Success Case

- **WHEN** user performs action
- **AND** additional condition
- **THEN** expected result
- **AND** additional result
```

### 3. Validate Change

**Before Implementation**:
```bash
openspec validate <change-id> --strict
```

**Fix Errors**:
- "Change must have at least one delta" → Add spec delta files
- "Requirement must have at least one scenario" → Add `#### Scenario:` sections
- "Invalid scenario format" → Use exact format: `#### Scenario: Name`

### 4. Implement Change

**Process**:
1. Read `proposal.md` for context
2. Read `design.md` for architecture (if exists)
3. Read `tasks.md` for implementation checklist
4. Implement incrementally, marking tasks `- [x]` as completed
5. DO NOT mark tasks complete until fully implemented

### 5. Archive Change

**After Deployment**:
```bash
openspec archive <change-id> --yes
```

**Manual Archive**:
```bash
mkdir -p openspec/changes/archive/YYYY-MM-DD-<change-id>
mv openspec/changes/<change-id>/* openspec/changes/archive/YYYY-MM-DD-<change-id>/
```

**Update Specs**:
- Merge deltas from `changes/<id>/specs/` into `openspec/specs/`
- Create permanent capability specs for new capabilities

---

## Spec Delta Format Reference

### ADDED Requirements

```markdown
## ADDED Requirements

### Requirement: New Feature

The system SHALL provide [capability].

#### Scenario: Success Case
- **WHEN** condition
- **THEN** result
```

### MODIFIED Requirements

```markdown
## MODIFIED Requirements

### Requirement: Existing Feature

[COMPLETE updated requirement with ALL scenarios]

**Changes from Previous**:
- Added: X
- Modified: Y
- Removed: Z
```

### REMOVED Requirements

```markdown
## REMOVED Requirements

### Requirement: Old Feature

**Reason**: Why removing (e.g., "Replaced by new feature", "No longer needed")
**Migration**: How to handle existing usage (e.g., "Data migrated to new table", "No action required")
```

### RENAMED Requirements

```markdown
## RENAMED Requirements

- FROM: `### Requirement: Old Name`
- TO: `### Requirement: New Name`

**Reason**: Why renamed
```

---

## Decision Tree: To Spec or Not to Spec?

### ✅ Create Change Proposal (Spec Required)

- New features or capabilities
- Breaking changes to existing features
- Database schema changes
- Business logic modifications
- Architecture changes
- API contract changes
- When unclear → CREATE PROPOSAL (safer)

### ❌ Fix Directly (No Spec Required)

- Bug fixes restoring spec behavior
- Typos, formatting, comments
- Performance optimizations (non-breaking)
- Dependency updates
- Documentation improvements

---

## Common Commands Reference

```bash
# List commands
openspec list                     # Active changes
openspec list --specs             # Existing capabilities
openspec spec list --long         # Detailed spec list

# Show details
openspec show <change-id>         # Show change details
openspec show <spec-id> --type spec  # Show spec details
openspec show <item> --json       # Machine-readable output

# Validation
openspec validate <change-id> --strict  # Validate change
openspec validate --strict        # Bulk validation

# Diff and archive
openspec diff <change-id>         # Show spec differences
openspec archive <change-id> --yes  # Archive completed change

# Search
rg -n "Requirement:" openspec/specs  # Find requirements
rg -n "Scenario:" openspec/specs     # Find scenarios
```

---

## Best Practices

### 1. Simplicity First
- Default to <100 lines of new code
- Single-file implementations until proven insufficient
- Avoid frameworks without clear justification

### 2. Clear References
- Use `file.ts:42` format for code locations
- Reference specs as `specs/auth/spec.md`
- Link related changes and PRs

### 3. Capability Naming
- Use verb-noun: `user-auth`, `payment-capture`
- Single purpose per capability
- 10-minute understandability rule

### 4. Change ID Naming
- Kebab-case, short and descriptive
- Verb-led prefixes: `add-`, `update-`, `remove-`, `refactor-`
- Examples: `add-pilot-portal`, `refactor-leave-eligibility`, `remove-legacy-auth`

### 5. Scenario Format (CRITICAL)
- Exact format required: `#### Scenario: Name` (4 hashtags)
- Use WHEN/THEN format
- Don't use bullet points or bold for scenario headers
- Debug with: `openspec show <change-id> --json --deltas-only`

---

## Troubleshooting

### "Change must have at least one delta"
- Check `changes/<id>/specs/` exists with `.md` files
- Verify files have operation prefixes (`## ADDED Requirements`, etc.)

### "Requirement must have at least one scenario"
- Check scenarios use `#### Scenario:` format (4 hashtags)
- Don't use bullet points or bold for scenario headers

### Silent scenario parsing failures
- Exact format required: `#### Scenario: Name`
- Debug with: `openspec show <change-id> --json --deltas-only`

### Validation fails on existing change
- Run `openspec validate <change-id> --strict`
- Fix all reported errors before continuing

---

## Resources

### Internal Documentation
- [openspec/project.md](./project.md) - System overview and architecture
- [CLAUDE.md](../CLAUDE.md) - Development guidelines (448 lines)
- [README.md](../README.md) - Project setup and commands

### OpenSpec Resources
- OpenSpec CLI: `openspec --help`
- Validation: `openspec validate --strict`

---

## Status Summary

**Active Changes**: 1
- `add-missing-core-features` (Draft, P1, 0/150 tasks)

**Completed Changes**: 0

**Total Capabilities**: 0 (specs will be created from completed changes)

---

**OpenSpec Initialized**: October 22, 2025
**Maintainer**: Maurice (Skycruzer)
**Project**: Fleet Management V2 - B767 Pilot Management System
