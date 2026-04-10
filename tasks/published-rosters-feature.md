# Published Rosters Feature — Implementation Plan

**Created**: February 24, 2026
**Author**: Maurice (Skycruzer)
**Status**: APPROVED — Ready to build

---

## Overview

Allow admins to upload externally-produced B767 roster PDFs (from the Analytic Roster Tool), parse them into structured data, and present them as interactive, searchable tables. Admin-only, for records and review purposes.

**Key decisions:**

- **Dedicated page** — opens directly to the current roster period's grid (based on today's date)
- Period navigator (prev/next + dropdown) to browse other roster periods
- Parse PDF grid into structured assignments (not just PDF storage)
- Match roster entries to `pilots` table records
- Activity code legend with color-coded categories
- No summary columns or analysis section needed from the PDF
- One final roster per roster period (no versioning)
- New "Published Rosters" nav item under sidebar "More" section

---

## Phase 1: Database & Storage Foundation

- [ ] 1.1 Create Supabase Storage bucket: `published-rosters`
- [ ] 1.2 Create migration: `published_rosters` table
  ```sql
  - id (uuid PK)
  - roster_period_code (text, unique, e.g., "RP02/2026")
  - title (text, e.g., "B767 ANALYTIC ROSTER TOOL - RP02 ART 2026")
  - file_path (text, Supabase Storage path)
  - file_name (text, original filename)
  - file_size (integer, bytes)
  - uploaded_by (uuid, admin user)
  - uploaded_at (timestamptz)
  - parsed (boolean, default false)
  - parsed_at (timestamptz, nullable)
  - captain_count (integer, parsed)
  - fo_count (integer, parsed)
  - period_start_date (date)
  - period_end_date (date)
  - created_at, updated_at
  ```
- [ ] 1.3 Create migration: `roster_assignments` table
  ```sql
  - id (uuid PK)
  - published_roster_id (uuid FK → published_rosters ON DELETE CASCADE)
  - roster_period_code (text)
  - pilot_id (uuid FK → pilots, nullable — null if no match found)
  - pilot_name (text, raw name from PDF)
  - pilot_last_name (text)
  - pilot_first_name (text)
  - rank (text CHECK: 'CAPTAIN' | 'FIRST_OFFICER')
  - day_number (integer, 1-28)
  - date (date)
  - activity_code (text, e.g., "R0600", "DO", "SIM")
  - created_at
  - INDEX on (published_roster_id)
  - INDEX on (pilot_id)
  - INDEX on (roster_period_code, rank, day_number)
  ```
- [ ] 1.4 Create migration: `activity_codes` table + seed data
  ```sql
  - id (uuid PK)
  - code (text, unique)
  - name (text, human-readable label)
  - category (text CHECK: 'FLIGHT' | 'DAY_OFF' | 'TRAINING' | 'LEAVE' |
              'RESERVE' | 'TRANSPORT' | 'ACCOMMODATION' | 'OFFICE' | 'MEDICAL' | 'OTHER')
  - color (text, Tailwind color class for UI)
  - description (text, optional)
  - created_at
  ```
  Seed with known codes from existing rosters:
  - FLIGHTS: 001, 002, 003/004, 008, 019, 392, 393
  - DAY_OFF: DO, RDO, SDO
  - TRAINING: SIM, CRM, B7_EP, PERFM
  - LEAVE: A_L, LSL
  - RESERVE: R0600, R0400, R1200, RSL
  - TRANSPORT: CAR, DH008, DH019
  - ACCOMMODATION: HOTAC, STOPOVER
  - OFFICE: OFC_P2
  - MEDICAL: DO_MEDF, DO_MEDI, DO_MEDX
  - OTHER: SPD, 3/4
- [ ] 1.5 Add RLS policies (authenticated read, admin insert/update/delete)
- [ ] 1.6 Run `npm run db:types` to regenerate TypeScript types

## Phase 2: Service Layer

- [ ] 2.1 Create `lib/services/published-roster-service.ts`
  - `uploadPublishedRoster(file, rosterPeriodCode, uploadedBy)` → upload to storage + insert DB row
  - `getPublishedRosters(filters?)` → list with optional year/period filters
  - `getPublishedRosterById(id)` → single roster with assignment count
  - `getPublishedRosterByPeriod(code)` → lookup by roster period
  - `deletePublishedRoster(id)` → remove storage file + DB cascade
  - `getSignedPdfUrl(id)` → signed URL for PDF download
