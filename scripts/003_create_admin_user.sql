-- This script will be run manually through Supabase dashboard to create admin user
-- because we need to use auth.users which requires elevated privileges

-- Note: This needs to be executed in Supabase SQL Editor with proper permissions
-- The password will be hashed by Supabase Auth

-- Create the admin user using Supabase Auth API
-- Email: ohemengappiah@qccgh.com
-- Password: ghana

-- After creating user through Supabase Auth signup, update their profile:
-- UPDATE public.profiles 
-- SET role = 'admin', 
--     username = 'ohemengappiah', 
--     full_name = 'Ohemeng Appiah',
--     location = 'Head Office - Accra',
--     department = 'IT Department'
-- WHERE id = (SELECT id FROM auth.users WHERE email = 'ohemengappiah@qccgh.com');
