---
name: marketing-writer
description: Write authentic, conversion-focused marketing content for product features and launches. Use when Maurice ships a feature, needs landing page copy, tweet threads, launch emails, or any marketing content. Automatically analyzes codebase to understand features and value props. Brand voice is casual, direct, no corporate buzzwords - focuses on real benefits in simple language.
---

# Marketing Writer

## Overview

Create marketing content that sounds like talking to a friend, not a corporate press release. This skill helps write landing page sections, tweet threads, and launch emails by first understanding what the product actually does through codebase analysis, then crafting content in Maurice's authentic brand voice.

## Core Workflow

### 1. Understand the Product Context

Before writing any marketing content, understand what you're marketing:

**If codebase is available:**
- Read `references/codebase-analysis.md` for detailed analysis approach
- Examine main views, models, and user flows
- Extract features, value props, and user context from the code
- Identify specific benefits and outcomes the code delivers

**If codebase isn't available:**
- Ask Maurice what features were just shipped
- Understand the specific problem being solved
- Get concrete examples of how users benefit
- Focus on real outcomes, not assumed benefits

**Key extraction:**
- What can users DO? (actions enabled)
- What problem does it SOLVE? (pain point removed)
- What outcome does it DELIVER? (measurable benefit)

### 2. Choose the Content Type

Based on what Maurice needs:

**Landing Page Feature Section:** Use `references/landing-page-template.md`
- Structure: Problem → Solution → Benefit
- Best for: Website copy, feature pages, marketing pages

**Tweet Thread:** Use `references/tweet-thread-template.md`
- Structure: Hook → Credibility → Value → CTA
- Best for: Feature announcements, product launches on Twitter/X

**Launch Email:** Use `references/launch-email-template.md`
- Structure: Personal Opening → Specific Value → Easy CTA
- Best for: Product updates, feature releases, newsletter content

### 3. Apply Brand Voice Rules

Every piece of content must follow these voice guidelines:

**Do:**
- Write like talking to a friend over coffee
- Use "you" and "I" language
- Lead with specific problems and frustrations
- Show real benefits with numbers when possible
- Keep sentences short and scannable
- Be direct - get to the point fast

**Don't:**
- Use corporate buzzwords: "leverage," "synergy," "revolutionize," "game-changing"
- Say "we're thrilled to announce" or "excited to share"
- Write long paragraphs (3 lines max)
- Make vague claims without specifics
- Use multiple exclamation marks
- Add unnecessary emojis

**Examples:**

❌ Bad: "We're excited to introduce our revolutionary pilot management solution that leverages cutting-edge technology to optimize crew scheduling workflows."

✅ Good: "Track every pilot certification automatically. Get alerts before anything expires. No more manual spreadsheets."

❌ Bad: "Our platform enables organizations to streamline their compliance processes."

✅ Good: "Saves flight ops teams 5+ hours per week on compliance tracking. Zero surprise groundings in 6 months."

## Content Templates

### Landing Page Sections

Read `references/landing-page-template.md` for complete guidance.

**Quick formula:**
1. **Problem:** Start with what sucks (2-3 sentences on the pain)
2. **Solution:** What the feature does (1 clear sentence)
3. **Benefit:** Real-world outcome (specific, measurable when possible)

### Tweet Threads

Read `references/tweet-thread-template.md` for complete guidance.

**Quick formula:**
1. **Hook:** Scroll-stopping problem or insight (1 tweet)
2. **Credibility:** Why you understand the problem (1-2 tweets)
3. **Value:** What you built and its impact (1-2 tweets)
4. **CTA:** Simple next step (1 tweet)

### Launch Emails

Read `references/launch-email-template.md` for complete guidance.

**Quick formula:**
1. **Opening:** Personal story or observation (2-3 sentences)
2. **Value Prop:** Problem solved + solution + benefit (3-4 sentences)
3. **CTA:** One clear, easy action (1-2 sentences)

## Quality Checklist

Before delivering any marketing content, verify:

- [ ] Based on actual features (not assumptions)
- [ ] Includes specific benefits or numbers
- [ ] Uses casual, direct language
- [ ] No corporate buzzwords present
- [ ] Lead with problem/pain point
- [ ] One clear call to action
- [ ] Short sentences and paragraphs
- [ ] Sounds like talking to a friend

## Example Usage

**User request:** "Just shipped auto-alerts for certification expiry. Write a tweet thread."

**Process:**
1. Analyze notification code to understand: 30/60/90 day alerts, automatic tracking
2. Identify benefit: No surprise groundings, saves manual checking time
3. Read `references/tweet-thread-template.md`
4. Write thread following Hook → Credibility → Value → CTA structure
5. Apply brand voice: casual, specific, no buzzwords
6. Verify against quality checklist

## References

- `references/landing-page-template.md` - Problem-Solution-Benefit format with examples
- `references/tweet-thread-template.md` - Thread structure and voice guidelines
- `references/launch-email-template.md` - Email format with multiple examples
- `references/codebase-analysis.md` - How to extract features and value props from code
