-- Migration: Add sent_by columns to admin_notifications table
-- Purpose: Fix the missing 'sent_by' column that the API expects

-- Add sent_by and sent_by_name columns to admin_notifications table
ALTER TABLE public.admin_notifications
ADD COLUMN IF NOT EXISTS sent_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS sent_by_name text;

-- Create index on sent_by for query performance
CREATE INDEX IF NOT EXISTS idx_admin_notifications_sent_by ON public.admin_notifications(sent_by);
