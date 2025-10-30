/**
 * Lazy-Loaded Analytics Components
 *
 * Dynamic imports for heavy analytics components to reduce initial bundle size.
 * These components use Tremor charts and heavy visualization libraries.
 *
 * Expected Impact: 30-40% bundle size reduction for analytics dashboard
 *
 * @version 1.0.0
 * @since 2025-10-28
 */

import { lazyLoadChart } from '@/lib/utils/dynamic-imports'

/**
 * Multi-Year Forecast Chart (Tremor BarChart)
 * Heavy component with Tremor + Recharts dependencies
 * ~150KB minified
 */
export const LazyMultiYearForecastChart = lazyLoadChart(() =>
  import('./MultiYearForecastChart').then(mod => ({
    default: mod.MultiYearForecastChart
  }))
)

/**
 * Crew Shortage Warnings (Complex client component)
 * Heavy interactive component with multiple cards and badges
 * ~50KB minified
 */
export const LazyCrewShortageWarnings = lazyLoadChart(() =>
  import('./CrewShortageWarnings').then(mod => ({
    default: mod.CrewShortageWarnings
  }))
)

/**
 * Succession Pipeline Table (Server Component, but can be lazy-loaded)
 * Large table component with sorting and filtering
 * ~40KB minified
 */
export const LazySuccessionPipelineTable = lazyLoadChart(() =>
  import('./SuccessionPipelineTable').then(mod => ({
    default: mod.SuccessionPipelineTable
  }))
)
