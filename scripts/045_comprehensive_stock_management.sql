-- Comprehensive Stock Management Enhancement
-- Run this AFTER fixing location inconsistencies

-- 1. Ensure stock_transactions table exists with proper structure
CREATE TABLE IF NOT EXISTS stock_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES store_items(id) ON DELETE CASCADE,
  item_name VARCHAR(255) NOT NULL,
  transaction_type VARCHAR(50) NOT NULL,
  quantity INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns to stock_transactions if they don't exist
DO $$ 
BEGIN
  -- Add location_id
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stock_transactions' AND column_name = 'location_id') THEN
    ALTER TABLE stock_transactions ADD COLUMN location_id UUID;
    ALTER TABLE stock_transactions ADD CONSTRAINT fk_stock_transactions_location FOREIGN KEY (location_id) REFERENCES locations(id);
  END IF;
  
  -- Add unit
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stock_transactions' AND column_name = 'unit') THEN
    ALTER TABLE stock_transactions ADD COLUMN unit VARCHAR(50);
  END IF;
  
  -- Add location_name
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stock_transactions' AND column_name = 'location_name') THEN
    ALTER TABLE stock_transactions ADD COLUMN location_name VARCHAR(255);
  END IF;
  
  -- Add from_location
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stock_transactions' AND column_name = 'from_location') THEN
    ALTER TABLE stock_transactions ADD COLUMN from_location VARCHAR(255);
  END IF;
  
  -- Add to_location
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stock_transactions' AND column_name = 'to_location') THEN
    ALTER TABLE stock_transactions ADD COLUMN to_location VARCHAR(255);
  END IF;
  
  -- Add recipient
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stock_transactions' AND column_name = 'recipient') THEN
    ALTER TABLE stock_transactions ADD COLUMN recipient VARCHAR(255);
  END IF;
  
  -- Add office_location
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stock_transactions' AND column_name = 'office_location') THEN
    ALTER TABLE stock_transactions ADD COLUMN office_location VARCHAR(255);
  END IF;
  
  -- Add room_number
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stock_transactions' AND column_name = 'room_number') THEN
    ALTER TABLE stock_transactions ADD COLUMN room_number VARCHAR(100);
  END IF;
  
  -- Add reference_type
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stock_transactions' AND column_name = 'reference_type') THEN
    ALTER TABLE stock_transactions ADD COLUMN reference_type VARCHAR(50);
  END IF;
  
  -- Add reference_id
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stock_transactions' AND column_name = 'reference_id') THEN
    ALTER TABLE stock_transactions ADD COLUMN reference_id UUID;
  END IF;
  
  -- Add reference_number
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stock_transactions' AND column_name = 'reference_number') THEN
    ALTER TABLE stock_transactions ADD COLUMN reference_number VARCHAR(100);
  END IF;
  
  -- Add notes
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stock_transactions' AND column_name = 'notes') THEN
    ALTER TABLE stock_transactions ADD COLUMN notes TEXT;
  END IF;
  
  -- Add performed_by
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stock_transactions' AND column_name = 'performed_by') THEN
    ALTER TABLE stock_transactions ADD COLUMN performed_by VARCHAR(255);
  END IF;
  
  -- Add performed_by_id
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stock_transactions' AND column_name = 'performed_by_id') THEN
    ALTER TABLE stock_transactions ADD COLUMN performed_by_id UUID;
  END IF;
  
  -- Add updated_at
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stock_transactions' AND column_name = 'updated_at') THEN
    ALTER TABLE stock_transactions ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

-- Drop and recreate constraint if needed
DO $$
BEGIN
  -- Drop old constraint if exists
  ALTER TABLE stock_transactions DROP CONSTRAINT IF EXISTS stock_transactions_transaction_type_check;
  
  -- Add new constraint
  ALTER TABLE stock_transactions ADD CONSTRAINT stock_transactions_transaction_type_check 
    CHECK (transaction_type IN ('receipt', 'issue', 'transfer_in', 'transfer_out', 'adjustment', 'return'));
EXCEPTION
  WHEN OTHERS THEN
    -- Constraint might not exist, ignore
    NULL;
