-- Remove invalid "sp" service provider with name "sp"
-- This service provider was created with an incomplete name and has no proper role assigned
-- Service Provider ID: dd7c27a4-6687-43ae-9981-9e1f3d48eee5
-- Email: spohemengappiah@gmail.com

BEGIN;

-- First, check what we're about to delete
SELECT 'BEFORE CLEANUP: Service Providers to be deleted' as status;
SELECT id, name, email, is_active, user_id, created_at 
FROM public.service_providers 
WHERE id = 'dd7c27a4-6687-43ae-9981-9e1f3d48eee5'
   OR LOWER(name) = LOWER('sp') 
   OR email = 'spohemengappiah@gmail.com';

-- Check for any repair requests linked to this provider
SELECT 'BEFORE CLEANUP: Repair requests linked to SP provider' as status;
SELECT id, service_provider_id, service_provider_name, status, created_at
FROM public.repair_requests 
WHERE service_provider_id = 'dd7c27a4-6687-43ae-9981-9e1f3d48eee5'
   OR service_provider_name = 'sp';

-- Delete repair requests associated with this invalid provider
DELETE FROM public.repair_requests 
WHERE service_provider_id = 'dd7c27a4-6687-43ae-9981-9e1f3d48eee5'
   OR service_provider_name = 'sp';

-- Finally, delete the invalid service provider
DELETE FROM public.service_providers 
WHERE id = 'dd7c27a4-6687-43ae-9981-9e1f3d48eee5'
   OR LOWER(name) = LOWER('sp') 
   OR email = 'spohemengappiah@gmail.com';

-- Verify deletion
SELECT 'AFTER CLEANUP: Verification' as status;
SELECT COUNT(*) as remaining_sp_count
FROM public.service_providers 
WHERE LOWER(name) = LOWER('sp') OR email = 'spohemengappiah@gmail.com';

-- Show remaining active service providers
SELECT 'ACTIVE SERVICE PROVIDERS:' as status;
SELECT id, name, email, location, phone, is_active 
FROM public.service_providers 
WHERE is_active = true
ORDER BY name;

COMMIT;
