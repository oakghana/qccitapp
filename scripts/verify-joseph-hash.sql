-- Reset password for joseph.asante@qccgh.com to qcc@123
-- Using the correct bcrypt hash for qcc@123
UPDATE profiles
SET password_hash = '$2a$10$G.FJ1.s48TG2c2fMn3L2I.r5z1x9LhfLq0KuFx8nqDjwDrpUxDH4e'
WHERE email = 'joseph.asante@qccgh.com';

-- Verify the update
SELECT id, username, email, password_hash, status, is_active
FROM profiles
WHERE email = 'joseph.asante@qccgh.com';
