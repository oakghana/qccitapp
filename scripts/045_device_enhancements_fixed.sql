-- ============================================
-- DEVICE ENHANCEMENTS & AUTOMATED NEEDS ANALYSIS (FIXED)
-- Adds: Device age, repair tracking, printer toner specs, room numbers,
-- and automated needs generation system
-- ============================================

-- ============================================
-- PART 1: ENHANCE DEVICES TABLE
-- ============================================

-- Add device age and repair tracking columns
ALTER TABLE public.devices ADD COLUMN IF NOT EXISTS room_number TEXT;
ALTER TABLE public.devices ADD COLUMN IF NOT EXISTS building_section TEXT;
ALTER TABLE public.devices ADD COLUMN IF NOT EXISTS floor_number TEXT;
ALTER TABLE public.devices ADD COLUMN IF NOT EXISTS total_repair_count INT DEFAULT 0;
ALTER TABLE public.devices ADD COLUMN IF NOT EXISTS last_repair_date DATE;
ALTER TABLE public.devices ADD COLUMN IF NOT EXISTS device_condition TEXT CHECK (device_condition IN ('excellent', 'good', 'fair', 'poor')) DEFAULT 'good';

-- Add printer-specific fields
ALTER TABLE public.devices ADD COLUMN IF NOT EXISTS toner_type TEXT;
ALTER TABLE public.devices ADD COLUMN IF NOT EXISTS toner_model TEXT;
ALTER TABLE public.devices ADD COLUMN IF NOT EXISTS printer_capacity TEXT; -- 'low_volume', 'medium_volume', 'high_volume'
ALTER TABLE public.devices ADD COLUMN IF NOT EXISTS monthly_page_volume INT;
ALTER TABLE public.devices ADD COLUMN IF NOT EXISTS toner_yield INT; -- Expected pages per toner
ALTER TABLE public.devices ADD COLUMN IF NOT EXISTS is_color_printer BOOLEAN DEFAULT false;

-- Add computed columns for device age (FIXED)
ALTER TABLE public.devices ADD COLUMN IF NOT EXISTS device_age_days INT GENERATED ALWAYS AS (
  CASE WHEN purchase_date IS NOT NULL 
  THEN (CURRENT_DATE - purchase_date)
  ELSE NULL END
) STORED;

ALTER TABLE public.devices ADD COLUMN IF NOT EXISTS device_age_years DECIMAL(4,1) GENERATED ALWAYS AS (
  CASE WHEN purchase_date IS NOT NULL 
  THEN ROUND(CAST((CURRENT_DATE - purchase_date) AS DECIMAL) / 365.25, 1)
  ELSE NULL END
) STORED;

ALTER TABLE public.devices ADD COLUMN IF NOT EXISTS warranty_status TEXT GENERATED ALWAYS AS (
  CASE 
    WHEN warranty_expiry IS NULL THEN 'unknown'
    WHEN CURRENT_DATE > warranty_expiry THEN 'expired'
    WHEN CURRENT_DATE > (warranty_expiry - INTERVAL '30 days') THEN 'expiring_soon'
    ELSE 'active'
  END
) STORED;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_devices_age ON public.devices(device_age_years);
CREATE INDEX IF NOT EXISTS idx_devices_repair_count ON public.devices(total_repair_count);
CREATE INDEX IF NOT EXISTS idx_devices_room ON public.devices(room_number);
CREATE INDEX IF NOT EXISTS idx_devices_toner_type ON public.devices(toner_type);

-- ============================================
-- PART 2: UPDATE REPAIR TRACKING
-- ============================================

-- Create function to update device repair count
CREATE OR REPLACE FUNCTION update_device_repair_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Only count completed repairs
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    UPDATE public.devices 
    SET 
      total_repair_count = COALESCE(total_repair_count, 0) + 1,
      last_repair_date = CURRENT_DATE,
      device_condition = CASE 
        WHEN COALESCE(total_repair_count, 0) + 1 >= 5 THEN 'poor'
        WHEN COALESCE(total_repair_count, 0) + 1 >= 3 THEN 'fair'
        ELSE device_condition
      END
    WHERE id = NEW.device_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update repair count
DROP TRIGGER IF EXISTS trigger_update_device_repair_count ON public.repair_requests;
CREATE TRIGGER trigger_update_device_repair_count
  AFTER UPDATE ON public.repair_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_device_repair_count();

-- ============================================
-- PART 3: REGIONAL NEEDS ANALYSIS TABLE
-- ============================================

-- Create needs analysis table for automated reporting
CREATE TABLE IF NOT EXISTS public.regional_needs_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_period TEXT NOT NULL, -- 'monthly_2026_01' or 'quarterly_2026_Q1'
  analysis_type TEXT NOT NULL CHECK (analysis_type IN ('monthly', 'quarterly')),
  region TEXT NOT NULL,
  location TEXT,
  
  -- Device metrics
  total_devices INT DEFAULT 0,
  active_devices INT DEFAULT 0,
  devices_under_repair INT DEFAULT 0,
  devices_needing_replacement INT DEFAULT 0,
  avg_device_age_years DECIMAL(4,1),
  devices_out_of_warranty INT DEFAULT 0,
  
  -- Toner needs
  total_printers INT DEFAULT 0,
  estimated_monthly_toner_needs JSONB, -- {"HP_CF410A": 50, "CANON_CRG045": 30}
  
  -- Cost estimates
  estimated_replacement_cost DECIMAL(12,2),
  estimated_toner_cost DECIMAL(12,2),
  
  -- Metadata
  generated_at TIMESTAMP DEFAULT NOW(),
  generated_by TEXT,
  notes TEXT,
  
  UNIQUE(analysis_period, region, location)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_needs_analysis_period ON public.regional_needs_analysis(analysis_period);
