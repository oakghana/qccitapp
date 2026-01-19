-- Add columns to store_requisitions for edit/delete and role-based workflow
ALTER TABLE store_requisitions ADD COLUMN IF NOT EXISTS requester_role VARCHAR(50);
ALTER TABLE store_requisitions ADD COLUMN IF NOT EXISTS is_head_office_request BOOLEAN DEFAULT FALSE;
ALTER TABLE store_requisitions ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN DEFAULT TRUE;
ALTER TABLE store_requisitions ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE store_requisitions ADD COLUMN IF NOT EXISTS deleted_by UUID;
ALTER TABLE store_requisitions ADD COLUMN IF NOT EXISTS edit_history JSONB DEFAULT '[]'::jsonb;

-- Create store_categories table for managing item categories
CREATE TABLE IF NOT EXISTS store_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  location VARCHAR(100) DEFAULT 'Central Stores',
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add category_id to store_items
ALTER TABLE store_items ADD COLUMN IF NOT EXISTS category_id UUID;
ALTER TABLE store_items ADD CONSTRAINT fk_store_items_category
  FOREIGN KEY (category_id) REFERENCES store_categories(id) ON DELETE SET NULL;

-- Create index for faster requisition queries
CREATE INDEX IF NOT EXISTS idx_store_requisitions_status ON store_categories(location);
CREATE INDEX IF NOT EXISTS idx_store_requisitions_deleted ON store_requisitions(deleted_at);
CREATE INDEX IF NOT EXISTS idx_store_requisitions_role ON store_requisitions(requester_role);

COMMIT;
