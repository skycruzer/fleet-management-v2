# Claude Code Agents - Fleet Management V2

Comprehensive guide to installed Claude Code marketplace agents and slash commands.

## 📋 Table of Contents

- [Overview](#overview)
- [Installed Agents](#installed-agents)
- [Quick Reference](#quick-reference)
- [Usage Examples](#usage-examples)
- [Best Practices](#best-practices)
- [Agent Workflows](#agent-workflows)

---

## Overview

This project has **6 Claude Code marketplace agents** installed as slash commands, plus **10 BMAD framework agents** for comprehensive development support.

### Agent Categories

**Code Quality Agents:**

- TypeScript Review
- Code Simplification

**Security & Performance:**

- Security Audit
- Performance Optimization

**Database & Data:**

- Database Review

**Research & Documentation:**

- Framework Documentation Research

---

## Installed Agents

### 1. TypeScript Reviewer (`/review-typescript`)

**Agent**: `kieran-typescript-reviewer`
**Quality Bar**: Exceptional (Kieran's strict standards)

**Use After:**

- ✅ Implementing new features
- ✅ Creating React components
- ✅ Modifying TypeScript code
- ✅ Refactoring

**What It Reviews:**

- Type safety and proper type usage
- Naming conventions
- React/Next.js best practices
- Component patterns
- Code quality issues

**Example:**

```bash
/review-typescript
```

---

### 2. Security Audit (`/security-audit`)

**Agent**: `security-sentinel`
**Scope**: Comprehensive security review

**Use For:**

- ✅ Pre-deployment security checks
- ✅ Authentication/authorization review
- ✅ API endpoint security
- ✅ Sensitive data handling
- ✅ Before production releases

**What It Checks:**

- Common security vulnerabilities (OWASP)
- Input validation and sanitization
- Authentication/authorization flows
- Hardcoded secrets
- Supabase RLS policies
- SQL injection vulnerabilities
- Session management

**Example:**

```bash
/security-audit
```

**Project-Specific:**

- Supabase RLS policy validation
- Service layer security
- API route authentication
- Environment variable security

---

### 3. Performance Optimizer (`/optimize-performance`)

**Agent**: `performance-oracle`
**Focus**: Performance & Scalability

**Use For:**

- ✅ Performance bottleneck identification
- ✅ Database query optimization
- ✅ API response time improvements
- ✅ Component rendering optimization
- ✅ Scalability validation

**What It Analyzes:**

- Database queries (Supabase)
- Caching strategies
- Memory usage patterns
- Algorithm complexity
- React component performance
- Bundle size optimization

**Example:**

```bash
/optimize-performance
```

**Project-Specific:**

- Optimizing queries for 607+ certifications
- Service layer caching (lib/services/cache-service.ts)
- React component memoization
- Database index recommendations

---

### 4. Database Review (`/review-database`)

**Agent**: `data-integrity-guardian`
**Focus**: Database Safety & Integrity

**Use For:**

- ✅ Database migration reviews
- ✅ Schema change validation
- ✅ Service layer database operations
- ✅ Transaction verification
- ✅ RLS policy reviews

**What It Validates:**

- Migration safety
- Data constraints
- Transaction boundaries
- Referential integrity
- Privacy requirements (RLS)
- Service layer compliance

**Example:**

```bash
/review-database
```

**CRITICAL**: Ensures all database operations use service layer (`lib/services/`)!

**Project-Specific:**

- Supabase migration safety
- RLS policy correctness
- Service pattern enforcement
- Production database protection (wgdmgvonqysflwdiiols)

---

### 5. Code Simplifier (`/simplify-code`)

**Agent**: `code-simplicity-reviewer`
**Philosophy**: Simple is better than complex

**Use For:**

- ✅ Final review before commit
- ✅ Reducing code complexity
- ✅ Applying YAGNI principles
- ✅ Improving maintainability

**What It Does:**

- Identifies simplification opportunities
- Removes unnecessary complexity
- Eliminates over-engineering
- Suggests straightforward approaches
- Ensures YAGNI compliance

**Example:**

```bash
/simplify-code
```

---

### 6. Framework Researcher (`/research-framework`)

**Agent**: `framework-docs-researcher`
**Focus**: Official Documentation & Best Practices

**Use For:**

- ✅ Next.js 15 documentation
- ✅ React 19 best practices
- ✅ Supabase features
- ✅ TypeScript 5.7 features
- ✅ Library implementation guidance

**What It Provides:**

- Official framework documentation
- Version-specific information
- Best practices from maintainers
- Real implementation examples
- Source code exploration

**Examples:**

```bash
/research-framework Next.js 15 server actions
/research-framework Supabase RLS policies
/research-framework React 19 use hook
/research-framework TypeScript 5.7 decorators
```

**Supported Frameworks:**

- Next.js 15.5.4
- React 19.1.0
- TypeScript 5.7.3
- Supabase 2.75.1

---

## Quick Reference

### Pre-Commit Workflow

```bash
# 1. Review TypeScript code
/review-typescript

# 2. Simplify if needed
/simplify-code

# 3. Security check
/security-audit

# 4. Performance check
/optimize-performance

# 5. Database review (if migrations)
/review-database
```

### Post-Implementation Workflow

```bash
# After implementing feature
/review-typescript

# If complex logic
/simplify-code

# Before deployment
/security-audit
/optimize-performance
```

### Research Workflow

```bash
# Need framework guidance?
/research-framework {topic}

# Examples:
/research-framework Next.js 15 middleware
/research-framework Supabase real-time
```

---

## Usage Examples

### Example 1: New Feature Implementation

**Scenario**: Implemented new pilot certification tracking feature

```bash
User: "I've implemented the certification expiry alerts feature"

# Step 1: Review TypeScript code
/review-typescript

# Step 2: Check for simplification
/simplify-code

# Step 3: Security audit
/security-audit

# Step 4: Performance check
/optimize-performance
```

---

### Example 2: Database Migration

**Scenario**: Created migration to add qualifications column

```bash
User: "Created migration to add qualifications JSONB column to pilots table"

# Review migration safety
/review-database

# Then after approval, deploy
npm run db:deploy
```

---

### Example 3: API Endpoint Development

**Scenario**: Built new leave request API endpoint

```bash
User: "Built POST /api/leave-requests endpoint"

# Step 1: Review TypeScript
/review-typescript

# Step 2: Security audit (critical for APIs)
/security-audit

# Step 3: Performance check
/optimize-performance
```

---

### Example 4: Performance Issue

**Scenario**: Dashboard loading slowly

```bash
User: "Dashboard is slow - loads 607 certifications"

# Analyze performance
/optimize-performance

# Might suggest:
# - Query optimization
# - Caching strategies (cache-service.ts)
# - Pagination
# - Lazy loading
```

---

### Example 5: Pre-Deployment Checklist

**Scenario**: Ready to deploy to production

```bash
# Complete pre-deployment review
/review-typescript
/simplify-code
/security-audit
/optimize-performance
/review-database

# Then run validation
npm run validate

# Then deploy
npm run build
```

---

## Best Practices

### When to Use Each Agent

| Agent                   | When                  | Why                       |
| ----------------------- | --------------------- | ------------------------- |
| `/review-typescript`    | After code changes    | Ensure TypeScript quality |
| `/security-audit`       | Pre-deployment        | Prevent vulnerabilities   |
| `/optimize-performance` | After features        | Maintain performance      |
| `/review-database`      | Before migrations     | Prevent data issues       |
| `/simplify-code`        | Final review          | Keep code maintainable    |
| `/research-framework`   | Learning/implementing | Get official guidance     |

### Agent Sequencing

**Recommended Order:**

1. **Implementation** → Write code
2. **Review** → `/review-typescript`
3. **Simplify** → `/simplify-code`
4. **Secure** → `/security-audit`
5. **Optimize** → `/optimize-performance`
6. **Deploy** → Production

### Proactive vs Reactive

**Proactive (Best Practice):**

```bash
# After every feature
/review-typescript
/simplify-code
/security-audit
```

**Reactive (When Issues Found):**

```bash
# When performance problems discovered
/optimize-performance

# When security concerns arise
/security-audit
```

---

## Agent Workflows

### Workflow 1: Feature Development

```
┌─────────────────────┐
│ 1. Implement Feature│
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ 2. /review-typescript│
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ 3. /simplify-code   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ 4. /security-audit  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ 5. /optimize-perf   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ 6. Commit & Deploy  │
└─────────────────────┘
```

### Workflow 2: Database Changes

```
┌─────────────────────┐
│ 1. Create Migration │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ 2. /review-database │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ 3. Test Migration   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ 4. /security-audit  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ 5. Deploy to Prod   │
└─────────────────────┘
```

### Workflow 3: Bug Fix

```
┌─────────────────────┐
│ 1. Identify Bug     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ 2. Implement Fix    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ 3. /review-typescript│
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ 4. Test Fix         │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ 5. /simplify-code   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ 6. Deploy Fix       │
└─────────────────────┘
```

---

## Specification & API Design Agents

These agents are **optimized for Specify and OpenSpec workflows**:

### 7. Architecture Reviewer (`/review-architecture`)

**Agent**: `architecture-strategist`
**Focus**: System Architecture & Design

**Use For:**

- ✅ Architectural compliance reviews
- ✅ API specification reviews (OpenSpec)
- ✅ System design validation
- ✅ Component boundary checks
- ✅ Design pattern verification

**What It Reviews:**

- Service layer architecture
- API endpoint structure
- OpenAPI specification compliance
- Component boundaries
- Design patterns

**Example:**

```bash
/review-architecture
```

**OpenSpec Integration:**

- Reviews API specifications in `/openspec/`
- Validates OpenAPI 3.0/3.1 compliance
- Ensures RESTful patterns
- Checks API design consistency

---

### 8. Best Practices Researcher (`/research-best-practices`)

**Agent**: `best-practices-researcher`
**Scope**: Any technology or practice

**Use For:**

- ✅ OpenAPI specification best practices
- ✅ API design patterns
- ✅ Framework conventions
- ✅ Industry standards
- ✅ Specification writing

**What It Provides:**

- Official documentation
- Community standards
- Real-world examples
- Best practices synthesis

**Examples:**

```bash
/research-best-practices OpenAPI specification design
/research-best-practices REST API versioning strategies
/research-best-practices Next.js API routes patterns
```

---

### 9. Pattern Analyzer (`/analyze-patterns`)

**Agent**: `pattern-recognition-specialist`
**Focus**: Patterns & Consistency

**Use For:**

- ✅ Design pattern identification
- ✅ Anti-pattern detection
- ✅ Code duplication detection
- ✅ Naming convention analysis
- ✅ API pattern consistency

**What It Identifies:**

- Design patterns (Factory, Repository, etc.)
- Anti-patterns (God Objects, etc.)
- Code smells
- Inconsistencies

**Example:**

```bash
/analyze-patterns
```

---

### 10. DHH Rails Review (`/dhh-rails-review`)

**Agent**: `dhh-rails-reviewer`
**Style**: Brutally honest

**Use For:**

- ✅ RESTful API design critique
- ✅ Over-engineering detection
- ✅ Convention validation
- ✅ Simplicity enforcement

**Philosophy:**

- Convention over Configuration
- Simplicity over Complexity
- Pragmatic solutions

**Example:**

```bash
/dhh-rails-review
```

---

### 11. Repository Researcher (`/repo-research`)

**Agent**: `repo-research-analyst`
**Focus**: Repository analysis

**Use For:**

- ✅ Understanding project structure
- ✅ Finding implementation patterns
- ✅ Reviewing conventions
- ✅ Template discovery

**What It Analyzes:**

- Repository structure
- Documentation patterns
- Implementation patterns
- GitHub conventions

**Example:**

```bash
/repo-research
```

---

## BMAD Framework Agents

Your project also has **BMAD (Brilliant Multi-Agent Development)** framework agents:

Located in: `.claude/commands/BMad/agents/`

1. **analyst** (`/analyst`) - Business analysis, market research
2. **architect** (`/architect`) - System architecture design
3. **dev** (`/dev`) - Development implementation
4. **pm** (`/pm`) - Project management
5. **po** (`/po`) - Product ownership
6. **qa** (`/qa`) - Quality assurance
7. **sm** (`/sm`) - Scrum master
8. **ux-expert** (`/ux-expert`) - UX/UI design
9. **bmad-master** (`/bmad-master`) - BMAD framework master
10. **bmad-orchestrator** (`/bmad-orchestrator`) - Multi-agent orchestration

---

## Additional Resources

### Project Documentation

- [CLAUDE.md](../CLAUDE.md) - Project guidance
- [WORK-PLAN.md](../WORK-PLAN.md) - 9-week implementation plan
- [PROJECT-SUMMARY.md](../PROJECT-SUMMARY.md) - Tech stack overview

### Claude Code Documentation

- [Commands README](.claude/commands/README.md) - Slash commands guide
- Run `/help` in any BMAD agent for agent-specific help

---

## Summary

**11 Claude Code Marketplace Agents Installed:**

### Code Quality Agents (4)

| Command              | Agent                      | Purpose                      |
| -------------------- | -------------------------- | ---------------------------- |
| `/review-typescript` | kieran-typescript-reviewer | TypeScript code quality      |
| `/simplify-code`     | code-simplicity-reviewer   | Code simplification          |
| `/dhh-rails-review`  | dhh-rails-reviewer         | Rails-style pragmatic review |
| `/review-database`   | data-integrity-guardian    | Database safety              |

### Security & Performance (2)

| Command                 | Agent              | Purpose                   |
| ----------------------- | ------------------ | ------------------------- |
| `/security-audit`       | security-sentinel  | Security vulnerabilities  |
| `/optimize-performance` | performance-oracle | Performance & scalability |

### Architecture & Patterns (3)

| Command                | Agent                          | Purpose                 |
| ---------------------- | ------------------------------ | ----------------------- |
| `/review-architecture` | architecture-strategist        | Architecture validation |
| `/analyze-patterns`    | pattern-recognition-specialist | Pattern recognition     |
| `/repo-research`       | repo-research-analyst          | Repository analysis     |

### Research & Documentation (2)

| Command                    | Agent                     | Purpose                 |
| -------------------------- | ------------------------- | ----------------------- |
| `/research-framework`      | framework-docs-researcher | Framework documentation |
| `/research-best-practices` | best-practices-researcher | Best practices research |

**Plus 10 BMAD Framework Agents** for complete development lifecycle coverage.

---

**Version**: 1.0.0
**Last Updated**: October 22, 2025
**Maintainer**: Maurice (Skycruzer)
**Project**: Fleet Management V2 - B767 Pilot Management System
