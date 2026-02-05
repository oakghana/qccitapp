-- Count users created today (2026-02-04)
SELECT 
  COUNT(*) as total_users_today,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_today,
  COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_today,
  COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_today
FROM profiles
WHERE DATE(created_at) = CURRENT_DATE;

-- Also show breakdown by role for today's users
SELECT 
  role,
  status,
  COUNT(*) as count
FROM profiles
WHERE DATE(created_at) = CURRENT_DATE
GROUP BY role, status
ORDER BY role, status;

-- Show all users created today
SELECT 
  id,
  email,
  full_name,
  role,
  status,
  created_at
FROM profiles
WHERE DATE(created_at) = CURRENT_DATE
ORDER BY created_at DESC;
