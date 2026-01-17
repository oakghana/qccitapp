-- ============================================
-- COMPREHENSIVE DATABASE UPDATE SCRIPT
-- This script updates the schema for:
-- 1. Extended user roles (including regional service desk roles)
-- 2. Self-registration with default password
-- 3. Requisition workflow
-- 4. Allocation & stock transactions
-- 5. Enhanced device/toner tracking
-- 6. Service desk improvements
-- ============================================

-- ============================================
-- PART 1: UPDATE USER_ROLE ENUM
-- ============================================

-- Add new role values to user_role enum
DO $$ BEGIN
  -- Add regional_it_head if not exists
  ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'regional_it_head';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'staff';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'service_desk_accra';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'service_desk_kumasi';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'service_desk_takoradi';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'service_desk_tema';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'service_desk_sunyani';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'service_desk_cape_coast';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- PART 2: UPDATE PROFILES TABLE FOR SELF-REGISTRATION
-- ============================================

-- Add new columns to profiles table if they don't exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT true;
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
-- PART 3: CREATE REGIONS AND DISTRICTS TABLES
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
-- PART 4: REQUISITION WORKFLOW TABLES
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
  priority priority_level DEFAULT 'medium',
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
-- PART 5: ALLOCATION & STOCK TRANSACTION TABLES
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
-- PART 6: ENHANCED DEVICES TABLE
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
-- PART 7: TONER TRACKING TABLE
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
-- PART 8: ENHANCED SERVICE TICKETS
-- ============================================

-- Create enhanced ticket status enum
DO $$ BEGIN
  CREATE TYPE service_ticket_status AS ENUM (
    'new',
    'in_triage',
    'assigned',
    'in_progress',
    'in_repair',
    'awaiting_parts',
    'ready_for_pickup',
    'on_hold',
    'resolved',
    'closed',
    'reopened',
    'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Add new columns to service_tickets if table exists
DO $$ BEGIN
  ALTER TABLE public.service_tickets ADD COLUMN IF NOT EXISTS ticket_number TEXT;
  ALTER TABLE public.service_tickets ADD COLUMN IF NOT EXISTS region_id UUID REFERENCES public.regions(id) ON DELETE SET NULL;
  ALTER TABLE public.service_tickets ADD COLUMN IF NOT EXISTS district_id UUID REFERENCES public.districts(id) ON DELETE SET NULL;
  ALTER TABLE public.service_tickets ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL;
  ALTER TABLE public.service_tickets ADD COLUMN IF NOT EXISTS device_id UUID REFERENCES public.devices(id) ON DELETE SET NULL;
  ALTER TABLE public.service_tickets ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
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
-- PART 9: NOTIFICATIONS TABLE
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
-- PART 10: PDF UPLOADS TABLE (for IT Documents)
-- ============================================

-- Create PDF document types enum
DO $$ BEGIN
  CREATE TYPE pdf_document_type AS ENUM ('toner', 'quarterly_report', 'information');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- PDF uploads table
CREATE TABLE IF NOT EXISTS public.pdf_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  document_type pdf_document_type NOT NULL,
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

-- Function to record stock transaction on allocation
CREATE OR REPLACE FUNCTION record_allocation_transaction()
RETURNS TRIGGER AS $$
DECLARE
  item_record RECORD;
BEGIN
  -- When allocation status changes to 'allocated', create transaction
  IF NEW.status = 'allocated' AND (OLD.status IS NULL OR OLD.status != 'allocated') THEN
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

-- Create trigger for allocation transactions
DROP TRIGGER IF EXISTS trg_record_allocation_transaction ON public.stock_allocations;
CREATE TRIGGER trg_record_allocation_transaction
  AFTER UPDATE ON public.stock_allocations
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

-- Basic RLS policies (allow authenticated users to read, admins to write)
-- These should be refined based on actual security requirements

CREATE POLICY "Authenticated users can view regions" ON public.regions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can view districts" ON public.districts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can view locations" ON public.locations FOR SELECT TO authenticated USING (true);

-- Requisitions: users can see their own, managers can see their region's
CREATE POLICY "Users can view own requisitions" ON public.requisitions FOR SELECT USING (requester_id = auth.uid());
CREATE POLICY "Managers can view requisitions" ON public.requisitions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'it_head', 'regional_it_head', 'it_store_head'))
);

-- Notifications: users can only see their own
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (user_id = auth.uid());

-- PDF uploads: viewable by IT staff
CREATE POLICY "IT staff can view PDF uploads" ON public.pdf_uploads FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN (
    'admin', 'it_head', 'regional_it_head', 'it_staff', 'it_store_head',
    'service_desk_accra', 'service_desk_kumasi', 'service_desk_takoradi',
    'service_desk_tema', 'service_desk_sunyani', 'service_desk_cape_coast'
  ))
);

-- ============================================
-- INDEXES FOR PERFORMANCE
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

COMMIT;
