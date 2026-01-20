/**
 * Optimistic UI Hooks
 * Barrel export for all optimistic mutation hooks
 */

export {
  useOptimisticLeaveRequest,
  useOptimisticLeaveRequestUpdate,
} from './use-optimistic-leave-request'

/**
 * Animation & Accessibility Hooks
 */
export {
  useAnimationSettings,
  usePresetVariants,
  useAnimationTransition,
  useReducedMotion,
} from './use-reduced-motion'

export {
  useOptimisticCertificationUpdate,
  useOptimisticCertificationCreate,
} from './use-optimistic-certification'

export { useOptimisticPilotUpdate, useOptimisticPilotCreate } from './use-optimistic-pilot'
