-- Link service providers to their user accounts
-- This fixes the relationship so service providers can see their assigned repairs

-- Step 1: Update service_providers to link to user profiles
UPDATE public.service_providers sp
SET user_id = ap.id
FROM auth.users ap
WHERE LOWER(sp.email) = LOWER(ap.email)
  AND sp.user_id IS NULL
  AND ap.raw_user_meta_data->>'role' = 'service_provider';

-- Step 2: Verify the link was created
SELECT 
  'Service Providers linked to users:' as status,
  COUNT(*) as count
FROM public.service_providers 
WHERE user_id IS NOT NULL;

-- Step 3: Show the service provider that should now be linked
SELECT 
  id,
  name,
  email,
  user_id,
  is_active
FROM public.service_providers 
WHERE email = 'spohemengappiah@gmail.com';

-- Step 4: Verify the user profile
SELECT 
  id,
  email,
  raw_user_meta_data->>'role' as role,
  raw_user_meta_data->>'name' as name
FROM auth.users
WHERE email = 'spohemengappiah@gmail.com';
