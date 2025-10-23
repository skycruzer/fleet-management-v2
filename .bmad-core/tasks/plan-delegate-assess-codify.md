<!-- Powered by BMAD™ Core -->

# PLAN-DELEGATE-ASSESS-CODIFY Workflow

## ⚠️ CRITICAL EXECUTION NOTICE ⚠️

**THIS IS AN EXECUTABLE WORKFLOW - NOT REFERENCE MATERIAL**

This task implements a systematic approach to project execution and knowledge capture using the PDAC methodology.

## Workflow Overview

**PLAN-DELEGATE-ASSESS-CODIFY (PDAC)** is a four-phase workflow for executing complex projects:

1. **PLAN**: Analyze requirements, break down tasks, identify specialists
2. **DELEGATE**: Route tasks to appropriate specialist agents
3. **ASSESS**: Review completed work for quality and completeness
4. **CODIFY**: Capture learnings, patterns, and best practices

## Phase 1: PLAN 📋

### Objective
Thoroughly analyze the project requirements and create an actionable execution plan.

### Steps

**1.1 Requirements Analysis**
- Load project context (CLAUDE.md, README, docs/)
- Identify project objectives and success criteria
- List all features/capabilities needed
- Identify constraints and dependencies

**1.2 Task Breakdown**
Break the project into discrete, delegatable tasks:
- Feature implementation tasks
- Code review tasks
- Testing tasks
- Documentation tasks
- Optimization tasks
- Security review tasks

**1.3 Specialist Mapping**
For each task, identify the best specialist agent:

| Task Type | Specialist Agent | Example |
|-----------|-----------------|---------|
| Next.js pages/routes | `@agent-react-nextjs-expert` | App Router, SSR, Server Actions |
| React components | `@agent-react-component-architect` | Hooks, composition, patterns |
| Backend/services | `@agent-backend-developer` | Service layer, business logic |
| API design | `@agent-api-architect` | RESTful, GraphQL, OpenAPI |
| Tailwind styling | `@agent-tailwind-css-expert` | Responsive, utility-first |
| Code review | `@agent-code-reviewer` | Security, quality, best practices |
| Performance | `@agent-performance-optimizer` | Bottlenecks, optimization |
| Documentation | `@agent-documentation-specialist` | Technical docs, API specs |
| UX/UI design | Sally (ux-expert) | Wireframes, specs, prototypes |
| Market research | Mary (analyst) | Competitive analysis, research |

**1.4 Dependency Graph**
Create task execution order:
- Which tasks must be completed first?
- Which tasks can run in parallel?
- What are the critical path items?

**1.5 Risk Assessment**
Identify risks for each task:
- Technical complexity
- Unknown requirements
- Integration challenges
- Time constraints

**Output: Execution Plan Document**
```markdown
# Execution Plan: [Project Name]

## Objectives
[List project objectives]

## Success Criteria
[Define what "done" looks like]

## Task Breakdown

### Phase 1: Foundation
- [ ] Task 1: [Description] → @agent-X
- [ ] Task 2: [Description] → @agent-Y

### Phase 2: Core Features
- [ ] Task 3: [Description] → @agent-Z
- [ ] Task 4: [Description] → @agent-A

### Phase 3: Polish & Optimization
- [ ] Task 5: [Description] → @agent-B
- [ ] Task 6: [Description] → @agent-C

## Dependencies
- Task 3 requires Task 1, 2 to complete
- Task 5 requires all Phase 2 tasks

## Risk Assessment
- HIGH RISK: Task 3 (complex integration)
- MEDIUM RISK: Task 5 (performance unknowns)

## Timeline Estimate
- Phase 1: X hours
- Phase 2: Y hours
- Phase 3: Z hours
```

---

## Phase 2: DELEGATE 🚀

### Objective
Execute the plan by delegating tasks to specialist agents and coordinating their work.

### Steps

**2.1 Agent Invocation**
For each task in the execution plan:

