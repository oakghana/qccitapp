-- Check password hash for joseph.asante@qccgh.com
SELECT 
  id,
  username,
  email,
  full_name,
  password_hash,
  status,
  is_active,
  role,
  LENGTH(password_hash) as hash_length,
  SUBSTRING(password_hash, 1, 7) as hash_format
FROM profiles
WHERE email = 'joseph.asante@qccgh.com'
LIMIT 1;
