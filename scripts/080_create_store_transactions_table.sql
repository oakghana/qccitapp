-- Create store transactions audit table
CREATE TABLE IF NOT EXISTS public.store_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID REFERENCES store_items(id) ON DELETE SET NULL,
  item_name TEXT NOT NULL,
  transaction_type VARCHAR(50) NOT NULL, -- addition, reduction, assignment, return, adjustment
  quantity INTEGER NOT NULL,
  unit VARCHAR(20) DEFAULT 'pcs',
  location_name VARCHAR(255),
  reference_type VARCHAR(50), -- stock_addition, requisition, assignment, transfer, etc
  reference_number VARCHAR(100),
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_store_transactions_item_id ON store_transactions(item_id);
CREATE INDEX IF NOT EXISTS idx_store_transactions_created_at ON store_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_store_transactions_location_name ON store_transactions(location_name);
CREATE INDEX IF NOT EXISTS idx_store_transactions_transaction_type ON store_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_store_transactions_reference_number ON store_transactions(reference_number);

-- Enable RLS
ALTER TABLE public.store_transactions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow viewing for authenticated users
CREATE POLICY "Enable read access for authenticated users" ON public.store_transactions
  FOR SELECT USING (auth.role() = 'authenticated');

-- Create policy to allow inserts for admin and it_store_head
CREATE POLICY "Enable insert for admin and it_store_head" ON public.store_transactions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'it_store_head')
    )
  );

-- Grant permissions
GRANT SELECT ON public.store_transactions TO authenticated;
GRANT INSERT ON public.store_transactions TO authenticated;
