-- Add staff completion metadata to service tickets
ALTER TABLE public.service_tickets
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.service_tickets
  ADD COLUMN IF NOT EXISTS completed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.service_tickets
  ADD COLUMN IF NOT EXISTS completed_by_name TEXT;

ALTER TABLE public.service_tickets
  ADD COLUMN IF NOT EXISTS completed_by_role TEXT;

ALTER TABLE public.service_tickets
  ADD COLUMN IF NOT EXISTS completion_work_notes TEXT;

-- ensure resolved_at still exists (older deployments may have it)
ALTER TABLE public.service_tickets
  ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP WITH TIME ZONE;

-- index completed fields for filtering
CREATE INDEX IF NOT EXISTS idx_service_tickets_completed_at ON public.service_tickets(completed_at);
