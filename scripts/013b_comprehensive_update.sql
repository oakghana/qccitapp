-- ============================================
-- STEP 2: COMPREHENSIVE DATABASE UPDATE SCRIPT
-- Run this AFTER 013a_add_enum_values.sql has been committed
-- ============================================
-- This script updates the schema for:
-- 1. Self-registration with default password
-- 2. Requisition workflow
-- 3. Allocation & stock transactions
-- 4. Enhanced device/toner tracking
-- 5. Service desk improvements
-- ============================================

-- ============================================
-- PART 1: UPDATE PROFILES TABLE FOR SELF-REGISTRATION
-- ============================================

-- Add new columns to profiles table if they don't exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT false; -- false to not force existing users
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS two_factor_secret TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS region_id UUID;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS district_id UUID;

-- ============================================
-- PART 2: CREATE REGIONS AND DISTRICTS TABLES
-- ============================================

-- Regions table
CREATE TABLE IF NOT EXISTS public.regions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Districts table
CREATE TABLE IF NOT EXISTS public.districts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region_id UUID REFERENCES public.regions(id) ON DELETE CASCADE,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Locations table (enhanced)
CREATE TABLE IF NOT EXISTS public.locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  region_id UUID REFERENCES public.regions(id) ON DELETE SET NULL,
  district_id UUID REFERENCES public.districts(id) ON DELETE SET NULL,
  address TEXT,
  is_central_store BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PART 3: REQUISITION WORKFLOW TABLES
-- ============================================

