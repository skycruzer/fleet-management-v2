# Common MVP Mistakes - Detailed Anti-Patterns

## 1. Building Features Nobody Asked For

### The Mistake

Adding features based on assumptions rather than user feedback.

### Real Examples

**Bad:** Building a task management app with:

- Priority levels (High/Medium/Low)
- Tags and categories
- Due date reminders
- Subtasks
- Comments
- File attachments
- Team assignments
  ...before a single user has created their first task.

**Why it's bad:**

- 6+ features built on assumptions
- Takes 2-3 weeks to build
- No validation of core value
- Most features will go unused

**Good:** Building a task management app with:

- Add task
- Mark complete
- View list

Ship in 2 days. Learn what users actually need.

### How to Catch It

Before adding any feature, ask: "Did a user explicitly request this?"

- If no → defer it
- If yes → ask how many users requested it
- If only one → still defer it

### Recovery

If you've already built unwanted features:

1. Don't delete them yet
2. Ship with just the core features visible
3. Track if anyone asks for the hidden features
4. Only reveal features when users specifically request them

## 2. Over-Engineering

### The Mistake

Building for imaginary scale or flexibility instead of current needs.

### Real Examples

**Bad - Premature Abstraction:**

```typescript
// Building a generic notification system
interface INotificationStrategy {
  send(notification: Notification): Promise<void>
}

class EmailNotificationStrategy implements INotificationStrategy { ... }
class SMSNotificationStrategy implements INotificationStrategy { ... }
class PushNotificationStrategy implements INotificationStrategy { ... }
class NotificationFactory { ... }
class NotificationQueue { ... }
```

You have 0 users. You need to send one email.

**Good - Simple Solution:**

```typescript
// Just send an email
await sendEmail({
  to: user.email,
  subject: 'Welcome!',
  body: 'Thanks for signing up.',
})
```

**Bad - Premature Optimization:**

- Setting up Redis caching before having 10 users
- Building a microservices architecture for an MVP
- Implementing custom pagination for 20 records
- Creating a complex state management system for 3 form fields

**Good - Start Simple:**

- Use Supabase queries directly
- Keep everything in one Next.js app
- Use browser's default infinite scroll
- Use React useState

### How to Catch It

Ask: "What breaks if I have 100 users?"

- If the answer is "nothing" → you don't need the complex solution
- If the answer is "performance" → that's a great problem to have later

### Red Flag Phrases

- "We should make this configurable..."
- "What if we need to support..."
- "Let's build it the right way from the start..."
- "This will make it easier to add [feature] later..."

### Recovery

If you've over-engineered:

1. Don't refactor yet (wastes more time)
2. Ship what you have
3. Only simplify if the complexity is blocking you

## 3. Adding Auth Before Validating the Idea

### The Mistake

Building user accounts, authentication, profiles, and permissions before validating core value.

### Real Examples

**Bad - Starting with Auth:**
Week 1 priorities:

- Set up Supabase auth
- Build signup flow
- Build login flow
- Password reset flow
- Email verification
- User profiles
- Account settings

Week 1 result: Perfect auth system. Zero validation of core idea.

**Good - Auth Later:**
Week 1 priorities:

- Build core feature
- Test with 5 people using shared demo account
- Validate the value prop

Week 2: Add simple auth only if validated

- Magic link (simplest)
- Or basic password
- Skip profiles, settings, verification

### Why It's Tempting

- Auth feels necessary
- It's well-documented
- It's a "known" problem
- It feels like progress

### Why It's Harmful

- Takes 2-3 days minimum
- Blocks getting to the valuable part
- Creates friction for testing
- Adds complexity to every feature

### When to Actually Add Auth

Only after:

1. Core value is validated
2. Users want to save their data
3. You need to distinguish between users

### Simple Auth Patterns

- **Demo mode:** One shared account for testing
- **Access codes:** Simple secret code → access (no signup)
- **Magic links:** Email → instant access (no password)
- **Social auth:** Google login only (one provider, nothing fancy)

## 4. Scope Creep Mid-Build

### The Mistake

Adding "just one more thing" while building, repeatedly.

### Real Example Timeline

**Day 1:** Start building simple invoice app

- Add invoice
- Send to email

**Day 2:** "While I'm at it..."

- Let's add PDF export
- And multiple currencies
- And tax calculations

**Day 3:** "This would be better if..."

- Add client management
- Add invoice templates
- Add payment tracking

