-- Migration: Add Ticket Messaging and Admin Notification System
-- Purpose: Enable real-time messaging on tickets, delayed ticket alerts, and admin broadcast notifications

-- 1. Create ticket_messages table for communication on tickets
CREATE TABLE IF NOT EXISTS public.ticket_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.service_tickets(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  sender_name text NOT NULL,
  sender_role text NOT NULL,
  message_text text NOT NULL,
  is_internal boolean DEFAULT false,
  attachments text[] DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 2. Create admin_notifications table for broadcast notifications
CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_by_name text NOT NULL,
  created_by_role text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  notification_type text DEFAULT 'info', -- 'info', 'warning', 'alert', 'success'
  target_role text, -- null for broadcast to all, or specific role like 'it_staff', 'service_desk'
  target_location_id uuid REFERENCES public.locations(id) ON DELETE SET NULL,
  target_location_name text,
  recipients_count integer DEFAULT 0,
  sound_enabled boolean DEFAULT true,
  sound_type text DEFAULT 'default', -- 'default', 'alert', 'success', 'warning'
  status text DEFAULT 'sent', -- 'draft', 'scheduled', 'sent'
  scheduled_for timestamp with time zone,
  sent_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 3. Create table to track which users have received admin notifications
CREATE TABLE IF NOT EXISTS public.admin_notification_recipients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id uuid NOT NULL REFERENCES public.admin_notifications(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_name text NOT NULL,
  user_email text,
  user_role text,
  user_location text,
  is_read boolean DEFAULT false,
  read_at timestamp with time zone,
  received_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

-- 4. Create delayed_ticket_alerts table for tracking SLA breaches
CREATE TABLE IF NOT EXISTS public.delayed_ticket_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.service_tickets(id) ON DELETE CASCADE,
  ticket_number text,
  alert_type text DEFAULT 'sla_breach', -- 'sla_breach', 'approaching_deadline'
  due_date date,
  days_overdue integer,
  assigned_to_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  assigned_to_name text,
  requested_by_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  requested_by_name text,
  requester_email text,
  alert_sent boolean DEFAULT false,
  alert_sent_at timestamp with time zone,
  acknowledged boolean DEFAULT false,
  acknowledged_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  acknowledged_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(ticket_id, alert_type)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket_id ON public.ticket_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_sender_id ON public.ticket_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_created_at ON public.ticket_messages(created_at);

CREATE INDEX IF NOT EXISTS idx_admin_notifications_created_by ON public.admin_notifications(created_by);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_target_role ON public.admin_notifications(target_role);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_status ON public.admin_notifications(status);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_created_at ON public.admin_notifications(created_at);

CREATE INDEX IF NOT EXISTS idx_admin_notification_recipients_notification_id ON public.admin_notification_recipients(notification_id);
CREATE INDEX IF NOT EXISTS idx_admin_notification_recipients_user_id ON public.admin_notification_recipients(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_notification_recipients_is_read ON public.admin_notification_recipients(is_read);

CREATE INDEX IF NOT EXISTS idx_delayed_ticket_alerts_ticket_id ON public.delayed_ticket_alerts(ticket_id);
CREATE INDEX IF NOT EXISTS idx_delayed_ticket_alerts_assigned_to_id ON public.delayed_ticket_alerts(assigned_to_id);
CREATE INDEX IF NOT EXISTS idx_delayed_ticket_alerts_alert_sent ON public.delayed_ticket_alerts(alert_sent);

-- Enable RLS on new tables
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_notification_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delayed_ticket_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ticket_messages
CREATE POLICY "Users can view messages on their tickets"
  ON public.ticket_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.service_tickets st
      WHERE st.id = ticket_messages.ticket_id
      AND (
        st.assigned_to_id = auth.uid()
        OR st.user_confirmed_by = auth.uid()
        OR auth.jwt() ->> 'role' = 'admin'
      )
    )
  );

CREATE POLICY "Users can create messages on assigned tickets"
  ON public.ticket_messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.service_tickets st
      WHERE st.id = ticket_messages.ticket_id
      AND (st.assigned_to_id = auth.uid() OR auth.jwt() ->> 'role' = 'admin')
    )
  );

-- RLS Policies for admin_notifications
CREATE POLICY "Admins can manage notifications"
  ON public.admin_notifications FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin' OR created_by = auth.uid())
  WITH CHECK (auth.jwt() ->> 'role' = 'admin' OR created_by = auth.uid());

-- RLS Policies for admin_notification_recipients
CREATE POLICY "Users can view their own notifications"
  ON public.admin_notification_recipients FOR SELECT
  USING (user_id = auth.uid() OR auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "System can track notification delivery"
  ON public.admin_notification_recipients FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role' OR auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Users can mark their notifications as read"
  ON public.admin_notification_recipients FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for delayed_ticket_alerts
CREATE POLICY "Users can view alerts on their tickets"
  ON public.delayed_ticket_alerts FOR SELECT
  USING (
    assigned_to_id = auth.uid()
    OR requested_by_id = auth.uid()
    OR auth.jwt() ->> 'role' = 'admin'
  );

CREATE POLICY "System can manage alerts"
  ON public.delayed_ticket_alerts FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "System can update alerts"
  ON public.delayed_ticket_alerts FOR UPDATE
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role' OR auth.jwt() ->> 'role' = 'admin');
