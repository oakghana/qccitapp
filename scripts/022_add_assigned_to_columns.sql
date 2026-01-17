-- ============================================
-- ADD ASSIGNED_TO COLUMNS FOR TASK ASSIGNMENT
-- This script adds proper assignment tracking columns
-- ============================================

-- Add assigned_to (user ID) column to service_tickets if not exists
ALTER TABLE public.service_tickets ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.service_tickets ADD COLUMN IF NOT EXISTS assigned_to_name TEXT;
ALTER TABLE public.service_tickets ADD COLUMN IF NOT EXISTS assigned_by TEXT;
ALTER TABLE public.service_tickets ADD COLUMN IF NOT EXISTS assigned_by_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.service_tickets ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ;
ALTER TABLE public.service_tickets ADD COLUMN IF NOT EXISTS due_date DATE;
ALTER TABLE public.service_tickets ADD COLUMN IF NOT EXISTS work_notes TEXT;
ALTER TABLE public.service_tickets ADD COLUMN IF NOT EXISTS estimated_hours DECIMAL(6,2);
ALTER TABLE public.service_tickets ADD COLUMN IF NOT EXISTS actual_hours DECIMAL(6,2);
ALTER TABLE public.service_tickets ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;

-- Add assigned_to column to repair_requests if not exists
ALTER TABLE public.repair_requests ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.repair_requests ADD COLUMN IF NOT EXISTS assigned_to_name TEXT;
ALTER TABLE public.repair_requests ADD COLUMN IF NOT EXISTS assigned_by TEXT;
ALTER TABLE public.repair_requests ADD COLUMN IF NOT EXISTS assigned_by_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.repair_requests ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ;
ALTER TABLE public.repair_requests ADD COLUMN IF NOT EXISTS due_date DATE;
ALTER TABLE public.repair_requests ADD COLUMN IF NOT EXISTS work_notes TEXT;
ALTER TABLE public.repair_requests ADD COLUMN IF NOT EXISTS estimated_hours DECIMAL(6,2);
ALTER TABLE public.repair_requests ADD COLUMN IF NOT EXISTS actual_hours DECIMAL(6,2);
ALTER TABLE public.repair_requests ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_service_tickets_assigned_to ON public.service_tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_repair_requests_assigned_to ON public.repair_requests(assigned_to);

COMMENT ON COLUMN public.service_tickets.assigned_to IS 'User ID of the staff member assigned to this ticket';
COMMENT ON COLUMN public.repair_requests.assigned_to IS 'User ID of the staff member assigned to this repair';
