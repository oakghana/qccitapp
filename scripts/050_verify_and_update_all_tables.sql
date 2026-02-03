-- ============================================================
-- COMPREHENSIVE DATABASE VERIFICATION AND UPDATE SCRIPT
-- Run this to ensure all tables and fields are up to date
-- ============================================================
-- Generated: 2026-02-03
-- This script uses IF NOT EXISTS to safely add missing columns
-- ============================================================

BEGIN;

-- ============================================================
-- 1. PROFILES TABLE - User accounts
-- ============================================================
DO $$
BEGIN
  -- Core fields
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'status') THEN
    ALTER TABLE profiles ADD COLUMN status VARCHAR(50) DEFAULT 'active';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'is_approved') THEN
    ALTER TABLE profiles ADD COLUMN is_approved BOOLEAN DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'must_change_password') THEN
    ALTER TABLE profiles ADD COLUMN must_change_password BOOLEAN DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'password_hash') THEN
    ALTER TABLE profiles ADD COLUMN password_hash TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'region_id') THEN
    ALTER TABLE profiles ADD COLUMN region_id UUID;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'district_id') THEN
    ALTER TABLE profiles ADD COLUMN district_id UUID;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'phone') THEN
    ALTER TABLE profiles ADD COLUMN phone VARCHAR(20);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'department') THEN
    ALTER TABLE profiles ADD COLUMN department VARCHAR(100);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'employee_id') THEN
    ALTER TABLE profiles ADD COLUMN employee_id VARCHAR(50);
  END IF;
  
  RAISE NOTICE 'Profiles table verified';
END $$;

-- ============================================================
-- 2. STORE_ITEMS TABLE - Inventory items
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'store_items' AND column_name = 'category') THEN
    ALTER TABLE store_items ADD COLUMN category VARCHAR(100);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'store_items' AND column_name = 'sku') THEN
    ALTER TABLE store_items ADD COLUMN sku VARCHAR(100);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'store_items' AND column_name = 'min_quantity') THEN
    ALTER TABLE store_items ADD COLUMN min_quantity INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'store_items' AND column_name = 'max_quantity') THEN
    ALTER TABLE store_items ADD COLUMN max_quantity INTEGER DEFAULT 1000;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'store_items' AND column_name = 'unit') THEN
    ALTER TABLE store_items ADD COLUMN unit VARCHAR(50) DEFAULT 'units';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'store_items' AND column_name = 'reorder_level') THEN
    ALTER TABLE store_items ADD COLUMN reorder_level INTEGER DEFAULT 10;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'store_items' AND column_name = 'supplier') THEN
    ALTER TABLE store_items ADD COLUMN supplier VARCHAR(255);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'store_items' AND column_name = 'cost_price') THEN
    ALTER TABLE store_items ADD COLUMN cost_price DECIMAL(12,2);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'store_items' AND column_name = 'notes') THEN
    ALTER TABLE store_items ADD COLUMN notes TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'store_items' AND column_name = 'last_restocked_at') THEN
    ALTER TABLE store_items ADD COLUMN last_restocked_at TIMESTAMP WITH TIME ZONE;
  END IF;
  
  RAISE NOTICE 'Store items table verified';
END $$;

