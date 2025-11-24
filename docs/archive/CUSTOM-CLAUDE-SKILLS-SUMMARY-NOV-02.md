# Custom Claude Skills Summary

**Created**: November 2, 2025
**Author**: Maurice (Skycruzer)
**Location**: Downloaded from Claude Desktop → `~/Downloads/`

---

## Overview

You've created 5 powerful custom skills for Claude Desktop that form a complete product development workflow. These skills work together to take you from idea validation through design, planning, execution, and ongoing roadmap management.

## The 5 Skills

### 1. **Idea Validator**
📦 `idea-validator.skill` (2.4 KB)

**Purpose**: Brutally honest validation of app ideas before investing time building.

**When to Use**:
- User presents an app idea
- Need validation of a concept
- Before starting any new project
- Want to avoid building something nobody wants

**Key Features**:
- Evaluates 5 critical dimensions: Market Analysis, Demand Reality, Solo Builder Feasibility, Monetization, Interest Factor
- Provides clear verdict: "Build it" / "Maybe" / "Skip it"
- Lists similar existing products with pricing
- Suggests actionable improvements

**Evaluation Framework**:
1. **Market Analysis** - How crowded is the space? What's different?
2. **Demand Reality Check** - Do people actually pay for this or just say they want it?
3. **Solo Builder Feasibility** - Can this ship in 2-4 weeks by one person?
4. **Monetization Viability** - How would this make money?
5. **Interest Factor** - Is this genuinely compelling or just another utility app?

**Response Format**:
```markdown
**VERDICT: [Build it / Maybe / Skip it]**

**WHY:**
[2-3 sentences explaining the verdict]

**SIMILAR PRODUCTS:**
- Product 1 - What they do, pricing
- Product 2 - What they do, pricing
- Product 3 - What they do, pricing

**WHAT WOULD MAKE THIS STRONGER:**
- Specific actionable suggestion 1
- Specific actionable suggestion 2
- Specific actionable suggestion 3
```

**Key Principles**:
- Be brutally honest - save builder time, not feelings
- Avoid false positivity
- Focus on reality, not potential
- Cite real products that exist now
- Give actionable improvements

**Common Red Flags**:
- "It's like Uber but for X"
- Requires critical mass of users (network effects)
- "No one else is doing this" (usually means no demand)
- Relies on behavior change
- Complex B2B sales cycle
- "We'll figure out monetization later"

---

### 2. **Launch Planner**
📦 `launch-planner.skill` (12.4 KB)

**Purpose**: Transform app ideas into shippable MVPs using rapid validation methodology.

**When to Use**:
- User wants to build a new app
- Generate a PRD (Product Requirements Document)
- Create Claude Code prompts
- Scope an MVP
- Make product decisions
- Prevent feature creep

**Key Features**:
- 4 comprehensive workflows (Idea → PRD, PRD → Code Prompt, Mid-Build Advice, Feature Creep Prevention)
- Includes 3 reference files: PRD Template, Common Mistakes, MVP Examples
- Default tech stack: Next.js + Supabase + Vercel
- One-week rule: If feature takes >1 week, it's not MVP

**Product Philosophy**:
- Ship fast. Validate with real users. No feature creep.
- Speed to user feedback trumps perfection
- Real usage data beats assumptions
- Core functionality beats comprehensive features

**MVP Scoping Rules**:
- Only build features that serve the core user loop
- One-Week Rule: Features must be buildable in <1 week
- Feature Triage: Does it serve core loop? Can users accomplish goal without it? Can we validate without it?

**Critical Questions (Always Ask Before Building)**:
1. **Who is this for?** (Be specific, not "everyone")
2. **What's the ONE problem it solves?** (Not two, not three, ONE)
3. **How will I know if it works?** (Define success metrics)

**Common Mistakes to Avoid**:
- ❌ Building features nobody asked for
- ❌ Over-engineering (build for 10 users, not 10,000)
- ❌ Adding auth before validating the idea
- ❌ Scope creep mid-build
- ❌ Perfectionism ("not ready to show yet")

