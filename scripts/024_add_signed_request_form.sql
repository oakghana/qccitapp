-- Add signed_request_form column to repair_requests table
-- This stores the URL/path of the signed and endorsed repair request form

ALTER TABLE public.repair_requests
ADD COLUMN IF NOT EXISTS signed_request_form_url TEXT;

COMMENT ON COLUMN public.repair_requests.signed_request_form_url IS 'URL of the signed and endorsed repair request form (required for submission)';

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_repair_requests_signed_form ON repair_requests(signed_request_form_url)
WHERE signed_request_form_url IS NOT NULL;