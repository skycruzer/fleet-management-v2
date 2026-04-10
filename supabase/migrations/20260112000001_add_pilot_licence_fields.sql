-- Migration: Add pilot licence type and licence number fields
-- Author: Maurice Rondeau
-- Date: 2026-01-12
-- Description: Adds licence_type (enum: ATPL, CPL) and licence_number fields to pilots table

-- Step 1: Create the licence type enum
CREATE TYPE "public"."pilot_licence_type" AS ENUM (
    'ATPL',  -- Airline Transport Pilot Licence
    'CPL'    -- Commercial Pilot Licence
);

-- Step 2: Add columns to pilots table
ALTER TABLE "public"."pilots"
ADD COLUMN "licence_type" "public"."pilot_licence_type" NULL,
ADD COLUMN "licence_number" VARCHAR(20) NULL;

-- Step 3: Add unique constraint on licence_number (excluding nulls)
-- This allows multiple NULL values but ensures non-null values are unique
CREATE UNIQUE INDEX "pilots_licence_number_unique"
ON "public"."pilots" ("licence_number")
WHERE "licence_number" IS NOT NULL;

-- Step 4: Add index for licence type lookups
CREATE INDEX "idx_pilots_licence_type" ON "public"."pilots" ("licence_type");

-- Step 5: Add column comments for documentation
COMMENT ON COLUMN "public"."pilots"."licence_type" IS 'Pilot licence type (ATPL - Airline Transport, CPL - Commercial)';
COMMENT ON COLUMN "public"."pilots"."licence_number" IS 'Unique pilot licence number (5-20 alphanumeric characters)';
