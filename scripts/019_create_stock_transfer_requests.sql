-- ============================================
-- CREATE STOCK TRANSFER REQUESTS TABLE
-- This table tracks requests from Regional IT Heads
-- to transfer stock from Central Stores to their location
-- ============================================

-- Create the stock transfer requests table
CREATE TABLE IF NOT EXISTS public.stock_transfer_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    request_number VARCHAR(50) UNIQUE NOT NULL,
    item_id UUID NOT NULL REFERENCES public.store_items(id),
    item_name VARCHAR(255) NOT NULL,
    item_code VARCHAR(100),
    central_stock_available INTEGER NOT NULL DEFAULT 0,
    requested_quantity INTEGER NOT NULL,
    approved_quantity INTEGER,
    requested_by VARCHAR(255) NOT NULL,
    requesting_location VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
    notes TEXT,
    approved_by VARCHAR(255),
    approved_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_stock_transfer_requests_status ON public.stock_transfer_requests(status);
CREATE INDEX IF NOT EXISTS idx_stock_transfer_requests_location ON public.stock_transfer_requests(requesting_location);
CREATE INDEX IF NOT EXISTS idx_stock_transfer_requests_item ON public.stock_transfer_requests(item_id);
CREATE INDEX IF NOT EXISTS idx_stock_transfer_requests_created ON public.stock_transfer_requests(created_at DESC);

-- Disable RLS (since we're using service role key)
ALTER TABLE public.stock_transfer_requests DISABLE ROW LEVEL SECURITY;

-- Grant access
GRANT ALL ON public.stock_transfer_requests TO authenticated;
GRANT ALL ON public.stock_transfer_requests TO service_role;

-- Add comment
COMMENT ON TABLE public.stock_transfer_requests IS 'Tracks stock transfer requests from Regional IT Heads to Central Stores';

SELECT 'Stock transfer requests table created successfully!' AS status;