**Day 7:** Project still not shipped. Original 2-day scope became a 2-week project.

### How It Happens

- Thinking of improvements while building
- Noticing "easy" additions
- Finding related features in other apps
- Wanting to ship something "complete"

### Prevention Strategy

**The Parking Lot:**

Create a `ideas.md` file:

```markdown
# Post-MVP Ideas

## From building

- PDF export (Day 2)
- Multi-currency (Day 2)
- Client management (Day 3)

## From testing

- [Add as you test]

## From users

- [Add as you get feedback]
```

Every time you think "we should also add...":

1. Write it in ideas.md
2. Do NOT build it
3. Continue with original scope

### Recovery

If scope has already crept:

1. List all features added beyond original plan
2. Mark which ones block shipping
3. Comment out or delete features that don't block shipping
4. Add them back only if users request them

## 5. Perfectionism

### The Mistake

Holding back from user testing because "it's not ready yet."

### Real Examples

**Signs of Perfectionism:**

- "The UI needs more polish"
- "I should add loading states"
- "The error messages aren't friendly enough"
- "The mobile version isn't perfect"
- "I want to fix this bug first"
- "Let me just add one more feature"

**Reality Check:**

- Users forgive ugly UIs if the value is there
- Users forgive bugs if the core works
- Users forgive missing features if the main thing works

### The Standard

**Minimum viable polish:**

- Does the core user loop work? → Ship it
- Can a user accomplish their goal? → Ship it
- Does it break in obvious ways? → Fix that, then ship it
- Is it aesthetically perfect? → Don't care, ship it

### Examples of "Good Enough"

**Good enough UI:**

- Default browser styles
- Tailwind defaults
- No custom illustrations
- No animations
- Basic responsive design

**Good enough errors:**

- "Something went wrong. Please try again."
- Technical errors are fine during MVP

**Good enough features:**

- Manual processes are OK
- Admin-only workflows are OK
- Unscalable solutions are OK

### The 80/20 Rule

If it works 80% of the time for 80% of users, ship it.

### Recovery from Perfectionism

Create launch criteria:

- [ ] Core loop works
- [ ] One person can get value
- [ ] No critical bugs (not "no bugs")

If all checked → ship immediately, no excuses.

## 6. Ignoring the One-Week Rule

### The Mistake

Convincing yourself that a 2-3 week feature is necessary for MVP.

### Common Rationalizations

- "This feature is core to the value prop"
- "Users will expect this"
- "It's important for quality"
- "I can build it faster than that"

### Reality Check

If it takes >1 week:

- It's too complex for MVP
- Break it down
- Or find a simpler solution
- Or cut it entirely

### Example Breakdown

**Too big:** "Build a scheduling system" (2 weeks)

**Broken down:**

- Week 1: Calendar view + manual booking → Ship this
- Week 2: Automated reminders → Only if validated
- Week 3: Multi-timezone support → Only if users ask
- Week 4: Integration with Google Calendar → Only if usage proves need

Ship week 1. Evaluate. Then decide on week 2.

## 7. Not Talking to Users First

### The Mistake

Building for weeks without validating assumptions with real people.

### What to Validate Before Building

- Is this actually a problem?
- How painful is it?
- How are they solving it now?
- Would they use a solution?
- What would they pay?

### How to Validate (Before Writing Code)

1. **Describe the solution** in 1-2 sentences
2. **Show to 5 people** who have the problem
3. **Ask:**
   - Does this solve your problem?
   - Would you use this?
   - What's missing?
   - What's unnecessary?

### Quick Validation Methods

- Post in relevant Slack/Discord communities
- DM people on Twitter/LinkedIn
- Comments in relevant Reddit threads
- Friends/colleagues who have the problem
- Feedback on a landing page

### After Building (Testing)

Don't wait for perfection. Show early:

- "I'm building X, here's a rough version"
- "It's not pretty but does it solve Y?"
- "What's the first thing you'd want to do?"

## Summary: The Anti-Pattern Checklist

Before building, verify you're not making these mistakes:

- [ ] Every feature has user validation (not assumptions)
- [ ] No premature optimization or abstraction
- [ ] Auth is deferred unless absolutely necessary
- [ ] Original scope is documented and unchanged
- [ ] "Perfect enough" standard is defined
- [ ] No feature takes more than 1 week
- [ ] At least 5 people confirmed this solves their problem

If any box is unchecked, stop and address it before continuing.
