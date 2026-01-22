-- Device Enhancements: Age Tracking, Repair Count, Printer Toner, Detailed Location
-- This migration adds comprehensive device tracking capabilities

-- Add new columns to devices table
ALTER TABLE devices ADD COLUMN IF NOT EXISTS purchase_date DATE;
ALTER TABLE devices ADD COLUMN IF NOT EXISTS device_age_years NUMERIC(4,1);
ALTER TABLE devices ADD COLUMN IF NOT EXISTS repair_count INTEGER DEFAULT 0;
ALTER TABLE devices ADD COLUMN IF NOT EXISTS last_repair_date DATE;
ALTER TABLE devices ADD COLUMN IF NOT EXISTS device_condition VARCHAR(20) CHECK (device_condition IN ('excellent', 'good', 'fair', 'poor', 'critical'));

-- Detailed location fields
ALTER TABLE devices ADD COLUMN IF NOT EXISTS room_number VARCHAR(50);
ALTER TABLE devices ADD COLUMN IF NOT EXISTS building VARCHAR(100);
ALTER TABLE devices ADD COLUMN IF NOT EXISTS floor VARCHAR(20);
ALTER TABLE devices ADD COLUMN IF NOT EXISTS district VARCHAR(100);
ALTER TABLE devices ADD COLUMN IF NOT EXISTS region VARCHAR(100);

-- Printer-specific fields
ALTER TABLE devices ADD COLUMN IF NOT EXISTS is_printer BOOLEAN DEFAULT FALSE;
ALTER TABLE devices ADD COLUMN IF NOT EXISTS toner_type VARCHAR(100);
ALTER TABLE devices ADD COLUMN IF NOT EXISTS toner_model VARCHAR(100);
ALTER TABLE devices ADD COLUMN IF NOT EXISTS toner_yield INTEGER;
ALTER TABLE devices ADD COLUMN IF NOT EXISTS monthly_print_volume INTEGER;
ALTER TABLE devices ADD COLUMN IF NOT EXISTS printer_type VARCHAR(50) CHECK (printer_type IN ('laser', 'inkjet', 'dot_matrix', 'thermal', 'multifunction'));

-- Usage and maintenance tracking
ALTER TABLE devices ADD COLUMN IF NOT EXISTS last_maintenance_date DATE;
ALTER TABLE devices ADD COLUMN IF NOT EXISTS next_maintenance_due DATE;
ALTER TABLE devices ADD COLUMN IF NOT EXISTS warranty_expiry_date DATE;
ALTER TABLE devices ADD COLUMN IF NOT EXISTS replacement_due_date DATE;

-- Add comments for documentation
COMMENT ON COLUMN devices.purchase_date IS 'Date when device was purchased';
COMMENT ON COLUMN devices.device_age_years IS 'Age of device in years (calculated)';
COMMENT ON COLUMN devices.repair_count IS 'Total number of repairs performed on this device';
COMMENT ON COLUMN devices.device_condition IS 'Current condition: excellent, good, fair, poor, critical';
COMMENT ON COLUMN devices.room_number IS 'Room or office number where device is located';
COMMENT ON COLUMN devices.district IS 'District within the location';
COMMENT ON COLUMN devices.region IS 'Region or area classification';