- [ ] 2.2 Create `lib/services/roster-parser-service.ts`
  - `parseRosterPdf(fileBuffer)` → extract structured data from PDF
  - Uses `pdfjs-dist` for position-aware text extraction
  - Splits CAPTAINS and FIRST OFFICERS sections
  - Extracts date headers to map day columns
  - Extracts pilot rows with 28 activity codes each
  - Returns: `{ captains: PilotAssignment[], firstOfficers: PilotAssignment[], periodCode, dates }`
- [ ] 2.3 Create `lib/services/activity-code-service.ts`
  - `getActivityCodes()` → all codes with categories
  - `getActivityCodesByCategory(category)` → filtered
  - `upsertActivityCode(code, data)` → add/update codes (for new codes found during parsing)
- [ ] 2.4 Add pilot name matching logic
  - Match `last_name + first_name` from PDF to `pilots` table
  - Case-insensitive comparison
  - Log unmatched pilots for admin review

## Phase 3: API Routes

- [ ] 3.1 `POST /api/published-rosters` — Upload + parse roster
  - CSRF validation → admin auth → rate limit
  - Accept multipart/form-data (PDF + roster_period_code)
  - Validate: PDF only, max 10MB, period not already uploaded
  - Upload to Supabase Storage
  - Parse PDF → insert assignments
  - Return roster record with parse status
- [ ] 3.2 `GET /api/published-rosters` — List rosters
  - Query params: `year`, `roster_period_code`
  - Return roster list with metadata
- [ ] 3.3 `GET /api/published-rosters/[id]` — Roster detail with assignments
  - Returns full roster data + all assignments
  - Supports query: `?pilot_id=`, `?rank=`, `?activity=`
- [ ] 3.4 `GET /api/published-rosters/[id]/pdf` — Signed PDF URL
  - Returns temporary signed URL for PDF download/view
- [ ] 3.5 `DELETE /api/published-rosters/[id]` — Delete roster
  - CSRF + admin auth + role check (ADMIN only)
  - Deletes storage file + cascades DB records

## Phase 4: UI — Dedicated Roster Page

The page opens directly to the **current roster period** based on today's date.
If no roster is uploaded for the current period, it shows an empty state with upload prompt.

### Page Layout (top → bottom):

```
┌─────────────────────────────────────────────────────┐
│  ◀ RP01/2026    [ RP02/2026 ▾ ]    RP03/2026 ▶     │  ← Period Navigator
│  "03 January – 30 January 2026"     [Upload] [PDF]  │  ← Dates + Actions
├─────────────────────────────────────────────────────┤
│  🔍 Search pilot...   [Filter: All Activities ▾]    │  ← Toolbar
├─────────────────────────────────────────────────────┤
│  CAPTAINS                                            │
│  ┌──────────┬────┬────┬────┬─── ... ───┬────┐       │
│  │ Pilot    │ D1 │ D2 │ D3 │          │ D28│       │  ← Interactive Grid
│  ├──────────┼────┼────┼────┤          ├────┤       │
│  │ AIHI N.  │STOP│019 │    │          │R060│       │
│  │ DAWANI P.│R060│R060│RDO │          │    │       │
│  └──────────┴────┴────┴────┴─── ... ───┴────┘       │
│                                                      │
│  FIRST OFFICERS                                      │
│  ┌──────────┬────┬────┬────┬─── ... ───┬────┐       │
│  │ ...      │    │    │    │          │    │       │
│  └──────────┴────┴────┴────┴─── ... ───┴────┘       │
├─────────────────────────────────────────────────────┤
│  Daily Crew: CPT 12/12/11/... | FO 6/7/8/...        │  ← Crew Summary
├─────────────────────────────────────────────────────┤
│  ▸ Activity Code Legend                              │  ← Collapsible
└─────────────────────────────────────────────────────┘
```

### Tasks

- [ ] 4.1 Create page: `app/dashboard/published-rosters/page.tsx`
  - **Single dedicated page** (no separate list/detail pages)
  - Server component: determines current roster period from today's date
  - Fetches roster for current period (or nearest available if none)
  - URL state: `?period=RP02/2026` for direct linking / navigation
  - Empty state: "No roster uploaded for RP02/2026" + upload CTA
- [ ] 4.2 Create `components/published-rosters/roster-period-navigator.tsx`
  - Prev/Next arrows + dropdown selector
  - Shows period dates and title
  - Highlights current period
  - Indicates which periods have uploaded rosters (dot/badge)
  - Upload button + Download PDF button in the header
