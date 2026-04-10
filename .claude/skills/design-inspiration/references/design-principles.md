# Design Principles — Linear-Inspired SaaS

These principles codify the visual patterns from the reference images. Apply them consistently across all UI work.

## 1. Color System

### Dark Mode (Primary)
- **Background layers**: zinc-950 (base) → zinc-900 (surface) → zinc-800 (elevated)
- **Borders**: zinc-800 (subtle) or zinc-700 (emphasis)
- **Text**: zinc-100 (primary), zinc-400 (secondary), zinc-500 (muted)
- **Accent**: One color only — violet-500, blue-500, or indigo-500
- **Destructive**: red-500 for errors and destructive actions
- **Success**: emerald-500 for confirmations, sparingly

### Light Mode (Secondary)
- **Background layers**: white (base) → zinc-50 (surface) → zinc-100 (elevated)
- **Borders**: zinc-200 (subtle) or zinc-300 (emphasis)
- **Text**: zinc-900 (primary), zinc-600 (secondary), zinc-400 (muted)

### Rules
- Never use more than one accent color per view
- Status colors (red/yellow/green/blue) are functional only — not decorative
- Opacity modifiers for hover states: accent/10 for subtle, accent/20 for active
- Background gradients are forbidden. Solid colors only.

## 2. Typography

### Scale
| Role | Size | Weight | Line Height | Usage |
|------|------|--------|-------------|-------|
| Page title | 20-24px | 600 (semibold) | 1.2 | One per page, top-left |
| Section heading | 14-16px | 600 (semibold) | 1.3 | Card titles, group labels |
| Body | 13-14px | 400 (normal) | 1.5 | Primary content |
| Label | 12-13px | 500 (medium) | 1.4 | Form labels, table headers |
| Caption | 11-12px | 400 (normal) | 1.4 | Timestamps, metadata, badges |

### Rules
- Use a single font family: Geist Sans (or Inter as fallback)
- Geist Mono for code, IDs, timestamps, and keyboard shortcuts
- Never use font sizes below 11px
- Maximum 3 font weights per view (400, 500, 600)
- Letter-spacing: -0.01em for headings, normal for body

## 3. Spacing

### Grid
Base unit: 4px. Common values: 4, 8, 12, 16, 20, 24, 32, 40, 48px.

### Application
| Context | Spacing |
|---------|---------|
| Inline elements (icon + label) | 6-8px |
| Form field internal padding | 8-12px vertical, 12px horizontal |
| Between form fields | 16-20px |
| Card internal padding | 16-20px |
| Between cards/sections | 24-32px |
| Page margins | 24-32px (desktop), 16px (mobile) |

### Rules
- Consistent spacing within a component. If cards use 16px padding, all cards use 16px.
- Tighter spacing inside components, looser between them.
- Vertical rhythm matters more than arbitrary whitespace.

## 4. Borders and Separators

- Default border: 1px solid zinc-800 (dark) / zinc-200 (light)
- Border radius: 6px for buttons/inputs, 8px for cards, 12px for modals/sheets
- Use borders OR shadows — never both on the same element
- Prefer borders over shadows for most surfaces
- Horizontal rules between list items: 1px, full-bleed within the container
- No double borders (e.g., card inside a bordered section)

## 5. Shadows

- Almost never in dark mode. Borders handle separation.
- Light mode: `0 1px 2px rgba(0,0,0,0.05)` for cards, `0 4px 12px rgba(0,0,0,0.1)` for dropdowns/popovers
- Floating elements (modals, command palette): `0 16px 48px rgba(0,0,0,0.2)`
- Ring shadows for focus: `0 0 0 2px accent-500/50`

## 6. Interactive States

### Buttons
| Variant | Default | Hover | Active | Disabled |
|---------|---------|-------|--------|----------|
| Primary | accent bg, white text | accent/90 | accent/80 | 40% opacity |
| Secondary | transparent, accent text, accent/10 border | accent/10 bg | accent/20 bg | 40% opacity |
| Ghost | transparent | zinc-800 bg (dark) / zinc-100 bg (light) | zinc-700 bg | 40% opacity |
| Destructive | red bg, white text | red/90 | red/80 | 40% opacity |

### List Items / Table Rows
- Hover: zinc-800/50 background (dark) / zinc-50 (light)
- Selected: accent/10 background + accent left border (2px)
- Focus: ring shadow, 2px accent

### Links
- Default: accent color, no underline
- Hover: underline
- Never use blue (#0000FF)

## 7. Component Patterns

### Cards
- Background: one step above page background (zinc-900 on zinc-950)
- Border: 1px zinc-800
- Border radius: 8px
- Padding: 16-20px
- No shadow in dark mode

### Tables
- Header: zinc-800/50 background, 12px semibold uppercase text, zinc-400
- Rows: transparent background, 1px bottom border
- Hover: zinc-800/30 background
- Cell padding: 12px horizontal, 8-10px vertical
- Align numbers right, text left, actions right

### Forms
- Input height: 32-36px
- Background: zinc-900 (dark) / white (light)
- Border: 1px zinc-700 (dark) / zinc-300 (light)
- Focus: accent border + accent ring shadow
- Labels above inputs, 4-6px gap
- Help text below inputs in zinc-500, 12px

### Modals
- Overlay: black/50 backdrop
- Background: zinc-900 (dark) / white (light)
- Border radius: 12px
- Max width: 480px for forms, 640px for content
- Padding: 24px
- Close: X button top-right or Escape key

### Empty States
- Centered in container
- Icon (muted, 40-48px) → heading (16px semibold) → description (13px zinc-400) → CTA button
- Vertical spacing: 12px between elements
- Keep copy concise: one sentence description, clear action

## 8. Animation and Transitions

- Duration: 150ms for hovers, 200ms for reveals, 300ms for modals
- Easing: `ease-out` for entrances, `ease-in` for exits
- Properties: opacity, transform (translate/scale), background-color
- Never animate layout properties (width, height, margin, padding)
- Reduced motion: respect `prefers-reduced-motion` — disable all non-essential animation

## 9. Icons

- Size: 16px inline, 20px standalone, 14px in compact contexts
- Stroke width: 1.5-2px (match the icon set)
- Color: inherit from text color (zinc-400 for muted, zinc-100 for primary)
- Preferred set: Lucide (already in project via shadcn/ui)
- Always pair with text labels in navigation — icon-only for secondary actions with tooltips
