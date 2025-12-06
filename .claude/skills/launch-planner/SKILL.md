---
name: launch-planner
description: Transform app ideas into shippable MVPs using rapid validation methodology. Use when the user wants to build a new app, evaluate an idea, generate a PRD, create Claude Code prompts, scope an MVP, or make product decisions. Helps avoid feature creep and over-engineering by focusing on core user loops and real user validation.
---

# Launch Planner

A skill for transforming ideas into shippable MVPs through rapid validation and focused execution.

## Product Philosophy

**Ship fast. Validate with real users. No feature creep.**

Every decision filters through these three principles:

- Speed to user feedback trumps perfection
- Real usage data beats assumptions
- Core functionality beats comprehensive features

## Tech Stack

Default stack optimized for rapid iteration:

**Frontend:** Next.js (App Router)
**Backend:** Supabase (Database + Auth + Storage)
**Deployment:** Vercel
**Why:** This stack enables 0-to-production in hours, not days.

## MVP Scoping Rules

### Core Principle

Only build features that serve the core user loop. Everything else is noise.

### The One-Week Rule

If a feature takes more than 1 week to build, it's not MVP. Either:

- Break it into smaller pieces
- Find a simpler solution
- Cut it entirely

### Feature Triage

For every feature idea, ask:

1. Does it serve the core user loop? If no → cut it
2. Can users accomplish their goal without it? If yes → cut it
3. Can we validate the idea without it? If yes → defer it

## Critical Questions (Ask Before Building)

Never start coding without clear answers to:

### 1. Who is this for?

Be specific. "Everyone" is not an answer.

- What's their current workflow?
- What's their pain point?
- How are they solving it today?

### 2. What's the ONE problem it solves?

Not two problems. Not three. ONE.

- If you can't describe it in one sentence, scope is too broad
- This sentence becomes your north star

### 3. How will I know if it works?

Define success before building:

- What's the key metric?
- What number indicates validation?
- When do we pivot vs. iterate?

## Common Mistakes to Avoid

### Building Features Nobody Asked For

**Red flag:** "Users will probably want..."
**Fix:** Talk to users first. Build second.

### Over-Engineering

**Red flag:** "We should make it scalable/flexible/configurable..."
**Fix:** Build for 10 users, not 10,000. Premature optimization kills momentum.

### Adding Auth Before Validating the Idea

**Red flag:** Starting with user accounts, profiles, settings
**Fix:** Validate the core value prop first. Auth can wait. Use magic links or simple passwords when you need it.

### Scope Creep Mid-Build

**Red flag:** "While we're at it, we should also add..."
**Fix:** Write it down. Build it after validation. Stay focused.

### Perfectionism

**Red flag:** "This isn't ready to show users yet..."
**Fix:** If it works, it's ready. Users forgive bugs if the value is there.

## Workflows

### Workflow 1: Idea → PRD

When user shares an app idea, generate a lean PRD:

1. **Ask the critical questions** (if not already clear)
   - Who is this for?
   - What's the one problem?
   - How will we measure success?

2. **Generate PRD** using references/prd-template.md as structure

3. **Ruthlessly scope** using MVP rules
   - Flag any features that violate one-week rule
   - Identify the minimum viable feature set
   - Suggest what to build first vs. defer

### Workflow 2: PRD → Claude Code Starter Prompt

When user has a PRD and wants to start building:

1. **Review PRD** for technical clarity
   - Are data models defined?
   - Are user flows clear?
   - Are success metrics measurable?

2. **Generate starter prompt** for Claude Code that includes:
   - Tech stack (Next.js, Supabase, Vercel)
   - Data models and schema
   - Core user flows to implement
   - What NOT to build (scope constraints)
   - Success criteria

3. **Format for immediate use** in Claude Code terminal

### Workflow 3: Mid-Build Product Advice

When user asks for advice during development:

1. **Ground in philosophy**
   - Does this serve the core user loop?
   - Does this move us closer to validation?
   - Is this the simplest solution?

2. **Apply MVP scoping rules**
   - Can this wait until after validation?
   - Is there a faster way to test this assumption?
   - What's the 80/20 version?

3. **Keep focused on shipping**
   - Remind of the one-week rule
   - Suggest simpler alternatives
   - Encourage shipping over perfecting

### Workflow 4: Feature Creep Prevention

When detecting scope expansion:

1. **Acknowledge the idea** (it might be good!)

2. **Park it** in a "post-MVP" list
   - Document it
   - Explain why it's deferred
   - Set conditions for revisiting

3. **Refocus on core**
   - What's the minimum to validate?
   - What can users forgive?
   - What's blocking shipping?

## Templates & References

- **PRD Template**: See references/prd-template.md for lean PRD structure
- **Common Mistakes**: See references/common-mistakes.md for detailed anti-patterns with examples
- **MVP Examples**: See references/mvp-examples.md for real-world scoping examples

## Quick Reference

### MVP Checklist

- [ ] Answers "who is this for?" specifically
- [ ] Solves exactly one problem
- [ ] Has measurable success criteria
- [ ] Core user loop is clear
- [ ] All features buildable in <1 week
- [ ] No premature optimization
- [ ] Auth deferred until needed
- [ ] Ready to show to users

### Red Flags

🚩 "Users will probably want..."
🚩 "We should make it scalable..."
🚩 "While we're at it..."
🚩 "This isn't ready to show yet..."
🚩 Feature takes >1 week
🚩 Can't explain the one problem in one sentence

### Green Lights

✅ Built from real user feedback
✅ Simplest possible solution
✅ Core loop works
✅ Can ship this week
✅ Users can accomplish their goal
✅ Metrics are defined
