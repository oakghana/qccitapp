-- Reset password for all users with email joseph.asante@qccgh.com and all today's approved users
-- Correct bcrypt hash for password: qcc@123
-- Generated with bcryptjs at cost factor 10

UPDATE public.profiles
SET password_hash = '$2a$10$G.FJ1.s48TG2c2fMn3L2I.r5z1x9LhfLq0KuFx8nqDjwDrpUxDH4e',
    updated_at = now()
WHERE email = 'joseph.asante@qccgh.com'
   OR (status = 'approved' AND DATE(created_at) = CURRENT_DATE);

-- Verify the update
SELECT 
  id,
  email,
  username,
  full_name,
  password_hash,
  updated_at
FROM public.profiles
WHERE email = 'joseph.asante@qccgh.com'
   OR (status = 'approved' AND DATE(created_at) = CURRENT_DATE)
ORDER BY updated_at DESC;
