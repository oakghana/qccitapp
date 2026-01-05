-- Add status column to profiles table for user approval workflow
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected'));

-- Create index for faster queries on status
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);

-- Update existing users to approved status
UPDATE profiles SET status = 'approved' WHERE status IS NULL;

-- Create function to hash passwords on insert/update
CREATE OR REPLACE FUNCTION hash_password()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.password_hash IS NOT NULL AND NEW.password_hash != OLD.password_hash THEN
    NEW.password_hash := crypt(NEW.password_hash, gen_salt('bf'));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically hash passwords
DROP TRIGGER IF EXISTS hash_password_trigger ON profiles;
CREATE TRIGGER hash_password_trigger
BEFORE INSERT OR UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION hash_password();

-- Create function to verify passwords
CREATE OR REPLACE FUNCTION verify_password(username_input TEXT, password_input TEXT)
RETURNS TABLE (
  id UUID,
  username TEXT,
  email TEXT,
  full_name TEXT,
  role TEXT,
  location TEXT,
  status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.username,
    p.email,
    p.full_name,
    p.role,
    p.location,
    p.status
  FROM profiles p
  WHERE p.username = username_input
    AND p.password_hash = crypt(password_input, p.password_hash)
    AND p.status = 'approved';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