**4 Workflows**:
1. **Idea → PRD**: Ask critical questions → Generate lean PRD → Ruthlessly scope
2. **PRD → Claude Code Starter Prompt**: Review for technical clarity → Generate starter prompt with tech stack, data models, flows, constraints
3. **Mid-Build Product Advice**: Ground in philosophy → Apply MVP rules → Keep focused on shipping
4. **Feature Creep Prevention**: Acknowledge idea → Park it in "post-MVP" list → Refocus on core

**MVP Checklist**:
- [ ] Answers "who is this for?" specifically
- [ ] Solves exactly one problem
- [ ] Has measurable success criteria
- [ ] Core user loop is clear
- [ ] All features buildable in <1 week
- [ ] No premature optimization
- [ ] Auth deferred until needed
- [ ] Ready to show to users

---

### 3. **Design Guide**
📦 `design-guide.skill` (10.2 KB)

**Purpose**: Ensures modern, professional UI design across SwiftUI, Android, and web platforms.

**When to Use**:
- Building ANY user interface components
- Creating buttons, forms, cards, layouts, navigation
- Building complete screens
- Need to ensure clean, minimal, professional design

**Key Features**:
- 8 core design principles (Clean & Minimal, Color Palette, Spacing, Typography, Shadows, Rounded Corners, Interactive States, Mobile-First)
- Includes 2 reference files: Color Palettes, Component Templates
- Platform-specific notes for SwiftUI, Android, and Web

**Core Design Principles**:

**1. Clean and Minimal**
- Embrace white space generously
- One primary action per screen/section
- Remove unnecessary decorative elements