-- Create requisition_status enum if not exists
DO $$ BEGIN
  CREATE TYPE requisition_workflow_status AS ENUM (
    'draft',
    'submitted',
    'pending_approval',
    'approved',
    'partially_fulfilled',
    'fulfilled',
    'closed',
    'rejected',
    'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Create priority_level enum if not exists
DO $$ BEGIN
  CREATE TYPE priority_level AS ENUM (
    'low',
    'medium',
    'high',
    'urgent'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Requisitions header table
CREATE TABLE IF NOT EXISTS public.requisitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requisition_number TEXT UNIQUE NOT NULL,
  requester_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  requester_name TEXT NOT NULL,
  requester_role TEXT NOT NULL,
  region_id UUID REFERENCES public.regions(id) ON DELETE SET NULL,
  district_id UUID REFERENCES public.districts(id) ON DELETE SET NULL,
  location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
  location_name TEXT,
  status requisition_workflow_status DEFAULT 'draft',
  purpose TEXT,
  notes TEXT,
  priority TEXT DEFAULT 'medium',
  -- Approval tracking
  requires_it_head_approval BOOLEAN DEFAULT false,
  requires_admin_approval BOOLEAN DEFAULT false,
  submitted_at TIMESTAMPTZ,
  submitted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  approval_comments TEXT,
  rejected_at TIMESTAMPTZ,
  rejected_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  rejection_reason TEXT,
  fulfilled_at TIMESTAMPTZ,
  fulfilled_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  closed_at TIMESTAMPTZ,
  closed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Requisition line items
CREATE TABLE IF NOT EXISTS public.requisition_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requisition_id UUID REFERENCES public.requisitions(id) ON DELETE CASCADE,
  item_id UUID REFERENCES public.store_items(id) ON DELETE SET NULL,
  item_name TEXT NOT NULL,
  item_category TEXT,
  requested_qty INTEGER NOT NULL CHECK (requested_qty > 0),
  approved_qty INTEGER,
  fulfilled_qty INTEGER DEFAULT 0,
  unit TEXT DEFAULT 'units',
  purpose TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Requisition approval history
CREATE TABLE IF NOT EXISTS public.requisition_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requisition_id UUID REFERENCES public.requisitions(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- 'submitted', 'approved', 'rejected', 'fulfilled', 'closed'
  performed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  performed_by_name TEXT NOT NULL,
  performed_by_role TEXT NOT NULL,
  comments TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PART 4: ALLOCATION & STOCK TRANSACTION TABLES
-- ============================================

-- Create allocation status enum
DO $$ BEGIN
  CREATE TYPE allocation_status AS ENUM (
    'pending',
    'allocated',
    'in_transit',
    'delivered',
    'confirmed',
    'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Create stock transaction type enum
DO $$ BEGIN
  CREATE TYPE stock_transaction_type AS ENUM (
    'receipt',
    'issue',
    'transfer_out',
    'transfer_in',
    'allocation_out',
    'allocation_in',
    'receipt_confirmed',
    'adjustment_add',
    'adjustment_subtract',
    'return',
    'write_off',
    'requisition_fulfill'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Stock allocations table
CREATE TABLE IF NOT EXISTS public.stock_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  allocation_number TEXT UNIQUE NOT NULL,
  requisition_id UUID REFERENCES public.requisitions(id) ON DELETE SET NULL,
  -- Source (Central Store)
  source_location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
  source_location_name TEXT NOT NULL,
  -- Target (Region/User)
  target_type TEXT NOT NULL CHECK (target_type IN ('region', 'district', 'location', 'user')),
  target_region_id UUID REFERENCES public.regions(id) ON DELETE SET NULL,
  target_district_id UUID REFERENCES public.districts(id) ON DELETE SET NULL,
  target_location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
  target_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  target_name TEXT NOT NULL,
  -- Status tracking
  status allocation_status DEFAULT 'pending',
  allocated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  allocated_by_name TEXT,
  allocated_at TIMESTAMPTZ,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ,
  confirmed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  confirmed_by_name TEXT,
  confirmation_comments TEXT,
  confirmation_attachments TEXT[],
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Allocation line items
CREATE TABLE IF NOT EXISTS public.allocation_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  allocation_id UUID REFERENCES public.stock_allocations(id) ON DELETE CASCADE,
  item_id UUID REFERENCES public.store_items(id) ON DELETE SET NULL,
  item_name TEXT NOT NULL,
  item_category TEXT,
  allocated_qty INTEGER NOT NULL CHECK (allocated_qty > 0),
  received_qty INTEGER DEFAULT 0,
  unit TEXT DEFAULT 'units',
  serial_numbers TEXT[], -- For serialized items
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stock transactions (for audit trail)
CREATE TABLE IF NOT EXISTS public.stock_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_number TEXT UNIQUE NOT NULL,
  transaction_type stock_transaction_type NOT NULL,
  item_id UUID REFERENCES public.store_items(id) ON DELETE SET NULL,
  item_name TEXT NOT NULL,
  location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
  location_name TEXT,
  quantity INTEGER NOT NULL,
  quantity_before INTEGER,
  quantity_after INTEGER,
  unit_cost DECIMAL(12,2),
  total_cost DECIMAL(12,2),
  reference_type TEXT, -- 'requisition', 'allocation', 'adjustment', etc.
  reference_id UUID,
  reference_number TEXT,
  performed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  performed_by_name TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PART 5: ENHANCED DEVICES TABLE
-- ============================================

-- Add new columns to devices table
ALTER TABLE public.devices ADD COLUMN IF NOT EXISTS asset_tag TEXT;
ALTER TABLE public.devices ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.devices ADD COLUMN IF NOT EXISTS assigned_to_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.devices ADD COLUMN IF NOT EXISTS region_id UUID REFERENCES public.regions(id) ON DELETE SET NULL;
ALTER TABLE public.devices ADD COLUMN IF NOT EXISTS district_id UUID REFERENCES public.districts(id) ON DELETE SET NULL;
ALTER TABLE public.devices ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL;
ALTER TABLE public.devices ADD COLUMN IF NOT EXISTS warranty_end DATE;
ALTER TABLE public.devices ADD COLUMN IF NOT EXISTS last_maintenance_date DATE;
ALTER TABLE public.devices ADD COLUMN IF NOT EXISTS next_maintenance_date DATE;
ALTER TABLE public.devices ADD COLUMN IF NOT EXISTS notes TEXT;

-- Create index on devices for faster lookups
CREATE INDEX IF NOT EXISTS idx_devices_location ON public.devices(location);
CREATE INDEX IF NOT EXISTS idx_devices_region ON public.devices(region_id);
CREATE INDEX IF NOT EXISTS idx_devices_status ON public.devices(status);
CREATE INDEX IF NOT EXISTS idx_devices_assigned_to ON public.devices(assigned_to_user_id);

-- ============================================
-- PART 6: TONER TRACKING TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.toner_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES public.store_items(id) ON DELETE SET NULL,
  toner_name TEXT NOT NULL,
  toner_model TEXT,
  printer_id UUID REFERENCES public.devices(id) ON DELETE SET NULL,
  printer_name TEXT,
  location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
  location_name TEXT,
  region_id UUID REFERENCES public.regions(id) ON DELETE SET NULL,
  district_id UUID REFERENCES public.districts(id) ON DELETE SET NULL,
  -- Installation tracking
  installed_date DATE NOT NULL,
  installed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  installed_by_name TEXT,
  page_count_at_install INTEGER,
  -- Replacement tracking
  replaced_date DATE,
  replaced_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  page_count_at_replace INTEGER,
  pages_printed INTEGER GENERATED ALWAYS AS (
    CASE WHEN page_count_at_replace IS NOT NULL AND page_count_at_install IS NOT NULL 
    THEN page_count_at_replace - page_count_at_install 
    ELSE NULL END
  ) STORED,
  -- Yield tracking
  estimated_yield INTEGER,
  actual_yield INTEGER,
  status TEXT DEFAULT 'in_use' CHECK (status IN ('in_use', 'replaced', 'returned', 'disposed')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_toner_usage_location ON public.toner_usage(location_id);
CREATE INDEX IF NOT EXISTS idx_toner_usage_printer ON public.toner_usage(printer_id);
CREATE INDEX IF NOT EXISTS idx_toner_usage_status ON public.toner_usage(status);

-- ============================================
-- PART 7: ENHANCED SERVICE TICKETS
-- ============================================

-- Add new columns to service_tickets if table exists
DO $$ BEGIN
  ALTER TABLE public.service_tickets ADD COLUMN IF NOT EXISTS ticket_number TEXT;
  ALTER TABLE public.service_tickets ADD COLUMN IF NOT EXISTS region_id UUID;
  ALTER TABLE public.service_tickets ADD COLUMN IF NOT EXISTS district_id UUID;
  ALTER TABLE public.service_tickets ADD COLUMN IF NOT EXISTS location_id UUID;
  ALTER TABLE public.service_tickets ADD COLUMN IF NOT EXISTS device_id UUID;
  ALTER TABLE public.service_tickets ADD COLUMN IF NOT EXISTS assigned_to UUID;
  ALTER TABLE public.service_tickets ADD COLUMN IF NOT EXISTS assigned_to_name TEXT;
  ALTER TABLE public.service_tickets ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ;
  ALTER TABLE public.service_tickets ADD COLUMN IF NOT EXISTS pickup_location TEXT;
  ALTER TABLE public.service_tickets ADD COLUMN IF NOT EXISTS ready_for_pickup_at TIMESTAMPTZ;
  ALTER TABLE public.service_tickets ADD COLUMN IF NOT EXISTS picked_up_at TIMESTAMPTZ;
  ALTER TABLE public.service_tickets ADD COLUMN IF NOT EXISTS sla_due_date TIMESTAMPTZ;
  ALTER TABLE public.service_tickets ADD COLUMN IF NOT EXISTS sla_breached BOOLEAN DEFAULT false;
  ALTER TABLE public.service_tickets ADD COLUMN IF NOT EXISTS resolution_notes TEXT;
  ALTER TABLE public.service_tickets ADD COLUMN IF NOT EXISTS resolution_time_minutes INTEGER;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- Service ticket updates/notes table
CREATE TABLE IF NOT EXISTS public.service_ticket_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL,
  update_type TEXT NOT NULL CHECK (update_type IN ('note', 'status_change', 'assignment', 'escalation', 'attachment')),
  old_status TEXT,
  new_status TEXT,
  old_assignee UUID,
  new_assignee UUID,
  notes TEXT,
  attachments TEXT[],
  is_internal BOOLEAN DEFAULT false, -- Internal notes not visible to requester
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_by_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PART 8: NOTIFICATIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL, -- 'info', 'warning', 'success', 'error', 'action_required'
  category TEXT, -- 'requisition', 'allocation', 'ticket', 'approval', 'system'
  reference_type TEXT, -- 'requisition', 'allocation', 'ticket', etc.
  reference_id UUID,
  reference_url TEXT,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  is_email_sent BOOLEAN DEFAULT false,
  email_sent_at TIMESTAMPTZ,
  is_sms_sent BOOLEAN DEFAULT false,
  sms_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id, is_read) WHERE is_read = false;

-- ============================================
-- PART 9: PDF UPLOADS TABLE (for IT Documents)
-- ============================================

-- PDF uploads table
CREATE TABLE IF NOT EXISTS public.pdf_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  document_type TEXT NOT NULL CHECK (document_type IN ('toner', 'quarterly_report', 'information')),
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  uploaded_by_name TEXT NOT NULL,
  target_location TEXT,
  target_region_id UUID REFERENCES public.regions(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PDF confirmations table
CREATE TABLE IF NOT EXISTS public.pdf_confirmations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pdf_id UUID REFERENCES public.pdf_uploads(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  user_location TEXT NOT NULL,
  confirmed_at TIMESTAMPTZ DEFAULT NOW(),
  comments TEXT,
  UNIQUE(pdf_id, user_id)
);

-- ============================================
-- PART 10: REPAIR TASKS TABLE (for service providers)
-- ============================================

CREATE TABLE IF NOT EXISTS public.repair_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_number TEXT UNIQUE,
  repair_request_id UUID REFERENCES public.repair_requests(id) ON DELETE SET NULL,
  device_id UUID REFERENCES public.devices(id) ON DELETE SET NULL,
  device_info JSONB,
  service_provider_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  service_provider_name TEXT,
  issue_description TEXT NOT NULL,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT DEFAULT 'assigned' CHECK (status IN (
    'assigned', 'pickup_scheduled', 'collected', 'diagnosing', 
    'in_repair', 'awaiting_parts', 'repaired', 'ready_for_return',
    'returned', 'completed', 'cancelled'
  )),
  assigned_date TIMESTAMPTZ DEFAULT NOW(),
  assigned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  assigned_by_name TEXT,
  scheduled_pickup_date TIMESTAMPTZ,
  collected_date TIMESTAMPTZ,
  estimated_completion_date DATE,
  completed_date TIMESTAMPTZ,
  diagnosis_notes TEXT,
  repair_notes TEXT,
  parts_used JSONB DEFAULT '[]'::jsonb,
  estimated_cost DECIMAL(12,2),
  actual_cost DECIMAL(12,2),
  labor_hours DECIMAL(5,2),
  attachments TEXT[],
  status_history JSONB DEFAULT '[]'::jsonb,
  location TEXT,
  region_id UUID REFERENCES public.regions(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_repair_tasks_provider ON public.repair_tasks(service_provider_id);
CREATE INDEX IF NOT EXISTS idx_repair_tasks_status ON public.repair_tasks(status);
CREATE INDEX IF NOT EXISTS idx_repair_tasks_device ON public.repair_tasks(device_id);

-- ============================================
-- PART 11: SEED DATA FOR REGIONS & LOCATIONS
-- ============================================

-- Insert regions
INSERT INTO public.regions (code, name) VALUES
  ('greater_accra', 'Greater Accra'),
  ('ashanti', 'Ashanti'),
  ('western', 'Western'),
  ('eastern', 'Eastern'),
  ('central', 'Central'),
  ('volta', 'Volta'),
  ('northern', 'Northern'),
  ('bono', 'Bono')
ON CONFLICT (code) DO NOTHING;

-- Insert locations with Takoradi Port
INSERT INTO public.locations (code, name, is_central_store) VALUES
  ('head_office', 'Head Office', false),
  ('central_stores', 'Central Stores', true),
  ('tema_port', 'Tema Port', false),
  ('takoradi_port', 'Takoradi Port', false),
  ('tema_research', 'Tema Research', false),
  ('tema_training_school', 'Tema Training School', false),
  ('kumasi', 'Kumasi', false),
  ('kaase', 'Kaase', false),
  ('ws', 'WS', false),
  ('wn', 'WN', false),
  ('vr', 'VR', false),
  ('bar', 'BAR', false),
  ('eastern', 'Eastern', false),
  ('nsawam', 'Nsawam', false),
  ('cr', 'CR', false),
  ('cape_coast', 'Cape Coast', false),
  ('sunyani', 'Sunyani', false)
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- PART 11.5: ADD quantity_in_stock COLUMN TO store_items
-- ============================================
-- The store_items table has 'quantity' but triggers use 'quantity_in_stock'
-- Add the column if it doesn't exist
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'store_items' 
                 AND column_name = 'quantity_in_stock') THEN
    ALTER TABLE public.store_items ADD COLUMN quantity_in_stock INTEGER DEFAULT 0;
    -- Copy existing quantity values to the new column
    UPDATE public.store_items SET quantity_in_stock = COALESCE(quantity, 0);
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ============================================
-- PART 12: HELPER FUNCTIONS
-- ============================================

-- Function to generate requisition number
CREATE OR REPLACE FUNCTION generate_requisition_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  year_prefix TEXT;
  seq_num INTEGER;
BEGIN
  year_prefix := TO_CHAR(NOW(), 'YYYY');
  SELECT COALESCE(MAX(CAST(SUBSTRING(requisition_number FROM 5) AS INTEGER)), 0) + 1
  INTO seq_num
  FROM public.requisitions
  WHERE requisition_number LIKE year_prefix || '%';
  
  new_number := year_prefix || LPAD(seq_num::TEXT, 6, '0');
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Function to generate allocation number
CREATE OR REPLACE FUNCTION generate_allocation_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  year_prefix TEXT;
  seq_num INTEGER;
BEGIN
  year_prefix := 'AL' || TO_CHAR(NOW(), 'YYYY');
  SELECT COALESCE(MAX(CAST(SUBSTRING(allocation_number FROM 7) AS INTEGER)), 0) + 1
  INTO seq_num
  FROM public.stock_allocations
  WHERE allocation_number LIKE year_prefix || '%';
  
  new_number := year_prefix || LPAD(seq_num::TEXT, 6, '0');
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Function to generate transaction number
CREATE OR REPLACE FUNCTION generate_transaction_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  date_prefix TEXT;
  seq_num INTEGER;
BEGIN
  date_prefix := 'TX' || TO_CHAR(NOW(), 'YYYYMMDD');
  SELECT COALESCE(MAX(CAST(SUBSTRING(transaction_number FROM 11) AS INTEGER)), 0) + 1
  INTO seq_num
  FROM public.stock_transactions
  WHERE transaction_number LIKE date_prefix || '%';
  
  new_number := date_prefix || LPAD(seq_num::TEXT, 5, '0');
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Function to generate repair task number
CREATE OR REPLACE FUNCTION generate_repair_task_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  year_prefix TEXT;
  seq_num INTEGER;
BEGIN
  year_prefix := 'RT' || TO_CHAR(NOW(), 'YYYY');
  SELECT COALESCE(MAX(CAST(SUBSTRING(task_number FROM 7) AS INTEGER)), 0) + 1
  INTO seq_num
  FROM public.repair_tasks
  WHERE task_number LIKE year_prefix || '%';
  
  new_number := year_prefix || LPAD(seq_num::TEXT, 5, '0');
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate repair task number
CREATE OR REPLACE FUNCTION set_repair_task_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.task_number IS NULL THEN
    NEW.task_number := generate_repair_task_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_repair_task_number ON public.repair_tasks;
CREATE TRIGGER trg_set_repair_task_number
  BEFORE INSERT ON public.repair_tasks
  FOR EACH ROW
  EXECUTE FUNCTION set_repair_task_number();

-- Function to set approval routing based on requester role
CREATE OR REPLACE FUNCTION set_requisition_approval_routing()
RETURNS TRIGGER AS $$
BEGIN
  -- Regional IT Head submitter → IT Head must approve
  IF NEW.requester_role = 'regional_it_head' THEN
    NEW.requires_it_head_approval := true;
    NEW.requires_admin_approval := false;
  -- Head Office IT or Store Head submitter → Admin must approve
  ELSIF NEW.requester_role IN ('it_head', 'it_store_head', 'it_staff') THEN
    NEW.requires_it_head_approval := false;
    NEW.requires_admin_approval := true;
  -- Staff requests may require Regional IT Head pre-approval
  ELSIF NEW.requester_role IN ('staff', 'user') THEN
    NEW.requires_it_head_approval := true;
    NEW.requires_admin_approval := false;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for approval routing
DROP TRIGGER IF EXISTS trg_set_requisition_approval ON public.requisitions;
CREATE TRIGGER trg_set_requisition_approval
  BEFORE INSERT ON public.requisitions
  FOR EACH ROW
  EXECUTE FUNCTION set_requisition_approval_routing();

-- Trigger to auto-generate requisition number
CREATE OR REPLACE FUNCTION set_requisition_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.requisition_number IS NULL OR NEW.requisition_number = '' THEN
    NEW.requisition_number := generate_requisition_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_requisition_number ON public.requisitions;
CREATE TRIGGER trg_set_requisition_number
  BEFORE INSERT ON public.requisitions
  FOR EACH ROW
  EXECUTE FUNCTION set_requisition_number();

-- Trigger to auto-generate allocation number
CREATE OR REPLACE FUNCTION set_allocation_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.allocation_number IS NULL OR NEW.allocation_number = '' THEN
    NEW.allocation_number := generate_allocation_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_allocation_number ON public.stock_allocations;
CREATE TRIGGER trg_set_allocation_number
  BEFORE INSERT ON public.stock_allocations
  FOR EACH ROW
  EXECUTE FUNCTION set_allocation_number();

-- Function to record stock transaction on allocation
CREATE OR REPLACE FUNCTION record_allocation_transaction()
RETURNS TRIGGER AS $$
DECLARE
  item_record RECORD;
  v_old_status TEXT;
BEGIN
  -- Handle both INSERT and UPDATE
  IF TG_OP = 'INSERT' THEN
    v_old_status := NULL;
  ELSE
    v_old_status := OLD.status::TEXT;
  END IF;

  -- When allocation status is 'allocated', create transaction and deduct stock
  IF NEW.status = 'allocated' AND (v_old_status IS NULL OR v_old_status != 'allocated') THEN
    FOR item_record IN 
      SELECT ai.*, si.quantity_in_stock 
      FROM public.allocation_items ai
      LEFT JOIN public.store_items si ON ai.item_id = si.id
      WHERE ai.allocation_id = NEW.id
    LOOP
      -- Deduct from central store
      UPDATE public.store_items 
      SET quantity_in_stock = quantity_in_stock - item_record.allocated_qty,
          updated_at = NOW()
      WHERE id = item_record.item_id;
      
      -- Record transaction
      INSERT INTO public.stock_transactions (
        transaction_number,
        transaction_type,
        item_id,
        item_name,
        location_id,
        location_name,
        quantity,
        quantity_before,
        quantity_after,
        reference_type,
        reference_id,
        reference_number,
        performed_by,
        performed_by_name,
        notes
      ) VALUES (
        generate_transaction_number(),
        'allocation_out',
        item_record.item_id,
        item_record.item_name,
        NEW.source_location_id,
        NEW.source_location_name,
        item_record.allocated_qty,
        item_record.quantity_in_stock,
        item_record.quantity_in_stock - item_record.allocated_qty,
        'allocation',
        NEW.id,
        NEW.allocation_number,
        NEW.allocated_by,
        NEW.allocated_by_name,
        'Allocation to ' || NEW.target_name
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for allocation transactions (AFTER INSERT OR UPDATE)
DROP TRIGGER IF EXISTS trg_record_allocation_transaction ON public.stock_allocations;
CREATE TRIGGER trg_record_allocation_transaction
  AFTER INSERT OR UPDATE ON public.stock_allocations
  FOR EACH ROW
  EXECUTE FUNCTION record_allocation_transaction();

-- ============================================
-- PART 13: ENABLE RLS ON NEW TABLES
-- ============================================

ALTER TABLE public.regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requisitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requisition_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requisition_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.allocation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.toner_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_ticket_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdf_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdf_confirmations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repair_tasks ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PART 14: RLS POLICIES (using TEXT comparison instead of enum)
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can view regions" ON public.regions;
DROP POLICY IF EXISTS "Authenticated users can view districts" ON public.districts;
DROP POLICY IF EXISTS "Authenticated users can view locations" ON public.locations;
DROP POLICY IF EXISTS "Users can view own requisitions" ON public.requisitions;
DROP POLICY IF EXISTS "Managers can view requisitions" ON public.requisitions;
DROP POLICY IF EXISTS "Admin and IT Head can view all requisitions" ON public.requisitions;
DROP POLICY IF EXISTS "Regional IT heads can view region requisitions" ON public.requisitions;
DROP POLICY IF EXISTS "IT staff can view location requisitions" ON public.requisitions;
DROP POLICY IF EXISTS "Users can create requisitions" ON public.requisitions;
DROP POLICY IF EXISTS "Users can update own draft requisitions" ON public.requisitions;
DROP POLICY IF EXISTS "Managers can update requisitions" ON public.requisitions;
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "IT staff can view PDF uploads" ON public.pdf_uploads;
DROP POLICY IF EXISTS "Service providers can view their tasks" ON public.repair_tasks;
DROP POLICY IF EXISTS "IT staff can view all repair tasks" ON public.repair_tasks;
DROP POLICY IF EXISTS "Users can view own allocations" ON public.stock_allocations;
DROP POLICY IF EXISTS "Admin can view all allocations" ON public.stock_allocations;
DROP POLICY IF EXISTS "Regional IT heads can view region allocations" ON public.stock_allocations;
DROP POLICY IF EXISTS "IT staff can view location allocations" ON public.stock_allocations;
DROP POLICY IF EXISTS "IT staff can view allocations" ON public.stock_allocations;
DROP POLICY IF EXISTS "IT staff can manage allocations" ON public.stock_allocations;
DROP POLICY IF EXISTS "Users can view requisition items" ON public.requisition_items;
DROP POLICY IF EXISTS "Users can insert requisition items" ON public.requisition_items;
DROP POLICY IF EXISTS "Managers can update requisition items" ON public.requisition_items;
DROP POLICY IF EXISTS "Users can view requisition approvals" ON public.requisition_approvals;
DROP POLICY IF EXISTS "Managers can insert requisition approvals" ON public.requisition_approvals;
DROP POLICY IF EXISTS "IT staff can insert PDF uploads" ON public.pdf_uploads;
DROP POLICY IF EXISTS "Users can view PDF confirmations" ON public.pdf_confirmations;
DROP POLICY IF EXISTS "Users can confirm PDFs" ON public.pdf_confirmations;
DROP POLICY IF EXISTS "IT staff can manage repair tasks" ON public.repair_tasks;
DROP POLICY IF EXISTS "IT staff can view stock transactions" ON public.stock_transactions;
DROP POLICY IF EXISTS "IT staff can view allocation items" ON public.allocation_items;
DROP POLICY IF EXISTS "IT staff can insert allocation items" ON public.allocation_items;
DROP POLICY IF EXISTS "IT staff can update allocation items" ON public.allocation_items;
DROP POLICY IF EXISTS "IT staff can insert allocations" ON public.stock_allocations;
DROP POLICY IF EXISTS "IT staff can insert stock transactions" ON public.stock_transactions;
DROP POLICY IF EXISTS "IT staff can view toner usage" ON public.toner_usage;
DROP POLICY IF EXISTS "IT staff can insert toner usage" ON public.toner_usage;
DROP POLICY IF EXISTS "IT staff can update toner usage" ON public.toner_usage;
DROP POLICY IF EXISTS "Users can view service ticket updates" ON public.service_ticket_updates;
DROP POLICY IF EXISTS "IT staff can insert service ticket updates" ON public.service_ticket_updates;
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

-- Basic RLS policies
CREATE POLICY "Authenticated users can view regions" ON public.regions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can view districts" ON public.districts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can view locations" ON public.locations FOR SELECT TO authenticated USING (true);

-- ============================================
-- REQUISITIONS RLS - Location-based visibility
-- ============================================
-- 1. Users can see their OWN requisitions (ones they created)
CREATE POLICY "Users can view own requisitions" ON public.requisitions FOR SELECT USING (
  requester_id = auth.uid()
);

-- 2. Admin and IT Head can see ALL requisitions (system-wide access)
CREATE POLICY "Admin and IT Head can view all requisitions" ON public.requisitions FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role::text IN ('admin', 'it_head', 'it_store_head')
  )
);

-- 3. Regional IT Heads can see requisitions from their REGION
CREATE POLICY "Regional IT heads can view region requisitions" ON public.requisitions FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() 
    AND p.role::text = 'regional_it_head'
    AND (
      -- Match by region_id
      (p.region_id IS NOT NULL AND requisitions.region_id = p.region_id)
      -- Or match by location (for backward compatibility)
      OR (p.location IS NOT NULL AND requisitions.location_name = p.location)
    )
  )
);

-- 4. IT Staff can see requisitions from their LOCATION
CREATE POLICY "IT staff can view location requisitions" ON public.requisitions FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() 
    AND p.role::text = 'it_staff'
    AND (
      -- Match by location_id
      (p.location IS NOT NULL AND requisitions.location_name = p.location)
    )
  )
);

-- Users can create requisitions for themselves
CREATE POLICY "Users can create requisitions" ON public.requisitions FOR INSERT WITH CHECK (requester_id = auth.uid());
CREATE POLICY "Users can update own draft requisitions" ON public.requisitions FOR UPDATE USING (
  requester_id = auth.uid() AND status::text = 'draft'
);
CREATE POLICY "Managers can update requisitions" ON public.requisitions FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role::text IN ('admin', 'it_head', 'regional_it_head', 'it_store_head'))
);

