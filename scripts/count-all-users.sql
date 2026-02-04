-- Count all users in the profiles table
-- This shows the total number of users and breakdown by status

SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_users,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_users,
  COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_users,
  COUNT(CASE WHEN is_active = true THEN 1 END) as active_users,
  COUNT(CASE WHEN is_active = false THEN 1 END) as inactive_users
FROM profiles;

-- Also show breakdown by role
SELECT 
  role,
  COUNT(*) as user_count,
  COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending
FROM profiles
GROUP BY role
ORDER BY user_count DESC;
