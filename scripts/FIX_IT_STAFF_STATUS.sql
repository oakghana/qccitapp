-- Check current status of all IT staff
SELECT 
  id,
  full_name,
  email,
  role,
  location,
  status,
  created_at
FROM profiles
WHERE role IN ('it_staff', 'service_desk_staff', 'regional_it_head', 'it_head', 'service_desk_head')
ORDER BY role, full_name;

-- Update all IT staff to approved status (valid values: 'pending', 'approved', 'rejected')
UPDATE profiles
SET 
  status = 'approved',
  updated_at = NOW()
WHERE role IN ('it_staff', 'service_desk_staff', 'regional_it_head', 'it_head', 'service_desk_head')
  AND (status IS NULL OR status = 'pending' OR status = 'rejected');

-- Verify the update
SELECT 
  role,
  status,
  COUNT(*) as count
FROM profiles
WHERE role IN ('it_staff', 'service_desk_staff', 'regional_it_head', 'it_head', 'service_desk_head')
GROUP BY role, status
ORDER BY role, status;
