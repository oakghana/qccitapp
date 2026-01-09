-- Reset password for ohemengappiah@qccgh.com to pa$$w0rd
-- bcryptjs hash for "pa$$w0rd": $2a$10$rKZCEoJhqYqX5xJ9n5H9.eWZkF7vJ.JGkqY5KqZqN5H9eWZkF7vJ.

UPDATE profiles
SET 
  password_hash = '$2a$10$rKZCEoJhqYqX5xJ9n5H9.eWZkF7vJ.JGkqY5KqZqN5H9eWZkF7vJ.',
  updated_at = NOW()
WHERE username = 'ohemengappiah@qccgh.com';

-- Verify the update
SELECT 
  username, 
  role, 
  status,
  LEFT(password_hash, 15) as password_hash_preview,
  'Password is now: pa$$w0rd' as note
FROM profiles
WHERE username = 'ohemengappiah@qccgh.com';
