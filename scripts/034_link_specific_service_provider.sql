-- Link the specific service provider to their user account
-- Service Provider: dd7c27a4-6687-43ae-9981-9e1f3d48eee5 (sp, spohemengappiah@gmail.com)
-- User: d764dcf8-a330-4438-9433-3139704c3fe5

UPDATE public.service_providers 
SET user_id = 'd764dcf8-a330-4438-9433-3139704c3fe5'
WHERE id = 'dd7c27a4-6687-43ae-9981-9e1f3d48eee5';

-- Verify the link was created
SELECT 
  sp.id,
  sp.name,
  sp.email,
  sp.user_id,
  sp.phone,
  sp.location
FROM public.service_providers sp
WHERE sp.id = 'dd7c27a4-6687-43ae-9981-9e1f3d48eee5';

-- Check repair requests assigned to this service provider
SELECT 
  COUNT(*) as total_repairs,
  status
FROM public.repair_requests
WHERE service_provider_id = 'dd7c27a4-6687-43ae-9981-9e1f3d48eee5'
GROUP BY status;
