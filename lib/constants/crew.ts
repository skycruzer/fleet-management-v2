/**
 * Crew Requirements Constants
 * Author: Maurice Rondeau
 *
 * Default minimum crew thresholds. These match the settings table defaults
 * (minimum_captains_per_hull: 5, number_of_aircraft: 2 → 5 × 2 = 10).
 *
 * Services that need dynamic values should use getPilotRequirements() from admin-service.
 * These constants are for UI components and fallback defaults only.
 */
export const DEFAULT_MINIMUM_CAPTAINS = 10
export const DEFAULT_MINIMUM_FIRST_OFFICERS = 10
