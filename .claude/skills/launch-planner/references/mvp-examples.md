# Real-World MVP Scoping Examples

## Example 1: Time Tracking App

### Initial Idea (Too Big)
"A comprehensive time tracking solution for freelancers"

**Proposed features:**
- Manual time entry
- Timer for live tracking
- Project management
- Client management
- Invoice generation
- Reports and analytics
- Calendar integration
- Mobile app
- Chrome extension
- Team features

**Estimate:** 6-8 weeks

### MVP Scoped (One Week)
"Help freelancers quickly log time to projects"

**Core user loop:**
1. Start a timer for a project
2. Stop the timer
3. View total hours per project

**Week 1 features:**
- Start/stop timer
- List of active timers
- Simple project list (just names)
- Weekly hour totals per project

**Estimate:** 4-5 days

**Deferred (Post-validation):**
- Manual time entry (add if users request it)
- Client management (wait to see if needed)
- Invoice generation (different tool, different problem)
- Reports (add based on what metrics users actually need)

**Explicitly cut:**
- Team features (solo freelancers first)
- Mobile/extension (web first)
- Calendar integration (premature)

### Success Metric
50 freelancers track >5 projects/week for 2 consecutive weeks

### What Happened
- Built in 5 days
- Got 30 users in week 1
- Users immediately asked for manual entry
- Nobody asked for invoicing
- Added manual entry in week 2 based on feedback

**Lesson:** Invoice generation would have been 2 weeks of wasted work.

---

## Example 2: Recipe Sharing App

### Initial Idea (Too Big)
"Social network for home cooks to share and discover recipes"

**Proposed features:**
- User profiles
- Recipe posting with photos
- Following/followers
- Like/comment system
- Search and filtering
- Collections/bookmarks
- Recipe ratings
- Meal planning
- Shopping lists
- Nutrition info

**Estimate:** 8-10 weeks

### MVP Scoped (One Week)
"Share your recipes with a link"

**Core user loop:**
1. Paste recipe ingredients and steps
2. Get a shareable link
3. Anyone with link can view the formatted recipe

**Week 1 features:**
- Form: title, ingredients, steps
- Generate unique URL
- Public recipe view page
- Basic recipe formatting

**Estimate:** 3-4 days

**Deferred (Post-validation):**
- Photos (add if users upload them)
- User accounts (if users want to manage their recipes)
- Search (if collection grows)
- Social features (if people actually share links)

**Explicitly cut:**
- Everything social (no users yet)
- Meal planning (different problem)
- Nutrition (complex, different problem)

### Success Metric
100 recipes created, 50% get shared at least once

### What Happened
- Built in 3 days
- Users immediately started sharing
- Photos were most requested feature
- Added image uploads week 2
- Nobody asked for social features
- "Discover" features still not needed 6 months later

**Lesson:** Would have wasted 6 weeks building social features nobody wanted.

---

## Example 3: Event Check-in App

### Initial Idea (Too Big)
"Complete event management platform"

**Proposed features:**
- Event creation
- Ticket sales
- QR code generation
- Mobile check-in
- Attendee management
- Email notifications
- Analytics dashboard
- Name badges
- Seating assignments
- Wait list management

**Estimate:** 10-12 weeks

### MVP Scoped (One Week)
"Let event hosts check people in with their phone"

**Core user loop:**
1. Upload attendee list (CSV)
2. See list on phone
3. Tap name to check in
4. See who's checked in vs. not

**Week 1 features:**
- CSV upload
- Name list view
- Check-in toggle
- Count of checked-in attendees

**Estimate:** 4 days

**Deferred (Post-validation):**
- QR codes (if manual is too slow)
- Email notifications (if hosts request it)
- Analytics (after we see what metrics matter)
- Badge printing (wait for user request)

**Explicitly cut:**
- Ticket sales (different business, use Eventbrite)
- Seating (different problem)
- Wait list (premature)

### Success Metric
Used for 5 different events, hosts report it's faster than paper

### What Happened
- Built in 3 days
- Used at first event successfully
- Hosts immediately wanted QR codes
- Added QR scanning week 2
- Email notifications requested, added week 3
- Nobody asked for seating or waitlist features

**Lesson:** QR codes were worth adding (requested). Complex features weren't.

---

## Example 4: Book Recommendation App

### Initial Idea (Too Big)
"AI-powered book discovery platform"

