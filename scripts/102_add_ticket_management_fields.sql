-- Add columns for ticket status management and completion confirmation
ALTER TABLE service_tickets ADD COLUMN IF NOT EXISTS ticket_held BOOLEAN DEFAULT FALSE;
ALTER TABLE service_tickets ADD COLUMN IF NOT EXISTS hold_reason TEXT;
ALTER TABLE service_tickets ADD COLUMN IF NOT EXISTS held_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE service_tickets ADD COLUMN IF NOT EXISTS held_by UUID REFERENCES auth.users(id);
ALTER TABLE service_tickets ADD COLUMN IF NOT EXISTS held_by_name TEXT;

-- Add completion confirmation tracking
ALTER TABLE service_tickets ADD COLUMN IF NOT EXISTS completion_confirmed BOOLEAN DEFAULT FALSE;
ALTER TABLE service_tickets ADD COLUMN IF NOT EXISTS completion_confirmed_by UUID REFERENCES auth.users(id);
ALTER TABLE service_tickets ADD COLUMN IF NOT EXISTS completion_confirmed_by_name TEXT;
ALTER TABLE service_tickets ADD COLUMN IF NOT EXISTS completion_confirmed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE service_tickets ADD COLUMN IF NOT EXISTS completion_confirmation_notes TEXT;

-- Create table to track ticket reassignments for audit trail
CREATE TABLE IF NOT EXISTS ticket_reassignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID REFERENCES service_tickets(id) ON DELETE CASCADE,
    reassigned_from UUID REFERENCES auth.users(id),
    reassigned_from_name TEXT,
    reassigned_to UUID REFERENCES auth.users(id),
    reassigned_to_name TEXT,
    reassigned_by UUID REFERENCES auth.users(id),
    reassigned_by_name TEXT,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for ticket reassignments
CREATE INDEX IF NOT EXISTS idx_ticket_reassignments_ticket ON ticket_reassignments(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_reassignments_created ON ticket_reassignments(created_at DESC);
