-- Reset password for all approved users created today to qcc@123
-- Hash: $2b$10$WKvRZ1W7aJNwX3IjRcZXa.dMB.Y7cF5vU6UvP5Fg6tH8P2KzHf5eW
-- Password: qcc@123

WITH updated_users AS (
  UPDATE public.profiles
  SET password_hash = '$2b$10$WKvRZ1W7aJNwX3IjRcZXa.dMB.Y7cF5vU6UvP5Fg6tH8P2KzHf5eW',
      updated_at = now()
  WHERE status = 'approved'
    AND DATE(created_at) = CURRENT_DATE
  RETURNING id, email, username, full_name, role, status
)
SELECT 
  COUNT(*) as total_updated,
  COUNT(CASE WHEN role = 'user' THEN 1 END) as user_count,
  COUNT(CASE WHEN role = 'it_staff' THEN 1 END) as it_staff_count,
  COUNT(CASE WHEN role = 'it_head' THEN 1 END) as it_head_count,
  COUNT(CASE WHEN role = 'regional_it_head' THEN 1 END) as regional_it_head_count,
  COUNT(CASE WHEN role = 'it_store_head' THEN 1 END) as it_store_head_count
FROM updated_users;

-- Display updated users for verification
SELECT 
  id,
  email,
  username,
  full_name,
  role,
  status,
  created_at
FROM public.profiles
WHERE status = 'approved'
  AND DATE(created_at) = CURRENT_DATE
ORDER BY created_at DESC;
