-- Add a friendly column name for confirmation notes that the UI expects
ALTER TABLE public.service_tickets
  ADD COLUMN IF NOT EXISTS confirmation_notes TEXT;

-- backfill from existing completion_confirmation_notes if necessary
UPDATE public.service_tickets
SET confirmation_notes = completion_confirmation_notes
WHERE confirmation_notes IS NULL AND completion_confirmation_notes IS NOT NULL;

-- keep the two columns in sync using a trigger (optional)
CREATE OR REPLACE FUNCTION sync_confirmation_notes() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.completion_confirmation_notes IS DISTINCT FROM OLD.completion_confirmation_notes THEN
    NEW.confirmation_notes := NEW.completion_confirmation_notes;
  END IF;
  IF NEW.confirmation_notes IS DISTINCT FROM OLD.confirmation_notes THEN
    NEW.completion_confirmation_notes := NEW.confirmation_notes;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_confirmation_notes ON public.service_tickets;
CREATE TRIGGER trg_sync_confirmation_notes
BEFORE INSERT OR UPDATE ON public.service_tickets
FOR EACH ROW EXECUTE FUNCTION sync_confirmation_notes();
