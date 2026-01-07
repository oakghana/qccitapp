-- Add location-based service desk roles
-- Each location will have dedicated service desk staff who can manage tickets and assign tasks for their region

-- Update the role enum to include location-based service desk roles
DO $$ 
BEGIN
  -- Add new role types if they don't exist
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('admin', 'it_head', 'regional_it_head', 'it_staff', 'it_store_head', 'staff', 'service_provider');
  ELSE
    -- Add new roles to existing enum
    ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'service_desk_accra';
    ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'service_desk_kumasi';
    ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'service_desk_takoradi';
    ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'service_desk_tema';
    ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'service_desk_sunyani';
    ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'service_desk_cape_coast';
  END IF;
END $$;

-- Create sample service desk accounts for each location
INSERT INTO profiles (username, email, full_name, role, location, phone, department, password_hash, status, created_at, updated_at)
VALUES 
(
  'servicedesk.accra@qccgh.com',
  'servicedesk.accra@qccgh.com',
  'Service Desk - Accra',
  'service_desk_accra',
  'Accra',
  '+233XXXXXXXXX',
  'IT Service Desk',
  crypt('desk123', gen_salt('bf')),
  'approved',
  NOW(),
  NOW()
),
(
  'servicedesk.kumasi@qccgh.com',
  'servicedesk.kumasi@qccgh.com',
  'Service Desk - Kumasi',
  'service_desk_kumasi',
  'Kumasi',
  '+233XXXXXXXXX',
  'IT Service Desk',
  crypt('desk123', gen_salt('bf')),
  'approved',
  NOW(),
  NOW()
),
(
  'servicedesk.takoradi@qccgh.com',
  'servicedesk.takoradi@qccgh.com',
  'Service Desk - Takoradi',
  'service_desk_takoradi',
  'Takoradi',
  '+233XXXXXXXXX',
  'IT Service Desk',
  crypt('desk123', gen_salt('bf')),
  'approved',
  NOW(),
  NOW()
)
ON CONFLICT (username) DO UPDATE
SET 
  password_hash = EXCLUDED.password_hash,
  role = EXCLUDED.role,
  location = EXCLUDED.location,
  status = 'approved',
  updated_at = NOW();

-- Grant service desk staff ability to view and manage tickets for their location
-- Update RLS policies for service_tickets table
DROP POLICY IF EXISTS "Service desk can update tickets" ON service_tickets;

CREATE POLICY "Service desk staff can manage location tickets"
ON service_tickets
FOR ALL
USING (
  -- Service desk can see tickets for their location
  location = (SELECT location FROM profiles WHERE id = auth.uid())
  OR
  -- IT heads and admins can see all tickets
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'it_head', 'regional_it_head')
  )
);

COMMENT ON TABLE profiles IS 'User profiles with location-based service desk roles for regional ticket management';
