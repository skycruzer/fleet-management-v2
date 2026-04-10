-- Seed reference data for incident_types and task_categories
-- Required for disciplinary matters and task management features
-- Author: Maurice Rondeau
-- Date: 2025-12-28

-- ============================================================================
-- INCIDENT TYPES (Required for creating disciplinary matters)
-- ============================================================================

INSERT INTO incident_types (code, name, description, severity_level, requires_review)
VALUES
  ('SAFETY_VIOLATION', 'Safety Violation', 'Violation of safety protocols or procedures', 'SERIOUS', true),
  ('PROCEDURE_DEVIATION', 'Procedure Deviation', 'Deviation from standard operating procedures', 'MODERATE', true),
  ('ATTENDANCE_ISSUE', 'Attendance Issue', 'Late arrival, no-show, or absence without notice', 'MINOR', false),
  ('PROFESSIONAL_CONDUCT', 'Professional Conduct', 'Unprofessional behavior or conduct violation', 'MODERATE', true),
  ('FATIGUE_MANAGEMENT', 'Fatigue Management', 'Failure to report fatigue or violation of rest requirements', 'SERIOUS', true),
  ('DOCUMENTATION_ERROR', 'Documentation Error', 'Incomplete, inaccurate, or missing required documentation', 'MINOR', false),
  ('COMMUNICATION_FAILURE', 'Communication Failure', 'Failure to follow proper communication protocols', 'MODERATE', true),
  ('EQUIPMENT_MISUSE', 'Equipment Misuse', 'Improper use or handling of aircraft equipment', 'SERIOUS', true),
  ('REGULATORY_VIOLATION', 'Regulatory Violation', 'Violation of FAA or other regulatory requirements', 'CRITICAL', true),
  ('OTHER', 'Other', 'Other incident type not covered above', 'MINOR', false)
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- TASK CATEGORIES (For organizing tasks in the task management system)
-- ============================================================================

INSERT INTO task_categories (name, description, color, icon, display_order, is_active)
VALUES
  ('Administrative', 'General administrative tasks and paperwork', '#6B7280', 'file-text', 1, true),
  ('Training', 'Pilot training, recurrency, and certification tasks', '#3B82F6', 'graduation-cap', 2, true),
  ('Compliance', 'Regulatory compliance and audit-related tasks', '#EF4444', 'shield-check', 3, true),
  ('Operations', 'Flight operations and scheduling tasks', '#10B981', 'plane', 4, true),
  ('HR', 'Human resources and personnel matters', '#8B5CF6', 'users', 5, true),
  ('Safety', 'Safety reviews, incident follow-up, and risk management', '#F59E0B', 'alert-triangle', 6, true),
  ('Maintenance', 'Aircraft maintenance coordination tasks', '#06B6D4', 'wrench', 7, true),
  ('Review', 'Document reviews, approvals, and sign-offs', '#EC4899', 'clipboard-check', 8, true)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Log counts for verification
DO $$
DECLARE
  incident_count INTEGER;
  category_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO incident_count FROM incident_types;
  SELECT COUNT(*) INTO category_count FROM task_categories;

  RAISE NOTICE 'Seed data complete: % incident types, % task categories', incident_count, category_count;
END $$;