-- Notifications: users can only see their own
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (user_id = auth.uid());

-- PDF uploads: viewable by IT staff (using TEXT comparison)
CREATE POLICY "IT staff can view PDF uploads" ON public.pdf_uploads FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role::text IN (
    'admin', 'it_head', 'regional_it_head', 'it_staff', 'it_store_head',
    'service_desk_accra', 'service_desk_kumasi', 'service_desk_takoradi',
    'service_desk_tema', 'service_desk_sunyani', 'service_desk_cape_coast'
  ))
);
CREATE POLICY "IT staff can insert PDF uploads" ON public.pdf_uploads FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role::text IN (
    'admin', 'it_head', 'regional_it_head', 'it_staff', 'it_store_head'
  ))
);

-- PDF confirmations
CREATE POLICY "Users can view PDF confirmations" ON public.pdf_confirmations FOR SELECT USING (true);
CREATE POLICY "Users can confirm PDFs" ON public.pdf_confirmations FOR INSERT WITH CHECK (user_id = auth.uid());

-- Repair tasks
CREATE POLICY "Service providers can view their tasks" ON public.repair_tasks FOR SELECT USING (service_provider_id = auth.uid());
CREATE POLICY "IT staff can view all repair tasks" ON public.repair_tasks FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role::text IN (
    'admin', 'it_head', 'regional_it_head', 'it_staff', 'it_store_head'
  ))
);
CREATE POLICY "IT staff can manage repair tasks" ON public.repair_tasks FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role::text IN (
    'admin', 'it_head', 'regional_it_head', 'it_staff'
  ))
);

