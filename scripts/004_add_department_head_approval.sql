-- Add Department Head approval to IT Equipment Requisitions
ALTER TABLE it_equipment_requisitions ADD COLUMN IF NOT EXISTS department_head_approved_at timestamp with time zone;
ALTER TABLE it_equipment_requisitions ADD COLUMN IF NOT EXISTS department_head_approved_by uuid REFERENCES profiles(id);
ALTER TABLE it_equipment_requisitions ADD COLUMN IF NOT EXISTS department_head_approved_by_name text;
ALTER TABLE it_equipment_requisitions ADD COLUMN IF NOT EXISTS department_head_approval_comments text;

-- Update status enum comment to include department_head stage
COMMENT ON COLUMN it_equipment_requisitions.status IS 'Status values: draft, submitted, pending_department_head_approval, approved_by_department_head, pending_it_service_desk, approved_by_it_service_desk, pending_it_head, approved_by_it_head, pending_admin, approved_by_admin, pending_store_issuance, issued, rejected';

-- Add Store Head approval columns
ALTER TABLE it_equipment_requisitions ADD COLUMN IF NOT EXISTS store_head_approved_at timestamp with time zone;
ALTER TABLE it_equipment_requisitions ADD COLUMN IF NOT EXISTS store_head_approved_by uuid REFERENCES profiles(id);
ALTER TABLE it_equipment_requisitions ADD COLUMN IF NOT EXISTS store_head_approved_by_name text;
ALTER TABLE it_equipment_requisitions ADD COLUMN IF NOT EXISTS store_head_approval_comments text;

-- Add approval timeline tracking
ALTER TABLE it_equipment_requisitions ADD COLUMN IF NOT EXISTS approval_timeline jsonb DEFAULT '[]'::jsonb;

-- Indexes for approvers
CREATE INDEX IF NOT EXISTS idx_it_equipment_requisitions_department_head_approved_by ON it_equipment_requisitions(department_head_approved_by);
CREATE INDEX IF NOT EXISTS idx_it_equipment_requisitions_store_head_approved_by ON it_equipment_requisitions(store_head_approved_by);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON it_equipment_requisitions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON it_equipment_requisition_approvals TO authenticated;
