-- Update password hash for all 59 users created today (2026-02-04)
-- New hash: $2b$10$y.4.eCKGm0kI0hXv1rhJtuLYpKJH3R/Pfxvn9AU6DVF5PzYHsnmqm
-- This should be the correct bcrypt hash for password: qcc@123

UPDATE profiles
SET 
  password_hash = '$2b$10$y.4.eCKGm0kI0hXv1rhJtuLYpKJH3R/Pfxvn9AU6DVF5PzYHsnmqm',
  updated_at = NOW()
WHERE 
  DATE(created_at) = '2026-02-04'
  AND status = 'approved'
  AND role = 'user';

-- Display the updated users
SELECT 
  id,
  username,
  email,
  full_name,
  role,
  status,
  created_at,
  updated_at,
  LEFT(password_hash, 20) as hash_preview
FROM profiles
WHERE 
  DATE(created_at) = '2026-02-04'
  AND status = 'approved'
  AND role = 'user'
ORDER BY full_name;
