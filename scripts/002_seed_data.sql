-- Insert service providers
INSERT INTO public.service_providers (name, email, phone, specialization, location, is_active)
VALUES
  ('Natland Computers', 'info@natlandcomputers.com', '+233-24-123-4567', ARRAY['Hardware Repair', 'Software Installation', 'Network Setup'], 'Accra', true),
  ('TechFix Ghana', 'support@techfixghana.com', '+233-24-234-5678', ARRAY['Hardware Repair', 'Data Recovery'], 'Kumasi', true),
  ('IT Solutions Ltd', 'info@itsolutionsgh.com', '+233-24-345-6789', ARRAY['Network Issues', 'Server Management'], 'Accra', true)
ON CONFLICT DO NOTHING;

-- Insert sample devices
INSERT INTO public.devices (serial_number, device_type, brand, model, assigned_to, location, status, purchase_date, warranty_expiry)
VALUES
  ('QCC-LAP-001', 'Laptop', 'Dell', 'Latitude 5520', 'John Doe', 'Head Office - Accra', 'active', '2023-06-15', '2026-06-15'),
  ('QCC-DES-002', 'Desktop', 'HP', 'EliteDesk 800', 'Jane Smith', 'Kumasi', 'active', '2023-03-10', '2026-03-10'),
  ('QCC-LAP-003', 'Laptop', 'Lenovo', 'ThinkPad X1', 'Michael Johnson', 'Cape Coast', 'active', '2023-08-20', '2026-08-20'),
  ('QCC-PRT-004', 'Printer', 'HP', 'LaserJet Pro M404', '', 'Accra Regional', 'active', '2023-05-01', '2026-05-01')
ON CONFLICT DO NOTHING;

-- Insert sample store items
INSERT INTO public.store_items (name, category, sku, siv_number, quantity, reorder_level, unit, location, supplier, last_restocked)
VALUES
  ('HP Laptop Battery', 'Laptop Parts', 'BAT-HP-001', 'SIV-2024-001', 15, 5, 'pieces', 'Head Office - Accra', 'Tech Supplies Ltd', '2024-01-10'),
  ('Dell Keyboard', 'Peripherals', 'KEY-DEL-001', 'SIV-2024-002', 8, 10, 'pieces', 'Head Office - Accra', 'Office Mart', '2024-01-05'),
  ('HDMI Cable', 'Cables', 'CAB-HDM-001', 'SIV-2024-003', 25, 10, 'pieces', 'Kumasi', 'Tech Supplies Ltd', '2024-01-15'),
  ('Mouse (Wireless)', 'Peripherals', 'MOU-WIR-001', 'SIV-2024-004', 0, 8, 'pieces', 'Accra Regional', 'Office Mart', NULL),
  ('RAM 8GB DDR4', 'Computer Parts', 'RAM-8GB-001', 'SIV-2024-005', 12, 5, 'pieces', 'Head Office - Accra', 'Tech Supplies Ltd', '2024-01-12'),
  ('USB Flash Drive 32GB', 'Storage', 'USB-32GB-001', 'SIV-2024-006', 30, 15, 'pieces', 'Head Office - Accra', 'Tech Mart', '2024-01-18'),
  ('Network Cable Cat6', 'Cables', 'CAB-CAT6-001', 'SIV-2024-007', 50, 20, 'meters', 'Kumasi', 'Network Supplies', '2024-01-20')
ON CONFLICT DO NOTHING;
