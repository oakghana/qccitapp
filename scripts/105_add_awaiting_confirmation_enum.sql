-- Add awaiting_confirmation value to ticket_status enum used by service_tickets
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum
    WHERE enumlabel = 'awaiting_confirmation'
      AND enumtypid = 'ticket_status'::regtype
  ) THEN
    ALTER TYPE ticket_status ADD VALUE 'awaiting_confirmation';
  END IF;
END $$;
-- also ensure the newer service_ticket_status enum (if used) contains the value
DO $$
DECLARE
  st_oid oid;
BEGIN
  SELECT oid INTO st_oid FROM pg_type WHERE typname = 'service_ticket_status';
  IF st_oid IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_enum
      WHERE enumlabel = 'awaiting_confirmation'
        AND enumtypid = st_oid
    ) THEN
      ALTER TYPE service_ticket_status ADD VALUE 'awaiting_confirmation';
    END IF;
  END IF;
END $$;
