# Codebase Analysis for Marketing Content

When writing marketing content, first understand what the product actually does by analyzing the codebase.

## What to Look For

### 1. Core Features

Identify the main functionality by examining:

- Main view files (SwiftUI views, Android activities/fragments)
- Model/data structures that represent core entities
- API endpoints or database tables that indicate key features
- Navigation patterns showing user flows

**What you're extracting:**

- What can users actually DO with this app?
- What problems does each feature solve?
- What's the primary user journey?

### 2. Value Proposition

Look for clues about the "why" behind features:

- Comments explaining business logic
- Data validations showing what users care about
- Error messages indicating what can go wrong
- Alerts and notifications showing what's time-sensitive

**What you're extracting:**

- What pain points does this address?
- What specific outcomes does it deliver?
- What would happen if users didn't have this?

### 3. User-Facing Language

Find the actual terminology users see:

- Button labels
- Screen titles
- Form field labels
- Success/error messages
- Onboarding copy

**What you're extracting:**

- How does the app describe itself to users?
- What language resonates with the target audience?
- What terms should marketing copy mirror?

## Analysis Process

### Step 1: Map the Core Features

```
Start with:
- Main navigation/menu files
- Primary view controllers/activities
- Key model objects

Output a list:
1. Feature name (as seen in app)
2. What it does (one sentence)
3. Key user action it enables
```

### Step 2: Extract Value Indicators

```
Look for:
- Calculations (what metrics matter?)
- Validations (what constraints exist?)
- Notifications (what needs urgent attention?)
- Data relationships (what connects to what?)

For each feature, identify:
- The problem it solves (inferred from validation/error handling)
- The outcome it delivers (inferred from success states)
- The pain point it removes (inferred from what it automates)
```

### Step 3: Understand User Context

```
Check:
- Onboarding flows
- Settings/preferences
- User roles or permissions
- Data import/export features

Determine:
- Who is this for? (role, industry, use case)
- When do they use it? (workflow context)
- What do they care about? (priorities indicated by feature set)
```

## Example Analysis

**Codebase:** Pilot certification tracking app

**Feature Discovery:**

```
File: Views/CertificationListView.swift
- Displays list of pilot certifications
- Shows expiry dates with color coding
- Allows adding new certifications

File: Models/Certification.swift
- Properties: name, expiryDate, pilotId, type
- Computed property: daysUntilExpiry
- Validation: expiryDate must be in future

File: Services/NotificationService.swift
- Sends alerts at 90, 60, 30 days before expiry
- Escalating alerts as expiry approaches
```

**Value Extraction:**

- **Problem:** Certifications expire without warning, grounding pilots
- **Solution:** Automated tracking with advance alerts
- **Benefit:** No surprise groundings, less manual tracking
- **Specific outcome:** Save hours on manual checks, zero missed renewals

**User Context:**

- Target: Flight operations managers, chief pilots
- Use case: Regulatory compliance, crew availability
- Priority: Avoiding flight groundings, reducing admin time
- Pain point: Manual spreadsheet tracking, missed expirations

**Marketing Angle:**
"Track every pilot certification automatically. Get alerts 30/60/90 days before expiry. No more manual spreadsheets, no more surprise groundings."

## When You Don't Have Code Access

If you can't access the codebase or it's not available:

1. **Ask the user directly:**
   - "What are the 3 main things users can do with this?"
   - "What problem were you trying to solve when you built this?"
   - "What do users say about it?"

2. **Look for existing materials:**
   - App store descriptions
   - README files
   - Internal docs
   - Previous marketing attempts

3. **Focus on the conversation:**
   - What features did the user just ship?
   - What are they excited about?
   - What feedback have they received?

## Red Flags to Avoid

Don't write marketing content based on:

- ❌ What you think the app might do
- ❌ Generic descriptions without specifics
- ❌ Features that don't exist yet
- ❌ Assumed benefits without evidence

Always base content on:

- ✅ Actual implemented features
- ✅ Real user actions the code enables
- ✅ Measurable outcomes (even if estimated)
- ✅ Specific use cases evident in the code
