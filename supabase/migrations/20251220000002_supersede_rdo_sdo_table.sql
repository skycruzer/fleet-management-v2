-- Migration: No-op - Mark rdo_sdo_requests table as superseded
-- Author: Maurice Rondeau
-- Date: December 20, 2025
--
-- Context: Migration 20250119120000_create_rdo_sdo_requests_table.sql created
-- a separate rdo_sdo_requests table. This architecture was superseded by
-- Sprint 1.1 (November 2025) which unified all requests into pilot_requests.
--
-- The unified approach:
--   SELECT * FROM pilot_requests WHERE request_category IN ('RDO', 'SDO')
--
-- See: 20251120010000_extend_pilot_requests_for_rdo_sdo.sql
--
-- This migration is intentionally a NO-OP to document the architectural decision
-- and prevent future confusion about the orphaned table.

-- No SQL operations - this is documentation only
SELECT 'rdo_sdo_requests table is deprecated - use pilot_requests with request_category IN (RDO, SDO)' AS migration_note;