- [ ] 4.3 Create upload dialog: `components/published-rosters/roster-upload-dialog.tsx`
  - Reuse existing `<FileUpload />` component (PDF only)
  - Pre-selects the current period (editable via dropdown)
  - Preview filename, validate before upload
  - Show parsing progress/result after upload
- [ ] 4.4 Create `components/published-rosters/roster-grid.tsx`
  - Full 28-day grid with pilot rows and day columns
  - **Two sections**: Captains header + rows, then First Officers header + rows
  - Color-coded activity cells by category
  - Sticky first column (pilot name) + sticky header row (dates + day names)
  - Click pilot name → link to pilot profile (if matched to `pilots` table)
  - Hover cell → tooltip with full activity code name
  - Responsive horizontal scroll for the 28 columns
- [ ] 4.5 Create `components/published-rosters/roster-toolbar.tsx`
  - Search by pilot name (filters grid rows)
  - Activity code filter (multi-select, filters/highlights matching cells)
  - Rank filter toggle (Captains / First Officers / Both)
- [ ] 4.6 Create `components/published-rosters/daily-crew-summary.tsx`
  - Row below each rank section showing daily counts
  - Count of pilots on duty (not DO/RDO/SDO/A_L) per day
  - Visual indicator when below minimum thresholds (10 CPT / 10 FO)
- [ ] 4.7 Create `components/published-rosters/activity-code-legend.tsx`
  - Collapsible legend at bottom of page
  - Shows all activity codes grouped by category with color swatches
  - Category headers: Flights, Day Off, Training, Leave, Reserve, Transport, Accommodation, Office, Medical
- [ ] 4.8 Create `components/published-rosters/roster-pdf-viewer.tsx`
  - Modal/dialog with embedded PDF viewer (iframe with signed URL)
  - Download PDF button
  - Triggered from header "PDF" button

## Phase 5: Navigation & Integration

- [ ] 5.1 Add "Published Rosters" to sidebar under "More" section
  - Icon: `ScrollText` from lucide-react
  - Route: `/dashboard/published-rosters`
- [ ] 5.2 Add validation schema: `lib/validations/published-roster-schema.ts`
- [ ] 5.3 Install `pdfjs-dist` dependency for server-side PDF parsing
- [ ] 5.4 Seed the 3 initial rosters (RP01, RP02, RP03 2026)

## Phase 6: Validation & Polish

- [ ] 6.1 Run `npm run validate` (type-check + lint + format)
- [ ] 6.2 Run `npm run build` to verify no SSR/import errors
- [ ] 6.3 Run `npm run validate:naming` for file naming conventions
- [ ] 6.4 Manual testing: upload, parse, view, search, filter, delete

---

## Architecture Decisions

### PDF Parsing Strategy

