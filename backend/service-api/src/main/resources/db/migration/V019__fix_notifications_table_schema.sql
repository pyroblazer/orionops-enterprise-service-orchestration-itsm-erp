-- V019: Fix notifications table schema
-- Add missing audit columns that BaseEntity expects
-- Fixes 500 error when fetching notifications

BEGIN;

-- Add missing updated_at column (required by BaseEntity)
ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Add missing deleted_at column (required by BaseEntity for soft deletes)
ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- Update existing rows to have updated_at = created_at if not already set
UPDATE notifications SET updated_at = created_at WHERE updated_at = CURRENT_TIMESTAMP AND created_at IS NOT NULL;

COMMIT;