-- ============================================================
-- 3. STORE_REQUISITIONS TABLE - Stock requisitions
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'store_requisitions' AND column_name = 'requested_by_role') THEN
    ALTER TABLE store_requisitions ADD COLUMN requested_by_role VARCHAR(50) DEFAULT 'it_staff';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'store_requisitions' AND column_name = 'approved_by_role') THEN
    ALTER TABLE store_requisitions ADD COLUMN approved_by_role VARCHAR(50);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'store_requisitions' AND column_name = 'rejection_reason') THEN
    ALTER TABLE store_requisitions ADD COLUMN rejection_reason TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'store_requisitions' AND column_name = 'it_req_number') THEN
    ALTER TABLE store_requisitions ADD COLUMN it_req_number VARCHAR(100);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'store_requisitions' AND column_name = 'destination_location') THEN
    ALTER TABLE store_requisitions ADD COLUMN destination_location VARCHAR(100);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'store_requisitions' AND column_name = 'approved_by') THEN
    ALTER TABLE store_requisitions ADD COLUMN approved_by UUID;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'store_requisitions' AND column_name = 'approved_at') THEN
    ALTER TABLE store_requisitions ADD COLUMN approved_at TIMESTAMP WITH TIME ZONE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'store_requisitions' AND column_name = 'issued_by') THEN
    ALTER TABLE store_requisitions ADD COLUMN issued_by UUID;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'store_requisitions' AND column_name = 'issued_at') THEN
    ALTER TABLE store_requisitions ADD COLUMN issued_at TIMESTAMP WITH TIME ZONE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'store_requisitions' AND column_name = 'allocated_quantity') THEN
    ALTER TABLE store_requisitions ADD COLUMN allocated_quantity INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'store_requisitions' AND column_name = 'issued_quantity') THEN
    ALTER TABLE store_requisitions ADD COLUMN issued_quantity INTEGER DEFAULT 0;
  END IF;
  
  RAISE NOTICE 'Store requisitions table verified';
END $$;

-- ============================================================
-- 4. STOCK_ASSIGNMENTS TABLE - Item assignments to staff
-- ============================================================
CREATE TABLE IF NOT EXISTS public.stock_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES public.store_items(id) ON DELETE SET NULL,
  item_name TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  assigned_to TEXT NOT NULL,
  assigned_by TEXT NOT NULL,
  location TEXT NOT NULL,
  notes TEXT,
  status TEXT DEFAULT 'assigned' CHECK (status IN ('assigned', 'returned', 'lost', 'damaged')),
  assigned_date TIMESTAMPTZ DEFAULT NOW(),
  returned_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 5. STOCK_TRANSACTIONS TABLE - Audit trail
-- ============================================================
CREATE TABLE IF NOT EXISTS stock_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES store_items(id) ON DELETE CASCADE,
  item_name VARCHAR(255) NOT NULL,
  transaction_type VARCHAR(50) NOT NULL,
  quantity INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stock_transactions' AND column_name = 'location_id') THEN
    ALTER TABLE stock_transactions ADD COLUMN location_id UUID;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stock_transactions' AND column_name = 'unit') THEN
    ALTER TABLE stock_transactions ADD COLUMN unit VARCHAR(50);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stock_transactions' AND column_name = 'location_name') THEN
    ALTER TABLE stock_transactions ADD COLUMN location_name VARCHAR(255);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stock_transactions' AND column_name = 'from_location') THEN
    ALTER TABLE stock_transactions ADD COLUMN from_location VARCHAR(255);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stock_transactions' AND column_name = 'to_location') THEN
    ALTER TABLE stock_transactions ADD COLUMN to_location VARCHAR(255);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stock_transactions' AND column_name = 'recipient') THEN
    ALTER TABLE stock_transactions ADD COLUMN recipient VARCHAR(255);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stock_transactions' AND column_name = 'office_location') THEN
    ALTER TABLE stock_transactions ADD COLUMN office_location VARCHAR(255);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stock_transactions' AND column_name = 'room_number') THEN
    ALTER TABLE stock_transactions ADD COLUMN room_number VARCHAR(100);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stock_transactions' AND column_name = 'reference_type') THEN
    ALTER TABLE stock_transactions ADD COLUMN reference_type VARCHAR(50);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stock_transactions' AND column_name = 'reference_id') THEN
    ALTER TABLE stock_transactions ADD COLUMN reference_id UUID;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stock_transactions' AND column_name = 'reference_number') THEN
    ALTER TABLE stock_transactions ADD COLUMN reference_number VARCHAR(100);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stock_transactions' AND column_name = 'notes') THEN
    ALTER TABLE stock_transactions ADD COLUMN notes TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stock_transactions' AND column_name = 'performed_by') THEN
    ALTER TABLE stock_transactions ADD COLUMN performed_by VARCHAR(255);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stock_transactions' AND column_name = 'performed_by_id') THEN
    ALTER TABLE stock_transactions ADD COLUMN performed_by_id UUID;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stock_transactions' AND column_name = 'updated_at') THEN
    ALTER TABLE stock_transactions ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
  
  RAISE NOTICE 'Stock transactions table verified';
