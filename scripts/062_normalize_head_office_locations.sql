-- 062_normalize_head_office_locations.sql
-- Normalize Head Office location variants across common tables.
-- Safe flow:
-- 1) PREVIEW the variants and counts (run the SELECTs below first).
-- 2) Back up affected rows into `merge_backup_*` tables (created if missing).
-- 3) Update the location columns to a canonical value: 'Head Office'.
-- 4) Commit. If anything looks off, restore from the backup tables.

-- IMPORTANT: Run a full DB backup (pg_dump) before executing this migration.

/* PREVIEW: list distinct values per table that look like Head Office */
SELECT 'devices' AS tbl, location AS value, COUNT(*) AS cnt
FROM devices
WHERE lower(coalesce(location, '')) LIKE '%head%office%'
GROUP BY location
ORDER BY cnt DESC;

SELECT 'profiles' AS tbl, location AS value, COUNT(*) AS cnt
FROM profiles
WHERE lower(coalesce(location, '')) LIKE '%head%office%'
GROUP BY location
ORDER BY cnt DESC;

SELECT 'store_items' AS tbl, location AS value, COUNT(*) AS cnt
FROM store_items
WHERE lower(coalesce(location, '')) LIKE '%head%office%'
GROUP BY location
ORDER BY cnt DESC;

SELECT 'store_requisitions.location' AS tbl, location AS value, COUNT(*) AS cnt
FROM store_requisitions
WHERE lower(coalesce(location, '')) LIKE '%head%office%'
GROUP BY location
ORDER BY cnt DESC;

SELECT 'store_requisitions.destination' AS tbl, destination_location AS value, COUNT(*) AS cnt
FROM store_requisitions
WHERE lower(coalesce(destination_location, '')) LIKE '%head%office%'
GROUP BY destination_location
ORDER BY cnt DESC;

/* When preview looks correct, run the guarded update below. */
BEGIN;

DO $$
BEGIN
  -- devices
  IF to_regclass('public.devices') IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'merge_backup_devices') THEN
      EXECUTE 'CREATE TABLE merge_backup_devices (LIKE devices INCLUDING ALL)';
    END IF;
    EXECUTE $exec$
      INSERT INTO merge_backup_devices
      SELECT * FROM devices WHERE lower(coalesce(location, '')) LIKE '%head%office%'
    $exec$;
    EXECUTE $exec$
      UPDATE devices
      SET location = 'Head Office'
      WHERE lower(coalesce(location, '')) LIKE '%head%office%'
    $exec$;
  END IF;

  -- profiles
  IF to_regclass('public.profiles') IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'merge_backup_profiles') THEN
      EXECUTE 'CREATE TABLE merge_backup_profiles (LIKE profiles INCLUDING ALL)';
    END IF;
    EXECUTE $exec$
      INSERT INTO merge_backup_profiles
      SELECT * FROM profiles WHERE lower(coalesce(location, '')) LIKE '%head%office%'
    $exec$;
    EXECUTE $exec$
      UPDATE profiles
      SET location = 'Head Office'
      WHERE lower(coalesce(location, '')) LIKE '%head%office%'
    $exec$;
  END IF;

  -- store_items
  IF to_regclass('public.store_items') IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'merge_backup_store_items') THEN
      EXECUTE 'CREATE TABLE merge_backup_store_items (LIKE store_items INCLUDING ALL)';
    END IF;
    EXECUTE $exec$
      INSERT INTO merge_backup_store_items
      SELECT * FROM store_items WHERE lower(coalesce(location, '')) LIKE '%head%office%'
    $exec$;
    EXECUTE $exec$
      UPDATE store_items
      SET location = 'Head Office'
      WHERE lower(coalesce(location, '')) LIKE '%head%office%'
    $exec$;
  END IF;

  -- store_requisitions.location
  IF to_regclass('public.store_requisitions') IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'merge_backup_store_requisitions') THEN
      EXECUTE 'CREATE TABLE merge_backup_store_requisitions (LIKE store_requisitions INCLUDING ALL)';
    END IF;
    EXECUTE $exec$
      INSERT INTO merge_backup_store_requisitions
      SELECT * FROM store_requisitions WHERE lower(coalesce(location, '')) LIKE '%head%office%'
    $exec$;
    EXECUTE $exec$
      UPDATE store_requisitions
      SET location = 'Head Office'
      WHERE lower(coalesce(location, '')) LIKE '%head%office%'
    $exec$;

    -- destination_location
    EXECUTE $exec$
      INSERT INTO merge_backup_store_requisitions
      SELECT * FROM store_requisitions WHERE lower(coalesce(destination_location, '')) LIKE '%head%office%'
    $exec$;
    EXECUTE $exec$
      UPDATE store_requisitions
      SET destination_location = 'Head Office'
      WHERE lower(coalesce(destination_location, '')) LIKE '%head%office%'
    $exec$;
  END IF;

  -- Additional common columns: repair_requests.location
  IF to_regclass('public.repair_requests') IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'merge_backup_repair_requests') THEN
      EXECUTE 'CREATE TABLE merge_backup_repair_requests (LIKE repair_requests INCLUDING ALL)';
    END IF;
    EXECUTE $exec$
      INSERT INTO merge_backup_repair_requests
      SELECT * FROM repair_requests WHERE lower(coalesce(location, '')) LIKE '%head%office%'
    $exec$;
    EXECUTE $exec$
      UPDATE repair_requests
      SET location = 'Head Office'
      WHERE lower(coalesce(location, '')) LIKE '%head%office%'
    $exec$;
  END IF;

  -- Normalize other known small variants: tema_research -> 'Tema Research'
  IF to_regclass('public.store_items') IS NOT NULL THEN
    EXECUTE $exec$
      INSERT INTO merge_backup_store_items
      SELECT * FROM store_items WHERE lower(coalesce(location,'')) IN ('tema_research','tema research')
    $exec$;
    EXECUTE $exec$
      UPDATE store_items SET location = 'Tema Research' WHERE lower(coalesce(location,'')) IN ('tema_research','tema research')
    $exec$;
  END IF;

  -- Convert empty-string or NULL locations to a safe placeholder (guarded)
  -- Some tables enforce NOT NULL on `location`; setting NULL will fail.
  IF to_regclass('public.devices') IS NOT NULL THEN
    EXECUTE $exec$
      INSERT INTO merge_backup_devices
      SELECT * FROM devices WHERE coalesce(location,'') = '' OR location IS NULL
    $exec$;
    -- Set a safe placeholder instead of NULL. Adjust placeholder if you prefer another value.
    EXECUTE $exec$
      UPDATE devices SET location = 'Unspecified' WHERE coalesce(location,'') = '' OR location IS NULL
    $exec$;
  END IF;

END$$;

COMMIT;

-- After running: validate with preview queries above and check merge_backup_* tables.