END $$;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_stock_transactions_item ON stock_transactions(item_id);
CREATE INDEX IF NOT EXISTS idx_stock_transactions_type ON stock_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_stock_transactions_date ON stock_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_stock_transactions_location ON stock_transactions(location_name);
CREATE INDEX IF NOT EXISTS idx_stock_transactions_recipient ON stock_transactions(recipient);
CREATE INDEX IF NOT EXISTS idx_stock_transactions_reference ON stock_transactions(reference_type, reference_id);

-- 2. Create stock_assignments table for tracking assigned items to staff
CREATE TABLE IF NOT EXISTS stock_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES store_items(id) ON DELETE CASCADE,
  item_name VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  assigned_to VARCHAR(255) NOT NULL,
  location VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'assigned',
  assigned_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns to stock_assignments if they don't exist
DO $$ 
BEGIN
  -- Add device_id
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stock_assignments' AND column_name = 'device_id') THEN
    ALTER TABLE stock_assignments ADD COLUMN device_id UUID;
    ALTER TABLE stock_assignments ADD CONSTRAINT fk_stock_assignments_device FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE SET NULL;
  END IF;
  
  -- Add assigned_to_id
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stock_assignments' AND column_name = 'assigned_to_id') THEN
    ALTER TABLE stock_assignments ADD COLUMN assigned_to_id UUID;
  END IF;
  
  -- Add office_location
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stock_assignments' AND column_name = 'office_location') THEN
    ALTER TABLE stock_assignments ADD COLUMN office_location VARCHAR(255);
  END IF;
  
  -- Add room_number
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stock_assignments' AND column_name = 'room_number') THEN
    ALTER TABLE stock_assignments ADD COLUMN room_number VARCHAR(100);
  END IF;
  
  -- Add return_date
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stock_assignments' AND column_name = 'return_date') THEN
    ALTER TABLE stock_assignments ADD COLUMN return_date TIMESTAMP WITH TIME ZONE;
  END IF;
  
  -- Add assigned_by
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stock_assignments' AND column_name = 'assigned_by') THEN
    ALTER TABLE stock_assignments ADD COLUMN assigned_by VARCHAR(255);
  END IF;
  
  -- Add assigned_by_id
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stock_assignments' AND column_name = 'assigned_by_id') THEN
    ALTER TABLE stock_assignments ADD COLUMN assigned_by_id UUID;
  END IF;
  
  -- Add notes
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stock_assignments' AND column_name = 'notes') THEN
    ALTER TABLE stock_assignments ADD COLUMN notes TEXT;
  END IF;
END $$;

-- Drop and recreate status constraint if needed
DO $$
BEGIN
  ALTER TABLE stock_assignments DROP CONSTRAINT IF EXISTS stock_assignments_status_check;
  ALTER TABLE stock_assignments ADD CONSTRAINT stock_assignments_status_check 
    CHECK (status IN ('assigned', 'returned', 'damaged', 'lost'));
EXCEPTION
  WHEN OTHERS THEN
    NULL;
END $$;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_stock_assignments_item ON stock_assignments(item_id);
CREATE INDEX IF NOT EXISTS idx_stock_assignments_device ON stock_assignments(device_id);
CREATE INDEX IF NOT EXISTS idx_stock_assignments_assigned_to ON stock_assignments(assigned_to);
CREATE INDEX IF NOT EXISTS idx_stock_assignments_status ON stock_assignments(status);
CREATE INDEX IF NOT EXISTS idx_stock_assignments_location ON stock_assignments(location);

-- 3. Create stock_movements view for comprehensive tracking
CREATE OR REPLACE VIEW stock_movements AS
SELECT 
  st.id,
  st.item_id,
  st.item_name,
  st.transaction_type,
  st.quantity,
  st.location_name as location,
  st.recipient,
  st.office_location,
  st.room_number,
  st.reference_type,
  st.reference_number,
  st.notes,
  st.performed_by,
  st.created_at,
  si.category,
  si.unit,
  CASE 
    WHEN st.transaction_type IN ('receipt', 'transfer_in', 'return') THEN st.quantity
    ELSE 0
  END as quantity_in,
  CASE 
    WHEN st.transaction_type IN ('issue', 'transfer_out') THEN st.quantity
    ELSE 0
  END as quantity_out
