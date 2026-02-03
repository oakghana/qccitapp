-- Add destination_location column to store_requisitions for stock transfers
-- This enables tracking where items are being transferred from Central Stores

ALTER TABLE store_requisitions 
ADD COLUMN IF NOT EXISTS destination_location VARCHAR(100);

-- Create index for faster queries on destination location
CREATE INDEX IF NOT EXISTS idx_store_requisitions_destination_location 
ON store_requisitions(destination_location);

-- Add comments for clarity
COMMENT ON COLUMN store_requisitions.destination_location IS 
'Location where items will be transferred to when sourcing from Central Stores';

COMMIT;