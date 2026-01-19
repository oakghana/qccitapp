-- Create stock_assignments table for tracking item assignments to users
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

ALTER TABLE public.stock_assignments ENABLE ROW LEVEL SECURITY;

-- Policy: IT staff can view assignments
CREATE POLICY "IT staff can view assignments" ON public.stock_assignments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'it_head', 'it_staff', 'it_store_head')
    )
  );

-- Policy: IT store head can manage assignments
CREATE POLICY "Store managers can manage assignments" ON public.stock_assignments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'it_store_head')
    )
  );

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_stock_assignments_item ON public.stock_assignments(item_id);
CREATE INDEX IF NOT EXISTS idx_stock_assignments_assigned_to ON public.stock_assignments(assigned_to);
CREATE INDEX IF NOT EXISTS idx_stock_assignments_location ON public.stock_assignments(location);

-- Create trigger for updated_at
CREATE TRIGGER update_stock_assignments_updated_at BEFORE UPDATE ON public.stock_assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
