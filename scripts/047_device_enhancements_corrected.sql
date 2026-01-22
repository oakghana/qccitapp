-- Device Enhancements: Age Tracking, Repair Counts, Printer Toner, Location Details, and Needs Analysis
-- This migration adds comprehensive tracking and automated needs generation capabilities

-- Step 1: Add new columns to devices table
ALTER TABLE devices
ADD COLUMN IF NOT EXISTS purchase_date DATE,
ADD COLUMN IF NOT EXISTS warranty_expiry_date DATE,
ADD COLUMN IF NOT EXISTS repair_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_repair_date DATE,
ADD COLUMN IF NOT EXISTS device_condition TEXT CHECK (device_condition IN ('excellent', 'good', 'fair', 'poor', 'critical')),
ADD COLUMN IF NOT EXISTS room_number TEXT,
ADD COLUMN IF NOT EXISTS building TEXT,
ADD COLUMN IF NOT EXISTS floor TEXT,
ADD COLUMN IF NOT EXISTS district TEXT,
ADD COLUMN IF NOT EXISTS region TEXT,
ADD COLUMN IF NOT EXISTS toner_type TEXT,
ADD COLUMN IF NOT EXISTS toner_model TEXT,
ADD COLUMN IF NOT EXISTS toner_yield INTEGER,
ADD COLUMN IF NOT EXISTS monthly_print_volume INTEGER,
ADD COLUMN IF NOT EXISTS replacement_recommended BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Step 2: Create index for performance
CREATE INDEX IF NOT EXISTS idx_devices_purchase_date ON devices(purchase_date);
CREATE INDEX IF NOT EXISTS idx_devices_location_full ON devices(location, district, region);
CREATE INDEX IF NOT EXISTS idx_devices_category ON devices(category);
CREATE INDEX IF NOT EXISTS idx_devices_repair_count ON devices(repair_count);

-- Step 3: Create function to calculate device age in years
CREATE OR REPLACE FUNCTION get_device_age_years(purchase_date DATE)
RETURNS NUMERIC AS $$
BEGIN
  IF purchase_date IS NULL THEN
    RETURN 0;
  END IF;
  RETURN ROUND(EXTRACT(EPOCH FROM (CURRENT_DATE - purchase_date)) / 31536000, 1);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Step 4: Create function to update repair count when repair status changes
CREATE OR REPLACE FUNCTION update_device_repair_count()
RETURNS TRIGGER AS $$
BEGIN
  -- When device status changes to under_repair, increment repair count
  IF NEW.status = 'under_repair' AND (OLD.status IS NULL OR OLD.status != 'under_repair') THEN
    NEW.repair_count := COALESCE(NEW.repair_count, 0) + 1;
    NEW.last_repair_date := CURRENT_DATE;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Create trigger for automatic repair count updates
DROP TRIGGER IF EXISTS trigger_update_repair_count ON devices;
CREATE TRIGGER trigger_update_repair_count
  BEFORE UPDATE ON devices
  FOR EACH ROW
  EXECUTE FUNCTION update_device_repair_count();

-- Step 6: Create view for device age analysis
CREATE OR REPLACE VIEW device_age_analysis AS
SELECT 
  id,
  name,
  brand,
  category,
  serialNumber as serial_number,
  location,
  district,
  region,
  purchase_date,
  get_device_age_years(purchase_date) as age_years,
  repair_count,
  last_repair_date,
  device_condition,
  status,
  warranty_expiry_date,
  CASE 
    WHEN purchase_date IS NULL THEN 'unknown'
    WHEN get_device_age_years(purchase_date) > 5 THEN 'old'
    WHEN get_device_age_years(purchase_date) > 3 THEN 'aging'
    ELSE 'new'
  END as age_category,
  CASE 
    WHEN repair_count > 5 THEN 'high_maintenance'
    WHEN repair_count > 2 THEN 'moderate_maintenance'
    ELSE 'low_maintenance'
  END as maintenance_category,
  CASE
    WHEN get_device_age_years(purchase_date) > 5 OR repair_count > 5 THEN TRUE
    WHEN get_device_age_years(purchase_date) > 4 AND repair_count > 3 THEN TRUE
    ELSE FALSE
  END as needs_replacement
FROM devices;

-- Step 7: Create view for regional device needs analysis
CREATE OR REPLACE VIEW regional_device_needs AS
SELECT 
  COALESCE(location, 'unassigned') as location,
  COALESCE(district, 'unassigned') as district,
  COALESCE(region, 'unassigned') as region,
  category,
  COUNT(*) as total_devices,
  COUNT(*) FILTER (WHERE needs_replacement = TRUE) as devices_needing_replacement,
  COUNT(*) FILTER (WHERE age_category = 'old') as old_devices,
  COUNT(*) FILTER (WHERE maintenance_category = 'high_maintenance') as high_maintenance_devices,
  ROUND(AVG(age_years), 1) as avg_age_years,
  ROUND(AVG(repair_count), 1) as avg_repair_count
FROM device_age_analysis
GROUP BY location, district, region, category
ORDER BY devices_needing_replacement DESC, location, category;

