-- Fix script to create missing store_items and transactions for issued requisitions
-- This fixes the bug where issued requisitions did not create stock at regional locations

-- Step 1: Get the issued requisition details
-- REQ-20260119-215 was issued to Kaase with 6 items but no stock was created

-- Step 2: Create store_items at Kaase location for each item in the requisition
-- Include SKU and SIV_NUMBER fields which are required
INSERT INTO store_items (name, sku, siv_number, category, unit, quantity, reorder_level, location, created_at, updated_at)
SELECT 
  si.name,
  si.sku || '-KAASE' as sku,  -- Create unique SKU for Kaase location
  si.siv_number || '-KAASE' as siv_number,  -- Create unique SIV number for Kaase location
  si.category,
  si.unit,
  COALESCE((req_item->>'quantity')::int, 0) as quantity,
  si.reorder_level,
  'kaase' as location,
  NOW() as created_at,
  NOW() as updated_at
FROM store_requisitions sr
CROSS JOIN LATERAL jsonb_array_elements(sr.items::jsonb) AS req_item
JOIN store_items si ON si.id = (req_item->>'item_id')::uuid
WHERE sr.requisition_number = 'REQ-20260119-215'
  AND sr.status = 'issued'
  AND NOT EXISTS (
    SELECT 1 FROM store_items si2 
    WHERE si2.sku = si.sku || '-KAASE'
      AND si2.location = 'kaase'
  );

-- Step 3: Create transfer_out transactions from Central Stores
INSERT INTO stock_transactions (
  item_id,
  item_name,
  transaction_number,
  transaction_type,
  quantity,
  location_name,
  reference_number,
  performed_by_name,
  notes,
  created_at
)
SELECT 
  (req_item->>'item_id')::uuid as item_id,
  si.name as item_name,
  'TXN-OUT-' || sr.requisition_number || '-' || row_number() OVER () as transaction_number,
  'transfer_out' as transaction_type,
  (req_item->>'quantity')::int as quantity,
  'Central Stores' as location_name,
  sr.requisition_number as reference_number,
  COALESCE(sr.issued_by, 'Store Manager') as performed_by_name,
  'Transfer to Kaase - Retroactive fix' as notes,
  sr.updated_at as created_at
FROM store_requisitions sr
CROSS JOIN LATERAL jsonb_array_elements(sr.items::jsonb) AS req_item
JOIN store_items si ON si.id = (req_item->>'item_id')::uuid
WHERE sr.requisition_number = 'REQ-20260119-215'
  AND sr.status = 'issued'
  AND NOT EXISTS (
    SELECT 1 FROM stock_transactions st 
    WHERE st.reference_number = sr.requisition_number 
      AND st.transaction_type = 'transfer_out'
      AND st.item_id = (req_item->>'item_id')::uuid
  );

-- Step 4: Create transfer_in transactions at Kaase
INSERT INTO stock_transactions (
  item_id,
  item_name,
  transaction_number,
  transaction_type,
  quantity,
  location_name,
  reference_number,
  performed_by_name,
  notes,
  created_at
)
SELECT 
  (req_item->>'item_id')::uuid as item_id,
  si.name as item_name,
  'TXN-IN-' || sr.requisition_number || '-' || row_number() OVER () as transaction_number,
  'transfer_in' as transaction_type,
  (req_item->>'quantity')::int as quantity,
  'kaase' as location_name,
  sr.requisition_number as reference_number,
  COALESCE(sr.requested_by, 'Regional IT Head') as performed_by_name,
  'Receipt from Central Stores - Retroactive fix' as notes,
  sr.updated_at as created_at
FROM store_requisitions sr
CROSS JOIN LATERAL jsonb_array_elements(sr.items::jsonb) AS req_item
JOIN store_items si ON si.id = (req_item->>'item_id')::uuid
WHERE sr.requisition_number = 'REQ-20260119-215'
  AND sr.status = 'issued'
  AND NOT EXISTS (
    SELECT 1 FROM stock_transactions st 
    WHERE st.reference_number = sr.requisition_number 
      AND st.transaction_type = 'transfer_in'
      AND st.item_id = (req_item->>'item_id')::uuid
  );

-- Step 5: Update Central Stores quantities (deduct the issued amounts)
UPDATE store_items si
SET 
  quantity = si.quantity - (req_item->>'quantity')::int,
  updated_at = NOW()
FROM store_requisitions sr
CROSS JOIN LATERAL jsonb_array_elements(sr.items::jsonb) AS req_item
WHERE sr.requisition_number = 'REQ-20260119-215'
  AND sr.status = 'issued'
  AND si.id = (req_item->>'item_id')::uuid
  AND si.location = 'central_stores';

-- Verification queries
-- Check that Kaase now has stock items
SELECT 'Kaase Stock Items Created' as check_type, COUNT(*) as count
FROM store_items
WHERE location = 'kaase';

-- Check that transactions were created
SELECT 'Transactions Created' as check_type, transaction_type, COUNT(*) as count
FROM stock_transactions
WHERE reference_number = 'REQ-20260119-215'
GROUP BY transaction_type;
