-- ============================================
-- Add service_provider_name column to repair_requests
-- ============================================

ALTER TABLE public.repair_requests ADD COLUMN IF NOT EXISTS service_provider_name TEXT;

-- Add comment
COMMENT ON COLUMN public.repair_requests.service_provider_name IS 'Name of the assigned service provider';