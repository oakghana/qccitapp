-- Add device enhancements for aging, repair tracking, printer toner fields, and detailed location
-- This migration adds all the requested fields to enable automatic needs analysis

-- Step 1: Add new columns to devices table
ALTER TABLE devices ADD COLUMN IF NOT EXISTS purchase_date_original DATE;
ALTER TABLE devices ADD COLUMN IF NOT EXISTS device_age_years INTEGER;
ALTER TABLE devices ADD COLUMN IF NOT EXISTS device_age_months INTEGER;
ALTER TABLE devices ADD COLUMN IF NOT EXISTS repair_count INTEGER DEFAULT 0;
ALTER TABLE devices ADD COLUMN IF NOT EXISTS last_repair_date DATE;
ALTER TABLE devices ADD COLUMN IF NOT EXISTS device_condition TEXT CHECK (device_condition IN ('excellent', 'good', 'fair', 'poor', 'critical'));
ALTER TABLE devices ADD COLUMN IF NOT EXISTS replacement_recommended BOOLEAN DEFAULT FALSE;

-- Printer-specific fields
ALTER TABLE devices ADD COLUMN IF NOT EXISTS is_printer BOOLEAN DEFAULT FALSE;
ALTER TABLE devices ADD COLUMN IF NOT EXISTS toner_type TEXT;
ALTER TABLE devices ADD COLUMN IF NOT EXISTS toner_model TEXT;
ALTER TABLE devices ADD COLUMN IF NOT EXISTS toner_yield INTEGER;
ALTER TABLE devices ADD COLUMN IF NOT EXISTS monthly_print_volume INTEGER;
ALTER TABLE devices ADD COLUMN IF NOT EXISTS monthly_toner_consumption NUMERIC(10,2);

-- Enhanced location fields
ALTER TABLE devices ADD COLUMN IF NOT EXISTS room_number TEXT;
ALTER TABLE devices ADD COLUMN IF NOT EXISTS building TEXT;
ALTER TABLE devices ADD COLUMN IF NOT EXISTS floor_level TEXT;

-- Step 2: Create function to calculate device age
CREATE OR REPLACE FUNCTION calculate_device_age(p_purchase_date DATE)
RETURNS TABLE(age_years INTEGER, age_months INTEGER) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    EXTRACT(YEAR FROM AGE(CURRENT_DATE, p_purchase_date))::INTEGER,
    (EXTRACT(YEAR FROM AGE(CURRENT_DATE, p_purchase_date)) * 12 + 
     EXTRACT(MONTH FROM AGE(CURRENT_DATE, p_purchase_date)))::INTEGER;
END;
$$;

-- Step 3: Create trigger to auto-update device age when purchase_date changes
CREATE OR REPLACE FUNCTION update_device_age()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_age_years INTEGER;
  v_age_months INTEGER;
BEGIN
  IF NEW.purchase_date IS NOT NULL THEN
    SELECT age_years, age_months INTO v_age_years, v_age_months
    FROM calculate_device_age(NEW.purchase_date);
    
    NEW.device_age_years := v_age_years;
    NEW.device_age_months := v_age_months;
    
    -- Recommend replacement if device is >5 years old or in poor/critical condition
    IF v_age_years >= 5 OR NEW.device_condition IN ('poor', 'critical') THEN
      NEW.replacement_recommended := TRUE;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_device_age ON devices;
CREATE TRIGGER trigger_update_device_age
  BEFORE INSERT OR UPDATE OF purchase_date, device_condition
  ON devices
  FOR EACH ROW
  EXECUTE FUNCTION update_device_age();

-- Step 4: Create trigger to update repair_count from repair_requests
CREATE OR REPLACE FUNCTION update_device_repair_count()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'completed' AND (TG_OP = 'INSERT' OR OLD.status <> 'completed') THEN
    UPDATE devices
    SET 
      repair_count = COALESCE(repair_count, 0) + 1,
      last_repair_date = NEW.completed_at::DATE,
      device_condition = CASE
        WHEN COALESCE(repair_count, 0) + 1 >= 5 THEN 'critical'
        WHEN COALESCE(repair_count, 0) + 1 >= 3 THEN 'poor'
        ELSE device_condition
      END
    WHERE id = NEW.device_id;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_device_repair_count ON repair_requests;
CREATE TRIGGER trigger_update_device_repair_count
  AFTER INSERT OR UPDATE OF status
  ON repair_requests
  FOR EACH ROW
  WHEN (NEW.status = 'completed')
  EXECUTE FUNCTION update_device_repair_count();

-- Step 5: Update existing devices with age calculation
UPDATE devices
SET device_age_years = (SELECT age_years FROM calculate_device_age(purchase_date)),
    device_age_months = (SELECT age_months FROM calculate_device_age(purchase_date))
WHERE purchase_date IS NOT NULL;

