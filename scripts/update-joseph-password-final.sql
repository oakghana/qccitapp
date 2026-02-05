-- Update Joseph's password with a properly generated bcrypt hash for qcc@123
-- Hash: bcrypt($2b$10$...) format which is the modern bcrypt version
-- This hash was generated with Node.js bcryptjs at cost 10

UPDATE profiles
SET password_hash = '$2b$10$nOQm3lEveL7Fc8nB8ByBreO3j.P44Pf0XAd68/tfm42qOcluParh2'
WHERE email = 'joseph.asante@qccgh.com' OR username = 'joseph.asante@qccgh.com';

-- Verify the update
SELECT id, username, email, password_hash, status, is_active, created_at
FROM profiles
WHERE email = 'joseph.asante@qccgh.com' OR username = 'joseph.asante@qccgh.com';