-- Stock transactions: viewable by IT staff
CREATE POLICY "IT staff can view stock transactions" ON public.stock_transactions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role::text IN (
    'admin', 'it_head', 'regional_it_head', 'it_staff', 'it_store_head'
  ))
);

-- Stock allocations - Location-based visibility
-- Users can see allocations meant for them
CREATE POLICY "Users can view own allocations" ON public.stock_allocations FOR SELECT USING (
  target_user_id = auth.uid()
);
-- Admin/IT Head/Store Head can see all allocations
CREATE POLICY "Admin can view all allocations" ON public.stock_allocations FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role::text IN (
    'admin', 'it_head', 'it_store_head'
  ))
);
-- Regional IT Head can see allocations for their region
CREATE POLICY "Regional IT heads can view region allocations" ON public.stock_allocations FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() 
    AND p.role::text = 'regional_it_head'
    AND (p.region_id = target_region_id OR p.location = target_name)
  )
);
-- IT Staff can see allocations for their location
CREATE POLICY "IT staff can view location allocations" ON public.stock_allocations FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() 
    AND p.role::text = 'it_staff'
    AND p.location = target_name
  )
);

CREATE POLICY "IT staff can manage allocations" ON public.stock_allocations FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role::text IN (
    'admin', 'it_head', 'it_store_head'
  ))
);

