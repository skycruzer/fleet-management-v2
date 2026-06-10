# Content & UX Review — All Pages (2026-06-11)

Scope: CONTENT and UX only (visual skin settled — Operations Navy). 5 parallel reviewers:
admin core, planning/reports, admin secondary, pilot portal, cross-cutting IA.
Predecessor: tasks/design-ux-review-2026-06-10.md (visual/UI; remediated).

## Verdict

The app is feature-complete and well-engineered, but the content is **entity-oriented when
the job is task-oriented**. Ops staff synthesize across 3+ pages to answer one question
("can I approve this leave without breaching the 10-captain rule?"), KPIs are counts rather
than actions, and the sidebar carries 14 items for a ~27-pilot operation.

## Top cross-cutting findings

1. **Crew eligibility (10 CPT + 10 FO) is the business' #1 rule but invisible in the UX.**
   Approvals don't preview impact ("approving drops RP8 to 9 captains"); dashboard shows
   "27 active pilots" instead of "2 captains short for RP8". Only surfaces reactively as an
   override error.
2. **Count KPIs instead of action KPIs.** "607 certifications", "27 pilots" are vanity;
   the actionable form is "8 overdue (6 CPT) — due today", "23 expiring <14d, 8 past
   renewal deadline".
3. **Requests fragmented across 3 admin + 2 portal surfaces.** /dashboard/requests,
   /dashboard/admin/leave-bids, renewal-planning leave context; portal has requests +
   leave-bids (+ legacy leave-requests page). No single "everything in flight" view.
   Biggest single consolidation win (~40% cognitive load per IA reviewer).
4. **Expiring certs reachable via 3 different surfaces** (Dashboard priorities, Analytics
   breakdown, Reports export) with different UX and no clear source of truth.
5. **Sidebar IA misaligned with frequency.** Leave Bids (weekly) primary, Audit (quarterly)
   buried in 8-item "More"; admin hub hides 5 subpages 3 clicks deep; orphan pages:
   /dashboard/notifications and /dashboard/support are not in any nav.
6. **Deadlines are nowhere.** Leave bid windows, RP submission deadlines, renewal plan
   due dates — all absent from the surfaces where decisions happen.
7. **Pilot portal answers "am I compliant?" but not "when is my next check?"** No
   next-check countdown; bid deadline missing; roster period buried 3rd; profile = 20+
   scrolls of read-only data on a phone.
8. **Batch workflows missing.** 350+ individual leave-bid decisions/year, no bulk cert
   actions, no sequential review queue for requests.

## Per-group highlights (details in agent reports)

- **Dashboard home**: 8+ widgets, breadth over depth; priorities widget omits eligibility
  and deadlines; retirement card duplicates Analytics.
- **Pilots**: list lacks compliance badge column; detail is a data view, not an ops
  decision view (no roster/eligibility impact context); edit form ordered by schema not
  by edit frequency.
- **Certifications**: strong table; needs triage structure (Critical/Attention buckets),
  "overdue vs due-in-N-days" framing, clickable rows with slide-out detail, bulk actions.
- **Requests**: 3 view modes that don't talk to each other; approval dialog shows no crew
  impact in the normal case; no proximity cue (current-RP requests look identical to
  RP+5 ones).
- **Analytics**: decorative; numbers don't link to the filtered surface that fixes them.
  Reports: right density, wrong discoverability (19 types, no guidance on which/when).
- **Renewal planning**: auto-generates on page load (disruptive); pairing status hidden
  behind modal; no capacity heat-map ordering.
- **Leave bids (admin)**: no deadline banner; no impact overlay ("approving all CPT bids
  drops RP3 to 4 captains"); no batch actions.
- **Secondary pages**: Support duplicates Help (merge); Settings is personal-prefs
  mislabeled as org settings; Notifications page orphaned (should be header bell + archive);
  Feedback dual view-modes add friction; Audit stat badges look clickable but aren't.
- **Portal**: cert filters eat mobile viewport above content; category grouping hides the
  one urgent cert; notifications lack links/reasons; settings is a stub; "flight" wording
  leaks where it should say RDO/SDO.

## What's working (keep)

Unified pilot_requests model and tabbed Requests page; Reports' filter density;
renewal-planning grid + Gantt; portal card layouts and 1-2-tap core flows; dashboard as a
summarizing hub (not a duplicate); empty state on notifications page.

## The 5 candidate directions (mockups in design-mockups/content-options/)

1. **Morning Brief** — action-first dashboard: eligibility banner, action-KPIs, triage queue.
2. **Approvals Hub** — all requests + bids + registrations in one queue with crew-impact preview.
3. **Compliance Cockpit** — certifications-led triage with buckets, bulk actions, slide-out detail.
4. **Consolidated IA** — 6 primary nav items, Scheduling + Governance hubs, header bell, merged Help.
5. **Pilot-First Portal** — portal rebuilt around next-check countdown, deadlines, roster-on-top.
