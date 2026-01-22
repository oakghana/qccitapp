-- ============================================
-- DEVICE ENHANCEMENTS & AUTOMATED NEEDS ANALYSIS
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

-- Add computed columns for device age
ALTER TABLE public.devices ADD COLUMN IF NOT EXISTS device_age_days INT GENERATED ALWAYS AS (
  CASE WHEN purchase_date IS NOT NULL 
  THEN EXTRACT(DAY FROM (CURRENT_DATE - purchase_date))
  ELSE NULL END
) STORED;

ALTER TABLE public.devices ADD COLUMN IF NOT EXISTS device_age_years DECIMAL(4,1) GENERATED ALWAYS AS (
  CASE WHEN purchase_date IS NOT NULL 
  THEN ROUND(CAST(EXTRACT(DAY FROM (CURRENT_DATE - purchase_date)) AS DECIMAL) / 365.25, 1)
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
      last_repair_date = CURRENT_DATE
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
  analysis_period TEXT NOT NULL, -- 'monthly_YYYY_MM' or 'quarterly_YYYY_Q1'
  analysis_type TEXT NOT NULL CHECK (analysis_type IN ('monthly', 'quarterly')),
  region_id UUID REFERENCES public.regions(id) ON DELETE CASCADE,
  region_name TEXT NOT NULL,
  location_id UUID REFERENCES public.locations(id) ON DELETE CASCADE,
  location_name TEXT,
  
  -- Device metrics
  total_devices INT DEFAULT 0,
  active_devices INT DEFAULT 0,
  devices_under_repair INT DEFAULT 0,
  devices_needing_replacement INT DEFAULT 0, -- Based on age/condition/repairs
  avg_device_age_years DECIMAL(4,1),
  
  -- Aging device breakdown
  devices_0_2_years INT DEFAULT 0,
  devices_3_5_years INT DEFAULT 0,
  devices_6_plus_years INT DEFAULT 0,
  
  -- Repair metrics
  total_repairs_this_period INT DEFAULT 0,
  devices_with_frequent_repairs INT DEFAULT 0, -- 3+ repairs
  
  -- Printer & toner needs
  total_printers INT DEFAULT 0,
  toner_usage_this_period INT DEFAULT 0,
  estimated_monthly_toner_need INT,
  
  -- Stock needs
  low_stock_items INT DEFAULT 0,
  out_of_stock_items INT DEFAULT 0,
  
  -- Calculated recommendations
  recommended_device_purchases JSONB, -- [{type, quantity, reason, priority}]
  recommended_toner_orders JSONB, -- [{toner_type, quantity, for_printers}]
  recommended_stock_replenishment JSONB, -- [{item, current_qty, recommended_qty}]
  
  -- Metadata
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  generated_by TEXT,
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_needs_analysis_period ON public.regional_needs_analysis(analysis_period);
CREATE INDEX IF NOT EXISTS idx_needs_analysis_region ON public.regional_needs_analysis(region_id);
CREATE INDEX IF NOT EXISTS idx_needs_analysis_location ON public.regional_needs_analysis(location_id);

-- ============================================
-- PART 4: AUTOMATED NEEDS CALCULATION FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION generate_regional_needs_analysis(
  p_analysis_period TEXT,
  p_analysis_type TEXT,
  p_region_id UUID DEFAULT NULL,
  p_location_id UUID DEFAULT NULL
)
RETURNS TABLE (
  region_name TEXT,
  location_name TEXT,
  total_devices INT,
  devices_needing_replacement INT,
  total_printers INT,
  estimated_monthly_toner_need INT
) AS $$
BEGIN
  RETURN QUERY
  WITH device_metrics AS (
    SELECT 
      COALESCE(r.name, 'Unknown Region') as region_name,
      COALESCE(l.name, d.location, 'Unknown Location') as location_name,
      d.region_id,
      d.location_id,
      COUNT(*) as total_devices,
      COUNT(*) FILTER (WHERE d.status = 'active') as active_devices,
      COUNT(*) FILTER (WHERE d.status = 'under_repair') as devices_under_repair,
      COUNT(*) FILTER (
        WHERE (d.device_age_years > 6 OR d.total_repair_count >= 3 OR d.device_condition = 'poor')
        AND d.status != 'retired'
      ) as devices_needing_replacement,
      ROUND(AVG(d.device_age_years), 1) as avg_device_age_years,
      COUNT(*) FILTER (WHERE d.device_age_years BETWEEN 0 AND 2) as devices_0_2_years,
      COUNT(*) FILTER (WHERE d.device_age_years BETWEEN 3 AND 5) as devices_3_5_years,
      COUNT(*) FILTER (WHERE d.device_age_years >= 6) as devices_6_plus_years,
      COUNT(*) FILTER (WHERE d.device_type = 'printer') as total_printers,
      SUM(CASE WHEN d.device_type = 'printer' AND d.monthly_page_volume IS NOT NULL 
          THEN CEIL(d.monthly_page_volume::DECIMAL / NULLIF(d.toner_yield, 0))
          ELSE 0 END)::INT as estimated_monthly_toner_need
    FROM public.devices d
    LEFT JOIN public.regions r ON d.region_id = r.id
    LEFT JOIN public.locations l ON d.location_id = l.id
    WHERE (p_region_id IS NULL OR d.region_id = p_region_id)
      AND (p_location_id IS NULL OR d.location_id = p_location_id)
    GROUP BY d.region_id, d.location_id, r.name, l.name, d.location
  )
  SELECT 
    dm.region_name,
    dm.location_name,
    dm.total_devices,
    dm.devices_needing_replacement,
    dm.total_printers,
    dm.estimated_monthly_toner_need
  FROM device_metrics dm;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PART 5: DEVICE REPLACEMENT RECOMMENDATION VIEW
-- ============================================

CREATE OR REPLACE VIEW device_replacement_recommendations AS
SELECT 
  d.id,
  d.device_type,
  d.brand,
  d.model,
  d.serial_number,
  d.location,
  COALESCE(r.name, 'Unknown') as region_name,
  d.device_age_years,
  d.total_repair_count,
  d.device_condition,
  d.warranty_status,
  -- Replacement priority score (0-100)
  (
    COALESCE(LEAST(d.device_age_years * 10, 40), 0) + -- Age: max 40 points
    COALESCE(LEAST(d.total_repair_count * 15, 30), 0) + -- Repairs: max 30 points
    CASE d.device_condition
      WHEN 'poor' THEN 20
      WHEN 'fair' THEN 10
      WHEN 'good' THEN 5
      ELSE 0
    END + -- Condition: max 20 points
    CASE d.warranty_status
      WHEN 'expired' THEN 10
      ELSE 0
    END -- Warranty: max 10 points
  )::INT as replacement_priority_score,
  CASE 
    WHEN (
      COALESCE(LEAST(d.device_age_years * 10, 40), 0) +
      COALESCE(LEAST(d.total_repair_count * 15, 30), 0) +
      CASE d.device_condition WHEN 'poor' THEN 20 WHEN 'fair' THEN 10 WHEN 'good' THEN 5 ELSE 0 END +
      CASE d.warranty_status WHEN 'expired' THEN 10 ELSE 0 END
    ) >= 70 THEN 'urgent'
    WHEN (
      COALESCE(LEAST(d.device_age_years * 10, 40), 0) +
      COALESCE(LEAST(d.total_repair_count * 15, 30), 0) +
      CASE d.device_condition WHEN 'poor' THEN 20 WHEN 'fair' THEN 10 WHEN 'good' THEN 5 ELSE 0 END +
      CASE d.warranty_status WHEN 'expired' THEN 10 ELSE 0 END
    ) >= 50 THEN 'high'
    WHEN (
      COALESCE(LEAST(d.device_age_years * 10, 40), 0) +
      COALESCE(LEAST(d.total_repair_count * 15, 30), 0) +
      CASE d.device_condition WHEN 'poor' THEN 20 WHEN 'fair' THEN 10 WHEN 'good' THEN 5 ELSE 0 END +
      CASE d.warranty_status WHEN 'expired' THEN 10 ELSE 0 END
    ) >= 30 THEN 'medium'
    ELSE 'low'
  END as replacement_priority,
  ARRAY_TO_STRING(ARRAY[
    CASE WHEN d.device_age_years > 6 THEN 'Device is over 6 years old' END,
    CASE WHEN d.total_repair_count >= 3 THEN 'Frequent repairs (' || d.total_repair_count || ')' END,
    CASE WHEN d.device_condition = 'poor' THEN 'Poor physical condition' END,
    CASE WHEN d.warranty_status = 'expired' THEN 'Warranty expired' END
  ], '; ') as replacement_reasons
FROM public.devices d
LEFT JOIN public.regions r ON d.region_id = r.id
WHERE d.status != 'retired'
  AND (
    d.device_age_years > 5 OR 
    d.total_repair_count >= 2 OR 
    d.device_condition IN ('poor', 'fair')
  )
ORDER BY replacement_priority_score DESC;

-- ============================================
-- PART 6: MONTHLY TONER NEEDS VIEW
-- ============================================

CREATE OR REPLACE VIEW monthly_toner_needs AS
SELECT 
  COALESCE(d.location, 'Unknown') as location,
  COALESCE(r.name, 'Unknown Region') as region_name,
  d.toner_type,
  d.toner_model,
  COUNT(*) as printer_count,
  SUM(d.monthly_page_volume) as total_monthly_pages,
  AVG(d.toner_yield) as avg_toner_yield,
  CEIL(SUM(d.monthly_page_volume)::DECIMAL / NULLIF(AVG(d.toner_yield), 0))::INT as estimated_monthly_toner_need,
  ARRAY_AGG(d.serial_number ORDER BY d.serial_number) as printer_serials
FROM public.devices d
LEFT JOIN public.regions r ON d.region_id = r.id
WHERE d.device_type = 'printer'
  AND d.status = 'active'
  AND d.toner_type IS NOT NULL
GROUP BY d.location, r.name, d.toner_type, d.toner_model
ORDER BY estimated_monthly_toner_need DESC NULLS LAST;

-- ============================================
-- PART 7: GRANT PERMISSIONS
-- ============================================

-- Grant access to IT staff roles
GRANT SELECT ON public.regional_needs_analysis TO authenticated;
GRANT SELECT ON device_replacement_recommendations TO authenticated;
GRANT SELECT ON monthly_toner_needs TO authenticated;

-- ============================================
-- COMPLETION MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ Device enhancements migration completed successfully!';
  RAISE NOTICE '📊 Added: Device age tracking, repair count, printer toner specs';
  RAISE NOTICE '🏢 Added: Room number, building section, floor tracking';
  RAISE NOTICE '🤖 Created: Automated needs analysis system';
  RAISE NOTICE '📈 Created: Device replacement recommendation view';
  RAISE NOTICE '🖨️ Created: Monthly toner needs calculation view';
END $$;