-- Step 6: Update existing devices with repair counts
UPDATE devices d
SET repair_count = (
  SELECT COUNT(*)
  FROM repair_requests rr
  WHERE rr.device_id = d.id AND rr.status = 'completed'
),
last_repair_date = (
  SELECT MAX(completed_at)::DATE
  FROM repair_requests rr
  WHERE rr.device_id = d.id AND rr.status = 'completed'
);

-- Step 7: Create view for devices needing replacement (for needs analysis)
CREATE OR REPLACE VIEW v_devices_replacement_needed AS
SELECT 
  d.*,
  l.name as location_full_name,
  r.name as region_name,
  dist.name as district_name,
  CASE
    WHEN d.device_age_years >= 7 THEN 'urgent'
    WHEN d.device_age_years >= 5 THEN 'recommended'
    WHEN d.repair_count >= 5 THEN 'urgent'
    WHEN d.repair_count >= 3 THEN 'recommended'
    WHEN d.device_condition IN ('critical', 'poor') THEN 'recommended'
    ELSE 'monitor'
  END as replacement_priority
FROM devices d
LEFT JOIN locations l ON d.location_id = l.id
LEFT JOIN regions r ON d.region_id = r.id
LEFT JOIN districts dist ON d.district_id = dist.id
WHERE 
  d.status = 'active'
  AND (
    d.device_age_years >= 5
    OR d.repair_count >= 3
    OR d.device_condition IN ('poor', 'critical')
    OR d.replacement_recommended = TRUE
  );

-- Step 8: Create view for printer toner needs analysis
CREATE OR REPLACE VIEW v_printer_toner_needs AS
SELECT 
  d.location,
  d.toner_type,
  d.toner_model,
  COUNT(*) as printer_count,
  SUM(d.monthly_print_volume) as total_monthly_pages,
  AVG(d.toner_yield) as avg_toner_yield,
  SUM(d.monthly_toner_consumption) as total_monthly_toner_consumption,
  -- Estimate toner units needed per month
  CEIL(SUM(d.monthly_print_volume)::NUMERIC / NULLIF(AVG(d.toner_yield), 0)) as monthly_toner_units_needed,
  -- Estimate toner units needed per quarter
  CEIL((SUM(d.monthly_print_volume)::NUMERIC * 3) / NULLIF(AVG(d.toner_yield), 0)) as quarterly_toner_units_needed
FROM devices d
WHERE 
  d.is_printer = TRUE
  AND d.status = 'active'
  AND d.toner_type IS NOT NULL
GROUP BY d.location, d.toner_type, d.toner_model;

-- Step 9: Create function to generate monthly/quarterly needs report
CREATE OR REPLACE FUNCTION generate_regional_needs_report(
  p_location TEXT DEFAULT NULL,
  p_period TEXT DEFAULT 'monthly' -- 'monthly' or 'quarterly'
)
RETURNS TABLE(
  location TEXT,
  category TEXT,
  item_description TEXT,
  quantity_needed INTEGER,
  priority TEXT,
  justification TEXT
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  -- Device replacements needed
  SELECT 
    d.location as location,
    'device_replacement' as category,
    d.device_type || ' - ' || d.brand || ' ' || d.model as item_description,
    COUNT(*)::INTEGER as quantity_needed,
    CASE
      WHEN MAX(d.device_age_years) >= 7 OR MAX(d.repair_count) >= 5 THEN 'urgent'
      ELSE 'recommended'
    END as priority,
    'Devices aged ' || MAX(d.device_age_years) || ' years or ' || MAX(d.repair_count) || ' repairs' as justification
  FROM v_devices_replacement_needed d
  WHERE (p_location IS NULL OR d.location = p_location)
  GROUP BY d.location, d.device_type, d.brand, d.model
  
  UNION ALL
  
  -- Toner needs
  SELECT 
    t.location,
    'printer_toner' as category,
    t.toner_type || ' (' || t.toner_model || ')' as item_description,
    CASE 
      WHEN p_period = 'quarterly' THEN t.quarterly_toner_units_needed
      ELSE t.monthly_toner_units_needed
    END::INTEGER as quantity_needed,
    'normal' as priority,
    'Based on ' || t.total_monthly_pages || ' pages/month for ' || t.printer_count || ' printers' as justification
  FROM v_printer_toner_needs t
  WHERE (p_location IS NULL OR t.location = p_location)
  
  ORDER BY priority DESC, location, category;
END;
$$;

-- Grant permissions
GRANT SELECT ON v_devices_replacement_needed TO authenticated;
GRANT SELECT ON v_printer_toner_needs TO authenticated;
GRANT EXECUTE ON FUNCTION generate_regional_needs_report TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_device_age TO authenticated;

-- Summary
SELECT 'Device enhancements migration completed successfully!' as status;
SELECT COUNT(*) as devices_with_age FROM devices WHERE device_age_years IS NOT NULL;
SELECT COUNT(*) as devices_with_repair_count FROM devices WHERE repair_count > 0;
SELECT COUNT(*) as devices_needing_replacement FROM v_devices_replacement_needed;
