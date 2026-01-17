-- ============================================
-- CREATE REPAIR INVOICES TABLE
-- This script creates the repair_invoices table
-- for service providers to upload invoices
-- ============================================

-- Create repair_invoices table
CREATE TABLE IF NOT EXISTS public.repair_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repair_id UUID REFERENCES public.repair_requests(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL,
  invoice_date DATE DEFAULT CURRENT_DATE,
  service_provider_id UUID REFERENCES public.service_providers(id) ON DELETE SET NULL,
  service_provider_name TEXT,
  
  -- Invoice amounts
  labor_cost DECIMAL(12,2) DEFAULT 0,
  parts_cost DECIMAL(12,2) DEFAULT 0,
  other_charges DECIMAL(12,2) DEFAULT 0,
  total_amount DECIMAL(12,2) NOT NULL,
  currency TEXT DEFAULT 'GHS',
  
  -- Invoice details
  description TEXT,
  parts_used TEXT[],
  labor_hours DECIMAL(6,2),
  
  -- File storage
  file_url TEXT,
  file_name TEXT,
  file_type TEXT,
  file_size INTEGER,
  
  -- Status tracking
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'paid')),
  approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  approval_notes TEXT,
  
  -- Metadata
  uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  uploaded_by_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_repair_invoices_repair_id ON public.repair_invoices(repair_id);
CREATE INDEX IF NOT EXISTS idx_repair_invoices_provider_id ON public.repair_invoices(service_provider_id);
CREATE INDEX IF NOT EXISTS idx_repair_invoices_status ON public.repair_invoices(status);

-- Disable RLS (since we're using service role key for API)
ALTER TABLE public.repair_invoices DISABLE ROW LEVEL SECURITY;

-- Add invoice columns to repair_requests if not exists
ALTER TABLE public.repair_requests ADD COLUMN IF NOT EXISTS task_number TEXT;
ALTER TABLE public.repair_requests ADD COLUMN IF NOT EXISTS service_provider_id UUID REFERENCES public.service_providers(id) ON DELETE SET NULL;
ALTER TABLE public.repair_requests ADD COLUMN IF NOT EXISTS issue_description TEXT;
ALTER TABLE public.repair_requests ADD COLUMN IF NOT EXISTS estimated_cost DECIMAL(12,2);
ALTER TABLE public.repair_requests ADD COLUMN IF NOT EXISTS actual_cost DECIMAL(12,2);
ALTER TABLE public.repair_requests ADD COLUMN IF NOT EXISTS invoice_id UUID REFERENCES public.repair_invoices(id) ON DELETE SET NULL;
ALTER TABLE public.repair_requests ADD COLUMN IF NOT EXISTS has_invoice BOOLEAN DEFAULT false;
ALTER TABLE public.repair_requests ADD COLUMN IF NOT EXISTS invoice_approved BOOLEAN DEFAULT false;

-- Grant permissions
GRANT ALL ON public.repair_invoices TO authenticated;
GRANT ALL ON public.repair_invoices TO service_role;

COMMENT ON TABLE public.repair_invoices IS 'Stores invoices uploaded by service providers for repair tasks';
