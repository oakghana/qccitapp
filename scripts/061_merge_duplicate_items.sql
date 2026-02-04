-- 061_merge_duplicate_items.sql
-- Merge duplicate items in `store_items` where names differ only by punctuation/case/spacing
-- Strategy:
-- 1. Preview duplicates using a normalization function (lowercase + remove non-alphanumeric).
-- 2. For each normalized group with >1 rows, pick the lowest UUID (keep_id) to keep.
-- 3. Sum `quantity` across duplicates and set it on the kept row.
-- 4. Re-point any referencing rows in `stock_assignments` and `stock_transactions` to the kept id and canonical name.
-- 5. Delete the duplicate rows (the ones not kept).
-- IMPORTANT: Run the SELECT preview section first to review which rows will be affected. Always back up your DB before running destructive operations.

-- PREVIEW: run this to inspect candidate groups BEFORE making any changes
-- SELECT
--   normalized,
--   count(*) AS cnt,
--   array_agg(id ORDER BY id) AS ids,
--   array_agg(name ORDER BY id) AS names,
--   sum(quantity) AS total_quantity
-- FROM (
--   SELECT *, regexp_replace(lower(coalesce(name, '')), '[^a-z0-9]+', '', 'g') AS normalized
--   FROM store_items
-- ) t
-- GROUP BY normalized
-- HAVING count(*) > 1
-- ORDER BY cnt DESC;

-- Recommended backup (Postgres example):
-- pg_dump -U <user> -h <host> -p <port> -Fc <database> > backup_before_merge_061.dump

-- When you're ready, run the migration block below.

BEGIN;

-- Create a temporary table with the groups to merge
CREATE TEMP TABLE tmp_merge_groups AS
SELECT
  normalized,
  array_agg(id ORDER BY id) AS ids,
  array_agg(name ORDER BY id) AS names,
  array_agg(quantity ORDER BY id) AS quantities,
  -- `min(id)` on UUID may not be supported in some Postgres setups; derive keep_id
  -- by taking the first element of the ordered `array_agg(id)` instead.
  (array_agg(id ORDER BY id))[1] AS keep_id,
  sum(quantity) AS total_quantity
FROM (
  SELECT *, regexp_replace(lower(coalesce(name, '')), '[^a-z0-9]+', '', 'g') AS normalized
  FROM store_items
) t
GROUP BY normalized
HAVING count(*) > 1;

-- Check how many groups will be merged
-- Print how many groups will be merged (RAISE is only valid inside PL/pgSQL blocks)
SELECT 'Will merge ' || (SELECT count(*) FROM tmp_merge_groups) || ' groups' AS info;

-- Prepare a list of all duplicate ids for backup
CREATE TEMP TABLE tmp_dup_ids AS
SELECT unnest(ids) AS id FROM tmp_merge_groups;

-- Backup affected rows into audit tables before making changes
DO $$
BEGIN
  -- Backup store_items
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'merge_backup_store_items') THEN
    EXECUTE 'CREATE TABLE merge_backup_store_items (LIKE store_items INCLUDING ALL)';
  END IF;
  EXECUTE 'INSERT INTO merge_backup_store_items SELECT * FROM store_items WHERE id IN (SELECT id FROM tmp_dup_ids)';

  -- Backup stock_assignments if present
  IF to_regclass('public.stock_assignments') IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'merge_backup_stock_assignments') THEN
      EXECUTE 'CREATE TABLE merge_backup_stock_assignments (LIKE stock_assignments INCLUDING ALL)';
    END IF;
    EXECUTE 'INSERT INTO merge_backup_stock_assignments SELECT * FROM stock_assignments WHERE item_id IN (SELECT id FROM tmp_dup_ids)';
  END IF;

  -- Backup stock_transactions if present
  IF to_regclass('public.stock_transactions') IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'merge_backup_stock_transactions') THEN
      EXECUTE 'CREATE TABLE merge_backup_stock_transactions (LIKE stock_transactions INCLUDING ALL)';
    END IF;
    EXECUTE 'INSERT INTO merge_backup_stock_transactions SELECT * FROM stock_transactions WHERE item_id IN (SELECT id FROM tmp_dup_ids)';
  END IF;

  -- Backup stock_transfer_requests if present
  IF to_regclass('public.stock_transfer_requests') IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'merge_backup_stock_transfer_requests') THEN
      EXECUTE 'CREATE TABLE merge_backup_stock_transfer_requests (LIKE stock_transfer_requests INCLUDING ALL)';
    END IF;
    EXECUTE 'INSERT INTO merge_backup_stock_transfer_requests SELECT * FROM stock_transfer_requests WHERE item_id IN (SELECT id FROM tmp_dup_ids)';
  END IF;

  -- Backup regional_stock_requisitions if present
  IF to_regclass('public.regional_stock_requisitions') IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'merge_backup_regional_stock_requisitions') THEN
      EXECUTE 'CREATE TABLE merge_backup_regional_stock_requisitions (LIKE regional_stock_requisitions INCLUDING ALL)';
    END IF;
    EXECUTE 'INSERT INTO merge_backup_regional_stock_requisitions SELECT * FROM regional_stock_requisitions WHERE item_id IN (SELECT id FROM tmp_dup_ids)';
  END IF;

  -- Backup stock_transfer_transactions if present
  IF to_regclass('public.stock_transfer_transactions') IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'merge_backup_stock_transfer_transactions') THEN
      EXECUTE 'CREATE TABLE merge_backup_stock_transfer_transactions (LIKE stock_transfer_transactions INCLUDING ALL)';
    END IF;
    EXECUTE 'INSERT INTO merge_backup_stock_transfer_transactions SELECT * FROM stock_transfer_transactions WHERE item_id IN (SELECT id FROM tmp_dup_ids)';
  END IF;

  -- Backup stock_level_history if present
  IF to_regclass('public.stock_level_history') IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'merge_backup_stock_level_history') THEN
      EXECUTE 'CREATE TABLE merge_backup_stock_level_history (LIKE stock_level_history INCLUDING ALL)';
    END IF;
    EXECUTE 'INSERT INTO merge_backup_stock_level_history SELECT * FROM stock_level_history WHERE item_id IN (SELECT id FROM tmp_dup_ids)';
  END IF;
