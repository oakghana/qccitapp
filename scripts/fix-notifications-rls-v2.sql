-- Test and fix RLS policies for notifications table

-- 1. Check if RLS is enabled
-- ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing problematic policies if they exist
DROP POLICY IF EXISTS "Users can read own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;
DROP POLICY IF EXISTS "Service role can insert notifications" ON notifications;

-- 3. Create new, simpler RLS policies
-- Allow users to read their own notifications
CREATE POLICY "allow_users_read_own_notifications"
ON notifications
FOR SELECT
USING (auth.uid() = user_id);

-- Allow users to update their own notifications (mark as read, etc.)
CREATE POLICY "allow_users_update_own_notifications"
ON notifications
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own notifications
CREATE POLICY "allow_users_delete_own_notifications"
ON notifications
FOR DELETE
USING (auth.uid() = user_id);

-- Allow service role to insert notifications (for broadcasts)
CREATE POLICY "allow_service_role_insert_notifications"
ON notifications
FOR INSERT
WITH CHECK (true);

-- Allow service role to update notifications (for batch operations)
CREATE POLICY "allow_service_role_update_notifications"
ON notifications
FOR UPDATE
USING (true)
WITH CHECK (true);

-- 4. Verify the policies are in place
-- SELECT * FROM pg_policies WHERE tablename = 'notifications';
