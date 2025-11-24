# Awesome Claude Agents - Complete Guide
## Fleet Management V2 AI Development Team

**Version**: 1.0.0
**Date**: October 22, 2025
**Project**: Fleet Management V2 - B767 Pilot Management System
**Author**: Maurice (Skycruzer)

---

## Table of Contents

1. [Introduction](#introduction)
2. [What Are Claude Agents?](#what-are-claude-agents)
3. [Your AI Development Team](#your-ai-development-team)
4. [Installation Summary](#installation-summary)
5. [Technology Stack Detection](#technology-stack-detection)
6. [Agent Reference Guide](#agent-reference-guide)
7. [Usage Examples](#usage-examples)
8. [Best Practices](#best-practices)
9. [Workflow Patterns](#workflow-patterns)
10. [Troubleshooting](#troubleshooting)

---

## Introduction

This guide provides comprehensive documentation for using **Awesome Claude Agents** with your Fleet Management V2 project. These specialized AI agents extend Claude Code's capabilities, giving you a complete AI development team optimized for your Next.js/React/TypeScript/Supabase stack.

### What You'll Learn

- How to invoke and use each specialist agent
- Best practices for agent coordination
- Real-world usage examples specific to your project
- Workflow patterns for common development tasks
- Troubleshooting tips

---

## What Are Claude Agents?

Claude Agents are specialized AI assistants that provide deep expertise in specific domains. Instead of relying on a general-purpose AI, you can invoke specialists who:

- **Have domain expertise** - Each agent masters their specific technology or task
- **Follow best practices** - Agents apply current industry standards
- **Coordinate seamlessly** - Agents work together through orchestration
- **Provide structured output** - Clear, actionable results

### How They Work

Agents are invoked using the `@agent-<name>` syntax in Claude Code:

```bash
claude "use @agent-react-nextjs-expert to review my App Router structure"
```

The main Claude instance coordinates the workflow, passing context between specialists and ensuring quality output.

---

## Your AI Development Team

You have **11 specialized agents** configured for Fleet Management V2:

### 🎭 Orchestrators (2 agents)

**1. @agent-tech-lead-orchestrator**
- **Purpose**: Coordinates complex multi-step projects
- **Use when**: Building new features, refactoring large systems
- **Capabilities**: Architecture decisions, task breakdown, team coordination

**2. @agent-project-analyst**
- **Purpose**: Technology stack detection and analysis
- **Use when**: Understanding project structure, generating reports
- **Capabilities**: Stack detection, dependency analysis, architecture review

### ⚛️ React/Next.js Specialists (2 agents)

**3. @agent-react-nextjs-expert**
- **Purpose**: Next.js framework expertise
- **Use when**: App Router development, SSR/SSG/ISR, Server Components
- **Capabilities**:
  - App Router architecture
  - Server Components vs Client Components
  - Server Actions implementation
  - Metadata API and SEO
  - Streaming and Suspense
  - Performance optimization

**4. @agent-react-component-architect**
- **Purpose**: React component design and patterns
- **Use when**: Building reusable components, hooks, composition patterns
- **Capabilities**:
  - React 19 patterns
  - Custom hooks development
  - Component composition
  - State management patterns
  - Performance optimization (memo, useMemo, useCallback)

### 🎨 Styling Specialist (1 agent)

**5. @agent-tailwind-css-expert**
- **Purpose**: Tailwind CSS styling and design
- **Use when**: Styling components, responsive design, utility-first development
- **Capabilities**:
  - Tailwind CSS 4.1.0 features
  - Responsive design patterns
  - Custom theme configuration
  - Component styling with Radix UI
  - Accessibility in design

### 🌐 API & Backend Specialists (2 agents)

**6. @agent-api-architect**
- **Purpose**: API design and architecture
- **Use when**: Designing API routes, Server Actions, GraphQL schemas
- **Capabilities**:
  - RESTful API design
  - Server Actions patterns
  - API route optimization
  - Request/response patterns
  - Error handling

**7. @agent-backend-developer**
- **Purpose**: Backend development and service layer
- **Use when**: Building services, Supabase integration, business logic
- **Capabilities**:
  - Service layer architecture
  - Supabase client integration
  - Database operations
  - Authentication and authorization
  - Data validation and transformation

### 🔧 Quality & Performance (2 agents)

**8. @agent-code-reviewer** ⭐ **MANDATORY FOR MAJOR CHANGES**
- **Purpose**: Security-aware code reviews
- **Use when**: Before committing major changes, security audits
- **Capabilities**:
  - Code quality analysis
  - Security vulnerability detection
  - Best practices enforcement
  - Severity-tagged reports
  - Refactoring suggestions

**9. @agent-performance-optimizer** ⭐ **MANDATORY BEFORE PRODUCTION**
- **Purpose**: Performance analysis and optimization
- **Use when**: Optimizing queries, caching strategies, bottleneck identification
- **Capabilities**:
  - Database query optimization
  - Caching strategy design
  - Bundle size optimization
  - React performance patterns
  - Server-side rendering optimization

### 📚 Documentation & Analysis (2 agents)

**10. @agent-documentation-specialist**
- **Purpose**: Technical documentation creation
- **Use when**: Writing docs, API specs, README updates
- **Capabilities**:
  - Technical documentation
  - API documentation
  - Architecture documentation
  - User guides
  - Code comments

**11. @agent-code-archaeologist**
- **Purpose**: Codebase exploration and analysis
- **Use when**: Understanding unfamiliar code, legacy analysis
- **Capabilities**:
  - Codebase exploration
  - Pattern identification
  - Dependency mapping
  - Legacy code documentation
  - Technical debt assessment

---

## Installation Summary

### ✅ Already Completed

Your installation is complete. Here's what was done:

**1. Agents Installed**
```bash
~/.claude/agents/awesome-claude-agents/
├── core/              # 4 agents
├── orchestrators/     # 3 agents (2 relevant for your project)
├── specialized/       # 26 agents (2 React/Next.js agents relevant)
└── universal/         # 4 agents
```

**2. Symlink Created**
```bash
ln -sf "$(pwd)/awesome-claude-agents/agents/" ~/.claude/agents/awesome-claude-agents
```

**3. CLAUDE.md Updated**
- Lines 30-131 contain AI Team Configuration
- Detected technology stack documented
- Agent routing table created
- Usage examples provided

### Verification

To verify installation:
```bash
# List all available agents
ls -la ~/.claude/agents/awesome-claude-agents/

# Check agent count
find ~/.claude/agents/awesome-claude-agents -name "*.md" -type f | wc -l
# Should show: 33 agents total (11 configured for your project)
```

---

## Technology Stack Detection

Your project was analyzed and the following stack was detected:

### Frontend
- **Framework**: Next.js 15.5.4 (App Router)
- **UI Library**: React 19.1.0
- **Language**: TypeScript 5.7.3 (strict mode)
- **Styling**: Tailwind CSS 4.1.0
- **UI Components**: Radix UI (shadcn/ui)

### State & Forms
- **State Management**: TanStack Query 5.90.2
- **Forms**: React Hook Form 7.65.0
- **Validation**: Zod 4.1.12

### Backend & Database
- **Database**: Supabase PostgreSQL
  - Project ID: wgdmgvonqysflwdiiols
  - @supabase/supabase-js 2.75.1
  - @supabase/ssr 0.7.0
- **Rate Limiting**: Upstash Redis

### Testing & Development
- **E2E Testing**: Playwright 1.55.0
- **Component Dev**: Storybook 8.5.11
- **Build System**: Turbopack (Next.js built-in)

### Additional Features
- **PWA**: Serwist/Next 9.2.1
- **Animation**: Framer Motion 12.23.24
- **Drag & Drop**: @dnd-kit

---

## Agent Reference Guide

### Quick Reference Table

| Task | Primary Agent | Fallback Agent | Notes |
|------|---------------|----------------|-------|
| **New Feature Development** | `@agent-tech-lead-orchestrator` | - | Coordinates multi-step tasks |
| **Next.js Pages/Routes** | `@agent-react-nextjs-expert` | `@agent-backend-developer` | App Router, SSR, Server Components |
| **React Components** | `@agent-react-component-architect` | - | Hooks, composition, patterns |
| **Tailwind Styling** | `@agent-tailwind-css-expert` | - | Responsive design, utilities |
| **API Routes** | `@agent-api-architect` | `@agent-backend-developer` | REST, Server Actions |
| **Service Layer** | `@agent-backend-developer` | - | Supabase integration, business logic |
| **Code Review** | `@agent-code-reviewer` | - | Security, quality, best practices |
| **Performance** | `@agent-performance-optimizer` | - | Bottlenecks, caching, optimization |
| **Documentation** | `@agent-documentation-specialist` | - | Docs, API specs, guides |
| **Codebase Analysis** | `@agent-code-archaeologist` | - | Exploration, legacy analysis |

### When to Use Each Agent

#### @agent-tech-lead-orchestrator
**Use For:**
- Building complete features (authentication, user management, etc.)
- Large refactoring projects
- Architecture decisions
- Complex multi-step tasks

**Example Scenarios:**
- "Build a pilot scheduling system with calendar integration"
- "Refactor the certification tracking module for better performance"
- "Design and implement a notification system"

#### @agent-react-nextjs-expert
**Use For:**
- Creating new pages with App Router
- Implementing Server Components
- Server Actions for mutations
- SSR/SSG/ISR strategies
- Metadata and SEO optimization

**Example Scenarios:**
- "Create a new dashboard page with real-time data using Server Components"
- "Implement a pilot profile page with SSR and dynamic metadata"
- "Optimize the certification list page with ISR"

#### @agent-react-component-architect
**Use For:**
- Building reusable UI components
- Custom hooks development
- Component composition patterns
- State management within components
- Performance optimization (memo, callbacks)

**Example Scenarios:**
- "Build a reusable data table component with sorting and filtering"
- "Create a custom hook for managing form state"
- "Refactor the pilot card component for better composition"

#### @agent-tailwind-css-expert
**Use For:**
- Styling components with Tailwind
- Responsive design implementation
- Radix UI integration and styling
- Custom theme configuration
- Accessibility in styling

**Example Scenarios:**
- "Style the navigation component with Tailwind and make it responsive"
- "Create a custom color palette for the pilot management system"
- "Implement dark mode with Tailwind"

#### @agent-api-architect
**Use For:**
- Designing API routes
- Server Actions implementation
- API error handling
- Request/response patterns
- API documentation

**Example Scenarios:**
- "Design the API endpoints for leave request management"
- "Implement Server Actions for pilot data mutations"
- "Create a RESTful API structure for certification tracking"

#### @agent-backend-developer
**Use For:**
- Service layer implementation
- Supabase integration
- Business logic
- Database operations
- Authentication and authorization

**Example Scenarios:**
- "Implement a service for calculating leave eligibility"
- "Create Supabase queries for pilot certification tracking"
- "Build authentication middleware for route protection"

#### @agent-code-reviewer
**Use For:**
- Pre-commit code reviews
- Security audits
- Best practices enforcement
- Refactoring suggestions
- Code quality assessment

**Example Scenarios:**
- "Review the new certification tracking feature before commit"
- "Audit the authentication implementation for security issues"
- "Review service layer for best practices"

#### @agent-performance-optimizer
**Use For:**
- Database query optimization
- Caching strategy design
- Bundle size reduction
- React performance optimization
- Server-side rendering optimization

**Example Scenarios:**
- "Optimize the pilot dashboard query performance"
- "Design a caching strategy for certification data"
- "Reduce bundle size and improve initial load time"

#### @agent-documentation-specialist
**Use For:**
- Writing technical documentation
- API documentation
- README updates
- User guides
- Architecture documentation

**Example Scenarios:**
- "Document the service layer architecture"
- "Create API documentation for the leave request endpoints"
- "Update README with deployment instructions"

#### @agent-code-archaeologist
**Use For:**
- Understanding unfamiliar code
- Legacy codebase analysis
- Pattern identification
- Technical debt assessment
- Dependency mapping

**Example Scenarios:**
- "Analyze the existing certification tracking implementation"
- "Document the legacy roster period calculation logic"
- "Identify patterns in the current service layer"

---

## Usage Examples

### Example 1: Building a New Feature

**Scenario**: Build a pilot notification system

```bash
# Step 1: Use tech-lead orchestrator for planning
claude "use @agent-tech-lead-orchestrator to build a pilot notification system with email and in-app notifications"

# The orchestrator will:
# 1. Analyze requirements
# 2. Create architecture plan
# 3. Coordinate specialists (Next.js expert, backend developer, etc.)
# 4. Provide implementation plan
```

### Example 2: Creating a New Page

**Scenario**: Create a pilot analytics dashboard page

```bash
# Use Next.js expert for App Router implementation
claude "use @agent-react-nextjs-expert to create a pilot analytics dashboard page with Server Components and real-time data"

# The agent will:
# 1. Create page.tsx with App Router
# 2. Implement Server Components for data fetching
# 3. Add metadata for SEO
# 4. Optimize for performance
```

### Example 3: Building Reusable Components

**Scenario**: Create a reusable certification card component

```bash
# Use React component architect
claude "use @agent-react-component-architect to create a reusable certification card component with status indicators and expiry warnings"

# The agent will:
# 1. Design component API (props)
# 2. Implement with React 19 patterns
# 3. Add proper TypeScript types
# 4. Include Storybook stories
# 5. Optimize performance
```

### Example 4: Styling Components

**Scenario**: Style the navigation with Tailwind

```bash
# Use Tailwind expert
claude "use @agent-tailwind-css-expert to style the main navigation component with responsive design and accessibility"

# The agent will:
# 1. Apply Tailwind utilities
# 2. Implement responsive breakpoints
# 3. Add accessibility features
# 4. Integrate with Radix UI
```

### Example 5: API Development

**Scenario**: Design leave request API endpoints

```bash
# Use API architect
claude "use @agent-api-architect to design RESTful API endpoints for leave request management with proper error handling"

# The agent will:
# 1. Design endpoint structure
# 2. Define request/response schemas
# 3. Implement error handling
# 4. Add validation
# 5. Document API
```

### Example 6: Service Layer Implementation

**Scenario**: Create a service for pilot statistics

```bash
# Use backend developer
claude "use @agent-backend-developer to create a service for calculating pilot statistics with Supabase integration"

# The agent will:
# 1. Design service architecture
# 2. Implement Supabase queries
# 3. Add error handling
# 4. Include TypeScript types
# 5. Add caching if needed
```

### Example 7: Code Review

**Scenario**: Review before committing major changes

```bash
# Use code reviewer (MANDATORY)
claude "use @agent-code-reviewer to review the new pilot scheduling feature with security focus"

# The agent will:
# 1. Analyze code quality
# 2. Check for security vulnerabilities
# 3. Verify best practices
# 4. Provide severity-tagged report
# 5. Suggest improvements
```

### Example 8: Performance Optimization

**Scenario**: Optimize dashboard performance

```bash
# Use performance optimizer (MANDATORY BEFORE PRODUCTION)
claude "use @agent-performance-optimizer to analyze and optimize the pilot dashboard performance"

# The agent will:
# 1. Identify bottlenecks
# 2. Analyze database queries
# 3. Review caching strategies
# 4. Check bundle size
# 5. Provide optimization plan
```

### Example 9: Documentation

**Scenario**: Document the service layer

```bash
# Use documentation specialist
claude "use @agent-documentation-specialist to create comprehensive documentation for the service layer architecture"

# The agent will:
# 1. Analyze service layer structure
# 2. Document each service
# 3. Create usage examples
# 4. Add architecture diagrams
# 5. Write best practices guide
```

### Example 10: Codebase Analysis

**Scenario**: Understand legacy leave eligibility logic

```bash
# Use code archaeologist
claude "use @agent-code-archaeologist to analyze and document the existing leave eligibility calculation logic"

# The agent will:
# 1. Explore the codebase
# 2. Identify patterns
# 3. Document logic flow
# 4. Explain business rules
# 5. Suggest improvements
```

---

## Best Practices

### 1. Agent Selection

✅ **DO:**
- Use tech-lead-orchestrator for complex multi-step features
- Use framework-specific agents (react-nextjs-expert) over generic ones
- Run code-reviewer before major commits
- Run performance-optimizer before production deployments

❌ **DON'T:**
- Use generic agents when specialists are available
- Skip code review for large changes
- Deploy without performance optimization
- Mix concerns (use specialized agents for their domain)

### 2. Workflow Patterns

#### New Feature Development
```
1. @agent-tech-lead-orchestrator → Planning and architecture
2. @agent-react-nextjs-expert → Page/route implementation
3. @agent-react-component-architect → Component development
4. @agent-tailwind-css-expert → Styling
5. @agent-backend-developer → Service layer
6. @agent-code-reviewer → Review before commit
7. @agent-performance-optimizer → Optimization
8. @agent-documentation-specialist → Documentation
```

#### Bug Fix Workflow
```
1. @agent-code-archaeologist → Understand existing code
2. @agent-backend-developer → Fix implementation
3. @agent-code-reviewer → Review fix
```

#### Refactoring Workflow
```
1. @agent-code-archaeologist → Analyze current implementation
2. @agent-tech-lead-orchestrator → Plan refactoring
3. Specialist agents → Implement changes
4. @agent-code-reviewer → Review changes
5. @agent-performance-optimizer → Verify improvements
```

### 3. Communication with Agents

**Be Specific:**
```bash
# ✅ Good - Specific request
claude "use @agent-react-nextjs-expert to create a pilot profile page with SSR, dynamic metadata, and real-time certification status"

# ❌ Bad - Too vague
claude "use @agent-react-nextjs-expert to make a page"
```

**Provide Context:**
```bash
# ✅ Good - Includes context
claude "use @agent-backend-developer to create a leave eligibility service that checks minimum crew requirements of 10 Captains and 10 First Officers separately by rank"

# ❌ Bad - Missing context
claude "use @agent-backend-developer to create a service"
```

**Request Specific Deliverables:**
```bash
# ✅ Good - Clear deliverables
claude "use @agent-code-reviewer to review the certification-service.ts file and provide severity-tagged security analysis"

# ❌ Bad - Unclear deliverables
claude "use @agent-code-reviewer to look at some code"
```

### 4. Quality Gates

**MANDATORY Quality Checks:**

Before ANY commit:
```bash
claude "use @agent-code-reviewer to review changes"
```

Before production deployment:
```bash
claude "use @agent-performance-optimizer to analyze performance"
```

After major refactoring:
```bash
claude "use @agent-code-archaeologist to verify changes don't break existing patterns"
```

### 5. Orchestration Best Practices

**When to use @agent-tech-lead-orchestrator:**
- Features requiring 3+ files
- Cross-cutting concerns
- Architecture decisions needed
- Multiple technologies involved

**When to use specialists directly:**
- Single file changes
- Specific domain tasks
- Quick fixes
- Isolated improvements

### 6. Agent Coordination

**Sequential Tasks (Dependencies):**
```bash
# Step 1: Design
claude "use @agent-api-architect to design the notification API"

# Step 2: Implement (after Step 1 completes)
claude "use @agent-backend-developer to implement the notification service based on the API design"

# Step 3: Review (after Step 2 completes)
claude "use @agent-code-reviewer to review the implementation"
```

**Parallel Tasks (Independent):**
```bash
# These can be done independently
claude "use @agent-react-component-architect to build notification bell component"
claude "use @agent-backend-developer to build notification service"
claude "use @agent-documentation-specialist to document notification system"
```

---

## Workflow Patterns

### Pattern 1: Full Feature Implementation

**Use Case**: Building a complete feature from scratch

```mermaid
graph TD
    A[User Request] --> B[@agent-tech-lead-orchestrator]
    B --> C[Planning Phase]
    C --> D[@agent-react-nextjs-expert]
    C --> E[@agent-backend-developer]
    C --> F[@agent-tailwind-css-expert]
    D --> G[Implementation]
    E --> G
    F --> G
    G --> H[@agent-code-reviewer]
    H --> I{Pass?}
    I -->|No| G
    I -->|Yes| J[@agent-performance-optimizer]
    J --> K{Pass?}
    K -->|No| G
    K -->|Yes| L[@agent-documentation-specialist]
    L --> M[Deploy]
```

**Steps:**
1. Tech-lead analyzes and plans
2. Specialists implement in parallel
3. Code reviewer validates
4. Performance optimizer checks
5. Documentation specialist documents
6. Ready for deployment

### Pattern 2: Bug Fix Workflow

```bash
# 1. Understand the issue
claude "use @agent-code-archaeologist to analyze the leave eligibility calculation bug"

# 2. Implement fix
claude "use @agent-backend-developer to fix the leave eligibility service based on the analysis"

# 3. Review fix
claude "use @agent-code-reviewer to review the bug fix"

# 4. Deploy
```

### Pattern 3: Performance Optimization

```bash
# 1. Identify bottlenecks
claude "use @agent-performance-optimizer to analyze the pilot dashboard performance"

# 2. Optimize queries
claude "use @agent-backend-developer to optimize the identified slow queries"

# 3. Optimize frontend
claude "use @agent-react-nextjs-expert to implement the recommended React optimizations"

# 4. Verify improvements
claude "use @agent-performance-optimizer to verify the optimization results"
```

### Pattern 4: Refactoring

```bash
# 1. Analyze current code
claude "use @agent-code-archaeologist to document the current certification tracking implementation"

# 2. Plan refactoring
claude "use @agent-tech-lead-orchestrator to plan refactoring of certification tracking for better maintainability"

# 3. Implement changes
claude "use @agent-backend-developer to refactor the certification service based on the plan"

# 4. Update components
claude "use @agent-react-component-architect to update components to use the refactored service"

# 5. Review
claude "use @agent-code-reviewer to review the refactoring"

# 6. Document
claude "use @agent-documentation-specialist to update documentation for the refactored system"
```

### Pattern 5: API Development

```bash
# 1. Design API
claude "use @agent-api-architect to design RESTful API endpoints for pilot document management"

# 2. Implement backend
claude "use @agent-backend-developer to implement the document management service and Supabase storage integration"

# 3. Create API routes
claude "use @agent-react-nextjs-expert to create API routes for document upload and retrieval"

# 4. Build frontend
claude "use @agent-react-component-architect to build document upload component"

# 5. Review
claude "use @agent-code-reviewer to review the complete API implementation"

# 6. Document
claude "use @agent-documentation-specialist to create API documentation"
```

---

## Troubleshooting

### Common Issues

#### Issue 1: Agent Not Found

**Symptom:**
```
Error: Agent '@agent-react-nextjs-expert' not found
```

**Solution:**
```bash
# Verify symlink exists
ls -la ~/.claude/agents/awesome-claude-agents

# If missing, recreate symlink
cd /Users/skycruzer/Desktop/Fleet\ Office\ Management/fleet-management-v2
ln -sf "$(pwd)/awesome-claude-agents/agents/" ~/.claude/agents/awesome-claude-agents
```

#### Issue 2: Agent Returns Generic Results

**Symptom:**
Agent doesn't provide framework-specific solutions

**Solution:**
- Be more specific in your request
- Provide context about your stack
- Reference specific files or patterns
- Use the tech-lead-orchestrator for complex tasks

**Example:**
```bash
# ❌ Too generic
claude "use @agent-react-nextjs-expert to make a page"

# ✅ Specific and contextual
claude "use @agent-react-nextjs-expert to create a pilot certification tracking page using App Router with Server Components, fetching data from Supabase, and including dynamic metadata for SEO"
```

#### Issue 3: Conflicting Recommendations

**Symptom:**
Different agents provide conflicting approaches

**Solution:**
Use the tech-lead-orchestrator to coordinate:

```bash
claude "use @agent-tech-lead-orchestrator to reconcile the different approaches for implementing real-time notifications and provide a unified recommendation"
```

#### Issue 4: Agent Doesn't Know Project Context

**Symptom:**
Agent makes suggestions that don't fit your architecture

**Solution:**
- Reference CLAUDE.md in your request
- Point to specific service layer patterns
- Mention existing patterns to follow

**Example:**
```bash
claude "use @agent-backend-developer to create a notification service following the same pattern as pilot-service.ts and integrating with our service layer architecture defined in CLAUDE.md"
```

#### Issue 5: Outdated Recommendations

**Symptom:**
Agent suggests older patterns not suitable for your versions

**Solution:**
Specify versions in your request:

```bash
claude "use @agent-react-nextjs-expert to create a page using Next.js 15 App Router with React 19 Server Components"
```

### Getting Help

**For Agent Issues:**
1. Check agent definition: `cat ~/.claude/agents/awesome-claude-agents/[category]/[agent-name].md`
2. Review CLAUDE.md for project-specific guidance
3. Use tech-lead-orchestrator for clarification

**For Installation Issues:**
1. Verify symlink: `ls -la ~/.claude/agents/`
2. Check agent count: `find ~/.claude/agents/awesome-claude-agents -name "*.md" -type f | wc -l`
3. Recreate symlink if needed

**For Quality Issues:**
1. Always use code-reviewer before commits
2. Use performance-optimizer before production
3. Request specific deliverables
4. Provide clear context

---

## Quick Reference Card

### Most Common Commands

```bash
# New Feature
claude "use @agent-tech-lead-orchestrator to build [feature description]"

# Next.js Page
claude "use @agent-react-nextjs-expert to create [page description] with SSR"

# React Component
claude "use @agent-react-component-architect to build [component description]"

# Styling
claude "use @agent-tailwind-css-expert to style [component] with responsive design"

# Service Layer
claude "use @agent-backend-developer to create [service description]"

# Code Review (Before Commit)
claude "use @agent-code-reviewer to review [feature/file]"

# Performance (Before Production)
claude "use @agent-performance-optimizer to analyze [area]"

# Documentation
claude "use @agent-documentation-specialist to document [feature]"
```

### Quality Checklist

Before committing code:
- [ ] Functionality implemented correctly
- [ ] TypeScript types are correct
- [ ] Service layer pattern followed
- [ ] Error handling implemented
- [ ] **@agent-code-reviewer** review passed
- [ ] Tests written (if applicable)

Before production deployment:
- [ ] All functionality tested
- [ ] **@agent-performance-optimizer** analysis passed
- [ ] Security review completed
- [ ] Documentation updated
- [ ] Performance benchmarks met

---

## Conclusion

You now have a complete AI development team optimized for your Fleet Management V2 project. These agents provide:

✅ **Domain Expertise** - Specialists in Next.js, React, TypeScript, Supabase
✅ **Quality Assurance** - Code review and performance optimization
✅ **Faster Development** - Coordinate complex tasks efficiently
✅ **Better Code** - Follow best practices automatically
✅ **Complete Documentation** - Generate docs as you build

### Next Steps

1. **Start Small** - Try a simple task with one agent
2. **Build Confidence** - Use tech-lead-orchestrator for a small feature
3. **Scale Up** - Coordinate multiple agents for complex features
4. **Maintain Quality** - Always use code-reviewer and performance-optimizer

### Support

- **Project Documentation**: `CLAUDE.md` (lines 30-131)
- **Agent Repository**: `~/.claude/agents/awesome-claude-agents/`
- **Agent Definitions**: Individual `.md` files in agent directories

---

**Happy Building! 🚀**

*Your AI development team is ready to help you build production-ready features faster than ever.*
