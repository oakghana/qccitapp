-- Add is_confirmed column to pdf_uploads table
ALTER TABLE pdf_uploads
ADD COLUMN IF NOT EXISTS is_confirmed BOOLEAN DEFAULT false;

-- Update existing documents with is_active = true to be confirmed
UPDATE pdf_uploads
SET is_confirmed = true
WHERE is_active = true;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_pdf_uploads_is_confirmed ON pdf_uploads(is_confirmed);
CREATE INDEX IF NOT EXISTS idx_pdf_uploads_target_location_confirmed ON pdf_uploads(target_location, is_confirmed);