**2. Color Palette**
- Neutral base (grays/whites): 80%
- Secondary neutral: 15%
- ONE accent color: 5%
- NEVER use generic purple/blue gradients
- Good accents: Emerald (#10B981), Indigo (#6366F1), Rose (#F43F5E), Amber (#F59E0B)

**3. Spacing System (8px Grid)**
- Always use multiples of 8: 8, 16, 24, 32, 48, 64px
- 16px: Standard spacing (button padding, form gaps)
- 24px: Section spacing (card internal padding)
- 32px: Component spacing (between cards/sections)
- Never use arbitrary values like 13px or 27px

**4. Typography**
- H1: 32-40px, bold (page titles only)
- H2: 24-28px, semibold (section headers)
- H3: 20-24px, semibold (subsections)
- Body: 16-18px, regular (MINIMUM 16px)
- Max 2 font families per project
- Recommended: Inter, SF Pro, Roboto, or system fonts

**5. Shadows**
- Subtle, not heavy
- Small: `0 1px 3px rgba(0,0,0,0.12)`
- Medium: `0 4px 6px rgba(0,0,0,0.1)`
- Cards: subtle shadow OR border, not both

**6. Rounded Corners**
- Small elements: 6-8px
- Cards: 8-12px
- Large panels: 12-16px
- Circular: 50% or 9999px

**7. Interactive States (MANDATORY)**
- Buttons: default, hover, active, disabled, focus
- Form fields: default, focus, error, disabled
- Links: default, visited, hover
- Cards: default, hover, active

**8. Mobile-First**
- Touch targets: minimum 44x44px (iOS), 48x48px (Android)
- Single column layouts on mobile
- Breakpoints: <640px mobile, 640-1024px tablet, >1024px desktop

**Component Patterns**:
- **Primary Button**: Accent background, white text, 12px 24px padding
- **Secondary Button**: White background, accent text, accent border
- **Cards**: White background, border OR shadow (not both), 12px radius, 24px padding
- **Forms**: Labels above inputs, 44px min height, 24px field spacing

**Design Quality Checklist**:
- [ ] Adequate white space throughout
- [ ] Consistent spacing using 8px grid
- [ ] Only ONE accent color, NO gradients
- [ ] Body text minimum 16px
- [ ] All interactive elements have hover/active/disabled/focus states
- [ ] Touch targets minimum 44x44px

**Anti-Patterns (NEVER)**:
- ❌ Rainbow gradients
- ❌ Purple/blue gradients by default
- ❌ Tiny text (< 16px body)
- ❌ Heavy drop shadows
- ❌ Both borders AND shadows on same element
- ❌ Cluttered layouts with no white space
- ❌ More than 2 font families

---

### 4. **Marketing Writer**
📦 `marketing-writer.skill` (10.0 KB) - Already detailed in `~/Documents/claude-skills/marketing-writer/`

**Purpose**: Write compelling marketing content using casual, direct brand voice that cuts through typical marketing noise.

**When to Use**:
- Ship a new feature and need to announce it
- Need landing page sections, tweets, or launch emails
- Want to promote your app
- Writing for users, customers, or audience

**Key Features**:
- Reads codebase to understand features
- 3 content templates (Landing Page Sections, Twitter/X Threads, Launch Emails)
- 3 content formulas (PAS, BAB, FAB)
- Pre-writing process that analyzes code first

**Brand Voice**:
- Talk like explaining to a friend over coffee
- Use simple, conversational language
- Focus on actual benefits
- NO corporate buzzwords (synergy, leverage, paradigm shift)

**Templates**:
1. **Landing Page**: Problem → Solution → Benefit
2. **Twitter Thread**: Hook → Credibility → Value → CTA
3. **Launch Email**: Personal Opening → Specific Value → Easy Next Step

**Pre-Writing Process (MANDATORY)**:
1. Read codebase to understand features
2. Identify: user problem, core features, target audience, differentiators
3. Only ask clarifying questions if critical info is missing

**Quality Checklist**:
- [ ] Read relevant codebase files
- [ ] Identified core problem being solved
- [ ] Used conversational language (no buzzwords)
- [ ] Focused on specific benefits
- [ ] Included concrete examples
- [ ] Kept it concise
- [ ] Active voice, second person ("you")
- [ ] Clear, easy next step

---

### 5. **Roadmap Builder**
📦 `roadmap-builder.skill` (4.0 KB)

**Purpose**: Ruthless prioritization framework for product decisions that prevents feature creep.

**When to Use**:
- Advising what to build next
- Challenging feature ideas
- Evaluating new features against Impact vs Effort matrix
- Applying stage-based rules (pre-launch, post-launch, growth)
- Filtering feature creep
- Keeping roadmaps focused

**Key Features**:
- Impact vs Effort Matrix prioritization
- Category Hierarchy (Retention > Core > Monetization > Growth)
- Stage-Based Rules (different criteria for each stage)
- 4 Validation Questions to challenge every feature
- Red Flag Detection system

**Prioritization Framework**:

**Impact vs Effort Matrix**:
1. High Impact, Low Effort → Ship immediately
2. High Impact, High Effort → Plan carefully, break into phases
3. Low Impact, Low Effort → Only if it validates something
4. Low Impact, High Effort → Never build

**Category Hierarchy** (strict priority order):
1. **Retention** (Most critical) - Keeps users coming back
2. **Core Features** - Essential to main use case
3. **Monetization** - Enables revenue without breaking core loop
4. **Growth** (Lowest priority until retention is solid)

**Stage-Based Rules**:

**Pre-Launch Stage**:
- ONLY build features that are part of core loop
- Is this required for minimum viable experience?
- ❌ Forbidden: Social features, analytics, settings, profiles, notifications, "nice to haves"

**Post-Launch Stage**:
- ONLY build features that users explicitly request after using the product
- Have 3+ different users asked for this?
- Are users trying to hack around the absence?

**Growth Phase**:
- ONLY build features that measurably reduce churn or increase sharing
- Will this demonstrably reduce Week 1 churn?
- Can we measure impact within 2 weeks?

**4 Validation Questions** (challenge every feature):
1. **Core Use Case Test**: Does this serve the core use case?
2. **Actual vs Imaginary Users**: Will users actually use this or just say they want it?
3. **Fake It First**: Can we fake it first to validate demand?
4. **Impact Validation**: What specific metric will this improve and by how much?

**Red Flags**:
- ❌ "Cool" Factor ("This would be really cool")
- ❌ Premature Optimization (building for scale before you have users)
- ❌ Imaginary Users ("Users might want...")
- ❌ Competitor Mimicry ("Competitor X has this feature")
- ❌ Scope Creep Phrases ("While we're at it...", "Just one more thing...")

**Output Format**:
```markdown
**Recommendation**: Clear yes/no/maybe with brief reasoning

**Stage Check**: Which stage rules apply and whether this passes

**Impact vs Effort**: Plot on matrix with specific estimates

**Category**: Which category and its priority level

**Validation Results**: Answers to the 4 validation questions

**Red Flags**: Any concerns identified (or "None detected")

**Next Steps**: Minimum viable version if approved, or what would make this viable if rejected
```

---

## How These Skills Work Together

### Complete Product Development Workflow

**Phase 1: Ideation**
1. **Idea Validator** - Is this worth building? Get brutal honest feedback
   - Evaluates market, demand, feasibility, monetization, interest
   - Verdict: Build it / Maybe / Skip it

**Phase 2: Planning**
2. **Launch Planner** - Transform idea into shippable MVP
   - Generates lean PRD
   - Creates Claude Code starter prompt
   - Ruthlessly scopes features
   - Prevents feature creep

**Phase 3: Design**
3. **Design Guide** - Ensure professional UI across all platforms
   - Clean minimal design
   - Neutral + ONE accent color
   - 8px grid spacing system
   - Proper interactive states
   - Mobile-first responsive

**Phase 4: Execution**
- Use **Launch Planner** for mid-build product advice
- Keep checking **Roadmap Builder** for feature prioritization
- Apply **Design Guide** to every UI component

**Phase 5: Marketing**
4. **Marketing Writer** - Announce and promote your launch
   - Reads codebase to understand features
   - Writes landing pages, tweet threads, launch emails
   - Casual, direct voice (no buzzwords)

**Phase 6: Ongoing Development**
5. **Roadmap Builder** - Ruthlessly prioritize what to build next
   - Impact vs Effort matrix
   - Stage-based rules
   - Retention-first mindset
   - Feature creep prevention

---

## Installation & Usage

### Current Status
✅ All 5 skills extracted from .skill files
✅ All skill documentation read and analyzed
📦 Skills currently in: `/tmp/skills-extracted/`

### Recommended Next Steps

**Option 1: Install to Claude Desktop Skills Directory**
```bash
# Copy all skills to Claude Desktop skills directory
cp -r /tmp/skills-extracted/* ~/.claude/skills/

# Verify installation
ls -la ~/.claude/skills/
```

**Option 2: Keep in Downloads and Load Manually**
- Keep .skill files in Downloads
- Upload to Claude conversations as needed
- Reference specific skills when starting new projects

**Option 3: Organize in Documents**
```bash
# Create skills directory in Documents (alongside marketing-writer)
mkdir -p ~/Documents/claude-skills/
cp -r /tmp/skills-extracted/* ~/Documents/claude-skills/

# Organize structure
~/Documents/claude-skills/
├── idea-validator/
├── launch-planner/
├── design-guide/
├── marketing-writer/
└── roadmap-builder/
```

---

## Skill Details

### File Sizes
- `idea-validator.skill` - 2,352 bytes
- `launch-planner.skill` - 12,449 bytes (largest - includes 3 reference files)
- `design-guide.skill` - 10,248 bytes (includes 2 reference files)
- `marketing-writer.skill` - 10,019 bytes
- `roadmap-builder.skill` - 4,023 bytes

### Created Timestamps
- `idea-validator` - Nov 2, 2025 at 22:03 (10:03 PM)
- `launch-planner` - Nov 2, 2025 at 22:21 (10:21 PM)
- `design-guide` - Nov 2, 2025 at 22:27 (10:27 PM)
- `marketing-writer` - Nov 2, 2025 at 22:40 (10:40 PM)
- `roadmap-builder` - Nov 2, 2025 at 22:44 (10:44 PM)

**Total Creation Time**: 41 minutes (22:03 - 22:44)

---

## Key Principles Across All Skills

### Common Themes

**1. Ruthless Simplicity**
- Launch Planner: "One-week rule" - features must be buildable in <1 week
- Idea Validator: Solo builder feasibility in 2-4 weeks
- Roadmap Builder: Strip everything that doesn't serve core loop

**2. User-Centric Validation**
- Launch Planner: "Real usage data beats assumptions"
- Idea Validator: "Do people actually pay for this?"
- Roadmap Builder: "Have 3+ users asked for this?"

**3. Anti-Bullshit Philosophy**
- Idea Validator: "Be brutally honest. Save builder time, not feelings."
- Marketing Writer: "NO corporate buzzwords (synergy, leverage, paradigm shift)"
- Roadmap Builder: "Actual vs Imaginary Users"

**4. Retention-First Mindset**
- Roadmap Builder: Retention is #1 category priority
- Launch Planner: "Speed to user feedback trumps perfection"
- All skills emphasize shipping and validating quickly

**5. Professional Quality Standards**
- Design Guide: Clean minimal design with consistent spacing
- Marketing Writer: Casual voice that still feels professional
- All skills enforce high standards while avoiding perfectionism

---

## Workflow Examples

### Example 1: New App Idea

**Step 1**: Use **Idea Validator**
```
User: "I want to build a task manager for remote teams"

Idea Validator Response:
VERDICT: Skip it

WHY: This market is extremely saturated with well-funded competitors.
You're competing against Asana, Monday, ClickUp, Notion, and 50+ others.
Unless you have a unique angle for a specific underserved niche, this is
a tough market for a solo builder.

SIMILAR PRODUCTS:
- Asana - Full project management, $10.99/user/month
- Monday.com - Visual project boards, $8/user/month
- ClickUp - All-in-one workspace, freemium to $5/user/month

WHAT WOULD MAKE THIS STRONGER:
- Focus on a specific niche (e.g., "task manager for video production teams")
- Solve a pain point existing tools don't address
- Build for a market you personally understand deeply
```

**Step 2**: Refine idea, use **Idea Validator** again
```
User: "How about a task manager specifically for solo content creators
who need to manage their content calendar, track sponsorships, and
organize research?"

Idea Validator Response:
VERDICT: Maybe

WHY: Narrower niche with specific pain points. Solo creators do struggle
with existing tools being too complex for their needs. However, you'd be
competing against Notion, Airtable, and Trello which creators already use.

SIMILAR PRODUCTS:
- Notion - Flexible workspace, $4-8/month
- Airtable - Database + spreadsheet hybrid, $10-20/month
- CoSchedule - Marketing calendar, $29/month

WHAT WOULD MAKE THIS STRONGER:
- Add unique features existing tools don't have (e.g., auto-suggest
  posting times based on audience analytics)
- Integrate with creator platforms (YouTube, TikTok, Instagram) for
  automatic performance tracking
- Price it competitively ($5-10/month) with a strong free tier
```

**Step 3**: Use **Launch Planner** to create PRD
```
Launch Planner generates lean PRD:
- Who: Solo content creators (YouTube, TikTok, Instagram) with 10K-500K followers
- One Problem: Existing tools are too complex and don't integrate with creator platforms
- Core Loop: Check upcoming content → Track progress → Mark as published → See performance
- Success Metric: >50% of users publish at least 3 pieces of content in first month
- MVP Features (1 week each):
  - Week 1: Content calendar with simple kanban view
  - Week 2: YouTube/Instagram API integration for auto-tracking
  - Week 3: Basic analytics dashboard
  - Week 4: Export to social platforms
```

**Step 4**: Use **Design Guide** during development
```
Every UI component follows Design Guide:
- Color: Neutral grays + Emerald (#10B981) accent
- Spacing: 8px grid (16px button padding, 24px card padding, 32px section spacing)
- Typography: Inter 16px body, 24px headings
- Buttons: Proper hover/active/disabled states
- Mobile-first responsive design
```

**Step 5**: Use **Marketing Writer** for launch
```
Marketing Writer reads codebase and generates:

Landing Page Section:
### Never Miss a Posting Deadline Again

Juggling YouTube uploads, Instagram posts, and TikTok videos? Losing track
of sponsorship deadlines? Forgetting what you already researched?

ContentFlow connects directly to your social accounts. See your entire
content calendar in one place. Track what's published, what's scheduled,
and what needs work.

Post consistently. Hit your sponsorship deadlines. Never lose research notes again.

Like having a personal assistant who remembers every content idea and
deadline, so you can focus on creating.

Twitter Thread:
1/ Content creators waste 10+ hours/week switching between calendars,
spreadsheets, and social platform dashboards.

2/ I was losing track of sponsorship deadlines and posting inconsistently.
Built ContentFlow to fix it.

3/ One dashboard for YouTube, Instagram, and TikTok. See everything you
need to post this month.

4/ Auto-tracks performance: ContentFlow pulls analytics from each platform.
Know what's working without opening 5 different apps.

5/ Never miss a sponsorship deadline: Set deadlines, get reminders, mark
as delivered. Keep your sponsors happy.

6/ Try it free: [link]
Connects in 2 minutes. Works with YouTube, Instagram, TikTok.
```

**Step 6**: Use **Roadmap Builder** post-launch
```
User: "Users are asking for team collaboration features - shared calendars,
comments, task assignment."

Roadmap Builder Response:
**Recommendation**: ❌ Not yet

**Stage Check**: Post-launch stage. Have 3+ users requested this? [YES]
But need to check if this serves the core use case.

**Impact vs Effort**: High Effort (team features are complex), Unknown
Impact (you're built for solo creators)

**Category**: Scope expansion - this changes your target audience from
solo creators to teams

**Validation Results**:
- Core use case? ❌ Your core is "solo content creators" - teams are
  a different market
- Real users? ⚠️ Users asking, but are they solo or teams?
- Fake it first? ✅ Manually invite 3 requesting users to a Slack channel
  for coordination - see if they use it
- Measurable? ⚠️ Unclear - would this increase retention or just add complexity?

**Red Flags**:
- Scope creep into different market segment
- Competitor mimicry (adding features because others have them)
- High effort with uncertain return

**Next Steps**:
- First: What's your Week 1 retention for solo users? If <40%, fix that first.
- Then: Manually test collaboration with 3 users via Slack/Discord
- If >80% of those users actively collaborate daily, then consider building it
- Alternative: Keep focused on solo creators, become the best at that
```

---

## Pro Tips

### When to Use Which Skill

**Before Writing Any Code**:
1. Idea Validator - Validate the concept
2. Launch Planner - Generate PRD and scope MVP

**During Development**:
1. Design Guide - Every time you build UI
2. Launch Planner - When making feature decisions

**After Launch**:
1. Marketing Writer - Announce and promote
2. Roadmap Builder - Prioritize what's next

### Combining Skills

**Best Practice**: Use skills sequentially in the workflow order above.

**Common Pattern**:
```
New Idea → Idea Validator (brutal validation)
         → If "Build it" or "Maybe": Launch Planner (PRD + MVP scope)
         → During build: Design Guide (every UI component)
         → During build: Roadmap Builder (feature decisions)
         → Pre-launch: Marketing Writer (landing page, tweets, email)
         → Post-launch: Roadmap Builder (ongoing prioritization)
```

### Skill Invocation

**In Claude Desktop**:
- Skills auto-load from `~/.claude/skills/`
- Reference by name: "Use the Idea Validator skill to evaluate this app idea..."

**In Claude Code**:
- Upload .skill file to conversation
- Or reference if installed globally

**In Claude.ai**:
- Upload SKILL.md file directly to conversation
- Claude will follow the instructions

---

## Summary

You've created an incredibly comprehensive product development framework with these 5 skills. Together, they guide you from idea validation through execution and ongoing product management.

**Key Strengths**:
- ✅ Ruthlessly practical and anti-bullshit
- ✅ Emphasizes shipping and user validation over perfection
- ✅ Clear, actionable frameworks (not vague advice)
- ✅ Works across platforms (SwiftUI, Android, Web)
- ✅ Prevents common mistakes (feature creep, over-engineering, premature optimization)

**Next Actions**:
1. ✅ Skills extracted and analyzed (COMPLETE)
2. 📋 Decide installation location (Claude Desktop, Documents, or keep in Downloads)
3. 🚀 Start using them in your next project workflow

---

**Files Created During This Session**:
- This summary: `/Users/skycruzer/Desktop/fleet-management-v2/CUSTOM-CLAUDE-SKILLS-SUMMARY-NOV-02.md`
- Extracted skills: `/tmp/skills-extracted/` (temporary)
- Original .skill files: `~/Downloads/` (permanent)