-- Create function to calculate device age
CREATE OR REPLACE FUNCTION calculate_device_age()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.purchase_date IS NOT NULL THEN
        NEW.device_age_years := ROUND(
            EXTRACT(EPOCH FROM (CURRENT_DATE - NEW.purchase_date)) / (365.25 * 24 * 60 * 60),
            1
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-calculate device age on insert/update
DROP TRIGGER IF EXISTS trigger_calculate_device_age ON devices;
CREATE TRIGGER trigger_calculate_device_age
    BEFORE INSERT OR UPDATE OF purchase_date
    ON devices
    FOR EACH ROW
    EXECUTE FUNCTION calculate_device_age();

-- Create function to increment repair count
CREATE OR REPLACE FUNCTION increment_device_repair_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.status = 'completed' THEN
        UPDATE devices 
        SET 
            repair_count = COALESCE(repair_count, 0) + 1,
            last_repair_date = NEW.completed_at::DATE
        WHERE id = NEW.device_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on repair_requests to auto-increment repair count
DROP TRIGGER IF EXISTS trigger_increment_repair_count ON repair_requests;
CREATE TRIGGER trigger_increment_repair_count
    AFTER INSERT OR UPDATE OF status
    ON repair_requests
    FOR EACH ROW
    EXECUTE FUNCTION increment_device_repair_count();

-- Create view for devices needing replacement (age > 5 years or repairs > 3)
CREATE OR REPLACE VIEW devices_needing_replacement AS
SELECT 
    d.*,
    CASE 
        WHEN device_age_years > 7 THEN 'urgent'
        WHEN device_age_years > 5 OR repair_count > 3 THEN 'high'
        WHEN device_age_years > 3 OR repair_count > 2 THEN 'medium'
        ELSE 'low'
    END as replacement_priority,
    CASE
        WHEN device_age_years > 7 OR repair_count > 5 THEN 'Replace immediately - device is beyond useful life'
        WHEN device_age_years > 5 OR repair_count > 3 THEN 'Plan replacement within 6 months'
        WHEN device_age_years > 3 OR repair_count > 2 THEN 'Monitor closely, consider replacement'
        ELSE 'Device in acceptable condition'
    END as recommendation
FROM devices d
WHERE 
    d.status IN ('active', 'in_repair', 'inactive')
    AND (d.device_age_years > 3 OR d.repair_count > 2 OR d.device_condition IN ('poor', 'critical'));

-- Create view for regional needs analysis
CREATE OR REPLACE VIEW regional_device_needs AS
SELECT 
    location,
    region,
    district,
    category,
    COUNT(*) as total_devices,
    SUM(CASE WHEN device_age_years > 5 THEN 1 ELSE 0 END) as devices_over_5_years,
    SUM(CASE WHEN repair_count > 3 THEN 1 ELSE 0 END) as high_repair_devices,
    SUM(CASE WHEN device_condition IN ('poor', 'critical') THEN 1 ELSE 0 END) as poor_condition_devices,
    SUM(CASE WHEN device_age_years > 5 OR repair_count > 3 THEN 1 ELSE 0 END) as recommended_replacements,
    ROUND(AVG(device_age_years), 1) as avg_device_age,
    ROUND(AVG(repair_count), 1) as avg_repair_count
FROM devices
WHERE status IN ('active', 'in_repair', 'inactive')
GROUP BY location, region, district, category
ORDER BY recommended_replacements DESC, avg_device_age DESC;

-- Create view for monthly toner requirements (for printers)
CREATE OR REPLACE VIEW monthly_toner_requirements AS
SELECT 
    location,
    region,
    district,
    toner_type,
    toner_model,
    COUNT(*) as printer_count,
    SUM(monthly_print_volume) as total_monthly_pages,
    AVG(toner_yield) as avg_toner_yield,
    ROUND(SUM(monthly_print_volume) / NULLIF(AVG(toner_yield), 0), 2) as estimated_monthly_toners_needed,
    ROUND(SUM(monthly_print_volume) / NULLIF(AVG(toner_yield), 0) * 3, 2) as estimated_quarterly_toners_needed
FROM devices
WHERE 
    is_printer = TRUE 
    AND status = 'active'
    AND toner_type IS NOT NULL
    AND monthly_print_volume > 0
GROUP BY location, region, district, toner_type, toner_model
ORDER BY estimated_monthly_toners_needed DESC;

-- Create function to generate regional needs report
CREATE OR REPLACE FUNCTION generate_regional_needs_report(
    p_location VARCHAR DEFAULT NULL,
    p_period VARCHAR DEFAULT 'monthly' -- 'monthly' or 'quarterly'
)
RETURNS TABLE (
    location VARCHAR,
    category VARCHAR,
    devices_needing_replacement INTEGER,
    replacement_priority VARCHAR,
    estimated_cost NUMERIC,
    toner_requirements NUMERIC,
    notes TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        rdn.location,
        rdn.category,
        rdn.recommended_replacements::INTEGER,
        CASE 
            WHEN rdn.devices_over_5_years > 5 THEN 'URGENT'
            WHEN rdn.devices_over_5_years > 2 THEN 'HIGH'
            ELSE 'MEDIUM'
        END as priority,
        ROUND(rdn.recommended_replacements * 2000, 2) as est_cost, -- Estimate $2000 per device
        COALESCE(mtr.estimated_monthly_toners_needed, 0) as toner_req,
        format('Avg Age: %s years, Avg Repairs: %s, Poor Condition: %s', 
            rdn.avg_device_age, rdn.avg_repair_count, rdn.poor_condition_devices) as notes
    FROM regional_device_needs rdn
    LEFT JOIN (
        SELECT location, SUM(estimated_monthly_toners_needed) as estimated_monthly_toners_needed
        FROM monthly_toner_requirements
        GROUP BY location
    ) mtr ON rdn.location = mtr.location
    WHERE (p_location IS NULL OR rdn.location = p_location)
        AND rdn.recommended_replacements > 0
    ORDER BY priority DESC, rdn.recommended_replacements DESC;
END;
$$ LANGUAGE plpgsql;

-- Set default values for existing devices (set purchase date to 3 years ago if null)
UPDATE devices 
SET purchase_date = CURRENT_DATE - INTERVAL '3 years'
WHERE purchase_date IS NULL AND created_at IS NOT NULL;

-- Update device_age_years for existing devices
UPDATE devices 
SET device_age_years = ROUND(
    EXTRACT(EPOCH FROM (CURRENT_DATE - purchase_date)) / (365.25 * 24 * 60 * 60),
    1
)
WHERE purchase_date IS NOT NULL;

-- Set is_printer flag for printer devices
UPDATE devices 
SET is_printer = TRUE
WHERE LOWER(category) = 'printer' OR LOWER(name) ILIKE '%printer%';

COMMIT;

-- Show summary
SELECT 'Migration completed successfully' as status;
SELECT COUNT(*) as total_devices, 
       COUNT(CASE WHEN device_age_years > 5 THEN 1 END) as devices_over_5_years,
       COUNT(CASE WHEN is_printer THEN 1 END) as total_printers
FROM devices;
