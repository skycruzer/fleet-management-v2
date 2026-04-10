---
name: design-inspiration
description: This skill should be used when creating or modifying any web UI component, page, or layout. It provides curated visual references organized by category (dashboards, navigation, forms, tables, cards, modals, sidebars, empty-states) that define the target aesthetic — clean SaaS inspired by Linear. Read the relevant category's reference images before writing or editing any TSX, CSS, or layout code to ensure designs align with the established look and feel.
---

# Design Inspiration

Visual reference library for achieving a clean, Linear-inspired SaaS aesthetic across all UI work. Before creating or modifying any UI component, consult the relevant reference images to ensure visual consistency.

## How to Use This Skill

### Step 1: Identify the Category

Match the UI work to one or more categories:

| Category | When to Reference | Asset Path |
|----------|-------------------|------------|
| **Dashboards** | Building metric cards, stat grids, overview pages, analytics views | `assets/dashboards/` |
| **Navigation** | Sidebars, top bars, breadcrumbs, tab systems, command palettes | `assets/navigation/` |
| **Forms** | Input fields, select menus, date pickers, multi-step forms, settings pages | `assets/forms/` |
| **Tables** | Data tables, list views, sortable columns, inline editing, bulk actions | `assets/tables/` |
| **Cards** | Content cards, feature cards, list items, summary panels | `assets/cards/` |
| **Modals** | Dialogs, confirmation prompts, slide-overs, sheets, popovers | `assets/modals/` |
| **Sidebars** | Navigation panels, detail panels, filter panels, collapsible sidebars | `assets/sidebars/` |
| **Empty States** | Zero-data views, onboarding prompts, error states, placeholder content | `assets/empty-states/` |

### Step 2: Read the Reference Images

Open and visually examine **every image** in the matching category folder(s) using the Read tool. Study:

- Layout structure and spacing rhythm
- Color usage and contrast patterns
- Typography hierarchy and weight choices
- Border, shadow, and separator treatments
- Interactive element styling (buttons, inputs, links)
- Information density and whitespace balance

### Step 3: Read the Design Principles

Reference `references/design-principles.md` for the codified rules that extract common patterns from the visual references. These principles translate what the images show into actionable implementation guidance.

### Step 4: Apply to Implementation

When writing TSX/CSS code, continuously cross-reference the visual references. Specific guidance:

- **Match the density**: Linear uses medium density — not cramped, not wasteful. Content breathes but screens feel purposeful.
- **Match the restraint**: One accent color. Minimal borders. Subtle shadows. Let typography and spacing create hierarchy.
- **Match the polish**: Smooth transitions, consistent radii, aligned baselines, pixel-perfect spacing.

## Adding New References

To add new design inspiration:

1. Save screenshots as PNG or JPG files
2. Use descriptive filenames: `linear-project-list.png`, `notion-settings-form.png`
3. Place in the appropriate category folder under `assets/`
4. If a reference spans multiple categories, place it in the primary one

Recommended sources for screenshots:
- Mobbin (mobbin.com) — search for "Linear", "Notion", "Vercel", "Stripe"
- Dribbble — search for "SaaS dashboard", "admin panel", "clean UI"
- Direct screenshots from Linear, Notion, Vercel Dashboard, Stripe Dashboard

## Design DNA (Quick Reference)

The target aesthetic is **Linear-grade SaaS**. Key traits:

- **Dark-first**: Dark backgrounds (zinc-900/950) with subtle borders (zinc-800)
- **Monochrome + one accent**: Zinc/neutral palette with a single accent (violet, blue, or indigo)
- **Tight typography**: Inter/Geist, medium weight headings, 13-14px body text
- **Subtle depth**: No heavy shadows — use 1px borders and very subtle elevation
- **Functional density**: Every pixel earns its place. No decorative filler.
- **Micro-interactions**: Smooth hover states, keyboard-navigable, instant feedback
- **Icon-forward**: Small, consistent icons paired with labels — not icon-only, not label-only
