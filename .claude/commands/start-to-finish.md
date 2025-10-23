# Start-to-Finish Workflow

This command executes a complete project workflow from planning through review.

## Workflow Stages

Execute the following agents/tasks in sequence:

### Stage 1: Analysis & Planning (Mary - Business Analyst)
```
/BMad:agents:analyst
*perform-market-research OR *create-project-brief
```

**Output:** Market research or project brief document

### Stage 2: UX/UI Design (Sally - UX Expert)
```
/BMad:agents:ux-expert
*create-front-end-spec
```

**Output:** Front-end specification with UI/UX requirements

### Stage 3: Technical Planning (Dev - PM)
```
/BMad:agents:pm
*create-technical-spec
*create-implementation-plan
```

**Output:** Technical specification and implementation plan

### Stage 4: Implementation (Dev Agent)
```
Use appropriate dev agent based on stack:
- @agent-react-nextjs-expert (for Next.js features)
- @agent-backend-developer (for backend/services)
- @agent-react-component-architect (for components)
```

**Output:** Implemented features with tests

### Stage 5: Code Review
```
@agent-code-reviewer
```

**Output:** Code review report with findings

### Stage 6: Testing & QA
```
npm test
npx playwright test
```

**Output:** Test results and coverage report

### Stage 7: Performance Optimization
```
@agent-performance-optimizer
```

**Output:** Performance analysis and optimizations

### Stage 8: Final Project Review
```
/BMad:project-review
```

**Output:** Comprehensive project review report

## Usage

Simply run:
```
/BMad:start-to-finish
```

The workflow will guide you through each stage, asking which stages to execute.

## Options

**Full Workflow:** Execute all stages
**Custom Workflow:** Select specific stages
**Quick Review:** Skip to Stage 8 (project review only)

## Notes

- Each stage builds on previous stages
- Can pause and resume at any stage
- Outputs are saved to appropriate locations (docs/, reports/)
- Use YOLO mode (`*yolo`) for faster execution with fewer confirmations