-- Step 8: Create view for printer toner needs analysis
CREATE OR REPLACE VIEW printer_toner_needs AS
SELECT 
  location,
  district,
  region,
  toner_type,
  toner_model,
  COUNT(*) as printer_count,
  SUM(monthly_print_volume) as total_monthly_volume,
  ROUND(SUM(monthly_print_volume)::NUMERIC / NULLIF(AVG(toner_yield), 0), 1) as monthly_toner_units_needed,
  ROUND(SUM(monthly_print_volume)::NUMERIC / NULLIF(AVG(toner_yield), 0) * 3, 1) as quarterly_toner_units_needed,
  ARRAY_AGG(DISTINCT name ORDER BY name) as printer_names
FROM devices
WHERE category = 'printer' 
  AND toner_type IS NOT NULL 
  AND status = 'active'
GROUP BY location, district, region, toner_type, toner_model
ORDER BY location, toner_type;

-- Step 9: Create function to generate monthly needs report for a location
CREATE OR REPLACE FUNCTION generate_monthly_needs_report(p_location TEXT DEFAULT NULL)
RETURNS TABLE(
  location TEXT,
  district TEXT,
  region TEXT,
  category TEXT,
  replacement_needed INTEGER,
  toner_type TEXT,
  monthly_toner_units NUMERIC,
  report_date DATE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    rdn.location,
    rdn.district,
    rdn.region,
    rdn.category,
    rdn.devices_needing_replacement::INTEGER,
    ptn.toner_type,
    ptn.monthly_toner_units_needed,
    CURRENT_DATE as report_date
  FROM regional_device_needs rdn
  LEFT JOIN printer_toner_needs ptn 
    ON rdn.location = ptn.location 
    AND rdn.category = 'printer'
  WHERE (p_location IS NULL OR rdn.location = p_location)
    AND (rdn.devices_needing_replacement > 0 OR ptn.monthly_toner_units_needed > 0)
  ORDER BY rdn.location, rdn.category;
END;
$$ LANGUAGE plpgsql;

-- Step 10: Create function to generate quarterly needs report
CREATE OR REPLACE FUNCTION generate_quarterly_needs_report(p_location TEXT DEFAULT NULL)
RETURNS TABLE(
  location TEXT,
  district TEXT,
  region TEXT,
  category TEXT,
  replacement_needed INTEGER,
  toner_type TEXT,
  quarterly_toner_units NUMERIC,
  report_date DATE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    rdn.location,
    rdn.district,
    rdn.region,
    rdn.category,
    rdn.devices_needing_replacement::INTEGER,
    ptn.toner_type,
    ptn.quarterly_toner_units_needed,
    CURRENT_DATE as report_date
  FROM regional_device_needs rdn
  LEFT JOIN printer_toner_needs ptn 
    ON rdn.location = ptn.location 
    AND rdn.category = 'printer'
  WHERE (p_location IS NULL OR rdn.location = p_location)
    AND (rdn.devices_needing_replacement > 0 OR ptn.quarterly_toner_units_needed > 0)
  ORDER BY rdn.location, rdn.category;
END;
$$ LANGUAGE plpgsql;

-- Step 11: Update existing devices with default values where appropriate
UPDATE devices 
SET device_condition = 'good' 
WHERE device_condition IS NULL AND status = 'active';

UPDATE devices 
SET device_condition = 'poor' 
WHERE device_condition IS NULL AND status = 'under_repair';

UPDATE devices 
SET device_condition = 'retired' 
WHERE device_condition IS NULL AND status = 'retired';

-- Step 12: Add helpful comments
COMMENT ON COLUMN devices.purchase_date IS 'Date when the device was purchased';
COMMENT ON COLUMN devices.repair_count IS 'Automatically incremented count of times device has been sent for repair';
COMMENT ON COLUMN devices.device_condition IS 'Current physical/functional condition: excellent, good, fair, poor, critical';
COMMENT ON COLUMN devices.room_number IS 'Specific room number where device is located';
COMMENT ON COLUMN devices.building IS 'Building name or identifier';
COMMENT ON COLUMN devices.floor IS 'Floor number or identifier';
COMMENT ON COLUMN devices.district IS 'District within the region';
COMMENT ON COLUMN devices.region IS 'Region or larger geographic area';
COMMENT ON COLUMN devices.toner_type IS 'Type of toner cartridge used (for printers)';
COMMENT ON COLUMN devices.toner_model IS 'Specific toner model number';
COMMENT ON COLUMN devices.toner_yield IS 'Number of pages per toner cartridge';
COMMENT ON COLUMN devices.monthly_print_volume IS 'Average number of pages printed per month';

COMMENT ON VIEW device_age_analysis IS 'Comprehensive device aging analysis with replacement recommendations';
COMMENT ON VIEW regional_device_needs IS 'Aggregated device replacement needs by location and category';
COMMENT ON VIEW printer_toner_needs IS 'Monthly and quarterly toner requirements by location and type';

COMMENT ON FUNCTION generate_monthly_needs_report IS 'Generate automated monthly procurement needs report for a location';
COMMENT ON FUNCTION generate_quarterly_needs_report IS 'Generate automated quarterly procurement needs report for a location';

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Device enhancements migration completed successfully!';
  RAISE NOTICE 'Added: device age tracking, repair counting, printer toner fields, detailed location fields';
  RAISE NOTICE 'Created: automated needs analysis views and reporting functions';
  RAISE NOTICE 'Use generate_monthly_needs_report() or generate_quarterly_needs_report() to get procurement recommendations';
END $$;