Use `pdfjs-dist` (Mozilla's PDF.js) for server-side text extraction with position coordinates. Group text items by Y-coordinate (same row), map X-coordinates to day columns via header positions. This is reliable for Excel-generated PDFs with consistent tabular layout.

### Pilot Name Matching

Case-insensitive match on `last_name` (primary) + `first_name` (secondary) against the `pilots` table. Unmatched pilots stored with `pilot_id = null` and flagged in the UI. Admin can manually review mismatches.

### Activity Codes

Stored in a separate table so new codes discovered during parsing can be auto-inserted with category "OTHER" for admin to later classify. This makes the system self-extending without code changes.

### What We Skip (by design)

- Summary columns (DO count, RDO count, total off, SDO, SHORT BLK)
- Analysis section (daily CPT/FO availability from PDF)
- Versioning (one final roster per period)
- Pilot portal access (admin-only)

---

## File Structure (New Files)

```
lib/services/
  published-roster-service.ts
  roster-parser-service.ts
  activity-code-service.ts

lib/validations/
  published-roster-schema.ts

app/dashboard/published-rosters/
  page.tsx                         (single dedicated page — grid + navigator)

app/api/published-rosters/
  route.ts                         (GET list, POST upload)
  [id]/route.ts                    (GET detail, DELETE)
  [id]/pdf/route.ts                (GET signed URL)

app/api/activity-codes/
  route.ts                         (GET all codes)

components/published-rosters/
  roster-period-navigator.tsx
  roster-upload-dialog.tsx
  roster-grid.tsx
  roster-toolbar.tsx
  daily-crew-summary.tsx
  activity-code-legend.tsx
  roster-pdf-viewer.tsx

supabase/migrations/
  YYYYMMDDHHMMSS_create_published_rosters.sql
  YYYYMMDDHHMMSS_create_roster_assignments.sql
  YYYYMMDDHHMMSS_create_activity_codes.sql
```

---

## UX Decisions (Approved)

### 1. Today Column Highlight

When viewing the current roster period, today's column gets a distinct background color.
Immediate visual anchor — open the page, see what's happening today.

### 2. Color-Coded Activity Cells

| Category      | Color        | Tailwind Class      | Examples                  |
| ------------- | ------------ | ------------------- | ------------------------- |
| Flights       | Blue         | `bg-blue-100/600`   | 008, 019, 392, 393, 001   |
| Day Off       | Light gray   | `bg-gray-100/700`   | DO, RDO, SDO              |
| Training      | Green        | `bg-green-100/600`  | SIM, CRM, B7_EP, PERFM    |
| Leave         | Amber/Orange | `bg-amber-100/600`  | A_L, LSL                  |
| Reserve       | Purple       | `bg-purple-100/600` | R0600, R0400, R1200, RSL  |
| Accommodation | Teal         | `bg-teal-100/600`   | HOTAC, STOPOVER           |
| Transport     | Slate        | `bg-slate-200/600`  | CAR, DH008, DH019         |
| Office        | Indigo       | `bg-indigo-100/600` | OFC_P2                    |
| Medical       | Red          | `bg-red-100/600`    | DO_MEDF, DO_MEDI, DO_MEDX |
| Other/Unknown | Yellow       | `bg-yellow-100/600` | SPD, 3/4, new codes       |

### 3. Auto-Collapse Sidebar

Page triggers sidebar collapse to icon-only (56px) for maximum grid width.
Existing `SidebarCollapseProvider` supports this.

### 4. Weekly Separators

Vertical divider every 7 columns to break the 28-day grid into 4 visual weeks.

### 5. Sticky Navigation

- Sticky left column: Pilot names (frozen while scrolling horizontally)
- Sticky top row: Date headers (frozen while scrolling vertically)

### 6. Pilot Click → Popover Detail

Click pilot name → popover card with full schedule list for that period.
Link to full pilot profile available from popover.

### 7. Period Navigator with Upload Status

Dropdown shows all periods with dot indicators: ● = uploaded, ○ = missing.

---

## Implementation Sequence (Build Order)

### Step 1: Database Foundation (Phase 1)

**No dependencies. Must be done first.**

- Write all 3 migration files (single combined migration)
- Create Supabase Storage bucket
- Deploy migration, regenerate types
- **Checkpoint: Verify tables exist and types generated**

### Step 2: PDF Parser Service (Phase 2.2)

**Depends on: Step 1 (types), pdfjs-dist installed**

- Build and test `roster-parser-service.ts` against the 3 real PDFs
- This is the riskiest piece — get it right before building UI
- **Checkpoint: Parser correctly extracts all pilots + 28 days from all 3 PDFs**

### Step 3: Core Services (Phase 2.1, 2.3, 2.4)

**Depends on: Step 1 (tables), Step 2 (parser)**

- `published-roster-service.ts` — CRUD + storage
- `activity-code-service.ts` — code legend management
- Pilot name matching logic
- Validation schema
- **Checkpoint: Can upload PDF, parse it, store assignments, match pilots**

### Step 4: API Routes (Phase 3)

**Depends on: Step 3 (services)**

- All 5 API endpoints following security pipeline
- **Checkpoint: API endpoints work via curl/Postman**

### Step 5: UI Components (Phase 4)

**Depends on: Step 4 (APIs)**

- Build bottom-up: grid cells → grid → toolbar → navigator → page
- **Sub-order:**
  1. `activity-code-legend.tsx` (standalone, no API dependency)
  2. `roster-grid.tsx` (core component, needs data shape)
  3. `daily-crew-summary.tsx` (derived from grid data)
  4. `roster-toolbar.tsx` (search + filters)
  5. `roster-period-navigator.tsx` (period switching + upload trigger)
  6. `roster-upload-dialog.tsx` (file upload + parse flow)
  7. `roster-pdf-viewer.tsx` (simple iframe modal)
  8. `page.tsx` (assembles all components)
- **Checkpoint: Full page renders with real data from 3 seeded rosters**

### Step 6: Navigation & Seeding (Phase 5)

**Depends on: Step 5 (page exists)**

- Add sidebar nav item
- Seed 3 initial rosters via upload
- **Checkpoint: Navigate from sidebar, see current roster**

### Step 7: Validation & Polish (Phase 6)

**Final gate before merge**

- `npm run validate` + `npm run build` + `npm run validate:naming`
- Dark mode testing
- Manual testing of all interactions
