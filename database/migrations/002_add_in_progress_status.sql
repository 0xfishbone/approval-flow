-- Migration: Add IN_PROGRESS status to request_status enum
-- Date: 2026-01-30
-- Description: Adds IN_PROGRESS status between PENDING and APPROVED to track requests that are actively being reviewed

-- Add IN_PROGRESS to the enum type
-- Note: In PostgreSQL, you cannot directly modify enum types
-- We need to use ALTER TYPE ... ADD VALUE

ALTER TYPE request_status ADD VALUE 'IN_PROGRESS' AFTER 'PENDING';

-- Verify the change
-- SELECT unnest(enum_range(NULL::request_status));
