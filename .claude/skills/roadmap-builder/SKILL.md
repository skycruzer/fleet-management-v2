---
name: roadmap-builder
description: Provides ruthless prioritization framework for product decisions. Use when advising what to build next, challenging feature ideas, evaluating new features against Impact vs Effort matrix, applying stage-based rules (pre-launch, post-launch, growth), or keeping roadmaps focused by filtering feature creep. Enforces retention-first mindset and validates features against real user needs versus imaginary requirements.
---

# Roadmap Builder

Guide product decisions using a ruthless prioritization framework that prevents feature creep and keeps focus on what drives real user value.

## Prioritization Framework

### Impact vs Effort Matrix

Always evaluate features on two dimensions:

- **Impact**: How much does this move core metrics? (User retention, core loop completion, monetization, organic growth)
- **Effort**: Engineering time, complexity, maintenance burden

**Priority order:**

1. High Impact, Low Effort → Ship immediately
2. High Impact, High Effort → Plan carefully, break into phases
3. Low Impact, Low Effort → Only if it validates something
4. Low Impact, High Effort → Never build

### Category Hierarchy

Evaluate features in strict priority order:

1. **Retention** (Most critical)
   - Does this keep users coming back?
   - Does this reduce churn in the first week?
   - Does this make the core loop more satisfying?

2. **Core Features**
   - Is this essential to the main use case?
   - Would users notice if this was missing?
   - Does this make the core value prop stronger?

3. **Monetization**
   - Does this enable revenue without breaking the core loop?
   - Will users actually pay for this?
   - Can we validate willingness to pay first?

4. **Growth** (Lowest priority until retention is solid)
   - Does this increase sharing naturally?
   - Does this reduce friction in inviting others?
   - Will this actually drive organic growth?

## Stage-Based Rules

Apply strict constraints based on product stage:

### Pre-Launch Stage

**ONLY build features that are part of the core loop. Nothing else exists.**

Criteria:

- Is this required for the minimum viable experience?
- Can a user complete the core action without this?
- Does this serve the single most important use case?

❌ Forbidden at this stage:

- Social features
- Analytics dashboards
- Settings and preferences
- Profile customization
- Notifications (unless core to the loop)
- Any "nice to have" features

### Post-Launch Stage

**ONLY build features that users explicitly request after using the product.**

Criteria:

- Have at least 3 different users asked for this?
- Are users trying to hack around the absence of this feature?
- Is this blocking real user workflows (not imaginary ones)?

❌ Still forbidden:

- Features that "might be useful"
- Things competitors have (unless users are churning for it)
- Vanity metrics
- Premature scaling features

### Growth Phase

**ONLY build features that measurably reduce churn or increase sharing.**

Criteria:

- Will this demonstrably reduce Week 1 churn?
- Does this make sharing feel natural (not forced)?
- Can we measure the impact within 2 weeks?

## Validation Questions

Challenge every feature idea with these questions:

### Core Use Case Test

- **Does this serve the core use case?**
  - If removed, would the product still deliver its main value?
  - Is this a distraction from what users actually come here to do?

### Actual vs Imaginary Users

- **Will users actually use this or just say they want it?**
  - Have you observed users struggling without this?
  - Are they currently using workarounds?
  - Can you name 3 specific users who need this today?

### Fake It First

- **Can we fake it first to validate demand?**
  - Wizard of Oz: Can we manually deliver this before automating?
  - Landing page test: Will users click a button that says this feature is "coming soon"?
  - Concierge MVP: Can we do this manually for 10 users first?

### Impact Validation

- **What specific metric will this improve and by how much?**
  - Be specific: "Reduce 7-day churn from 60% to 50%"
  - How will we measure success?
  - What's the minimum viable improvement to justify the effort?

## Red Flags

Watch for these signs of feature creep:

### "Cool" Factor

❌ "This would be really cool"
❌ "Users would love this"
❌ "This is innovative"

✅ Instead: "Users are churning because they can't do X"

### Premature Optimization

❌ Building for scale before you have users
❌ Adding analytics before you know what to measure
❌ Performance optimization when performance isn't a complaint

✅ Instead: Build for 10 users first, then 100, then 1000

### Imaginary Users

❌ "Users might want..."
❌ "Power users would need..."
❌ "Enterprise customers will require..."

✅ Instead: "Sarah tried to do X three times yesterday and couldn't"

### Competitor Mimicry

❌ "Competitor X has this feature"
❌ "This is table stakes"
❌ "We need feature parity"

✅ Instead: "We're losing users to X because we can't do Y"

### Scope Creep Phrases

Watch for these danger phrases:

