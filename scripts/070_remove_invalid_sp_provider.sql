-- Remove invalid "sp" service provider with name "sp"
-- This service provider was created with an incomplete name and has no proper role assigned

-- First, check what we're about to delete
SELECT id, name, email, is_active, user_id, created_at 
FROM public.service_providers 
WHERE LOWER(name) = LOWER('sp') 
   OR (name = 'sp' AND email = 'spohemengappiah@gmail.com');

-- Delete repair requests associated with this invalid provider (if any)
DELETE FROM public.repair_requests 
WHERE service_provider_id IN (
  SELECT id FROM public.service_providers 
  WHERE LOWER(name) = LOWER('sp') 
     OR (name = 'sp' AND email = 'spohemengappiah@gmail.com')
);

-- Finally, delete the invalid service provider
DELETE FROM public.service_providers 
WHERE LOWER(name) = LOWER('sp') 
   OR (name = 'sp' AND email = 'spohemengappiah@gmail.com');

-- Verify deletion
SELECT COUNT(*) as remaining_sp_providers
FROM public.service_providers 
WHERE LOWER(name) LIKE '%sp%';

-- Show remaining active service providers
SELECT id, name, email, location, is_active 
FROM public.service_providers 
WHERE is_active = true
ORDER BY name;
