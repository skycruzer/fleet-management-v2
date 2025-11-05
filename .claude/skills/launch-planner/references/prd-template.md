# Lean PRD Template

## Overview
One-paragraph summary: who this is for, what problem it solves, why now.

## Target User
**Who:** Specific persona, not "everyone"
**Current workflow:** How they solve this today
**Pain point:** What's broken or missing
**Quote:** Actual words from a real or hypothetical user describing the problem

## The One Problem
One sentence. This is your north star.

Example: "Freelancers lose 3+ hours/week manually tracking time across projects."

## Success Metrics
How you'll know if this works:
- **Primary metric:** The one number that matters most
- **Target:** What number indicates validation?
- **Timeframe:** When will you check this?

Example:
- Primary: Users track >5 projects/week
- Target: 50 active users in 30 days
- Timeframe: Check weekly for 4 weeks

## Core User Loop
The minimum path a user takes to get value:

1. [User action 1]
2. [User action 2]
3. [User action 3]
4. [Value delivered]

Keep this to 3-5 steps max. If it's longer, you're building too much.

## MVP Feature Set

### Must Have (Week 1)
Features that enable the core user loop. Without these, the app has no value.

- Feature 1: [Description]
  - Why: [Serves core loop because...]
  - Estimate: [X days]

- Feature 2: [Description]
  - Why: [Serves core loop because...]
  - Estimate: [X days]

**Total estimate:** Must be ≤5 days

### Deferred (Post-Validation)
Good ideas that don't block validation. Revisit after MVP ships.

- Feature name: [Why deferred]
- Feature name: [Why deferred]

### Explicitly Cut
Ideas that don't serve the core loop or violate MVP principles.

- Feature name: [Why cut]
- Feature name: [Why cut]

## User Stories

Write 3-5 core user stories in format:
"As [user], I want [action] so that [outcome]"

Focus on outcomes, not features.

## Data Model (High Level)

Minimum viable schema:
```
Table: users
- id
- [essential fields only]

Table: [primary entity]
- id
- user_id
- [essential fields only]
```

Don't design for scale. Design for validation.

## Technical Approach

**Stack:** Next.js, Supabase, Vercel (default unless strong reason to deviate)

**Key decisions:**
- How will data sync?
- What's the simplest auth approach?
- Any external APIs needed?

**What we're NOT building:**
- No [feature that's deferred]
- No [feature that's cut]
- No [premature optimization]

## Launch Criteria

What needs to be true before showing this to users?

- [ ] Core user loop works end-to-end
- [ ] Happy path is polished
- [ ] One user can accomplish their goal
- [ ] Key metric is measurable

Note: "Perfect" is not a launch criterion.

## Open Questions

What needs answering before/during build?
- Question 1?
- Question 2?

## Post-MVP Roadmap (If Validated)

Only think about this after validation. Listed in priority order:

1. [Feature based on user feedback]
2. [Optimization based on usage data]
3. [Scale/polish based on growth]

---

## Using This Template

**Fill out sections in order.** If you can't complete a section, your idea isn't ready yet.

**Be ruthless.** Most initial feature ideas belong in "Deferred" or "Explicitly Cut."

**Stay under one week.** If MVP Features > 5 days of work, cut more.

**Talk to users.** Before generating the PRD, validate assumptions with real people.