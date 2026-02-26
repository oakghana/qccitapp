-- Ensure service_tickets has a confirmation_status column used by the app
ALTER TABLE public.service_tickets
  ADD COLUMN IF NOT EXISTS confirmation_status TEXT;

-- no existing data to copy from; simply create the column and allow
-- the application to populate it moving forward.

-- You may need to refresh the Supabase schema cache after running this script
-- so PostgREST recognizes the new column (or restart the dev server).