-- Allocation items
CREATE POLICY "IT staff can view allocation items" ON public.allocation_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role::text IN (
    'admin', 'it_head', 'regional_it_head', 'it_staff', 'it_store_head'
  ))
);

-- Requisition items - Location-based visibility (matches requisition access)
CREATE POLICY "Users can view requisition items" ON public.requisition_items FOR SELECT USING (
  -- User can see items for their own requisitions
  EXISTS (SELECT 1 FROM public.requisitions WHERE id = requisition_id AND requester_id = auth.uid())
  -- Admin/IT Head/Store Head can see all
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role::text IN ('admin', 'it_head', 'it_store_head'))
  -- Regional IT Head can see items for their region's requisitions
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.requisitions r ON r.id = requisition_id
    WHERE p.id = auth.uid() 
    AND p.role::text = 'regional_it_head'
    AND (p.region_id = r.region_id OR p.location = r.location_name)
  )
  -- IT Staff can see items for their location's requisitions
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.requisitions r ON r.id = requisition_id
    WHERE p.id = auth.uid() 
    AND p.role::text = 'it_staff'
    AND p.location = r.location_name
  )
);

-- Requisition approvals - Location-based visibility (matches requisition access)
CREATE POLICY "Users can view requisition approvals" ON public.requisition_approvals FOR SELECT USING (
  -- User can see approvals for their own requisitions
  EXISTS (SELECT 1 FROM public.requisitions WHERE id = requisition_id AND requester_id = auth.uid())
  -- Admin/IT Head/Store Head can see all
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role::text IN ('admin', 'it_head', 'it_store_head'))
  -- Regional IT Head can see approvals for their region's requisitions
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.requisitions r ON r.id = requisition_id
    WHERE p.id = auth.uid() 
    AND p.role::text = 'regional_it_head'
    AND (p.region_id = r.region_id OR p.location = r.location_name)
  )
  -- IT Staff can see approvals for their location's requisitions
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.requisitions r ON r.id = requisition_id
    WHERE p.id = auth.uid() 
    AND p.role::text = 'it_staff'
    AND p.location = r.location_name
  )
);

-- Toner usage
CREATE POLICY "IT staff can view toner usage" ON public.toner_usage FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role::text IN (
    'admin', 'it_head', 'regional_it_head', 'it_staff', 'it_store_head'
  ))
);

-- Service ticket updates
CREATE POLICY "Users can view service ticket updates" ON public.service_ticket_updates FOR SELECT USING (true);
CREATE POLICY "IT staff can insert service ticket updates" ON public.service_ticket_updates FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role::text IN (
    'admin', 'it_head', 'regional_it_head', 'it_staff', 'it_store_head',
    'service_desk_accra', 'service_desk_kumasi', 'service_desk_takoradi',
    'service_desk_tema', 'service_desk_sunyani', 'service_desk_cape_coast'
  ))
);

-- Requisition items: insert and update
CREATE POLICY "Users can insert requisition items" ON public.requisition_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.requisitions WHERE id = requisition_id AND requester_id = auth.uid())
);
CREATE POLICY "Managers can update requisition items" ON public.requisition_items FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role::text IN ('admin', 'it_head', 'regional_it_head', 'it_store_head'))
);

-- Requisition approvals: insert by managers
CREATE POLICY "Managers can insert requisition approvals" ON public.requisition_approvals FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role::text IN ('admin', 'it_head', 'regional_it_head', 'it_store_head'))
);

