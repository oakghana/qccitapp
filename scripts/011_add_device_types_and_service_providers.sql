-- Add comprehensive device types to lookup_device_types table
INSERT INTO lookup_device_types (code, name, is_active, created_at, updated_at)
VALUES 
  ('laptop', 'Laptop', true, NOW(), NOW()),
  ('desktop', 'Desktop', true, NOW(), NOW()),
  ('printer', 'Printer', true, NOW(), NOW()),
  ('mobile', 'Mobile Device', true, NOW(), NOW()),
  ('server', 'Server', true, NOW(), NOW()),
  ('ups', 'UPS (Uninterruptible Power Supply)', true, NOW(), NOW()),
  ('stabiliser', 'Stabiliser/Voltage Regulator', true, NOW(), NOW()),
  ('network_cable', 'Network Cable', true, NOW(), NOW()),
  ('switch', 'Network Switch', true, NOW(), NOW()),
  ('router', 'Router', true, NOW(), NOW()),
  ('trunk', 'Trunk Cable', true, NOW(), NOW()),
  ('monitor', 'Monitor/Display', true, NOW(), NOW()),
  ('scanner', 'Scanner', true, NOW(), NOW()),
  ('projector', 'Projector', true, NOW(), NOW()),
  ('external_drive', 'External Hard Drive/SSD', true, NOW(), NOW()),
  ('keyboard', 'Keyboard', true, NOW(), NOW()),
  ('mouse', 'Mouse', true, NOW(), NOW()),
  ('webcam', 'Webcam', true, NOW(), NOW()),
  ('headset', 'Headset/Headphones', true, NOW(), NOW()),
  ('docking_station', 'Docking Station', true, NOW(), NOW()),
  ('adapter', 'Adapter/Converter', true, NOW(), NOW()),
  ('charger', 'Charger/Power Adapter', true, NOW(), NOW()),
  ('battery', 'Battery/Power Bank', true, NOW(), NOW()),
  ('cable', 'Cable (Various Types)', true, NOW(), NOW()),
  ('other', 'Other IT Equipment', true, NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Insert service providers into service_providers table
INSERT INTO service_providers (id, name, email, phone, specialization, location, is_active, created_at)
VALUES 
  (gen_random_uuid(), 'Natland Computers', 'support@natlandcomputers.com.gh', '+233302555000', 
   ARRAY['Laptops', 'Desktops', 'Printers', 'Mobile Devices', 'Network Equipment'], 
   'head_office', true, NOW()),
  (gen_random_uuid(), 'TechFix Ghana Ltd', 'contact@techfix.com.gh', '+233302123456', 
   ARRAY['Laptops', 'Desktops', 'Printers'], 
   'head_office', true, NOW()),
  (gen_random_uuid(), 'CompuServe Solutions', 'info@compuserve.gh', '+233322654321', 
   ARRAY['Mobile Devices', 'Tablets', 'Accessories'], 
   'kumasi', true, NOW())
ON CONFLICT (id) DO NOTHING;

-- Fix repair_requests RLS policy to allow proper querying
DROP POLICY IF EXISTS "Users can view their own repair requests" ON public.repair_requests;
CREATE POLICY "Users can view their own repair requests" ON public.repair_requests
  FOR SELECT USING (
    requested_by = (SELECT username FROM public.profiles WHERE id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'it_head', 'it_staff', 'service_provider', 'regional_it_head')
    )
  );