END $$;

-- ============================================================
-- 6. SERVICE_TICKETS TABLE
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'service_tickets' AND column_name = 'ticket_number') THEN
    ALTER TABLE service_tickets ADD COLUMN ticket_number VARCHAR(50);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'service_tickets' AND column_name = 'region_id') THEN
    ALTER TABLE service_tickets ADD COLUMN region_id UUID;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'service_tickets' AND column_name = 'device_id') THEN
    ALTER TABLE service_tickets ADD COLUMN device_id UUID;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'service_tickets' AND column_name = 'assigned_to') THEN
    ALTER TABLE service_tickets ADD COLUMN assigned_to UUID;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'service_tickets' AND column_name = 'sla_due_date') THEN
    ALTER TABLE service_tickets ADD COLUMN sla_due_date TIMESTAMP WITH TIME ZONE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'service_tickets' AND column_name = 'escalated') THEN
    ALTER TABLE service_tickets ADD COLUMN escalated BOOLEAN DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'service_tickets' AND column_name = 'escalation_reason') THEN
    ALTER TABLE service_tickets ADD COLUMN escalation_reason TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'service_tickets' AND column_name = 'escalated_at') THEN
    ALTER TABLE service_tickets ADD COLUMN escalated_at TIMESTAMP WITH TIME ZONE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'service_tickets' AND column_name = 'closed_at') THEN
    ALTER TABLE service_tickets ADD COLUMN closed_at TIMESTAMP WITH TIME ZONE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'service_tickets' AND column_name = 'resolution_notes') THEN
    ALTER TABLE service_tickets ADD COLUMN resolution_notes TEXT;
  END IF;
  
  RAISE NOTICE 'Service tickets table verified';
END $$;

-- ============================================================
-- 7. DEVICES TABLE
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'devices' AND column_name = 'asset_tag') THEN
    ALTER TABLE devices ADD COLUMN asset_tag VARCHAR(100);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'devices' AND column_name = 'category') THEN
    ALTER TABLE devices ADD COLUMN category VARCHAR(100);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'devices' AND column_name = 'region_id') THEN
    ALTER TABLE devices ADD COLUMN region_id UUID;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'devices' AND column_name = 'district_id') THEN
    ALTER TABLE devices ADD COLUMN district_id UUID;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'devices' AND column_name = 'location_id') THEN
    ALTER TABLE devices ADD COLUMN location_id UUID;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'devices' AND column_name = 'warranty_end') THEN
    ALTER TABLE devices ADD COLUMN warranty_end DATE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'devices' AND column_name = 'purchase_date') THEN
    ALTER TABLE devices ADD COLUMN purchase_date DATE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'devices' AND column_name = 'manufacturer') THEN
    ALTER TABLE devices ADD COLUMN manufacturer VARCHAR(100);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'devices' AND column_name = 'model') THEN
    ALTER TABLE devices ADD COLUMN model VARCHAR(100);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'devices' AND column_name = 'ip_address') THEN
    ALTER TABLE devices ADD COLUMN ip_address VARCHAR(45);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'devices' AND column_name = 'mac_address') THEN
    ALTER TABLE devices ADD COLUMN mac_address VARCHAR(17);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'devices' AND column_name = 'operating_system') THEN
    ALTER TABLE devices ADD COLUMN operating_system VARCHAR(100);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'devices' AND column_name = 'processor') THEN
    ALTER TABLE devices ADD COLUMN processor VARCHAR(100);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'devices' AND column_name = 'ram') THEN
    ALTER TABLE devices ADD COLUMN ram VARCHAR(50);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'devices' AND column_name = 'storage') THEN
    ALTER TABLE devices ADD COLUMN storage VARCHAR(100);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'devices' AND column_name = 'needs_assessment') THEN
    ALTER TABLE devices ADD COLUMN needs_assessment BOOLEAN DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'devices' AND column_name = 'assessment_notes') THEN
    ALTER TABLE devices ADD COLUMN assessment_notes TEXT;
  END IF;
  
  RAISE NOTICE 'Devices table verified';
END $$;

