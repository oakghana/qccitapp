-- The app uses custom auth (not Supabase Auth), so auth.uid() is always NULL.
-- All notification reads/writes go through API routes that use the service role key.
-- Disabling RLS on notifications is safe and prevents silent query failures.

ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies that relied on auth.uid() since they block all reads
DROP POLICY IF EXISTS "allow_users_read_own_notifications" ON notifications;
DROP POLICY IF EXISTS "allow_users_update_own_notifications" ON notifications;
DROP POLICY IF EXISTS "allow_users_delete_own_notifications" ON notifications;
DROP POLICY IF EXISTS "allow_service_role_insert_notifications" ON notifications;
DROP POLICY IF EXISTS "allow_service_role_update_notifications" ON notifications;
DROP POLICY IF EXISTS "Users can read own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;
DROP POLICY IF EXISTS "Service role can insert notifications" ON notifications;
