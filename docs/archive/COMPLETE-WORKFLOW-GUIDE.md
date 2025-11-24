# Complete Workflow & Agent Reference Guide
**Fleet Management V2 - B767 Pilot Management System**
**Generated**: October 24, 2025
**Author**: John (PM Agent) for Maurice

---

## Table of Contents

1. [Overview](#overview)
2. [BMAD Method Workflow](#bmad-method-workflow)
3. [OpenSpec Workflow](#openspec-workflow)
4. [Specify/SpecKit Workflow](#specifyspeckit-workflow)
5. [Compounding Engineering Agents](#compounding-engineering-agents)
6. [Claude Code Slash Commands](#claude-code-slash-commands)
7. [Workflow Comparison Matrix](#workflow-comparison-matrix)
8. [Best Practices & When to Use](#best-practices--when-to-use)

---

## Overview

Your Fleet Management V2 project has **FOUR integrated workflow systems** for development:

| Workflow System | Purpose | Best For |
|----------------|---------|----------|
| **BMAD Method** | Business analysis, documentation, and agent orchestration | PRDs, epics, stories, requirements gathering |
| **OpenSpec** | Change proposal and specification management | Major architectural changes, new features |
| **Specify/SpecKit** | Feature specification and implementation workflow | End-to-end feature development from idea to code |
| **Compounding Engineering** | Code quality, review, and optimization | Code review, performance optimization, security audits |

---

## BMAD Method Workflow

### Overview
**BMAD (Business Modeling and Development)** - Comprehensive business analysis and product management framework.

### Available Agents

#### Core Agents (Located in `.bmad-core/agents/`)

1. **BMad Master** 🧙 (`/BMad:agents:bmad-master`)
   - Master orchestrator and workflow executor
   - Commands:
     - `*help` - Show menu
     - `*list-tasks` - List all available tasks
     - `*list-workflows` - List all workflows
     - `*party-mode` - Group chat with all agents
     - `*exit` - Exit mode

2. **Product Manager** 📋 (`/BMad:agents:pm`)
   - PRD creation and product strategy
   - Commands:
     - `*help` - Show command list
     - `*correct-course` - Execute course correction
     - `*create-brownfield-epic` - Create epic for existing project
     - `*create-brownfield-prd` - Create brownfield PRD
     - `*create-brownfield-story` - Create user story for brownfield
     - `*create-epic` - Create epic
     - `*create-prd` - Create greenfield PRD
     - `*create-story` - Create user story
     - `*doc-out` - Output document to file
     - `*shard-prd` - Split PRD into sections
     - `*yolo` - Toggle fast execution mode
     - `*exit` - Exit PM mode

3. **Analyst** 📊 (`/BMad:agents:analyst`)
   - Data analysis and requirements research
   - Market research and competitive analysis

4. **UX Expert** 🎨 (`/BMad:agents:ux-expert`)
   - User experience design and usability
   - Interface design and user flow optimization

### BMAD Workflows

Located in `.bmad-core/workflows/`:

1. **Brainstorming Workflow**
   - File: `workflows/brainstorming/workflow.yaml`
   - Purpose: Interactive brainstorming sessions with diverse creative techniques
   - Output: `docs/brainstorming-session-results-{date}.md`
   - Features:
     - Multiple brainstorming techniques from `brain-methods.csv`
     - Advanced elicitation methods
     - Interactive facilitation

2. **Party Mode Workflow**
   - File: `workflows/party-mode/workflow.yaml`
   - Purpose: Group chat with all BMAD agents
   - Use case: Complex problems requiring multi-perspective analysis

### BMAD Tasks & Templates

**Tasks** (`.bmad-core/tasks/`):
- `brownfield-create-epic.md` - Create epic for existing projects
- `brownfield-create-story.md` - Create user story for brownfield
- `create-doc.md` - Generic document creation
- `execute-checklist.md` - Run quality checklists
- `shard-doc.md` - Split large documents
- `correct-course.md` - Project alignment
- `apply-qa-fixes.md` - Apply QA corrections
- `validate-next-story.md` - Story validation

**Templates** (`.bmad-core/templates/`):
- `prd-tmpl.yaml` - Product Requirements Document (greenfield)
- `brownfield-prd-tmpl.yaml` - PRD for existing systems
- `story-tmpl.yaml` - User story template

**Checklists** (`.bmad-core/checklists/`):
- `pm-checklist.md` - Product management checklist
- `change-checklist.md` - Change management checklist
- `story-dod-checklist.md` - Story Definition of Done
- `story-draft-checklist.md` - Story draft validation

### How to Use BMAD

```bash
# 1. Activate PM agent
/BMad:agents:pm

# 2. Use numbered commands (wait for prompt)
1  # Shows help
3  # Creates brownfield PRD

# 3. Or use direct commands
*create-brownfield-prd
*create-story
*shard-prd
```

---

## OpenSpec Workflow

### Overview
**OpenSpec** - Change proposal and specification management system for architectural changes.

### File Structure

```
openspec/
├── project.md                    # Project overview
├── AGENTS.md                     # Agent instructions (if exists)
├── README.md                     # OpenSpec documentation
└── changes/
    └── {change-name}/
        ├── proposal.md           # Change proposal
        ├── design.md             # Technical design
        ├── tasks.md              # Implementation tasks
        ├── research.md           # Research notes
        ├── data-model.md         # Data models
        ├── quickstart.md         # Quick reference
        └── specs/
            └── {feature}/
                └── spec.md       # Feature specifications
```

### OpenSpec Workflow Steps

1. **Proposal Creation**
   - Create change proposal in `openspec/changes/{change-name}/proposal.md`
   - Define scope, goals, and high-level approach

2. **Design Phase**
   - Document technical design in `design.md`
   - Create data models in `data-model.md`
   - Conduct research in `research.md`

3. **Task Breakdown**
   - Break down implementation in `tasks.md`
   - Create feature specs in `specs/{feature}/spec.md`

4. **Implementation**
   - Follow tasks sequentially
   - Reference specs for requirements
   - Update documentation as you go

### Example: Current OpenSpec Change

```
openspec/changes/add-missing-core-features/
├── proposal.md           # Proposal to add flight requests, pilot portal
├── tasks.md              # Implementation task list
├── design.md             # Architecture design
├── specs/
│   ├── flight-requests/spec.md
│   └── pilot-portal/spec.md
└── contracts/
    ├── CONTRACTS_SUMMARY.md
    └── README.md
```

### OpenSpec Best Practices

- **Always check CLAUDE.md** first - Look for OPENSPEC:START section
- **Use for major changes** - Breaking changes, new architecture, big features
- **Document thoroughly** - OpenSpec is your source of truth
- **Update as you go** - Keep specs synchronized with code

---

## Specify/SpecKit Workflow

### Overview
**Specify/SpecKit** - End-to-end feature development workflow from specification to implementation.

### SpecKit Slash Commands

All commands start with `/speckit.`:

1. **`/speckit.specify [feature description]`**
   - Create feature specification from natural language
   - Generates `spec.md` with quality validation
   - Creates requirements checklist
   - Limits clarifications to 3 maximum
   - **Output**: `.specify/specs/{feature}/spec.md`

2. **`/speckit.clarify`**
   - Identify underspecified areas in spec
   - Ask up to 5 targeted clarification questions
   - Updates spec with answers
   - **Use when**: Spec has ambiguities or gaps

3. **`/speckit.plan`**
   - Execute implementation planning workflow
   - Generate design artifacts
   - Create technical architecture
   - **Output**: `.specify/specs/{feature}/plan.md`

4. **`/speckit.tasks`**
   - Generate actionable, dependency-ordered task list
   - Based on spec and plan
   - **Output**: `.specify/specs/{feature}/tasks.md`

5. **`/speckit.analyze`**
   - Cross-artifact consistency analysis
   - Quality checks across spec, plan, and tasks
   - Non-destructive validation
   - **Run after**: Task generation

6. **`/speckit.implement`**
   - Execute implementation plan
   - Process and execute all tasks from `tasks.md`
   - **Use when**: Ready to code

7. **`/speckit.checklist`**
   - Generate custom feature checklist
   - Based on user requirements
   - **Output**: `.specify/specs/{feature}/checklists/{name}.md`

8. **`/speckit.constitution`**
   - Create/update project constitution
   - Define project principles
   - Keep templates synchronized
   - **Output**: `.specify/memory/constitution.md`

### SpecKit File Structure

```
.specify/
├── templates/
│   ├── spec-template.md          # Specification template
│   ├── plan-template.md          # Planning template
│   ├── tasks-template.md         # Task template
│   ├── checklist-template.md     # Checklist template
│   └── agent-file-template.md    # Agent template
├── memory/
│   └── constitution.md           # Project principles
├── scripts/
│   └── bash/
│       └── create-new-feature.sh # Feature initialization
└── specs/
    └── {feature-name}/
        ├── spec.md               # Feature specification
        ├── plan.md               # Implementation plan
        ├── tasks.md              # Task breakdown
        └── checklists/
            └── requirements.md   # Quality checklist
```

### SpecKit Workflow Process

```
1. /speckit.specify "Add user authentication with OAuth2"
   ↓
   Creates spec.md with quality validation

2. /speckit.clarify (if needed)
   ↓
   Resolves ambiguities in spec

3. /speckit.plan
   ↓
   Creates implementation plan

4. /speckit.tasks
   ↓
   Generates dependency-ordered tasks

5. /speckit.analyze
   ↓
   Validates consistency across artifacts

6. /speckit.implement
   ↓
   Executes implementation tasks
```

### SpecKit Best Practices

- **Start with specify**: Always begin with `/speckit.specify`
- **Quality first**: Spec must pass validation before planning
- **Max 3 clarifications**: Make informed guesses, only ask critical questions
- **Technology-agnostic specs**: Focus on WHAT and WHY, not HOW
- **Analyze before implement**: Run `/speckit.analyze` after task generation

---

## Compounding Engineering Agents

### Overview
**Compounding Engineering** - High-quality code review, optimization, and security agents.

### Available Agents

Located in `~/.claude/agents/awesome-claude-agents/`:

#### Core Quality Agents

1. **code-reviewer**
   - **Purpose**: Rigorous security-aware code review
   - **When**: After feature completion, before merging
   - **Output**: Severity-tagged report with actionable items
   - **Use**: `@agent-code-reviewer`

2. **code-archaeologist**
   - **Purpose**: Explore and document unfamiliar codebases
   - **When**: Legacy code, onboarding, refactors
   - **Output**: Full architecture report with action plan
   - **Use**: `@agent-code-archaeologist`

3. **performance-optimizer**
   - **Purpose**: Bottleneck identification and optimization
   - **When**: Slowness, scaling concerns, before traffic spikes
   - **Output**: Performance analysis with optimization recommendations
   - **Use**: `@agent-performance-optimizer`

4. **documentation-specialist**
   - **Purpose**: Technical documentation creation
   - **When**: After features, API changes, onboarding
   - **Output**: READMEs, API specs, architecture guides
   - **Use**: `@agent-documentation-specialist`

5. **project-analyst**
   - **Purpose**: Technology stack detection and analysis
   - **When**: New repos, stack changes
   - **Output**: Tech stack analysis and routing recommendations
   - **Use**: `@agent-project-analyst`

6. **team-configurator**
   - **Purpose**: AI team setup for projects
   - **When**: New repos, major stack changes
   - **Output**: CLAUDE.md with AI team configuration
   - **Use**: `@agent-team-configurator`

#### Orchestration Agents

7. **tech-lead-orchestrator**
   - **Purpose**: Multi-step complex feature orchestration
   - **When**: Complex features, architectural decisions
   - **Output**: Strategic recommendations and task breakdown
   - **Use**: `@agent-tech-lead-orchestrator`

#### Universal Development Agents

8. **api-architect**
   - **Purpose**: API design (RESTful, GraphQL)
   - **When**: New API endpoints, API contracts
   - **Output**: API specs, OpenAPI schemas
   - **Use**: `@agent-api-architect`

9. **backend-developer**
   - **Purpose**: Server-side code development
   - **When**: Backend features, no framework-specific agent
   - **Output**: Production-ready backend code
   - **Use**: `@agent-backend-developer`

10. **frontend-developer**
    - **Purpose**: UI development (vanilla JS/TS, React, Vue, etc.)
    - **When**: Frontend features, no framework-specific agent
    - **Output**: Responsive, accessible UIs
    - **Use**: `@agent-frontend-developer`

11. **tailwind-css-expert**
    - **Purpose**: Tailwind CSS styling
    - **When**: UI styling, component design
    - **Output**: Utility-first styled components
    - **Use**: `@agent-tailwind-css-expert`

### Fleet Management V2 Configured Agents

From `CLAUDE.md` AI Team Configuration:

| Task Category | Agent | Specialization |
|--------------|-------|----------------|
| **Next.js** | `@agent-react-nextjs-expert` | App Router, SSR, SSG, Server Components |
| **React** | `@agent-react-component-architect` | React 19, hooks, composition |
| **Tailwind** | `@agent-tailwind-css-expert` | Tailwind CSS 4.1.0 |
| **API Design** | `@agent-api-architect` | RESTful, Server Actions, GraphQL |
| **Backend** | `@agent-backend-developer` | Service layer, Supabase integration |
| **Code Review** | `@agent-code-reviewer` | Security, quality (MANDATORY) |
| **Performance** | `@agent-performance-optimizer` | Bottlenecks, caching (MANDATORY) |
| **Documentation** | `@agent-documentation-specialist` | Technical docs, API specs |
| **Analysis** | `@agent-code-archaeologist` | Legacy code exploration |
| **Orchestration** | `@agent-tech-lead-orchestrator` | Complex features |
| **Stack Detection** | `@agent-project-analyst` | Technology analysis |

### How to Use Compounding Engineering Agents

```bash
# Invoke agents using @agent-{name} syntax

# Code review (mandatory before commits)
claude "use @agent-code-reviewer to review the new certification tracking feature"

# Performance optimization (mandatory before production)
claude "use @agent-performance-optimizer to analyze the service layer performance"

# Complex feature orchestration
claude "use @agent-tech-lead-orchestrator to build user authentication system"

# Framework-specific work
claude "use @agent-react-nextjs-expert to create a new dashboard page with SSR"
claude "use @agent-react-component-architect to build a pilot profile card component"

# Styling
claude "use @agent-tailwind-css-expert to create a responsive navigation component"

# API development
claude "use @agent-api-architect to design the leave request API endpoints"

# Documentation
claude "use @agent-documentation-specialist to document the service layer architecture"
```

---

## Claude Code Slash Commands

### Overview
Custom slash commands located in `.claude/commands/`.

### Available Slash Commands

#### Quality & Review Commands

1. **`/review-architecture`**
   - Comprehensive architecture review
   - **Agent**: architecture-strategist
   - **Output**: Architectural analysis report

2. **`/review-typescript`**
   - TypeScript code review
   - **Agent**: kieran-typescript-reviewer
   - **Output**: TypeScript quality review

3. **`/review-database`**
   - Database design review
   - **Agent**: data-integrity-guardian
   - **Output**: Database integrity report

4. **`/security-audit`**
   - Comprehensive security audit
   - **Agent**: security-sentinel
   - **Output**: Security vulnerability report

5. **`/simplify-code`**
   - Code simplification review
   - **Agent**: code-simplicity-reviewer
   - **Output**: Simplification recommendations

#### Research Commands

6. **`/research-framework [framework]`**
   - Framework documentation research
   - **Agent**: framework-docs-researcher
   - **Output**: Comprehensive framework guide

7. **`/research-best-practices [topic]`**
   - Best practices research
   - **Agent**: best-practices-researcher
   - **Output**: Industry best practices guide

8. **`/repo-research`**
   - Repository structure analysis
   - **Agent**: repo-research-analyst
   - **Output**: Repository analysis report

#### Analysis Commands

9. **`/analyze-patterns`**
   - Code pattern analysis
   - **Agent**: pattern-recognition-specialist
   - **Output**: Pattern analysis report

10. **`/optimize-performance`**
    - Performance optimization
    - **Agent**: performance-oracle
    - **Output**: Performance optimization plan

#### Development Commands

11. **`/build`**
    - Quick development workflow
    - **Process**: Analyze → Plan → Implement

12. **`/apa`**
    - Custom workflow (project-specific)

13. **`/pdac`**
    - Plan, Design, Analyze, Code workflow

14. **`/start-to-finish`**
    - Complete feature development workflow

15. **`/project-review`**
    - Comprehensive project review

### SpecKit Commands (Already covered above)

16. **`/speckit.specify`** - Create feature specification
17. **`/speckit.clarify`** - Clarify underspecified areas
18. **`/speckit.plan`** - Execute implementation planning
19. **`/speckit.tasks`** - Generate task breakdown
20. **`/speckit.analyze`** - Cross-artifact analysis
21. **`/speckit.implement`** - Execute implementation
22. **`/speckit.checklist`** - Generate custom checklist
23. **`/speckit.constitution`** - Create project constitution

---

## Workflow Comparison Matrix

| Feature | BMAD | OpenSpec | SpecKit | Compounding Eng |
|---------|------|----------|---------|-----------------|
| **Primary Use** | Business analysis, PRDs | Change proposals | Feature dev workflow | Code quality |
| **Starting Point** | Business need | Architectural change | Feature idea | Existing code |
| **Agent Type** | Interactive personas | Documentation system | Automated workflow | Specialist reviewers |
| **Output Format** | YAML templates, MD docs | Structured MD specs | Structured artifacts | Analysis reports |
| **Collaboration** | Multi-agent (party mode) | Single-agent, structured | Sequential workflow | Specialized experts |
| **Best For** | Requirements gathering | Major changes | End-to-end features | Quality gates |
| **Complexity** | Medium | Low-Medium | High | Medium |
| **Learning Curve** | Moderate | Low | Moderate-High | Low |
| **Integration** | Standalone/combined | Independent | Integrated workflow | Tool-based |

---

## Best Practices & When to Use

### Use BMAD Method When:
✅ Creating Product Requirements Documents (PRDs)
✅ Gathering business requirements
✅ Creating epics and user stories
✅ Need multi-perspective analysis (party mode)
✅ Working on brownfield (existing) projects
✅ Need structured templates for documentation

**Example**: "I need to create a PRD for a new pilot certification tracking feature"
```bash
/BMad:agents:pm
*create-brownfield-prd
```

---

### Use OpenSpec When:
✅ Proposing major architectural changes
✅ Breaking changes that affect multiple systems
✅ Need structured change documentation
✅ Want clear separation of concerns (proposal → design → tasks)
✅ Working on complex features with multiple specs

**Example**: "We need to add missing core features like flight requests and pilot portal"
```
Create: openspec/changes/add-missing-core-features/
1. Write proposal.md
2. Design in design.md
3. Break down in tasks.md
4. Create specs/ for each feature
```

---

### Use SpecKit Workflow When:
✅ Need end-to-end feature development workflow
✅ Want automated quality validation
✅ Building features from scratch (greenfield)
✅ Need dependency-ordered task lists
✅ Want consistency checks across artifacts
✅ Building complex features requiring planning

**Example**: "Add OAuth2 authentication to the pilot portal"
```bash
/speckit.specify "Add OAuth2 authentication with social login support"
/speckit.plan
/speckit.tasks
/speckit.analyze
/speckit.implement
```

---

### Use Compounding Engineering Agents When:
✅ **MANDATORY**: Before committing major changes (code-reviewer)
✅ **MANDATORY**: Before production deployment (performance-optimizer, security-audit)
✅ Need code quality review
✅ Performance optimization required
✅ Security audit needed
✅ Working with unfamiliar legacy code
✅ Need technical documentation
✅ Complex multi-step features (tech-lead-orchestrator)

**Example**: "Review the new certification service before merging"
```bash
claude "use @agent-code-reviewer to review the certification-service.ts changes"
```

---

## Combined Workflow Example

### Scenario: Add Flight Requests Feature

**Phase 1: Business Analysis (BMAD)**
```bash
/BMad:agents:pm
*create-brownfield-story
# Output: User story in docs/stories/
```

**Phase 2: Specification (SpecKit)**
```bash
/speckit.specify "Flight Requests System - Enable pilots to submit flight requests"
/speckit.plan
/speckit.tasks
/speckit.analyze
```

**Phase 3: Implementation (SpecKit + Compounding)**
```bash
# Implementation
/speckit.implement

# Code review (during implementation)
claude "use @agent-code-reviewer to review flight request API routes"
claude "use @agent-react-component-architect to review flight request form component"
```

**Phase 4: Quality Gates (Compounding - MANDATORY)**
```bash
# Performance check
claude "use @agent-performance-optimizer to analyze flight request query performance"

# Security audit
/security-audit

# Final review
claude "use @agent-code-reviewer to do final review before merge"
```

**Phase 5: Documentation (Compounding)**
```bash
claude "use @agent-documentation-specialist to document the flight request feature"
```

---

## Quick Reference Cards

### BMAD Quick Reference
```
Activate: /BMad:agents:pm
Commands: *create-brownfield-prd, *create-story, *shard-prd
Output: docs/*.md
Best for: Requirements, PRDs, user stories
```

### OpenSpec Quick Reference
```
Location: openspec/changes/{change-name}/
Structure: proposal.md → design.md → tasks.md → specs/
Best for: Major changes, architectural proposals
Check first: CLAUDE.md for OPENSPEC:START
```

### SpecKit Quick Reference
```
Commands: /speckit.specify → /speckit.plan → /speckit.tasks → /speckit.implement
Location: .specify/specs/{feature}/
Best for: End-to-end feature development
Quality: Automated validation, max 3 clarifications
```

### Compounding Eng Quick Reference
```
Invoke: @agent-{name} or /slash-command
Mandatory: code-reviewer (before commits), performance-optimizer (before production)
Best for: Code quality, review, optimization, security
Usage: claude "use @agent-code-reviewer to review {file}"
```

---

## Integration with Fleet Management V2

### Project-Specific Configuration

**Current Setup** (from `.bmad-core/core-config.yaml`):
```yaml
user_name: Maurice
project_name: Fleet Management V2
output_folder: '{project-root}/docs'
stack:
  framework: Next.js 15.5.4
  language: TypeScript 5.7.3
  database: Supabase PostgreSQL
```

**AI Team** (from `CLAUDE.md`):
- Detected stack automatically
- 11 specialist agents configured
- Service-layer architecture enforced
- MANDATORY quality gates defined

### Recommended Workflow for Fleet Management V2

1. **New Feature Request**:
   - Use BMAD PM to create user story
   - Use SpecKit to specify and plan
   - Use Compounding agents during implementation

2. **Bug Fixes**:
   - Use SpecKit for complex bugs requiring planning
   - Use Compounding code-reviewer for review

3. **Performance Issues**:
   - Use @agent-performance-optimizer (MANDATORY)
   - Use /optimize-performance slash command

4. **Security Concerns**:
   - Use /security-audit (MANDATORY before production)
   - Use @agent-security-sentinel

5. **Code Review**:
   - Use @agent-code-reviewer (MANDATORY before commits)
   - Use /review-typescript for TS-specific review
   - Use /review-database for database changes

---

## Summary

You now have **4 integrated workflow systems** working together:

1. **BMAD Method** - Business analysis and requirements
2. **OpenSpec** - Change proposals and architectural documentation
3. **SpecKit** - Automated feature development workflow
4. **Compounding Engineering** - Code quality and optimization

**Pro Tip**: Combine workflows for best results!
- Start with BMAD for requirements
- Use SpecKit for implementation workflow
- Use Compounding agents for quality gates
- Document architectural changes in OpenSpec

---

**Generated by**: John (PM Agent) 📋
**For**: Maurice
**Project**: Fleet Management V2 - B767 Pilot Management System
**Date**: October 24, 2025