CREATE INDEX IF NOT EXISTS idx_needs_analysis_region ON public.regional_needs_analysis(region);

-- ============================================
-- PART 4: AUTOMATED VIEWS FOR NEEDS ANALYSIS
-- ============================================

-- View: Devices needing replacement (>5 years old OR >4 repairs OR poor condition)
CREATE OR REPLACE VIEW public.devices_needing_replacement AS
SELECT 
  d.*,
  CASE 
    WHEN d.device_age_years >= 5 THEN 'age'
    WHEN d.total_repair_count >= 4 THEN 'repairs'
    WHEN d.device_condition = 'poor' THEN 'condition'
    ELSE 'other'
  END as replacement_reason
FROM public.devices d
WHERE 
  (d.device_age_years >= 5 OR d.total_repair_count >= 4 OR d.device_condition = 'poor')
  AND d.status != 'disposed';

-- View: Monthly toner needs by location
CREATE OR REPLACE VIEW public.monthly_toner_needs AS
SELECT 
  d.location,
  d.region,
  d.district,
  d.toner_type,
  d.toner_model,
  COUNT(*) as printer_count,
  SUM(COALESCE(d.monthly_page_volume, 1000)) as total_monthly_pages,
  SUM(
    CASE 
      WHEN d.toner_yield > 0 THEN 
        CEILING(CAST(COALESCE(d.monthly_page_volume, 1000) AS DECIMAL) / d.toner_yield)
      ELSE 1
    END
  ) as estimated_monthly_toners
FROM public.devices d
WHERE 
  d.category = 'Printer' 
  AND d.status = 'active'
  AND d.toner_type IS NOT NULL
GROUP BY d.location, d.region, d.district, d.toner_type, d.toner_model
ORDER BY estimated_monthly_toners DESC;

-- View: Device health summary by location
CREATE OR REPLACE VIEW public.device_health_by_location AS
SELECT 
  d.location,
  d.region,
  d.district,
  COUNT(*) as total_devices,
  COUNT(*) FILTER (WHERE d.status = 'active') as active_devices,
  COUNT(*) FILTER (WHERE d.status = 'under_repair') as devices_under_repair,
  COUNT(*) FILTER (WHERE d.device_age_years >= 5) as old_devices,
  COUNT(*) FILTER (WHERE d.total_repair_count >= 3) as high_repair_devices,
  COUNT(*) FILTER (WHERE d.device_condition = 'poor') as poor_condition_devices,
  ROUND(AVG(d.device_age_years), 1) as avg_age_years,
  ROUND(AVG(d.total_repair_count), 1) as avg_repairs,
  COUNT(*) FILTER (WHERE d.warranty_status = 'expired') as out_of_warranty
FROM public.devices d
GROUP BY d.location, d.region, d.district
ORDER BY total_devices DESC;

-- ============================================
-- PART 5: FUNCTION TO GENERATE NEEDS ANALYSIS
-- ============================================

CREATE OR REPLACE FUNCTION generate_regional_needs_analysis(
  p_analysis_type TEXT, -- 'monthly' or 'quarterly'
  p_period TEXT, -- e.g., '2026_01' or '2026_Q1'
  p_generated_by TEXT DEFAULT 'system'
)
RETURNS TABLE(
  region TEXT,
  location TEXT,
  devices_total INT,
  devices_need_replacement INT,
  printers_total INT,
  toner_needs JSONB,
  estimated_costs DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(d.region, 'Unknown') as region,
    COALESCE(d.location, 'Unknown') as location,
    COUNT(*)::INT as devices_total,
    COUNT(*) FILTER (
      WHERE d.device_age_years >= 5 
      OR d.total_repair_count >= 4 
      OR d.device_condition = 'poor'
    )::INT as devices_need_replacement,
    COUNT(*) FILTER (WHERE d.category = 'Printer')::INT as printers_total,
    JSONB_BUILD_OBJECT(
      'toner_types', 
      JSONB_AGG(DISTINCT d.toner_type) FILTER (WHERE d.toner_type IS NOT NULL)
    ) as toner_needs,
    (
      COUNT(*) FILTER (
        WHERE d.device_age_years >= 5 
        OR d.total_repair_count >= 4 
        OR d.device_condition = 'poor'
      ) * 1500.00
    )::DECIMAL as estimated_costs
  FROM public.devices d
  WHERE d.status != 'disposed'
  GROUP BY d.region, d.location
  ORDER BY devices_need_replacement DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PART 6: SEED REPAIR COUNTS FROM EXISTING DATA
-- ============================================

-- Update repair counts based on existing repair requests
UPDATE public.devices d
SET 
  total_repair_count = (
    SELECT COUNT(*) 
    FROM public.repair_requests r 
    WHERE r.device_id = d.id AND r.status = 'completed'
  ),
  last_repair_date = (
    SELECT MAX(r.completed_date)
    FROM public.repair_requests r
    WHERE r.device_id = d.id AND r.status = 'completed'
  );

-- Show summary
SELECT 
  'Devices with repair history' as info,
  COUNT(*) FILTER (WHERE total_repair_count > 0) as devices_with_repairs,
  ROUND(AVG(total_repair_count), 2) as avg_repairs_per_device,
  MAX(total_repair_count) as max_repairs
FROM public.devices;
