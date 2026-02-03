-- Add IT Requisition Number field to store_requisitions table
-- This allows users to capture a reference form ID

ALTER TABLE store_requisitions
ADD COLUMN IF NOT EXISTS it_req_number VARCHAR(100);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_store_requisitions_it_req_number 
ON store_requisitions(it_req_number);

-- Add comment
COMMENT ON COLUMN store_requisitions.it_req_number IS 'IT Requisition form number/ID for tracking purposes';
