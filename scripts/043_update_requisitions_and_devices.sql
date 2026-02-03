-- Update store_requisitions table for item issuing workflow
-- This adds fields to capture recipient details and issuing information

-- Add IT Requisition Number field (if not already exists)
ALTER TABLE store_requisitions
ADD COLUMN IF NOT EXISTS it_req_number VARCHAR(100);

-- Add recipient and office location fields for issuing
ALTER TABLE store_requisitions
ADD COLUMN IF NOT EXISTS issued_to VARCHAR(255),
ADD COLUMN IF NOT EXISTS office_location VARCHAR(255),
ADD COLUMN IF NOT EXISTS room_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS issue_notes TEXT,
ADD COLUMN IF NOT EXISTS issued_date TIMESTAMP WITH TIME ZONE;

-- Add indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_store_requisitions_it_req_number 
ON store_requisitions(it_req_number);

CREATE INDEX IF NOT EXISTS idx_store_requisitions_issued_to 
ON store_requisitions(issued_to);

CREATE INDEX IF NOT EXISTS idx_store_requisitions_issued_date 
ON store_requisitions(issued_date);

-- Add comments
COMMENT ON COLUMN store_requisitions.it_req_number IS 'IT Requisition form number/ID for tracking purposes';
COMMENT ON COLUMN store_requisitions.issued_to IS 'Name of person who received the items';
COMMENT ON COLUMN store_requisitions.office_location IS 'Office location where items were delivered';
COMMENT ON COLUMN store_requisitions.room_number IS 'Room number where items were delivered';
COMMENT ON COLUMN store_requisitions.issue_notes IS 'Notes recorded during item issuance';
COMMENT ON COLUMN store_requisitions.issued_date IS 'Date when items were actually issued';

-- Add office_location and room_number to devices table if not exists
ALTER TABLE devices
ADD COLUMN IF NOT EXISTS office_location VARCHAR(255),
ADD COLUMN IF NOT EXISTS room_number VARCHAR(100);

COMMENT ON COLUMN devices.office_location IS 'Office location of the device';
COMMENT ON COLUMN devices.room_number IS 'Room number where device is located';

-- Add stock_transactions table if not exists
CREATE TABLE IF NOT EXISTS stock_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES store_items(id) ON DELETE CASCADE,
  item_name VARCHAR(255) NOT NULL,
  transaction_type VARCHAR(50) NOT NULL, -- 'issue', 'return', 'transfer', 'adjustment'
  quantity INTEGER NOT NULL,
  unit VARCHAR(50),
  location VARCHAR(255),
  recipient VARCHAR(255),
  office_location VARCHAR(255),
  room_number VARCHAR(100),
  notes TEXT,
  performed_by VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for stock_transactions
CREATE INDEX IF NOT EXISTS idx_stock_transactions_item_id ON stock_transactions(item_id);
CREATE INDEX IF NOT EXISTS idx_stock_transactions_type ON stock_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_stock_transactions_date ON stock_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_stock_transactions_recipient ON stock_transactions(recipient);

COMMENT ON TABLE stock_transactions IS 'Records all stock movement transactions';