END$$;

-- Iterate groups and perform merge operations
DO $$
DECLARE
  rec RECORD;
  keep_uuid UUID;
  dup_ids UUID[];
  i int;
  upd_name text;
BEGIN
  FOR rec IN SELECT * FROM tmp_merge_groups LOOP
    keep_uuid := rec.keep_id;
    dup_ids := rec.ids;

    -- Build canonical name: use the kept row's current name as authoritative
    SELECT name INTO upd_name FROM store_items WHERE id = keep_uuid;

    -- 1) Update the kept row's quantity to the summed total
    UPDATE store_items SET quantity = rec.total_quantity, last_restocked_at = GREATEST(last_restocked_at, now()) WHERE id = keep_uuid;

    -- 2) Update referencing tables to point to keep_id and canonical name
    -- Update stock_assignments (if table exists)
    IF to_regclass('public.stock_assignments') IS NOT NULL THEN
      UPDATE stock_assignments
      SET item_id = keep_uuid, item_name = upd_name
      WHERE item_id = ANY(dup_ids) AND item_id <> keep_uuid;
    END IF;

    -- Update stock_transactions (if table exists)
    IF to_regclass('public.stock_transactions') IS NOT NULL THEN
      UPDATE stock_transactions
      SET item_id = keep_uuid, item_name = upd_name
      WHERE item_id = ANY(dup_ids) AND item_id <> keep_uuid;
    END IF;

    -- Update stock_transfer_requests (if table exists)
    IF to_regclass('public.stock_transfer_requests') IS NOT NULL THEN
      UPDATE stock_transfer_requests
      SET item_id = keep_uuid, item_name = upd_name
      WHERE item_id = ANY(dup_ids) AND item_id <> keep_uuid;
    END IF;

    -- Update regional_stock_requisitions (if table exists)
    IF to_regclass('public.regional_stock_requisitions') IS NOT NULL THEN
      UPDATE regional_stock_requisitions
      SET item_id = keep_uuid
      WHERE item_id = ANY(dup_ids) AND item_id <> keep_uuid;
    END IF;

    -- Update stock_transfer_transactions (if table exists)
    IF to_regclass('public.stock_transfer_transactions') IS NOT NULL THEN
      UPDATE stock_transfer_transactions
      SET item_id = keep_uuid, item_name = upd_name
      WHERE item_id = ANY(dup_ids) AND item_id <> keep_uuid;
    END IF;

    -- Update stock_requisitions (if table exists)
    IF to_regclass('public.stock_requisitions') IS NOT NULL THEN
      UPDATE stock_requisitions
      SET item_id = keep_uuid
      WHERE item_id = ANY(dup_ids) AND item_id <> keep_uuid;
    END IF;

    -- Update stock_level_history (if table exists)
    IF to_regclass('public.stock_level_history') IS NOT NULL THEN
      UPDATE stock_level_history
      SET item_id = keep_uuid
      WHERE item_id = ANY(dup_ids) AND item_id <> keep_uuid;
    END IF;

    -- 3) Delete duplicate rows except the kept one
    DELETE FROM store_items WHERE id = ANY(dup_ids) AND id <> keep_uuid;

    RAISE NOTICE 'Merged % duplicates into % (name=%)', array_length(dup_ids,1)-1, keep_uuid, upd_name;
  END LOOP;
END$$;

COMMIT;

-- Post-run verification queries (run after migration):
-- 1. Ensure no duplicate normalized names remain
-- SELECT normalized, count(*) FROM (
--   SELECT regexp_replace(lower(coalesce(name, '')), '[^a-z0-9]+', '', 'g') AS normalized FROM store_items
-- ) t GROUP BY normalized HAVING count(*) > 1;

-- 2. Spot-check merged groups by listing items whose normalized form matches a sample
-- SELECT * FROM store_items WHERE regexp_replace(lower(coalesce(name, '')), '[^a-z0-9]+', '', 'g') = 'cexv14';

-- 3. Verify referential integrity counts (optional)
-- SELECT COUNT(*) FROM stock_assignments WHERE item_id IS NULL;
-- SELECT COUNT(*) FROM stock_transactions WHERE item_id IS NULL;

-- If anything goes wrong, restore from backup and investigate.