```bash
# Example delegation pattern
claude "use @agent-react-nextjs-expert to [task description]"
claude "use @agent-backend-developer to [task description]"
```

**2.2 Parallel Execution**
When tasks have no dependencies, delegate in parallel:
```bash
# Parallel delegation example
claude "use @agent-react-component-architect to build UserProfile component AND use @agent-tailwind-css-expert to create design system"
```

**2.3 Context Provision**
Provide each agent with:
- Clear task description
- Success criteria
- Constraints (time, tech stack, patterns to follow)
- Dependencies (what they can assume is done)
- Output requirements (code, docs, tests)

**2.4 Progress Tracking**
Track completion status:
```markdown
## Delegation Status

### Phase 1: Foundation ✅ COMPLETE
- [x] Task 1: Database schema → @agent-backend-developer ✅
- [x] Task 2: API routes → @agent-api-architect ✅

### Phase 2: Core Features 🔄 IN PROGRESS
- [x] Task 3: User dashboard → @agent-react-nextjs-expert ✅
- [ ] Task 4: Admin panel → @agent-react-nextjs-expert 🔄

### Phase 3: Polish & Optimization ⏳ PENDING
- [ ] Task 5: Performance optimization → @agent-performance-optimizer ⏳
- [ ] Task 6: Code review → @agent-code-reviewer ⏳
```

**2.5 Handoff Coordination**
When tasks have dependencies, coordinate handoffs:
- Ensure Task A output meets Task B input requirements
- Provide summary of what was delivered
- Highlight any deviations or discoveries

**Output: Delegation Log**
```markdown
# Delegation Log: [Project Name]

## Task 1: Database Schema Design
- **Agent**: @agent-backend-developer
- **Started**: 2025-10-23 10:00
- **Completed**: 2025-10-23 10:45
- **Status**: ✅ COMPLETE
- **Outputs**:
  - `lib/services/user-service.ts`
  - `types/database.ts`
- **Notes**: Added additional indexes for performance

## Task 2: API Route Implementation
- **Agent**: @agent-api-architect
- **Started**: 2025-10-23 11:00
- **Completed**: 2025-10-23 12:15
- **Status**: ✅ COMPLETE
- **Outputs**:
  - `app/api/users/route.ts`
  - `app/api/users/[id]/route.ts`
- **Notes**: Used service layer pattern as planned

[Continue for all tasks...]
```

---

## Phase 3: ASSESS 🔍

### Objective
Evaluate the quality, completeness, and integration of all delegated work.

### Steps

**3.1 Individual Task Assessment**
For each completed task, evaluate:

**Quality Checklist:**
- [ ] Meets requirements specified in plan
- [ ] Follows project conventions (CLAUDE.md)
- [ ] Code quality is high (TypeScript strict, clean code)
- [ ] Tests are included (unit, integration, E2E as appropriate)
- [ ] Documentation is adequate
- [ ] Error handling is comprehensive
- [ ] Performance is acceptable
- [ ] Security best practices followed

**3.2 Integration Assessment**
Verify tasks work together:
- [ ] Data flows correctly between components
- [ ] APIs integrate with frontend
- [ ] Services connect to database properly
- [ ] Authentication/authorization works end-to-end
- [ ] Error handling is consistent across layers

**3.3 Gap Analysis**
Identify what's missing or incomplete:
- Features not fully implemented
- Edge cases not handled
- Tests not written
- Documentation gaps
- Performance issues
- Security vulnerabilities

**3.4 Quality Scoring**
Rate each task and overall project:

```markdown
## Assessment Scores

### Task 1: Database Schema
- Requirements Met: 10/10
- Code Quality: 9/10
- Testing: 8/10
- Documentation: 9/10
**Task Score: 36/40 (90%)**

### Task 2: API Routes
- Requirements Met: 9/10
- Code Quality: 10/10
- Testing: 7/10
- Documentation: 8/10
**Task Score: 34/40 (85%)**

### Overall Project Assessment
- Feature Completeness: 85%
- Code Quality: 92%
- Testing Coverage: 75%
- Documentation: 88%
- Integration: 90%
**Overall Score: 86%**
```

