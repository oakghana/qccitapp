-- Normalize all store categories to title case
-- This ensures consistency across the application

-- Helper function to title case a string
CREATE OR REPLACE FUNCTION title_case(input_string TEXT) RETURNS TEXT AS $$
  SELECT string_agg(
    UPPER(substring(word, 1, 1)) || LOWER(substring(word, 2)),
    ' '
  )
  FROM regexp_split_to_table(LOWER(input_string), E'\\s+') AS word
$$ LANGUAGE SQL IMMUTABLE;

-- Update store_items table to normalize existing categories
UPDATE public.store_items
SET category = title_case(category)
WHERE category IS NOT NULL AND category != title_case(category);

-- Update store_categories table to normalize names
UPDATE public.store_categories
SET name = title_case(name)
WHERE name IS NOT NULL AND name != title_case(name);

-- Add a check constraint to ensure categories are properly formatted
-- (This prevents accidental additions of non-normalized categories)
ALTER TABLE public.store_items
DROP CONSTRAINT IF EXISTS store_items_category_normalized;

ALTER TABLE public.store_items
ADD CONSTRAINT store_items_category_normalized
CHECK (category IS NULL OR category = title_case(category));

-- Log the normalization completion
DO $$
DECLARE
  normalized_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO normalized_count FROM public.store_items WHERE category IS NOT NULL;
  RAISE NOTICE 'Normalized % store items categories to title case', normalized_count;
END $$;
