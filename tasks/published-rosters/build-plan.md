# Published Rosters Feature — Build Plan

**Status**: Ready to start implementation
**Estimated Timeline**: 6-8 hours total across 7 phases
**Checkpoint Strategy**: Complete one phase, validate, then proceed

---

## Summary

Build an admin-only published rosters page that lets admins upload B767 roster PDFs, parses them into structured data (assignments), and presents them as interactive searchable grids with period navigation.

**Key Architecture**:

- Single dedicated page: `/dashboard/published-rosters`
- Parse PDFs server-side with `pdfjs-dist` (position-aware extraction)
- Store parsed assignments in `roster_assignments` table
- Match roster names to `pilots` table records (case-insensitive)
- Color-coded activity codes by category (Flight, Day Off, Training, Leave, Reserve, etc.)

---

## Build Sequence (Phases)

### Phase 1: Database & Storage (30 min)

Create 3 tables + Storage bucket + migrations

**Deliverable**: Tables exist, types regenerated
**Blockers**: None
**Next**: Phase 2.2 (can start parser in parallel with this)

- [ ] Create `published_rosters`, `roster_assignments`, `activity_codes` tables
- [ ] Create Supabase Storage bucket: `published-rosters`
- [ ] Deploy migrations
- [ ] Run `npm run db:types`

### Phase 2.2: PDF Parser Service (1 hour)

Core risk item — must work reliably before building UI

**Deliverable**: Parser extracts pilots + 28 days correctly from real PDFs
**Blockers**: Phase 1 complete, `pdfjs-dist` installed
**Next**: Phase 2.1 (other services)

- [ ] Install `pdfjs-dist` dependency
- [ ] Build `lib/services/roster-parser-service.ts`
- [ ] Test against 3 real rosters (RP01, RP02, RP03/2026)
- [ ] Validate output structure and pilot extraction

### Phase 2.1, 2.3, 2.4: Services (1 hour)

CRUD service, activity codes, pilot name matching

**Deliverable**: Can upload PDF → parse → store → match pilots
**Blockers**: Phase 1, Phase 2.2
**Next**: Phase 3 (APIs)

- [ ] Build `lib/services/published-roster-service.ts`
- [ ] Build `lib/services/activity-code-service.ts`
- [ ] Add pilot name matching logic (case-insensitive `last_name` + `first_name`)
- [ ] Create `lib/validations/published-roster-schema.ts`

### Phase 3: API Routes (1 hour)

5 endpoints with auth + CSRF + rate limiting

**Deliverable**: All endpoints functional, tested via curl
**Blockers**: Phase 2
**Next**: Phase 4 (UI)

- [ ] `POST /api/published-rosters` — Upload + parse
- [ ] `GET /api/published-rosters` — List rosters
- [ ] `GET /api/published-rosters/[id]` — Detail + assignments
- [ ] `GET /api/published-rosters/[id]/pdf` — Signed PDF URL
- [ ] `DELETE /api/published-rosters/[id]` — Delete roster

### Phase 4: UI Components (2.5 hours)

7 components built bottom-up

**Deliverable**: Full page renders with real data from 3 seeded rosters
**Blockers**: Phase 3
**Next**: Phase 5 (navigation + seeding)

Build order:

1. `activity-code-legend.tsx` (standalone)
2. `roster-grid.tsx` (core grid with sticky headers)
3. `daily-crew-summary.tsx` (daily counts below grid)
4. `roster-toolbar.tsx` (search + filters)
5. `roster-period-navigator.tsx` (period switching)
6. `roster-upload-dialog.tsx` (file upload)
7. `roster-pdf-viewer.tsx` (iframe modal)
8. `page.tsx` (assemble all components)

Key UX:

- Sticky left column (pilot names)
- Sticky top row (dates)
- Color-coded cells by activity category
- Today column highlight
- Weekly separators (every 7 days)

### Phase 5: Navigation & Seeding (30 min)

Add sidebar link + seed 3 rosters

**Deliverable**: Can navigate from sidebar, see current roster
**Blockers**: Phase 4
**Next**: Phase 6 (validation)

- [ ] Add "Published Rosters" nav item under "More"
- [ ] Seed 3 initial rosters via upload (or database insert)

### Phase 6: Validation & Polish (30 min)

Final quality gate

**Deliverable**: Build succeeds, no lint/type errors, manual testing passes
**Blockers**: Phase 5
**Next**: Merge

- [ ] `npm run validate` (type-check + lint + format)
- [ ] `npm run build` (verify no SSR/import errors)
- [ ] `npm run validate:naming` (file naming conventions)
- [ ] Manual testing: upload, parse, view, search, filter, delete
- [ ] Dark mode testing

---

## Files to Create/Modify

### New Service Files

```
lib/services/published-roster-service.ts
lib/services/roster-parser-service.ts
lib/services/activity-code-service.ts
lib/validations/published-roster-schema.ts
```

### New API Routes

```
app/api/published-rosters/route.ts
app/api/published-rosters/[id]/route.ts
app/api/published-rosters/[id]/pdf/route.ts
app/api/activity-codes/route.ts
```

### New UI Components

```
app/dashboard/published-rosters/page.tsx

components/published-rosters/
  roster-period-navigator.tsx
  roster-upload-dialog.tsx
  roster-grid.tsx
  roster-toolbar.tsx
  daily-crew-summary.tsx
  activity-code-legend.tsx
  roster-pdf-viewer.tsx
```

### Database Migrations

```
supabase/migrations/
  YYYYMMDDHHMMSS_create_published_rosters_tables.sql
```

### Modified Files

```
app/(dashboard)/layout.tsx  (add sidebar nav item)
lib/supabase/middleware.ts  (if any auth updates needed)
```

---

## Risks & Mitigations

| Risk                                   | Mitigation                                                      |
| -------------------------------------- | --------------------------------------------------------------- |
| PDF parsing unreliable                 | Checkpoint after Phase 2.2, test against all 3 real PDFs        |
| Pilot name matching poor               | Review unmatched pilots in UI, log mismatches                   |
| Grid performance (28 cols × 100+ rows) | Virtualize if needed, monitor initial load                      |
| Sticky column/header bugs              | Test horizontal/vertical scroll, edge cases                     |
| Activity code gaps                     | Auto-insert new codes with category "OTHER", admin can classify |

---

## Success Criteria

✅ Phase 1: All 3 tables exist, types regenerated  
✅ Phase 2.2: Parser correctly extracts all pilots + 28 days from 3 real PDFs  
✅ Phase 2.1-2.4: Can upload, parse, store, match pilots  
✅ Phase 3: All 5 API endpoints functional  
✅ Phase 4: Page renders with real data, full UX working  
✅ Phase 5: Sidebar navigation works, 3 rosters seeded  
✅ Phase 6: `npm run validate` + `npm run build` pass, manual testing complete

---

## Next Steps

1. **Get approval** to proceed with implementation
2. **Start Phase 1** — Create database migrations
3. **Parallel Phase 2.2** — Build PDF parser (highest risk item)
4. **Complete Phases 2.1, 2.3, 2.4** — Services
5. **Phase 3** — API routes
6. **Phase 4** — UI components (critical path, builds on 3)
7. **Phase 5** — Navigation + seeding
8. **Phase 6** — Final validation

---

**Approval Requested**: Ready to start Phase 1 → Phase 2.2 in parallel?