**3.5 Issue Categorization**
Categorize findings by severity:

- 🔴 **CRITICAL**: Blocking issues, must fix before deployment
- 🟡 **HIGH**: Important issues, should fix soon
- 🟢 **MEDIUM**: Nice-to-have improvements
- ⚪ **LOW**: Minor polish, future consideration

**3.6 Recommendations**
Provide actionable next steps:
1. Prioritized list of fixes needed
2. Suggested refactoring opportunities
3. Technical debt to address
4. Future enhancements to consider

**Output: Assessment Report**
```markdown
# Assessment Report: [Project Name]
**Date**: 2025-10-23
**Assessor**: Claude Code

## Executive Summary
[2-3 sentence overview of project status]

## Overall Scores
- Feature Completeness: 85%
- Code Quality: 92%
- Testing Coverage: 75%
- Documentation: 88%
- Integration: 90%
**Project Health: 86% (B+)**

## Detailed Task Assessments
[Individual task scores and findings]

## Issues Found

### 🔴 CRITICAL (Must Fix)
1. **Authentication bypass in admin routes** (app/api/admin/route.ts:45)
   - Missing auth check allows unauthenticated access
   - Fix: Add `await requireAuth()` middleware

### 🟡 HIGH (Should Fix)
1. **Missing error boundaries** (app/dashboard/page.tsx)
   - Unhandled errors crash entire dashboard
   - Fix: Wrap in ErrorBoundary component

2. **No E2E tests for checkout flow**
   - Critical user flow untested
   - Fix: Add Playwright tests for checkout

### 🟢 MEDIUM (Nice to Have)
1. **Inconsistent loading states** (components/*)
   - Some components show spinners, others show skeletons
   - Fix: Standardize on skeleton pattern

### ⚪ LOW (Future Consideration)
1. **Bundle size optimization** (Next.js build)
   - Could reduce bundle by 15% with dynamic imports
   - Consider: Lazy load admin panel components

## Integration Assessment
✅ Frontend-Backend: Excellent
✅ Database-Services: Excellent
⚠️ Authentication: Gaps found (see critical issues)
✅ Error Handling: Good
⚠️ Testing: Coverage gaps

## Recommendations

### Immediate Actions (Before Deployment)
1. Fix critical authentication issue
2. Add error boundaries to main routes
3. Write E2E tests for critical flows

### Short-Term (Next Sprint)
1. Improve testing coverage to 85%+
2. Standardize loading states
3. Complete missing documentation

### Long-Term (Technical Debt)
1. Refactor admin panel for better code reuse
2. Implement bundle size optimizations
3. Add performance monitoring

## Conclusion
Project is **86% complete** and in **good shape** overall. Critical issues must be addressed before production deployment, but overall architecture and code quality are strong. Recommend fixing critical and high-priority issues, then deploy to staging for QA.
```

---

## Phase 4: CODIFY 📚

### Objective
Capture learnings, patterns, and best practices discovered during execution for future reference.

### Steps

**4.1 Pattern Extraction**
Identify reusable patterns discovered:
- Architectural patterns (service layer, API structure)
- Code patterns (error handling, validation)
- Testing patterns (test setup, fixtures)
- Documentation patterns (README structure, API docs)

**4.2 Best Practices Documentation**
Document what worked well:
- Effective agent delegation strategies
- Useful tool combinations
- Efficient workflows
- Quality gates that caught issues

**4.3 Anti-Pattern Documentation**
Document what to avoid:
- Approaches that didn't work
- Common mistakes made
- Inefficient processes
- Quality issues that slipped through

**4.4 Agent Performance Assessment**
Evaluate specialist agent effectiveness:
- Which agents delivered high-quality work?
- Which agents needed more guidance?
- Which task-agent pairings worked best?
- Where were handoffs smooth vs. problematic?