**Proposed features:**
- AI recommendation engine
- User taste profiles
- Reading lists
- Progress tracking
- Social following
- Book ratings/reviews
- Reading challenges
- Goodreads import
- Purchase links
- Discussion forums

**Estimate:** 12+ weeks

### MVP Scoped (One Week)
"Describe what you like, get 5 book recommendations"

**Core user loop:**
1. Enter 3 books you loved
2. Describe what you liked about them
3. Get 5 recommendations with reasons

**Week 1 features:**
- Simple form (3 book inputs + text area)
- Claude API call with good prompt
- Display 5 books with reasoning
- That's it

**Estimate:** 2 days

**Deferred (Post-validation):**
- User accounts (if people want to save results)
- Reading lists (if validated)
- Social features (way premature)
- Tracking (different problem)

**Explicitly cut:**
- All social features
- Forums
- Progress tracking
- Complex profile building

### Success Metric
100 recommendations generated, 30% of users click "get more"

### What Happened
- Built in 2 days
- Users loved the simplicity
- "Get more" button was heavily used
- Added "save recommendations" after validation
- Social features still not needed

**Lesson:** Simple AI prompt was the entire value prop. Everything else was noise.

---

## Example 5: Expense Splitter App

### Initial Idea (Too Big)
"Group expense management for travelers and roommates"

**Proposed features:**
- Group creation
- Expense entry
- Photo receipt scanning
- Multi-currency
- Debt simplification algorithm
- Payment integration (Venmo/PayPal)
- Recurring expenses
- Budget tracking
- Expense categories
- Export reports

**Estimate:** 8 weeks

### MVP Scoped (One Week)
"Quickly split a dinner bill among friends"

**Core user loop:**
1. Enter total amount
2. Enter names of people
3. See who owes what
4. Share the breakdown

**Week 1 features:**
- Amount input
- Add/remove people
- Option: split evenly or enter custom amounts
- Show breakdown
- Copy/share results as text

**Estimate:** 3 days

**Deferred (Post-validation):**
- Receipt scanning (if users need it)
- Multi-currency (if international users)
- Payment integration (complex, wait for user request)
- Groups/accounts (if users split with same people repeatedly)

**Explicitly cut:**
- Recurring expenses (different use case)
- Budget tracking (different problem)
- Reports (premature)

### Success Metric
Used 100 times, 40% share the results with their group

### What Happened
- Built in 2 days
- Widely used at restaurants
- Users wanted to save past splits
- Added simple history week 2
- Receipt scanning never requested
- Payment integration not needed (people just Venmo manually)

**Lesson:** Saved weeks by not building payment integration nobody wanted.

---

## Pattern Recognition

### What These Examples Show

**Common pattern:** Initial ideas were 6-12 weeks of work. MVPs were 2-5 days.

**Why the cuts worked:**
- Focused on one specific use case
- Removed all "nice to have" features
- Deferred user accounts until proven necessary
- Cut integration with other tools
- Removed social features
- Skipped reporting/analytics initially

**What to copy:**
- Start with one specific scenario
- Build the absolute minimum to test that scenario
- Defer everything that doesn't block testing
- Let users tell you what to add next

### The Scoping Framework

For any idea, ask:

1. **What's the single core action?**
   - Time tracking → start/stop timer
   - Recipe sharing → paste recipe, get link
   - Event check-in → mark person as checked in
   - Book recs → input likes, get suggestions
   - Expense splitting → enter bill, see split

2. **What's the minimum UI for that action?**
   - Usually just one or two forms
   - One results page
   - Maybe one list view

3. **What can we do manually (for now)?**
   - Admin can handle edge cases
   - Copy/paste instead of integration
   - Manual data entry vs. automation

4. **What feels necessary but isn't?**
   - User accounts (usually)
   - Social features (almost always)
   - Advanced filtering (premature)
   - Analytics (premature)
   - Mobile apps (web first)

### The One-Week Test

If your MVP estimate is >1 week, ask:
- What's the absolute core action?
- Can I test that action with less features?
- What am I building "just in case"?
- What am I building to impress vs. to validate?

Then cut until you're at ≤5 days of work.

---

## Your Turn: Apply This

Take your current idea and:

1. Write the initial feature list
2. Estimate how long it would take
3. Identify the single core user action
4. List only features needed for that action
5. Move everything else to "deferred"
6. Cut anything that's "nice to have"
7. Re-estimate (should be ≤5 days)

If it's still >5 days, cut more. You can always add back based on user feedback.