-- ============================================================
-- 8. REPAIR_TASKS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS repair_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_number VARCHAR(50),
  service_ticket_id UUID REFERENCES service_tickets(id),
  service_provider_id UUID,
  device_id UUID REFERENCES devices(id),
  description TEXT NOT NULL,
  priority VARCHAR(20) DEFAULT 'medium',
  status VARCHAR(50) DEFAULT 'pending',
  estimated_cost DECIMAL(12,2),
  actual_cost DECIMAL(12,2),
  diagnosis TEXT,
  repair_notes TEXT,
  parts_used TEXT,
  assigned_at TIMESTAMP WITH TIME ZONE,
  picked_up_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'repair_tasks' AND column_name = 'invoice_url') THEN
    ALTER TABLE repair_tasks ADD COLUMN invoice_url TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'repair_tasks' AND column_name = 'invoice_number') THEN
    ALTER TABLE repair_tasks ADD COLUMN invoice_number VARCHAR(100);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'repair_tasks' AND column_name = 'invoice_date') THEN
    ALTER TABLE repair_tasks ADD COLUMN invoice_date DATE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'repair_tasks' AND column_name = 'warranty_claim') THEN
    ALTER TABLE repair_tasks ADD COLUMN warranty_claim BOOLEAN DEFAULT false;
  END IF;
  
  RAISE NOTICE 'Repair tasks table verified';
END $$;

-- ============================================================
-- 9. SERVICE_PROVIDERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS service_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  contact_person VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  specialization TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'service_providers' AND column_name = 'user_id') THEN
    ALTER TABLE service_providers ADD COLUMN user_id UUID REFERENCES profiles(id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'service_providers' AND column_name = 'rating') THEN
    ALTER TABLE service_providers ADD COLUMN rating DECIMAL(2,1);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'service_providers' AND column_name = 'total_jobs') THEN
    ALTER TABLE service_providers ADD COLUMN total_jobs INTEGER DEFAULT 0;
  END IF;
  
  RAISE NOTICE 'Service providers table verified';
END $$;

-- ============================================================
-- 10. NOTIFICATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'info',
  is_read BOOLEAN DEFAULT false,
  link TEXT,
  reference_type VARCHAR(50),
  reference_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 11. AUDIT_LOGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  user_name VARCHAR(255),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100),
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 12. SYSTEM_SETTINGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(100) UNIQUE NOT NULL,
  value TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 13. CREATE INDEXES FOR PERFORMANCE
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_store_items_location ON store_items(location);
CREATE INDEX IF NOT EXISTS idx_store_items_category ON store_items(category);
CREATE INDEX IF NOT EXISTS idx_store_requisitions_status ON store_requisitions(status);
CREATE INDEX IF NOT EXISTS idx_store_requisitions_location ON store_requisitions(location);
CREATE INDEX IF NOT EXISTS idx_store_requisitions_requested_by ON store_requisitions(requested_by);
CREATE INDEX IF NOT EXISTS idx_store_requisitions_it_req_number ON store_requisitions(it_req_number);
CREATE INDEX IF NOT EXISTS idx_store_requisitions_destination_location ON store_requisitions(destination_location);
CREATE INDEX IF NOT EXISTS idx_stock_assignments_item ON stock_assignments(item_id);
CREATE INDEX IF NOT EXISTS idx_stock_assignments_assigned_to ON stock_assignments(assigned_to);
CREATE INDEX IF NOT EXISTS idx_stock_assignments_location ON stock_assignments(location);
CREATE INDEX IF NOT EXISTS idx_stock_transactions_item_id ON stock_transactions(item_id);
CREATE INDEX IF NOT EXISTS idx_stock_transactions_type ON stock_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_stock_transactions_created_at ON stock_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_service_tickets_status ON service_tickets(status);
CREATE INDEX IF NOT EXISTS idx_service_tickets_assigned_to ON service_tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_service_tickets_created_at ON service_tickets(created_at);
CREATE INDEX IF NOT EXISTS idx_devices_location ON devices(location);
CREATE INDEX IF NOT EXISTS idx_devices_asset_tag ON devices(asset_tag);
CREATE INDEX IF NOT EXISTS idx_devices_status ON devices(status);
CREATE INDEX IF NOT EXISTS idx_repair_tasks_status ON repair_tasks(status);
CREATE INDEX IF NOT EXISTS idx_repair_tasks_service_provider ON repair_tasks(service_provider_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- ============================================================
-- 14. CREATE OR REPLACE HELPER FUNCTIONS
-- ============================================================

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Generate requisition number function
CREATE OR REPLACE FUNCTION generate_requisition_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  year_part TEXT;
  seq_number INTEGER;
BEGIN
  year_part := to_char(NOW(), 'YYYY');
  
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(requisition_number FROM 'REQ-' || year_part || '-(\d+)') AS INTEGER)
  ), 0) + 1
  INTO seq_number
  FROM store_requisitions
  WHERE requisition_number LIKE 'REQ-' || year_part || '-%';
  
  new_number := 'REQ-' || year_part || '-' || LPAD(seq_number::TEXT, 6, '0');
  
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Generate ticket number function
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  date_part TEXT;
  seq_number INTEGER;