**4.5 Process Improvements**
Recommend workflow enhancements:
- How could PLAN phase be improved?
- What would make DELEGATE more efficient?
- How could ASSESS be more thorough?
- What should be added to this CODIFY phase?

**4.6 Knowledge Base Update**
Update project knowledge base:
- Add new patterns to `.bmad-core/data/patterns.md`
- Update coding standards in `docs/architecture/coding-standards.md`
- Document lessons learned in `docs/lessons-learned.md`
- Update CLAUDE.md with new guidance

**Output: Codification Document**
```markdown
# PDAC Codification: [Project Name]
**Date**: 2025-10-23
**Project**: Fleet Management V2

## Patterns Discovered

### Architectural Patterns

#### Service Layer Pattern (VALIDATED ✅)
**Description**: All database operations go through service functions
**Files**: `lib/services/*.ts`
**Effectiveness**: Excellent
**Recommendation**: Continue using; enforce in code reviews

**Example**:
```typescript
// ✅ GOOD: Use service layer
import { getPilots } from '@/lib/services/pilot-service'
const pilots = await getPilots()

// ❌ BAD: Direct Supabase call
const { data } = await supabase.from('pilots').select('*')
```

#### API Route Pattern (VALIDATED ✅)
**Description**: Consistent error handling and response format in API routes
**Files**: `app/api/*/route.ts`
**Effectiveness**: Very Good
**Recommendation**: Codify as template for new routes

**Example**:
```typescript
export async function GET(request: Request) {
  try {
    const data = await serviceFunction()
    return NextResponse.json({ success: true, data })
  } catch (error) {
    return handleApiError(error)
  }
}
```

### Code Patterns

#### Form Validation Pattern (VALIDATED ✅)
**Description**: React Hook Form + Zod for all forms
**Files**: `components/forms/*.tsx`, `lib/validations/*.ts`
**Effectiveness**: Excellent
**Recommendation**: Make this mandatory for all new forms

#### Error Boundary Pattern (NEEDS IMPROVEMENT ⚠️)
**Description**: Wrap route segments in error boundaries
**Files**: `components/error-boundary.tsx`
**Effectiveness**: Good but inconsistently applied
**Recommendation**: Add to all major route segments

### Testing Patterns

#### E2E Test Structure (VALIDATED ✅)
**Description**: Playwright tests with clear arrange-act-assert
**Files**: `e2e/*.spec.ts`
**Effectiveness**: Excellent
**Recommendation**: Use as template for new E2E tests

## Best Practices Validated

### What Worked Well

1. **Agent Specialization**
   - Using `@agent-react-nextjs-expert` for Next.js specific work produced excellent results
   - `@agent-code-reviewer` caught 12 issues before they reached production
   - `@agent-performance-optimizer` identified 3 significant bottlenecks

2. **Parallel Delegation**
   - Running component development and backend work in parallel saved ~40% time
   - No integration issues despite parallel work (good specs helped)

3. **Comprehensive Planning**
   - Detailed PLAN phase prevented rework and confusion
   - Dependency graph helped coordinate agent handoffs smoothly

4. **Regular Assessment Checkpoints**
   - Assessing after each phase caught issues early
   - Prevented accumulation of technical debt

### Agent Performance

| Agent | Tasks Assigned | Quality Score | Speed | Notes |
|-------|---------------|---------------|-------|-------|
| `@agent-react-nextjs-expert` | 5 | 9/10 | Fast | Excellent Next.js 15 knowledge |
| `@agent-backend-developer` | 3 | 10/10 | Medium | Perfect service layer implementation |
| `@agent-code-reviewer` | 1 | 10/10 | Slow | Very thorough, caught critical issues |
| `@agent-performance-optimizer` | 1 | 8/10 | Fast | Good recommendations, some needed clarification |
| `@agent-tailwind-css-expert` | 2 | 9/10 | Fast | Excellent responsive design |

**Best Performers**:
- `@agent-backend-developer` (perfect quality)
- `@agent-code-reviewer` (critical issue detection)

**Recommendations**:
- Use `@agent-code-reviewer` before all major deployments
- Give `@agent-performance-optimizer` more context for better results

## Anti-Patterns to Avoid

### What Didn't Work

1. **Insufficient Context in Delegation**
   - When we didn't provide enough context to agents, they made incorrect assumptions
   - **Fix**: Always include relevant CLAUDE.md sections and examples

2. **Skipping Integration Assessment**
   - When we didn't test integration between components, issues appeared later
   - **Fix**: Always run integration checks after Phase 2

3. **Vague Task Descriptions**
   - "Improve performance" is too vague; agents need specific targets
   - **Fix**: Provide measurable success criteria (e.g., "reduce page load to <2s")

4. **Not Reviewing Agent Output Immediately**
   - Letting agent output sit before review caused context loss
   - **Fix**: Review and assess immediately after delegation

## Process Improvements

### Enhancements for Future PDAC Workflows

**PLAN Phase:**
- ✅ Add "Success Criteria Definition" step (measurable outcomes)
- ✅ Create visual dependency graph (not just text list)
- ✅ Add time estimates for each task
- ✅ Identify potential blockers upfront

**DELEGATE Phase:**
- ✅ Use parallel delegation more aggressively (saved significant time)
- ✅ Create standard context templates for each agent type
- ✅ Add checkpoint reviews between phases (don't wait until ASSESS)
- ✅ Maintain real-time progress dashboard

**ASSESS Phase:**
- ✅ Add automated test runs before manual assessment
- ✅ Use scoring rubrics (we added this, keep it)
- ✅ Include user acceptance testing (not just technical)
- ✅ Run security scans automatically

**CODIFY Phase:**
- ✅ Extract reusable code snippets to templates
- ✅ Create checklists for common task types
- ✅ Build pattern library over time
- ✅ Share learnings across projects

## Knowledge Base Updates

### Files to Update

1. **`.bmad-core/data/patterns.md`**
   - Add: Service Layer Pattern
   - Add: API Route Pattern
   - Add: Form Validation Pattern

2. **`docs/architecture/coding-standards.md`**
   - Enforce: Service layer for all DB operations
   - Enforce: React Hook Form + Zod for forms
   - Add: Error boundary requirements

3. **`CLAUDE.md`**
   - Add: "Always use @agent-code-reviewer before deployment"
   - Add: "Parallel delegation saves ~40% time when dependencies allow"
   - Add: "Provide measurable success criteria to agents"

4. **`.bmad-core/templates/agent-context-template.md`** (NEW FILE)
   - Create: Standard context format for agent delegation
   - Include: Project overview, constraints, success criteria, examples

### New Templates Created

1. **API Route Template** (`templates/api-route-template.ts`)
2. **Form Component Template** (`templates/form-component-template.tsx`)
3. **Service Function Template** (`templates/service-template.ts`)
4. **E2E Test Template** (`templates/e2e-test-template.spec.ts`)

## Metrics & Analytics

### Project Metrics
- **Tasks Completed**: 12/12 (100%)
- **On-Time Delivery**: 11/12 (92%)
- **Quality Score**: 86/100
- **Critical Issues Found**: 1 (caught in ASSESS phase)
- **Rework Required**: 2 tasks (17%)

### Time Breakdown
- **PLAN Phase**: 2 hours
- **DELEGATE Phase**: 8 hours (actual work by agents)
- **ASSESS Phase**: 1.5 hours
- **CODIFY Phase**: 1 hour
- **Total**: 12.5 hours

### Efficiency Gains
- **Time Saved via Parallel Delegation**: ~40% (3 hours)
- **Issues Prevented**: 12 (via code review)
- **Technical Debt Avoided**: Significant (via pattern enforcement)

## Conclusion

The PDAC workflow was **highly effective** for this project:

**Strengths:**
- Systematic approach prevented missed requirements
- Agent specialization delivered high-quality work
- Regular assessment caught issues early
- Codification captures reusable knowledge

**Areas for Improvement:**
- Need better time estimates in PLAN phase
- Should run automated checks before ASSESS phase
- Could improve agent context templates

**Recommendation**: **Use PDAC for all future projects of similar complexity.** The workflow overhead (~4.5 hours) is justified by quality improvements and knowledge capture.

**Next Steps:**
1. ✅ Update knowledge base with patterns discovered
2. ✅ Create templates for reuse
3. ✅ Share PDAC learnings with team
4. ✅ Schedule PDAC retrospective to refine process
```

---

## Workflow Execution Guide

### Standard Mode Execution

Execute each phase sequentially with user approval:

1. **Start PLAN Phase**: Analyze requirements, create execution plan
2. **Present Plan**: Review with user, get approval to proceed
3. **Start DELEGATE Phase**: Begin agent delegation based on plan
4. **Progress Updates**: Provide status updates as tasks complete
5. **Start ASSESS Phase**: Evaluate all completed work
6. **Present Assessment**: Review findings with user
7. **Start CODIFY Phase**: Capture learnings and patterns
8. **Present Codification**: Review knowledge captured

### YOLO Mode Execution

Execute all phases rapidly with minimal user interaction:

1. ✅ PLAN: Create execution plan automatically
2. ✅ DELEGATE: Invoke agents in sequence/parallel
3. ✅ ASSESS: Run quality checks and generate report
4. ✅ CODIFY: Extract patterns and update knowledge base

**Present only:**
- Final assessment report
- Codification document
- Critical issues requiring immediate attention

### Hybrid Mode (Recommended)

Balance speed and control:

1. **PLAN**: Present plan, get user approval (checkpoint)
2. **DELEGATE**: Execute automatically with progress updates
3. **ASSESS**: Present assessment report (checkpoint)
4. **CODIFY**: Execute automatically, present final document

## Output Artifacts

After completing PDAC workflow, you will have:

1. **`docs/execution-plan-[DATE].md`** - Detailed task breakdown and delegation plan
2. **`docs/delegation-log-[DATE].md`** - Record of all agent invocations and outputs
3. **`docs/assessment-report-[DATE].md`** - Comprehensive quality assessment
4. **`docs/pdac-codification-[DATE].md`** - Patterns, learnings, and improvements
5. **Updated knowledge base** - Patterns added to `.bmad-core/data/`
6. **New templates** - Reusable templates created from patterns

## Success Criteria

The PDAC workflow is successful when:

- ✅ All requirements from PLAN phase are met
- ✅ All tasks delegated in DELEGATE phase are completed
- ✅ Assessment in ASSESS phase shows 80%+ quality score
- ✅ Critical issues identified and fixed
- ✅ At least 3 reusable patterns codified
- ✅ Knowledge base updated with learnings
- ✅ Project is ready for deployment (or next phase)

## Tips for Effective PDAC Execution

1. **Be thorough in PLAN** - Time spent planning saves 10x in execution
2. **Use parallel delegation** - When dependencies allow, run agents concurrently
3. **Assess incrementally** - Don't wait until all work is done; assess after each phase
4. **Codify continuously** - Capture patterns as you discover them, not just at end
5. **Involve specialists** - Use the right agent for each task type
6. **Measure everything** - Track time, quality, issues for continuous improvement
7. **Update templates** - Turn every CODIFY output into reusable templates

## When to Use PDAC

**Ideal for:**
- ✅ New feature development (medium to large)
- ✅ Complex refactoring projects
- ✅ Multi-component implementations
- ✅ Cross-cutting concerns (security, performance)
- ✅ Knowledge capture initiatives
- ✅ Process improvement projects

**Not ideal for:**
- ❌ Quick bug fixes (too much overhead)
- ❌ Single-file changes (use direct agent invocation)
- ❌ Urgent hotfixes (no time for full workflow)
- ❌ Exploratory prototypes (too structured)

**Use simpler workflows for small tasks; use PDAC for complex, high-stakes projects.**
