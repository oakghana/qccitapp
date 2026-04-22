-- Safely add missing columns to notifications table if they don't already exist
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS category text DEFAULT 'general';
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS read_at timestamptz DEFAULT NULL;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS reference_type text DEFAULT NULL;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS reference_id text DEFAULT NULL;

-- Update existing rows that have no category
UPDATE notifications SET category = 'general' WHERE category IS NULL;
