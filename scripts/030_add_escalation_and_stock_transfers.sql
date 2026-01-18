-- ============================================
-- ESCALATION AND STOCK TRANSFER SYSTEM
-- Add support for ticket escalation workflow
-- and automatic stock level updates
-- ============================================

-- Add escalation columns to service_tickets table
ALTER TABLE public.service_tickets ADD COLUMN IF NOT EXISTS escalation_level INT DEFAULT 0;
ALTER TABLE public.service_tickets ADD COLUMN IF NOT EXISTS escalated_to TEXT;
ALTER TABLE public.service_tickets ADD COLUMN IF NOT EXISTS escalation_reason TEXT;
ALTER TABLE public.service_tickets ADD COLUMN IF NOT EXISTS escalated_at TIMESTAMPTZ;
ALTER TABLE public.service_tickets ADD COLUMN IF NOT EXISTS escalated_by TEXT;
ALTER TABLE public.service_tickets ADD COLUMN IF NOT EXISTS escalation_form_url TEXT;

-- Create escalation_levels enum
DO $$ BEGIN
  CREATE TYPE escalation_level_enum AS ENUM ('level_0_staff', 'level_1_regional_head', 'level_2_it_head', 'level_3_service_provider');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Create escalation_history table to track escalation workflow
CREATE TABLE IF NOT EXISTS public.escalation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.service_tickets(id) ON DELETE CASCADE,
  escalation_level INT NOT NULL,
  escalated_from_role TEXT NOT NULL,
  escalated_to_role TEXT NOT NULL,
  escalated_by TEXT NOT NULL,
  escalated_to_user_id UUID,
  reason TEXT NOT NULL,
  request_form_url TEXT,
  device_location TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(ticket_id, escalation_level)
);

CREATE INDEX IF NOT EXISTS idx_escalation_history_ticket ON public.escalation_history(ticket_id);
CREATE INDEX IF NOT EXISTS idx_escalation_history_level ON public.escalation_history(escalation_level);

-- Update service_ticket_updates to support escalation
ALTER TABLE public.service_ticket_updates ADD COLUMN IF NOT EXISTS escalation_level INT;
ALTER TABLE public.service_ticket_updates ADD COLUMN IF NOT EXISTS escalation_reason TEXT;

-- Add auto stock adjustment columns to store_requisitions
ALTER TABLE public.store_requisitions ADD COLUMN IF NOT EXISTS auto_adjust_stock BOOLEAN DEFAULT true;
ALTER TABLE public.store_requisitions ADD COLUMN IF NOT EXISTS stock_adjustment_completed BOOLEAN DEFAULT false;
ALTER TABLE public.store_requisitions ADD COLUMN IF NOT EXISTS adjustment_notes TEXT;

-- Create stock_level_history table to track all stock movements
CREATE TABLE IF NOT EXISTS public.stock_level_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES public.store_items(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  from_quantity INT NOT NULL,
  to_quantity INT NOT NULL,
  quantity_change INT NOT NULL,
  from_location TEXT NOT NULL,
  to_location TEXT NOT NULL,
  transaction_type TEXT NOT NULL, -- 'requisition_allocated', 'requisition_fulfilled', 'adjustment', 'return'
  reference_id UUID, -- requisition_id or transfer_id
  reference_number TEXT,
  reason TEXT,
  handled_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stock_history_item ON public.stock_level_history(item_id);
CREATE INDEX IF NOT EXISTS idx_stock_history_location ON public.stock_level_history(from_location, to_location);
CREATE INDEX IF NOT EXISTS idx_stock_history_transaction ON public.stock_level_history(transaction_type);
CREATE INDEX IF NOT EXISTS idx_stock_history_date ON public.stock_level_history(created_at);

-- Create stock_transfer_approval table for regional to central requests
CREATE TABLE IF NOT EXISTS public.stock_transfer_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_location TEXT NOT NULL,
  from_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  from_user_name TEXT NOT NULL,
  to_location TEXT NOT NULL DEFAULT 'Head Office',
  items JSONB NOT NULL, -- Array of {item_id, item_name, requested_quantity}
  status TEXT DEFAULT 'pending', -- pending, approved, rejected, partially_approved
  approved_by_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  approved_by_name TEXT,
  approval_notes TEXT,
  approved_quantity JSONB, -- {item_id: approved_qty}
  rejection_reason TEXT,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stock_approvals_status ON public.stock_transfer_approvals(status);
CREATE INDEX IF NOT EXISTS idx_stock_approvals_location ON public.stock_transfer_approvals(from_location);

-- Add comment for the escalation system
COMMENT ON TABLE public.escalation_history IS 'Tracks ticket escalation workflow: Level 0 (IT Staff) -> Level 1 (Regional IT Head) -> Level 2 (IT Head) -> Level 3 (Service Provider)';
COMMENT ON TABLE public.stock_level_history IS 'Complete audit trail of all stock movements between locations and adjustments';
