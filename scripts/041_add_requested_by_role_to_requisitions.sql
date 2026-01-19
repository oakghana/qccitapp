-- Add requested_by_role column to store_requisitions table
ALTER TABLE store_requisitions
ADD COLUMN IF NOT EXISTS requested_by_role VARCHAR(50) DEFAULT 'it_staff',
ADD COLUMN IF NOT EXISTS approved_by_role VARCHAR(50),
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Add index for role-based queries
CREATE INDEX IF NOT EXISTS idx_store_requisitions_by_role ON store_requisitions(requested_by_role);
CREATE INDEX IF NOT EXISTS idx_store_requisitions_status_role ON store_requisitions(status, requested_by_role);

-- Add comment for documentation
COMMENT ON COLUMN store_requisitions.requested_by_role IS 'Role of the user who requested the requisition (admin, it_head, it_store_head, regional_it_head, it_staff)';
COMMENT ON COLUMN store_requisitions.approved_by_role IS 'Role of the user who approved/rejected the requisition';
COMMENT ON COLUMN store_requisitions.rejection_reason IS 'Reason for rejection if status is rejected';

COMMIT;
