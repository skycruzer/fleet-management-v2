/**
 * Lazy-Loaded Renewal Planning Components
 *
 * Dynamic imports for renewal planning dashboard to reduce initial bundle size.
 *
 * Expected Impact: 20-30% bundle size reduction for renewal planning pages
 */

import { lazyLoadDashboard } from '@/lib/utils/dynamic-imports'

/**
 * Renewal Planning Dashboard (Complex client component)
 * Heavy component with roster period timeline, calendar selectors, and complex state
 * ~80KB minified
 */
export const LazyRenewalPlanningDashboard = lazyLoadDashboard(() =>
  import('./renewal-planning-dashboard').then((mod) => ({
    default: mod.RenewalPlanningDashboard,
  }))
)
