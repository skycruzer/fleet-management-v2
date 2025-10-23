# PLAN-DELEGATE-ASSESS-CODIFY (PDAC) Workflow

Execute systematic project workflow with knowledge capture.

## What is PDAC?

**PLAN-DELEGATE-ASSESS-CODIFY** is a comprehensive project execution methodology:

1. **📋 PLAN**: Analyze requirements, break down tasks, identify specialists
2. **🚀 DELEGATE**: Route tasks to specialist agents, coordinate execution
3. **🔍 ASSESS**: Evaluate quality, completeness, integration
4. **📚 CODIFY**: Capture patterns, learnings, best practices

## Usage

```bash
/BMad:pdac
```

## Workflow Phases

### Phase 1: PLAN 📋
**Duration**: ~2 hours for complex projects

**Activities:**
- Requirements analysis
- Task breakdown
- Specialist mapping (which agent for each task)
- Dependency graphing
- Risk assessment

**Output**: `docs/execution-plan-[DATE].md`

### Phase 2: DELEGATE 🚀
**Duration**: Variable (depends on project size)

**Activities:**
- Agent invocation (sequential or parallel)
- Progress tracking
- Handoff coordination
- Context provision

**Output**: `docs/delegation-log-[DATE].md`

### Phase 3: ASSESS 🔍
**Duration**: ~1.5 hours

**Activities:**
- Individual task assessment (quality, completeness)
- Integration assessment (do components work together?)
- Gap analysis (what's missing?)
- Quality scoring (X/100)
- Issue categorization (🔴🟡🟢⚪)
- Recommendations (prioritized next steps)

**Output**: `docs/assessment-report-[DATE].md`

### Phase 4: CODIFY 📚
**Duration**: ~1 hour

**Activities:**
- Pattern extraction (what's reusable?)
- Best practices documentation
- Anti-pattern documentation (what to avoid)
- Agent performance assessment
- Process improvements
- Knowledge base updates

**Output**: `docs/pdac-codification-[DATE].md`

## Execution Modes

### Standard Mode (Recommended)
Present plan and assessment to user for approval at key checkpoints:
- After PLAN (review execution plan)
- After ASSESS (review quality report)

### YOLO Mode ⚡
Execute all phases rapidly with minimal interaction:
```bash
/BMad:agents:analyst
*yolo
/BMad:pdac
```

### Hybrid Mode
PLAN → get approval → DELEGATE (auto) → ASSESS → review → CODIFY (auto)

## When to Use PDAC

**✅ Ideal For:**
- New feature development (medium to large)
- Complex refactoring projects
- Multi-component implementations
- Cross-cutting concerns (security, performance)
- Knowledge capture initiatives
- High-stakes projects requiring quality assurance

**❌ Not For:**
- Quick bug fixes (too much overhead)
- Single-file changes (use direct agent)
- Urgent hotfixes (no time for full workflow)
- Exploratory prototypes (too structured)

## Benefits

**🎯 Systematic Execution**
- No missed requirements
- Clear task ownership
- Coordinated agent work

**📊 Quality Assurance**
- Comprehensive assessment
- Issue categorization
- Early problem detection

**📚 Knowledge Capture**
- Patterns documented
- Learnings preserved
- Continuous improvement

**⚡ Efficiency**
- Parallel delegation when possible
- Specialist agents for each task
- Reduced rework

## Output Artifacts

After PDAC completion:
1. ✅ Execution plan with task breakdown
2. ✅ Delegation log with agent assignments
3. ✅ Assessment report with quality scores
4. ✅ Codification document with patterns
5. ✅ Updated knowledge base
6. ✅ New templates for reuse

## Example Use Cases

### Use Case 1: New Feature Development
**Scenario**: Build pilot leave management system
```bash
/BMad:pdac
```
**PLAN**: Break down into DB schema, API routes, UI components, tests
**DELEGATE**: @agent-backend-developer → schema, @agent-react-nextjs-expert → UI
**ASSESS**: Verify integration, test coverage, quality
**CODIFY**: Document leave calculation patterns for future use

### Use Case 2: Performance Optimization
**Scenario**: Optimize dashboard performance
```bash
/BMad:pdac
```
**PLAN**: Identify bottlenecks, prioritize optimizations
**DELEGATE**: @agent-performance-optimizer → analyze and fix
**ASSESS**: Measure improvements, verify no regressions
**CODIFY**: Document optimization techniques

### Use Case 3: Security Audit & Fix
**Scenario**: Security review before production
```bash
/BMad:pdac
```
**PLAN**: Define security checklist, areas to review
**DELEGATE**: @agent-code-reviewer → security audit
**ASSESS**: Verify all vulnerabilities fixed
**CODIFY**: Document security patterns, update security guidelines

## Tips for Success

1. **Be Thorough in PLAN**: Time spent planning saves 10x in execution
2. **Use Parallel Delegation**: Run independent tasks concurrently
3. **Assess Incrementally**: Don't wait until end; check after each phase
4. **Codify Continuously**: Capture patterns as discovered, not just at end
5. **Measure Everything**: Track time, quality, issues for improvement

## Integration with Other Workflows

**Combine with:**
- `/BMad:project-review` - Run PDAC, then project-review for final check
- `/BMad:start-to-finish` - Use PDAC as core execution engine
- `/BMad:agents:analyst` - Start with market research, then PDAC implementation

## Success Criteria

PDAC is successful when:
- ✅ All requirements met (100%)
- ✅ Quality score 80%+ in ASSESS phase
- ✅ Critical issues identified and fixed
- ✅ 3+ reusable patterns codified
- ✅ Knowledge base updated
- ✅ Project ready for next phase/deployment

## Time Investment

**Typical Timeline:**
- Small project (1-2 features): 6-8 hours total
- Medium project (5-10 features): 12-20 hours total
- Large project (complex system): 40+ hours total

**ROI:**
- Prevents rework: Save 20-30% time vs. ad-hoc development
- Improves quality: 50% fewer post-deployment issues
- Builds knowledge: Reusable patterns save time on future projects

## Getting Started

**First Time Using PDAC?**
1. Start with a medium-complexity feature (not too small, not huge)
2. Use Standard Mode (checkpoints for learning)
3. Review all outputs carefully
4. Adapt the workflow to your needs
5. Use YOLO mode once comfortable

**Ready to begin?**
```bash
/BMad:pdac
```

Let the workflow guide you through systematic, high-quality project execution! 🚀
