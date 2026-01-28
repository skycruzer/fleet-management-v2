/**
 * Design Tokens — TypeScript Definitions
 * Developer: Maurice Rondeau
 *
 * Dark Navy Premium Design System — Linear-Inspired
 * Dark premium theme. CSS custom properties + TS access.
 */

// ============================================================================
// Z-INDEX SCALE
// ============================================================================
export const zIndex = {
  base: 0,
  dropdown: 10,
  sticky: 20,
  header: 30,
  sidebar: 40,
  overlay: 50,
  modal: 60,
  popover: 70,
  tooltip: 80,
  toast: 90,
  commandPalette: 100,
} as const

// ============================================================================
// TRANSITION TIMING
// ============================================================================
export const transitions = {
  instant: '100ms',
  fast: '150ms',
  normal: '200ms',
  slow: '300ms',
  page: '400ms',
} as const

// ============================================================================
// EASING FUNCTIONS
// ============================================================================
export const easing = {
  out: 'cubic-bezier(0.16, 1, 0.3, 1)',
  inOut: 'cubic-bezier(0.65, 0, 0.35, 1)',
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
} as const

// ============================================================================
// SPACING SCALE (8px Grid System)
// ============================================================================
export const spacing = {
  page: '1rem',
  pageSm: '1.5rem',
  pageLg: '2rem',
  section: '2rem',
  card: '1.25rem',
} as const

// ============================================================================
// LAYOUT TOKENS
// ============================================================================
export const layout = {
  sidebarWidth: '15rem',
  headerHeight: '3.5rem',
  mobileHeader: '4rem',
} as const

// ============================================================================
// BORDER RADIUS
// ============================================================================
export const radius = {
  sm: '0.375rem',
  md: '0.5rem',
  lg: '0.75rem',
  xl: '1rem',
} as const

// ============================================================================
// TOUCH TARGET SIZES (WCAG 2.2)
// ============================================================================
export const touchTargets = {
  minimum: '24px',
  recommended: '32px',
  mobile: '44px',
  mobileLarge: '48px',
} as const

// ============================================================================
// ANIMATION DURATIONS
// ============================================================================
export const animationDurations = {
  buttonState: { min: 120, max: 220 },
  formFeedback: { min: 200, max: 300 },
  pageTransition: { min: 300, max: 400 },
  modalOpenClose: { min: 200, max: 300 },
  skeletonShimmer: 1500,
} as const

// ============================================================================
// SEMANTIC COLORS (Dark premium theme)
// ============================================================================
export const semanticColors = {
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#38bdf8',
  primary: '#3b82f6',
  accent: '#06b6d4',
} as const

// ============================================================================
// GLASSMORPHISM VALUES
// ============================================================================
export const glass = {
  blur: '12px',
  blurStrong: '20px',
  blurSubtle: '8px',
  background: 'rgba(17, 24, 39, 0.8)',
  border: 'rgba(255, 255, 255, 0.06)',
} as const

// ============================================================================
// KEYBOARD SHORTCUTS (Command Palette)
// ============================================================================
export const keyboardShortcuts = {
  commandPalette: { key: 'k', modifier: 'meta' },
  search: { key: '/', modifier: null },
  escape: { key: 'Escape', modifier: null },
  save: { key: 's', modifier: 'meta' },
  newItem: { key: 'n', modifier: 'meta' },
} as const

// ============================================================================
// TYPE EXPORTS
// ============================================================================
export type ZIndex = keyof typeof zIndex
export type Transition = keyof typeof transitions
export type Easing = keyof typeof easing
export type Spacing = keyof typeof spacing
export type Radius = keyof typeof radius
export type SemanticColor = keyof typeof semanticColors
