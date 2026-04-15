-- Add new columns to repair_tasks for enhanced tracking
ALTER TABLE repair_tasks
ADD COLUMN IF NOT EXISTS confirmed_by uuid,
ADD COLUMN IF NOT EXISTS confirmed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS work_started_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS work_completed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS repair_source varchar(50) DEFAULT 'regional', -- 'regional' or 'head_office'
ADD COLUMN IF NOT EXISTS region_id varchar(100),
ADD COLUMN IF NOT EXISTS final_cost numeric,
ADD COLUMN IF NOT EXISTS repair_notes text,
ADD COLUMN IF NOT EXISTS confirmation_status varchar(50) DEFAULT 'pending'; -- 'pending', 'confirmed', 'rejected'

-- Create index for faster querying
CREATE INDEX IF NOT EXISTS idx_repair_tasks_service_provider_status 
ON repair_tasks(service_provider_id, status);

CREATE INDEX IF NOT EXISTS idx_repair_tasks_region_status 
ON repair_tasks(region_id, status);

CREATE INDEX IF NOT EXISTS idx_repair_tasks_confirmation_status 
ON repair_tasks(confirmation_status);

CREATE INDEX IF NOT EXISTS idx_repair_tasks_repair_source 
ON repair_tasks(repair_source, status);

-- Create a repair_confirmations audit table to track all confirmations
CREATE TABLE IF NOT EXISTS repair_confirmations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  repair_task_id uuid NOT NULL REFERENCES repair_tasks(id) ON DELETE CASCADE,
  confirmed_by uuid NOT NULL,
  confirmed_at timestamp with time zone NOT NULL DEFAULT now(),
  confirmation_status varchar(50) NOT NULL, -- 'confirmed', 'rejected'
  notes text,
  created_at timestamp with time zone DEFAULT now()
);

-- Create index for audit trail
CREATE INDEX IF NOT EXISTS idx_repair_confirmations_repair_task_id 
ON repair_confirmations(repair_task_id);

CREATE INDEX IF NOT EXISTS idx_repair_confirmations_confirmed_by 
ON repair_confirmations(confirmed_by);

-- Enable RLS if needed
ALTER TABLE repair_confirmations ENABLE ROW LEVEL SECURITY;

-- Create policy to allow service providers to view confirmations for their repairs
CREATE POLICY "Allow service providers to view confirmations" 
ON repair_confirmations 
FOR SELECT 
USING (
  confirmed_by = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM repair_tasks 
    WHERE repair_tasks.id = repair_confirmations.repair_task_id 
    AND repair_tasks.service_provider_id = (
      SELECT id FROM service_providers WHERE user_id = auth.uid()
    )
  )
);
