-- Add requester context fields to service_tickets table
ALTER TABLE service_tickets ADD COLUMN IF NOT EXISTS requester_department TEXT;
ALTER TABLE service_tickets ADD COLUMN IF NOT EXISTS requester_room_number TEXT;
ALTER TABLE service_tickets ADD COLUMN IF NOT EXISTS requester_phone TEXT;
ALTER TABLE service_tickets ADD COLUMN IF NOT EXISTS requester_email TEXT;

-- Add assigned staff tracking
ALTER TABLE service_tickets ADD COLUMN IF NOT EXISTS assigned_to_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE service_tickets ADD COLUMN IF NOT EXISTS assigned_to_name TEXT;
ALTER TABLE service_tickets ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE service_tickets ADD COLUMN IF NOT EXISTS self_assigned BOOLEAN DEFAULT FALSE;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_service_tickets_assigned_to ON service_tickets(assigned_to_id);
CREATE INDEX IF NOT EXISTS idx_service_tickets_assigned_at ON service_tickets(assigned_at DESC);
CREATE INDEX IF NOT EXISTS idx_service_tickets_self_assigned ON service_tickets(self_assigned, status);
CREATE INDEX IF NOT EXISTS idx_service_tickets_requester_dept ON service_tickets(requester_department);

-- Add comment
COMMENT ON COLUMN service_tickets.requester_department IS 'Department of the person requesting IT support';
COMMENT ON COLUMN service_tickets.requester_room_number IS 'Room/Office number of the person requesting IT support';
COMMENT ON COLUMN service_tickets.assigned_to_id IS 'ID of the IT staff member assigned to this ticket';
COMMENT ON COLUMN service_tickets.self_assigned IS 'Indicates if the ticket was self-assigned by regional IT head';
