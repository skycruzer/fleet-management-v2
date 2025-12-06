-- Migration: Drop Deprecated Request Tables
-- Date: 2025-12-05
-- Description: Remove deprecated leave_requests and flight_requests tables
--              All request data now uses unified pilot_requests table
--              Backups were created in /backups/ before cleanup

-- Drop deprecated tables (backups exist)
DROP TABLE IF EXISTS leave_requests CASCADE;
DROP TABLE IF EXISTS flight_requests CASCADE;

-- Add comment to pilot_requests confirming it's the unified table
COMMENT ON TABLE pilot_requests IS 'Unified request table for all leave and flight requests. Replaces deprecated leave_requests and flight_requests tables.';
