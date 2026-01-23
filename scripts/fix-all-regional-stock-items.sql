-- ============================================================================
-- Comprehensive Fix for Missing Regional Store Items
-- ============================================================================
-- This script fixes all issued requisitions that created transactions but 
-- never created the actual store_items at regional locations.
--
-- Affected Locations: Kumasi, Tema Port
-- Total Requisitions: 4
-- ============================================================================

BEGIN;

-- Step 1: Create store_items at regional locations for ALL issued requisitions
-- that don't have corresponding items yet
INSERT INTO store_items (name, sku, siv_number, category, unit, quantity, reorder_level, location, supplier, created_at, updated_at)
SELECT 
  si.name,
  si.sku || '-' || UPPER(REPLACE(sr.location, '_', '-')) as sku,
  si.siv_number || '-' || UPPER(REPLACE(sr.location, '_', '-')) as siv_number,
  si.category,
  si.unit,
  COALESCE((req_item->>'quantity')::int, 0) as quantity,
  si.reorder_level,
  sr.location,
  COALESCE(si.supplier, 'Central Stores') as supplier,
  sr.updated_at as created_at,
  sr.updated_at as updated_at
FROM store_requisitions sr
CROSS JOIN LATERAL jsonb_array_elements(sr.items::jsonb) AS req_item
JOIN store_items si ON si.id = (req_item->>'item_id')::uuid
WHERE sr.status = 'issued'
  AND sr.location NOT IN ('Central Stores', 'central_stores')
  AND (req_item->>'quantity')::int > 0  -- Only positive quantities
  AND NOT EXISTS (
    SELECT 1 FROM store_items si2 
    WHERE si2.sku = si.sku || '-' || UPPER(REPLACE(sr.location, '_', '-'))
      AND si2.location = sr.location
  );

-- Step 2: Create transfer_out transactions from Central Stores
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
  'TXN-OUT-' || sr.requisition_number || '-' || row_number() OVER (PARTITION BY sr.requisition_number) as transaction_number,
  'transfer_out' as transaction_type,
  (req_item->>'quantity')::int as quantity,
  'Central Stores' as location_name,
  sr.requisition_number as reference_number,
  COALESCE(sr.issued_by, 'Store Manager') as performed_by_name,
  'Transfer to ' || sr.location || ' - Retroactive fix for issued requisition' as notes,
  sr.updated_at as created_at
FROM store_requisitions sr
CROSS JOIN LATERAL jsonb_array_elements(sr.items::jsonb) AS req_item
JOIN store_items si ON si.id = (req_item->>'item_id')::uuid
WHERE sr.status = 'issued'
  AND sr.location NOT IN ('Central Stores', 'central_stores')
  AND (req_item->>'quantity')::int > 0  -- Only positive quantities
  AND NOT EXISTS (
    SELECT 1 FROM stock_transactions st 
    WHERE st.reference_number = sr.requisition_number 
      AND st.transaction_type = 'transfer_out'
      AND st.item_id = (req_item->>'item_id')::uuid
  );

-- Step 3: Create transfer_in transactions at regional locations
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
  'TXN-IN-' || sr.requisition_number || '-' || row_number() OVER (PARTITION BY sr.requisition_number) as transaction_number,
  'transfer_in' as transaction_type,
  (req_item->>'quantity')::int as quantity,
  sr.location as location_name,
  sr.requisition_number as reference_number,
  COALESCE(sr.requested_by, 'Regional IT Head') as performed_by_name,
  'Receipt from Central Stores - Retroactive fix for issued requisition' as notes,
  sr.updated_at as created_at
FROM store_requisitions sr
CROSS JOIN LATERAL jsonb_array_elements(sr.items::jsonb) AS req_item
JOIN store_items si ON si.id = (req_item->>'item_id')::uuid
WHERE sr.status = 'issued'
  AND sr.location NOT IN ('Central Stores', 'central_stores')
  AND (req_item->>'quantity')::int > 0  -- Only positive quantities
  AND NOT EXISTS (
    SELECT 1 FROM stock_transactions st 
    WHERE st.reference_number = sr.requisition_number 
      AND st.transaction_type = 'transfer_in'
      AND st.item_id = (req_item->>'item_id')::uuid
  );

-- Step 4: Deduct quantities from Central Stores for issued requisitions
-- (Only if they haven't been deducted already)
UPDATE store_items si
SET 
  quantity = si.quantity - (
    SELECT SUM((req_item->>'quantity')::int)
    FROM store_requisitions sr
    CROSS JOIN LATERAL jsonb_array_elements(sr.items::jsonb) AS req_item
    WHERE sr.status = 'issued'
      AND sr.location NOT IN ('Central Stores', 'central_stores')
      AND (req_item->>'item_id')::uuid = si.id
      AND (req_item->>'quantity')::int > 0
      AND NOT EXISTS (
        SELECT 1 FROM stock_transactions st 
        WHERE st.reference_number = sr.requisition_number 
          AND st.transaction_type = 'transfer_out'
          AND st.item_id = si.id
      )
  ),
  updated_at = NOW()
WHERE si.location IN ('Central Stores', 'central_stores')
  AND EXISTS (
    SELECT 1
    FROM store_requisitions sr
    CROSS JOIN LATERAL jsonb_array_elements(sr.items::jsonb) AS req_item
    WHERE sr.status = 'issued'
      AND sr.location NOT IN ('Central Stores', 'central_stores')
      AND (req_item->>'item_id')::uuid = si.id
      AND (req_item->>'quantity')::int > 0
      AND NOT EXISTS (
        SELECT 1 FROM stock_transactions st 
        WHERE st.reference_number = sr.requisition_number 
          AND st.transaction_type = 'transfer_out'
          AND st.item_id = si.id
      )
  );

COMMIT;

-- ============================================================================
-- Verification Queries (Run these after the script to verify)
-- ============================================================================

-- Check Kumasi stock items (should have items now)
SELECT name, sku, quantity, location 
FROM store_items 
WHERE location = 'kumasi' 
ORDER BY name;

-- Check Tema Port stock items (should have items now)
SELECT name, sku, quantity, location 
FROM store_items 
WHERE location = 'tema_port' 
ORDER BY name;

-- Check transactions created
SELECT 
  transaction_type,
  location_name,
  COUNT(*) as count,
  SUM(quantity) as total_quantity
FROM stock_transactions
WHERE reference_number IN (
  'REQ-20260123-983',
  'REQ-20260119-690', 
  'REQ-20260118-382',
  'REQ-20260107-299'
)
GROUP BY transaction_type, location_name
ORDER BY location_name, transaction_type;