FROM stock_transactions st
LEFT JOIN store_items si ON st.item_id = si.id
ORDER BY st.created_at DESC;

-- 4. Create inventory_summary view
CREATE OR REPLACE VIEW inventory_summary AS
SELECT 
  si.id,
  si.name,
  si.category,
  si.sku,
  si.location,
  si.quantity as current_stock,
  si.reorder_level,
  si.unit,
  COALESCE(receipts.total, 0) as total_receipts,
  COALESCE(issues.total, 0) as total_issues,
  COALESCE(assigned.total, 0) as total_assigned,
  COALESCE(assigned.active, 0) as currently_assigned,
  si.quantity + COALESCE(issues.total, 0) - COALESCE(receipts.total, 0) as calculated_opening,
  CASE 
    WHEN si.quantity = 0 THEN 'out_of_stock'
    WHEN si.quantity < si.reorder_level THEN 'low_stock'
    ELSE 'in_stock'
  END as stock_status
FROM store_items si
LEFT JOIN (
  SELECT item_id, SUM(quantity) as total
  FROM stock_transactions
  WHERE transaction_type IN ('receipt', 'transfer_in', 'return')
  GROUP BY item_id
) receipts ON si.id = receipts.item_id
LEFT JOIN (
  SELECT item_id, SUM(quantity) as total
  FROM stock_transactions
  WHERE transaction_type IN ('issue', 'transfer_out')
  GROUP BY item_id
) issues ON si.id = issues.item_id
LEFT JOIN (
  SELECT item_id, 
         SUM(quantity) as total,
         SUM(CASE WHEN status = 'assigned' THEN quantity ELSE 0 END) as active
  FROM stock_assignments
  GROUP BY item_id
) assigned ON si.id = assigned.item_id;

-- 5. Create function to record stock transaction
CREATE OR REPLACE FUNCTION record_stock_transaction(
  p_item_id UUID,
  p_transaction_type VARCHAR,
  p_quantity INTEGER,
  p_location VARCHAR,
  p_recipient VARCHAR DEFAULT NULL,
  p_office_location VARCHAR DEFAULT NULL,
  p_room_number VARCHAR DEFAULT NULL,
  p_reference_type VARCHAR DEFAULT NULL,
  p_reference_id UUID DEFAULT NULL,
  p_reference_number VARCHAR DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_performed_by VARCHAR DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_transaction_id UUID;
  v_item_name VARCHAR;
  v_unit VARCHAR;
  v_location_id UUID;
BEGIN
  -- Get item details
  SELECT name, unit INTO v_item_name, v_unit
  FROM store_items WHERE id = p_item_id;
  
  -- Get location_id if locations table exists
  SELECT id INTO v_location_id
  FROM locations WHERE name = p_location
  LIMIT 1;
  
  -- Insert transaction
  INSERT INTO stock_transactions (
    item_id,
    location_id,
    item_name,
    transaction_type,
    quantity,
    unit,
    location_name,
    recipient,
    office_location,
    room_number,
    reference_type,
    reference_id,
    reference_number,
    notes,
    performed_by
  ) VALUES (
    p_item_id,
    v_location_id,
    v_item_name,
    p_transaction_type,
    p_quantity,
    v_unit,
    p_location,
    p_recipient,
    p_office_location,
    p_room_number,
    p_reference_type,
    p_reference_id,
    p_reference_number,
    p_notes,
    p_performed_by
  ) RETURNING id INTO v_transaction_id;
  
  RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql;

-- 6. Add comments
COMMENT ON TABLE stock_transactions IS 'Records all stock movements and transactions';
COMMENT ON TABLE stock_assignments IS 'Tracks items assigned to staff members';
COMMENT ON VIEW stock_movements IS 'Comprehensive view of all stock movements';
COMMENT ON VIEW inventory_summary IS 'Summary view of inventory with calculated metrics';
COMMENT ON FUNCTION record_stock_transaction IS 'Helper function to record stock transactions consistently';

-- 7. Grant permissions (adjust as needed)
GRANT SELECT ON stock_movements TO authenticated;
GRANT SELECT ON inventory_summary TO authenticated;
GRANT ALL ON stock_transactions TO authenticated;
GRANT ALL ON stock_assignments TO authenticated;