-- Stock allocations: insert
CREATE POLICY "IT staff can insert allocations" ON public.stock_allocations FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role::text IN (
    'admin', 'it_head', 'it_store_head'
  ))
);

-- Allocation items: insert and update
CREATE POLICY "IT staff can insert allocation items" ON public.allocation_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role::text IN (
    'admin', 'it_head', 'it_store_head'
  ))
);
CREATE POLICY "IT staff can update allocation items" ON public.allocation_items FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role::text IN (
    'admin', 'it_head', 'it_store_head'
  ))
);

-- Stock transactions: insert by system/IT staff
CREATE POLICY "IT staff can insert stock transactions" ON public.stock_transactions FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role::text IN (
    'admin', 'it_head', 'it_store_head'
  ))
);

-- Toner usage: insert and update by IT staff
CREATE POLICY "IT staff can insert toner usage" ON public.toner_usage FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role::text IN (
    'admin', 'it_head', 'regional_it_head', 'it_staff', 'it_store_head'
  ))
);
CREATE POLICY "IT staff can update toner usage" ON public.toner_usage FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role::text IN (
    'admin', 'it_head', 'regional_it_head', 'it_staff', 'it_store_head'
  ))
);

-- Notifications: system can insert for any user
CREATE POLICY "System can insert notifications" ON public.notifications FOR INSERT WITH CHECK (true);

-- ============================================
-- PART 15: INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_requisitions_status ON public.requisitions(status);
CREATE INDEX IF NOT EXISTS idx_requisitions_requester ON public.requisitions(requester_id);
CREATE INDEX IF NOT EXISTS idx_requisitions_location ON public.requisitions(location_id);
CREATE INDEX IF NOT EXISTS idx_allocations_status ON public.stock_allocations(status);
CREATE INDEX IF NOT EXISTS idx_allocations_source ON public.stock_allocations(source_location_id);
CREATE INDEX IF NOT EXISTS idx_allocations_target ON public.stock_allocations(target_location_id);
CREATE INDEX IF NOT EXISTS idx_stock_transactions_item ON public.stock_transactions(item_id);
CREATE INDEX IF NOT EXISTS idx_stock_transactions_type ON public.stock_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_stock_transactions_date ON public.stock_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_pdf_uploads_type ON public.pdf_uploads(document_type);
CREATE INDEX IF NOT EXISTS idx_pdf_confirmations_pdf ON public.pdf_confirmations(pdf_id);

-- ============================================
-- PART 15.5: STOCK VALIDATION CONSTRAINT
-- ============================================