BEGIN
  date_part := to_char(NOW(), 'YYYYMMDD');
  
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(ticket_number FROM 'TKT-' || date_part || '-(\d+)') AS INTEGER)
  ), 0) + 1
  INTO seq_number
  FROM service_tickets
  WHERE ticket_number LIKE 'TKT-' || date_part || '-%';
  
  new_number := 'TKT-' || date_part || '-' || LPAD(seq_number::TEXT, 4, '0');
  
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 15. APPLY TRIGGERS
-- ============================================================

-- Store items updated_at trigger
DROP TRIGGER IF EXISTS update_store_items_updated_at ON store_items;
CREATE TRIGGER update_store_items_updated_at 
  BEFORE UPDATE ON store_items 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Store requisitions updated_at trigger
DROP TRIGGER IF EXISTS update_store_requisitions_updated_at ON store_requisitions;
CREATE TRIGGER update_store_requisitions_updated_at 
  BEFORE UPDATE ON store_requisitions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Stock assignments updated_at trigger
DROP TRIGGER IF EXISTS update_stock_assignments_updated_at ON stock_assignments;
CREATE TRIGGER update_stock_assignments_updated_at 
  BEFORE UPDATE ON stock_assignments 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Stock transactions updated_at trigger
DROP TRIGGER IF EXISTS update_stock_transactions_updated_at ON stock_transactions;
CREATE TRIGGER update_stock_transactions_updated_at 
  BEFORE UPDATE ON stock_transactions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Service tickets updated_at trigger
DROP TRIGGER IF EXISTS update_service_tickets_updated_at ON service_tickets;
CREATE TRIGGER update_service_tickets_updated_at 
  BEFORE UPDATE ON service_tickets 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Devices updated_at trigger
DROP TRIGGER IF EXISTS update_devices_updated_at ON devices;
CREATE TRIGGER update_devices_updated_at 
  BEFORE UPDATE ON devices 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Repair tasks updated_at trigger
DROP TRIGGER IF EXISTS update_repair_tasks_updated_at ON repair_tasks;
CREATE TRIGGER update_repair_tasks_updated_at 
  BEFORE UPDATE ON repair_tasks 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Service providers updated_at trigger
DROP TRIGGER IF EXISTS update_service_providers_updated_at ON service_providers;
CREATE TRIGGER update_service_providers_updated_at 
  BEFORE UPDATE ON service_providers 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Profiles updated_at trigger
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- System settings updated_at trigger
DROP TRIGGER IF EXISTS update_system_settings_updated_at ON system_settings;
CREATE TRIGGER update_system_settings_updated_at 
  BEFORE UPDATE ON system_settings 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMIT;

-- ============================================================
-- VERIFICATION QUERY - Run this after to check status
-- ============================================================
SELECT 'Table Status Check' AS info;

SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) AS column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_name IN (
    'profiles', 'store_items', 'store_requisitions', 'stock_assignments',
    'stock_transactions', 'service_tickets', 'devices', 'repair_tasks',
    'service_providers', 'notifications', 'audit_logs', 'system_settings'
  )
ORDER BY table_name;
