-- ============================================
-- CREATE REGIONAL STOCK REQUISITIONS TABLE
-- This table tracks requests from Regional IT Heads
-- to requisition stock from Central Stores
-- ============================================

-- Create the regional stock requisitions table
CREATE TABLE IF NOT EXISTS public.regional_stock_requisitions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    requisition_number VARCHAR(50) UNIQUE NOT NULL,
    
    -- Item details
    item_id UUID NOT NULL REFERENCES public.store_items(id),
    item_name VARCHAR(255) NOT NULL,
    item_code VARCHAR(100),
    item_category VARCHAR(100),
    
    -- Stock information
    central_stock_available INTEGER NOT NULL DEFAULT 0,
    regional_stock_current INTEGER NOT NULL DEFAULT 0,
    requested_quantity INTEGER NOT NULL,
    approved_quantity INTEGER,
    
    -- Requester details
    requested_by VARCHAR(255) NOT NULL,
    requester_user_id UUID,
    requesting_location VARCHAR(255) NOT NULL,
    
    -- Status tracking
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled', 'fulfilled')),
    
    -- Approval details
    approved_by VARCHAR(255),
    approver_role VARCHAR(100),
    approved_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    
    -- Fulfillment details
    fulfilled_by VARCHAR(255),
    fulfilled_at TIMESTAMP WITH TIME ZONE,
    
    -- Notes and tracking
    justification TEXT,
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_regional_stock_req_status ON public.regional_stock_requisitions(status);
CREATE INDEX IF NOT EXISTS idx_regional_stock_req_location ON public.regional_stock_requisitions(requesting_location);
CREATE INDEX IF NOT EXISTS idx_regional_stock_req_item ON public.regional_stock_requisitions(item_id);
CREATE INDEX IF NOT EXISTS idx_regional_stock_req_created ON public.regional_stock_requisitions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_regional_stock_req_requester ON public.regional_stock_requisitions(requested_by);

-- Create table for tracking stock transfer transactions
CREATE TABLE IF NOT EXISTS public.stock_transfer_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    transaction_number VARCHAR(50) UNIQUE NOT NULL,
    requisition_id UUID REFERENCES public.regional_stock_requisitions(id),
    
    -- Item details
    item_id UUID NOT NULL REFERENCES public.store_items(id),
    item_name VARCHAR(255) NOT NULL,
    
    -- Transfer details
    from_location VARCHAR(255) NOT NULL DEFAULT 'Central Stores',
    to_location VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL,
    
    -- Stock levels before and after
    central_stock_before INTEGER NOT NULL,
    central_stock_after INTEGER NOT NULL,
    regional_stock_before INTEGER NOT NULL,
    regional_stock_after INTEGER NOT NULL,
    
    -- User tracking
    processed_by VARCHAR(255) NOT NULL,
    approved_by VARCHAR(255),
    
    -- Notes
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for transactions
CREATE INDEX IF NOT EXISTS idx_stock_transfer_trans_item ON public.stock_transfer_transactions(item_id);
CREATE INDEX IF NOT EXISTS idx_stock_transfer_trans_locations ON public.stock_transfer_transactions(from_location, to_location);
CREATE INDEX IF NOT EXISTS idx_stock_transfer_trans_created ON public.stock_transfer_transactions(created_at DESC);

-- Disable RLS (since we're using service role key)
ALTER TABLE public.regional_stock_requisitions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_transfer_transactions DISABLE ROW LEVEL SECURITY;

-- Grant access
GRANT ALL ON public.regional_stock_requisitions TO authenticated;
GRANT ALL ON public.regional_stock_requisitions TO service_role;
GRANT ALL ON public.stock_transfer_transactions TO authenticated;
GRANT ALL ON public.stock_transfer_transactions TO service_role;

-- Add comments
COMMENT ON TABLE public.regional_stock_requisitions IS 'Tracks stock requisitions from Regional IT Heads requesting items from Central Stores';
COMMENT ON TABLE public.stock_transfer_transactions IS 'Audit trail of all stock transfers between Central Stores and regional locations';

SELECT 'Regional stock requisitions tables created successfully!' AS status;
