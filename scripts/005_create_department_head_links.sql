-- Create department_head_links table for managing staff under department heads
CREATE TABLE IF NOT EXISTS public.department_head_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  department_head_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure each staff member is linked only once per department head
  UNIQUE(department_head_id, staff_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_department_head_links_head_id 
  ON public.department_head_links(department_head_id);

CREATE INDEX IF NOT EXISTS idx_department_head_links_staff_id 
  ON public.department_head_links(staff_id);

-- Add RLS policies
ALTER TABLE public.department_head_links ENABLE ROW LEVEL SECURITY;

-- Allow admins to manage all links
CREATE POLICY "Admins can manage all links" 
  ON public.department_head_links 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Allow department heads to view their staff links
CREATE POLICY "Department heads can view their staff links"
  ON public.department_head_links
  FOR SELECT
  USING (
    department_head_id = auth.uid()
  );

-- Allow staff to view their department head link
CREATE POLICY "Staff can view their department head"
  ON public.department_head_links
  FOR SELECT
  USING (
    staff_id = auth.uid()
  );