- "While we're at it..."
- "It would be easy to also..."
- "Just one more thing..."
- "We should probably add..."
- "What if we also..."

## How to Use This Skill

### When Advising What to Build Next

1. **Ask about stage**: Are they pre-launch, post-launch, or in growth phase?
2. **Apply stage rules**: Enforce the strict criteria for that stage
3. **Demand evidence**: Real user requests, observed behavior, not assumptions
4. **Calculate impact vs effort**: Plot it on the matrix
5. **Check category**: Does it fit the priority order?
6. **Recommend**: Clear yes/no with reasoning

### When Challenging Feature Ideas

1. **Run validation questions**: Force specificity on each question
2. **Identify red flags**: Call out any danger signs
3. **Propose alternatives**: Suggest how to validate with less effort
4. **Reframe**: Turn vague ideas into testable hypotheses

### When Keeping Roadmap Focused

1. **Regular audits**: Review backlog against criteria
2. **Cut ruthlessly**: Remove anything that doesn't pass validation
3. **Maintain core focus**: Constantly ask "does this serve the core use case?"
4. **Evidence-based only**: No features without user evidence

## Decision Framework

Use this decision tree for every feature request:

```
Feature Idea
    ├─> What stage are you in?
    │   ├─> Pre-launch
    │   │   └─> Is this part of core loop?
    │   │       ├─> Yes → Maybe (apply full framework)
    │   │       └─> No → ❌ Reject
    │   │
    │   ├─> Post-launch
    │   │   └─> Have 3+ users explicitly requested this?
    │   │       ├─> Yes → Maybe (apply full framework)
    │   │       └─> No → ❌ Reject
    │   │
    │   └─> Growth phase
    │       └─> Will this reduce churn or increase sharing?
    │           ├─> Yes → Maybe (apply full framework)
    │           └─> No → ❌ Reject
    │
    └─> Full Framework Evaluation
        ├─> Impact vs Effort?
        │   ├─> High Impact, Low Effort → ✅ Prioritize
        │   ├─> High Impact, High Effort → ⏸ Plan carefully
        │   ├─> Low Impact, Low Effort → 🧪 Validate first
        │   └─> Low Impact, High Effort → ❌ Reject
        │
        ├─> Category priority?
        │   ├─> Retention → Higher priority
        │   ├─> Core features → Medium priority
        │   ├─> Monetization → Lower priority
        │   └─> Growth → Lowest priority
        │
        ├─> Passes validation questions?
        │   ├─> Core use case? → Required
        │   ├─> Real vs imaginary users? → Required
        │   ├─> Can we fake it first? → Preferred
        │   └─> Measurable impact? → Required
        │
        └─> Any red flags?
            ├─> None → ✅ Proceed
            └─> Present → ❌ Reject or redesign
```

## Output Format

When providing roadmap advice, structure responses as:

**Recommendation**: Clear yes/no/maybe with brief reasoning

**Stage Check**: Which stage rules apply and whether this passes

**Impact vs Effort**: Plot on matrix with specific estimates

**Category**: Which category and its priority level

**Validation Results**: Answers to the 4 validation questions

**Red Flags**: Any concerns identified (or "None detected")

**Next Steps**: If approved, what's the minimum viable version? If rejected, what would make this viable?

## Examples

### ❌ Bad Feature Request

User: "I want to add a social feed where users can share their progress with friends"

Response:

- **Stage Check**: Post-launch. Have 3+ users requested this? [Need evidence]
- **Impact vs Effort**: High Effort, Unknown Impact → ⏸ Wait
- **Category**: Growth (lowest priority until retention is solid)
- **Red Flags**: Imaginary users ("friends might..."), premature feature
- **Recommendation**: ❌ Not yet. First, are users completing the core loop? What's Week 1 retention? Fix retention before adding growth features.
- **Alternative**: Add a simple "share result" button. If >20% of users click it, then consider a full social feature.

### ✅ Good Feature Request

User: "Users are churning because they forget to come back. I want to add email reminders."

Response:

- **Stage Check**: Post-launch. User behavior observed → ✅ Passes
- **Impact vs Effort**: High Impact (retention), Low Effort (email service) → ✅ Priority 1
- **Category**: Retention → Highest priority
- **Validation**:
  - Serves core use case? ✅ Brings users back to complete core loop
  - Real users? ✅ Observable churn pattern
  - Fake it first? ✅ Can manually email 10 users to test
  - Measurable? ✅ Track return rate for users who get reminders vs those who don't
- **Red Flags**: None detected
- **Recommendation**: ✅ Build MVP. Start with manual emails to 10 users. Measure return rate. If >30% return within 24 hours, automate it.
