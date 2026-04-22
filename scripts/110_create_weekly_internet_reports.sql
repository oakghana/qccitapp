-- Migration: Create Weekly Internet Services Report System
-- Purpose: Allow regional IT heads to submit weekly internet reports
-- Visible to admin and IT head for oversight

CREATE TABLE IF NOT EXISTS public.weekly_internet_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start_date date NOT NULL,
  week_end_date date NOT NULL,
  week_number integer NOT NULL,
  year integer NOT NULL,

  -- Who submitted
  submitted_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  submitted_by_name text NOT NULL,
  location text NOT NULL,
  region text,

  -- Internet service status
  overall_status text DEFAULT 'operational', -- 'operational', 'degraded', 'outage', 'maintenance'
  uptime_percentage numeric(5,2),

  -- ISP providers coverage
  primary_isp text,
  primary_isp_status text DEFAULT 'operational',
  primary_isp_notes text,

  backup_isp text,
  backup_isp_status text DEFAULT 'operational',
  backup_isp_notes text,

  -- Connectivity report
  downtime_incidents integer DEFAULT 0,
  downtime_total_hours numeric(5,2) DEFAULT 0,
  downtime_details text,

  -- Users affected
  users_affected integer DEFAULT 0,
  departments_affected text[],

  -- Issues & resolutions
  issues_reported text,
  resolutions_taken text,
  escalated_to_head_office boolean DEFAULT false,
  escalation_details text,

  -- Speed / quality
  avg_download_speed_mbps numeric(8,2),
  avg_upload_speed_mbps numeric(8,2),
  speed_test_tool text,

  -- Upcoming maintenance
  planned_maintenance text,
  maintenance_window text,

  -- Additional notes
  additional_notes text,
  attachments text[],

  -- Submission tracking
  status text DEFAULT 'draft', -- 'draft', 'submitted', 'acknowledged'
  submitted_at timestamp with time zone,
  acknowledged_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  acknowledged_by_name text,
  acknowledged_at timestamp with time zone,
  acknowledgement_notes text,

  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),

  UNIQUE(submitted_by, week_start_date)
);

CREATE INDEX IF NOT EXISTS idx_weekly_internet_reports_submitted_by ON public.weekly_internet_reports(submitted_by);
CREATE INDEX IF NOT EXISTS idx_weekly_internet_reports_week ON public.weekly_internet_reports(week_start_date, year);
CREATE INDEX IF NOT EXISTS idx_weekly_internet_reports_location ON public.weekly_internet_reports(location);
CREATE INDEX IF NOT EXISTS idx_weekly_internet_reports_status ON public.weekly_internet_reports(status);