-- Add check constraint to prevent negative stock
DO $$ BEGIN
  ALTER TABLE public.store_items ADD CONSTRAINT chk_quantity_non_negative CHECK (quantity >= 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.store_items ADD CONSTRAINT chk_quantity_in_stock_non_negative CHECK (quantity_in_stock >= 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- PART 16: SERVICE TICKET ENHANCEMENTS
-- ============================================

-- Function to generate service ticket number
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  year_prefix TEXT;
  seq_num INTEGER;
BEGIN
  year_prefix := 'TKT' || TO_CHAR(NOW(), 'YYYY');
  SELECT COALESCE(MAX(CAST(SUBSTRING(ticket_number FROM 8) AS INTEGER)), 0) + 1
  INTO seq_num
  FROM public.service_tickets
  WHERE ticket_number LIKE year_prefix || '%';
  
  new_number := year_prefix || LPAD(seq_num::TEXT, 6, '0');
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate ticket number
CREATE OR REPLACE FUNCTION set_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.ticket_number IS NULL OR NEW.ticket_number = '' THEN
    NEW.ticket_number := generate_ticket_number();
  END IF;
  -- Set SLA due date based on priority (if not already set)
  IF NEW.sla_due_date IS NULL THEN
    CASE NEW.priority
      WHEN 'urgent' THEN NEW.sla_due_date := NOW() + INTERVAL '4 hours';
      WHEN 'high' THEN NEW.sla_due_date := NOW() + INTERVAL '8 hours';
      WHEN 'medium' THEN NEW.sla_due_date := NOW() + INTERVAL '24 hours';
      ELSE NEW.sla_due_date := NOW() + INTERVAL '48 hours';
    END CASE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger only if service_tickets table exists
DO $$ BEGIN
  DROP TRIGGER IF EXISTS trg_set_ticket_number ON public.service_tickets;
  CREATE TRIGGER trg_set_ticket_number
    BEFORE INSERT ON public.service_tickets
    FOR EACH ROW
    EXECUTE FUNCTION set_ticket_number();
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- ============================================
-- PART 17: HELPER VIEWS FOR REPORTING
-- ============================================

-- View: Requisitions with approval status summary
CREATE OR REPLACE VIEW public.v_requisitions_summary AS
SELECT 
  r.*,
  p.full_name as requester_full_name,
  p.email as requester_email,
  reg.name as region_name,
  d.name as district_name,
  loc.name as loc_name,
  (SELECT COUNT(*) FROM public.requisition_items WHERE requisition_id = r.id) as item_count,
  (SELECT SUM(requested_qty) FROM public.requisition_items WHERE requisition_id = r.id) as total_qty_requested,
  (SELECT SUM(fulfilled_qty) FROM public.requisition_items WHERE requisition_id = r.id) as total_qty_fulfilled
FROM public.requisitions r
LEFT JOIN public.profiles p ON r.requester_id = p.id
LEFT JOIN public.regions reg ON r.region_id = reg.id
LEFT JOIN public.districts d ON r.district_id = d.id
LEFT JOIN public.locations loc ON r.location_id = loc.id;

-- View: Allocations with details
CREATE OR REPLACE VIEW public.v_allocations_summary AS
SELECT 
  a.*,
  reg.name as target_region_name,
  d.name as target_district_name,
  loc.name as target_loc_name,
  (SELECT COUNT(*) FROM public.allocation_items WHERE allocation_id = a.id) as item_count,
  (SELECT SUM(allocated_qty) FROM public.allocation_items WHERE allocation_id = a.id) as total_qty_allocated,
  (SELECT SUM(received_qty) FROM public.allocation_items WHERE allocation_id = a.id) as total_qty_received
FROM public.stock_allocations a
LEFT JOIN public.regions reg ON a.target_region_id = reg.id
LEFT JOIN public.districts d ON a.target_district_id = d.id
LEFT JOIN public.locations loc ON a.target_location_id = loc.id;

-- View: Stock transactions summary
CREATE OR REPLACE VIEW public.v_stock_transactions_summary AS
SELECT 
  st.*,
  si.name as item_full_name,
  si.category as item_category,
  si.quantity_in_stock as current_stock
FROM public.stock_transactions st
LEFT JOIN public.store_items si ON st.item_id = si.id;

-- ============================================
-- PART 18: CONFIRMATION RECEIPT FUNCTION
-- ============================================

-- Function to confirm receipt of allocation
CREATE OR REPLACE FUNCTION confirm_allocation_receipt(
  p_allocation_id UUID,
  p_confirmer_id UUID,
  p_confirmer_name TEXT,
  p_comments TEXT DEFAULT NULL,
  p_attachments TEXT[] DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_allocation RECORD;
  v_item RECORD;
BEGIN
  -- Get allocation
  SELECT * INTO v_allocation FROM public.stock_allocations WHERE id = p_allocation_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Allocation not found');
  END IF;
  
  IF v_allocation.status = 'confirmed' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Allocation already confirmed');
  END IF;
  
  -- Update allocation status
  UPDATE public.stock_allocations
  SET 
    status = 'confirmed',
    confirmed_at = NOW(),
    confirmed_by = p_confirmer_id,
    confirmed_by_name = p_confirmer_name,
    confirmation_comments = p_comments,
    confirmation_attachments = p_attachments,
    updated_at = NOW()
  WHERE id = p_allocation_id;
  
  -- Update received quantities to match allocated
  UPDATE public.allocation_items
  SET received_qty = allocated_qty
  WHERE allocation_id = p_allocation_id;
  
  -- Record receipt confirmation transactions
  FOR v_item IN 
    SELECT ai.*, si.quantity_in_stock 
    FROM public.allocation_items ai
    LEFT JOIN public.store_items si ON ai.item_id = si.id
    WHERE ai.allocation_id = p_allocation_id
  LOOP
    INSERT INTO public.stock_transactions (
      transaction_number,
      transaction_type,
      item_id,
      item_name,
      location_id,
      location_name,
      quantity,
      reference_type,
      reference_id,
      reference_number,
      performed_by,
      performed_by_name,
      notes
    ) VALUES (
      generate_transaction_number(),
      'receipt_confirmed',
      v_item.item_id,
      v_item.item_name,
      v_allocation.target_location_id,
      v_allocation.target_name,
      v_item.allocated_qty,
      'allocation',
      p_allocation_id,
      v_allocation.allocation_number,
      p_confirmer_id,
      p_confirmer_name,
      'Receipt confirmed by ' || p_confirmer_name
    );
  END LOOP;
  
  RETURN jsonb_build_object('success', true, 'message', 'Allocation receipt confirmed');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PART 19: REQUISITION WORKFLOW FUNCTIONS
-- ============================================

-- Function to submit requisition for approval
CREATE OR REPLACE FUNCTION submit_requisition(
  p_requisition_id UUID,
  p_submitter_id UUID,
  p_submitter_name TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_requisition RECORD;
BEGIN
  SELECT * INTO v_requisition FROM public.requisitions WHERE id = p_requisition_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Requisition not found');
  END IF;
  
  IF v_requisition.status != 'draft' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Only draft requisitions can be submitted');
  END IF;
  
  -- Update requisition
  UPDATE public.requisitions
  SET 
    status = 'submitted',
    submitted_at = NOW(),
    submitted_by = p_submitter_id,
    updated_at = NOW()
  WHERE id = p_requisition_id;
  
  -- Record approval history
  INSERT INTO public.requisition_approvals (requisition_id, action, performed_by, performed_by_name, performed_by_role, comments)
  SELECT p_requisition_id, 'submitted', p_submitter_id, p_submitter_name, v_requisition.requester_role, 'Requisition submitted for approval';
  
  RETURN jsonb_build_object('success', true, 'message', 'Requisition submitted for approval');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to approve requisition
CREATE OR REPLACE FUNCTION approve_requisition(
  p_requisition_id UUID,
  p_approver_id UUID,
  p_approver_name TEXT,
  p_approver_role TEXT,
  p_comments TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_requisition RECORD;
BEGIN
  SELECT * INTO v_requisition FROM public.requisitions WHERE id = p_requisition_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Requisition not found');
  END IF;
  
  IF v_requisition.status NOT IN ('submitted', 'pending_approval') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Requisition is not pending approval');
  END IF;
  
  -- Update requisition
  UPDATE public.requisitions
  SET 
    status = 'approved',
    approved_at = NOW(),
    approved_by = p_approver_id,
    approval_comments = p_comments,
    updated_at = NOW()
  WHERE id = p_requisition_id;
  
  -- Set approved_qty to requested_qty for all items
  UPDATE public.requisition_items
  SET approved_qty = requested_qty, updated_at = NOW()
  WHERE requisition_id = p_requisition_id;
  
  -- Record approval history
  INSERT INTO public.requisition_approvals (requisition_id, action, performed_by, performed_by_name, performed_by_role, comments)
  VALUES (p_requisition_id, 'approved', p_approver_id, p_approver_name, p_approver_role, COALESCE(p_comments, 'Requisition approved'));
  
  RETURN jsonb_build_object('success', true, 'message', 'Requisition approved');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reject requisition
CREATE OR REPLACE FUNCTION reject_requisition(
  p_requisition_id UUID,
  p_rejector_id UUID,
  p_rejector_name TEXT,
  p_rejector_role TEXT,
  p_reason TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_requisition RECORD;
BEGIN
  SELECT * INTO v_requisition FROM public.requisitions WHERE id = p_requisition_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Requisition not found');
  END IF;
  
  IF v_requisition.status NOT IN ('submitted', 'pending_approval') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Requisition is not pending approval');
  END IF;
  
  -- Update requisition
  UPDATE public.requisitions
  SET 
    status = 'rejected',
    rejected_at = NOW(),
    rejected_by = p_rejector_id,
    rejection_reason = p_reason,
    updated_at = NOW()
  WHERE id = p_requisition_id;
  
  -- Record approval history
  INSERT INTO public.requisition_approvals (requisition_id, action, performed_by, performed_by_name, performed_by_role, comments)
  VALUES (p_requisition_id, 'rejected', p_rejector_id, p_rejector_name, p_rejector_role, p_reason);
  
  RETURN jsonb_build_object('success', true, 'message', 'Requisition rejected');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to fulfill requisition (creates allocation and deducts stock)
CREATE OR REPLACE FUNCTION fulfill_requisition(
  p_requisition_id UUID,
  p_fulfiller_id UUID,
  p_fulfiller_name TEXT,
  p_source_location_id UUID,
  p_source_location_name TEXT,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_requisition RECORD;
  v_allocation_id UUID;
  v_item RECORD;
  v_available_qty INTEGER;
  v_fulfill_qty INTEGER;
  v_all_fulfilled BOOLEAN := true;
BEGIN
  SELECT * INTO v_requisition FROM public.requisitions WHERE id = p_requisition_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Requisition not found');
  END IF;
  
  IF v_requisition.status NOT IN ('approved', 'partially_fulfilled') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Requisition must be approved before fulfillment');
  END IF;
  
  -- Create allocation record
  v_allocation_id := gen_random_uuid();
  INSERT INTO public.stock_allocations (
    id,
    requisition_id,
    source_location_id,
    source_location_name,
    target_type,
    target_region_id,
    target_location_id,
    target_user_id,
    target_name,
    status,
    allocated_by,
    allocated_by_name,
    allocated_at,
    notes
  ) VALUES (
    v_allocation_id,
    p_requisition_id,
    p_source_location_id,
    p_source_location_name,
    CASE 
      WHEN v_requisition.requester_id IS NOT NULL THEN 'user'
      WHEN v_requisition.location_id IS NOT NULL THEN 'location'
      ELSE 'region'
    END,
    v_requisition.region_id,
    v_requisition.location_id,
    v_requisition.requester_id,
    COALESCE(v_requisition.location_name, v_requisition.requester_name),
    'allocated', -- This triggers stock deduction via trigger
    p_fulfiller_id,
    p_fulfiller_name,
    NOW(),
    p_notes
  );
  
  -- Process each requisition item
  FOR v_item IN 
    SELECT ri.*, si.quantity_in_stock 
    FROM public.requisition_items ri
    LEFT JOIN public.store_items si ON ri.item_id = si.id
    WHERE ri.requisition_id = p_requisition_id
      AND ri.fulfilled_qty < COALESCE(ri.approved_qty, ri.requested_qty)
  LOOP
    -- Get available quantity
    v_available_qty := COALESCE(v_item.quantity_in_stock, 0);
    
    -- Calculate fulfill quantity (min of available and remaining needed)
    v_fulfill_qty := LEAST(
      v_available_qty,
      COALESCE(v_item.approved_qty, v_item.requested_qty) - v_item.fulfilled_qty
    );
    
    IF v_fulfill_qty > 0 THEN
      -- Create allocation item
      INSERT INTO public.allocation_items (
        allocation_id,
        item_id,
        item_name,
        item_category,
        allocated_qty,
        unit,
        notes
      ) VALUES (
        v_allocation_id,
        v_item.item_id,
        v_item.item_name,
        v_item.item_category,
        v_fulfill_qty,
        v_item.unit,
        v_item.notes
      );
      
      -- Update requisition item fulfilled qty
      UPDATE public.requisition_items
      SET fulfilled_qty = fulfilled_qty + v_fulfill_qty, updated_at = NOW()
      WHERE id = v_item.id;
    END IF;
    
    -- Check if fully fulfilled
    IF v_fulfill_qty < (COALESCE(v_item.approved_qty, v_item.requested_qty) - v_item.fulfilled_qty) THEN
      v_all_fulfilled := false;
    END IF;
  END LOOP;
  
  -- Update requisition status
  UPDATE public.requisitions
  SET 
    status = CASE WHEN v_all_fulfilled THEN 'fulfilled' ELSE 'partially_fulfilled' END,
    fulfilled_at = CASE WHEN v_all_fulfilled THEN NOW() ELSE fulfilled_at END,
    fulfilled_by = CASE WHEN v_all_fulfilled THEN p_fulfiller_id ELSE fulfilled_by END,
    updated_at = NOW()
  WHERE id = p_requisition_id;
  
  -- Record approval history
  INSERT INTO public.requisition_approvals (requisition_id, action, performed_by, performed_by_name, performed_by_role, comments)
  VALUES (
    p_requisition_id, 
    CASE WHEN v_all_fulfilled THEN 'fulfilled' ELSE 'partially_fulfilled' END,
    p_fulfiller_id, 
    p_fulfiller_name, 
    'it_store_head', 
    COALESCE(p_notes, CASE WHEN v_all_fulfilled THEN 'Requisition fully fulfilled' ELSE 'Requisition partially fulfilled' END)
  );
  
  RETURN jsonb_build_object(
    'success', true, 
    'message', CASE WHEN v_all_fulfilled THEN 'Requisition fully fulfilled' ELSE 'Requisition partially fulfilled' END,
    'allocation_id', v_allocation_id,
    'fully_fulfilled', v_all_fulfilled
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to close requisition
CREATE OR REPLACE FUNCTION close_requisition(
  p_requisition_id UUID,
  p_closer_id UUID,
  p_closer_name TEXT,
  p_comments TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_requisition RECORD;
BEGIN
  SELECT * INTO v_requisition FROM public.requisitions WHERE id = p_requisition_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Requisition not found');
  END IF;
  
  IF v_requisition.status NOT IN ('fulfilled', 'partially_fulfilled', 'rejected') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Only fulfilled or rejected requisitions can be closed');
  END IF;
  
  -- Update requisition
  UPDATE public.requisitions
  SET 
    status = 'closed',
    closed_at = NOW(),
    closed_by = p_closer_id,
    updated_at = NOW()
  WHERE id = p_requisition_id;
  
  -- Record approval history
  INSERT INTO public.requisition_approvals (requisition_id, action, performed_by, performed_by_name, performed_by_role, comments)
  VALUES (p_requisition_id, 'closed', p_closer_id, p_closer_name, 'admin', COALESCE(p_comments, 'Requisition closed'));
  
  RETURN jsonb_build_object('success', true, 'message', 'Requisition closed');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION confirm_allocation_receipt TO authenticated;
GRANT EXECUTE ON FUNCTION submit_requisition TO authenticated;
GRANT EXECUTE ON FUNCTION approve_requisition TO authenticated;
GRANT EXECUTE ON FUNCTION reject_requisition TO authenticated;
GRANT EXECUTE ON FUNCTION fulfill_requisition TO authenticated;
GRANT EXECUTE ON FUNCTION close_requisition TO authenticated;

-- ============================================
-- PART 20: STOCK VALIDATION FUNCTION
-- ============================================

-- Function to check stock availability before allocation
CREATE OR REPLACE FUNCTION check_stock_availability(p_item_id UUID, p_requested_qty INTEGER)
RETURNS JSONB AS $$
DECLARE
  v_item RECORD;
BEGIN
  SELECT * INTO v_item FROM public.store_items WHERE id = p_item_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('available', false, 'error', 'Item not found', 'requested', p_requested_qty);
  END IF;
  
  IF v_item.quantity_in_stock >= p_requested_qty THEN
    RETURN jsonb_build_object(
      'available', true, 
      'item_name', v_item.name,
      'in_stock', v_item.quantity_in_stock,
      'requested', p_requested_qty,
      'remaining_after', v_item.quantity_in_stock - p_requested_qty
    );
  ELSE
    RETURN jsonb_build_object(
      'available', false, 
      'error', 'Insufficient stock',
      'item_name', v_item.name,
      'in_stock', v_item.quantity_in_stock,
      'requested', p_requested_qty,
      'shortage', p_requested_qty - v_item.quantity_in_stock
    );
  END IF;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION check_stock_availability TO authenticated;

-- ============================================
-- PART 21: NOTIFICATION HELPER FUNCTION
-- ============================================

-- Function to create notification for a user
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_title TEXT,
  p_message TEXT,
  p_type TEXT,
  p_category TEXT DEFAULT NULL,
  p_reference_type TEXT DEFAULT NULL,
  p_reference_id UUID DEFAULT NULL,
  p_reference_url TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO public.notifications (
    user_id, title, message, type, category, reference_type, reference_id, reference_url
  ) VALUES (
    p_user_id, p_title, p_message, p_type, p_category, p_reference_type, p_reference_id, p_reference_url
  )
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION create_notification TO authenticated;

-- ============================================
-- PART 22: FIX SERVICE_PROVIDERS RLS POLICY
-- ============================================

-- Drop existing policies on service_providers
DROP POLICY IF EXISTS "IT staff can view service providers" ON public.service_providers;
DROP POLICY IF EXISTS "Admins can manage service providers" ON public.service_providers;
DROP POLICY IF EXISTS "All IT roles can view service providers" ON public.service_providers;
DROP POLICY IF EXISTS "IT managers can manage service providers" ON public.service_providers;

-- Create updated policies with proper role access (using ::text cast)
CREATE POLICY "All IT roles can view service providers" ON public.service_providers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role::text IN (
        'admin', 'it_head', 'it_staff', 'it_store_head', 'regional_it_head',
        'service_desk_accra', 'service_desk_kumasi', 'service_desk_takoradi',
        'service_desk_tema', 'service_desk_sunyani', 'service_desk_cape_coast'
      )
    )
  );

CREATE POLICY "IT managers can manage service providers" ON public.service_providers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role::text IN ('admin', 'it_head')
    )
  );
