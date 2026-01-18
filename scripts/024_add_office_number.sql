-- Add office_number column to service_tickets
ALTER TABLE IF EXISTS service_tickets
ADD COLUMN IF NOT EXISTS office_number TEXT;

-- Optionally backfill existing records with empty string to avoid NULLs
UPDATE service_tickets SET office_number = '' WHERE office_number IS NULL;
