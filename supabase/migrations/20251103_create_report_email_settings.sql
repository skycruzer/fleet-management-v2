-- Migration: Create report email settings table
-- Author: Maurice Rondeau
-- Date: November 3, 2025
-- Purpose: Allow admin to configure email recipients for automated reports

-- Create report_email_settings table
CREATE TABLE IF NOT EXISTS public.report_email_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_report_email_settings_key ON public.report_email_settings(setting_key);

-- Enable RLS
ALTER TABLE public.report_email_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admin users can view email settings"
  ON public.report_email_settings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.an_users
      WHERE an_users.id = auth.uid()
      AND an_users.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Admin users can insert email settings"
  ON public.report_email_settings
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.an_users
      WHERE an_users.id = auth.uid()
      AND an_users.role = 'admin'
    )
  );

CREATE POLICY "Admin users can update email settings"
  ON public.report_email_settings
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.an_users
      WHERE an_users.id = auth.uid()
      AND an_users.role = 'admin'
    )
  );

CREATE POLICY "Admin users can delete email settings"
  ON public.report_email_settings
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.an_users
      WHERE an_users.id = auth.uid()
      AND an_users.role = 'admin'
    )
  );

-- Insert default email recipients
INSERT INTO public.report_email_settings (setting_key, setting_value, description) VALUES
('default_report_recipients', 'fleet@example.com,admin@example.com', 'Default email recipients for all reports (comma-separated)'),
('fleet_report_recipients', 'fleet@example.com,hr@example.com', 'Email recipients for fleet reports'),
('certification_report_recipients', 'training@example.com,compliance@example.com', 'Email recipients for certification reports'),
('leave_report_recipients', 'hr@example.com,scheduling@example.com', 'Email recipients for leave reports'),
('operational_report_recipients', 'operations@example.com,scheduling@example.com', 'Email recipients for operational reports'),
('system_report_recipients', 'it@example.com,admin@example.com', 'Email recipients for system reports')
ON CONFLICT (setting_key) DO NOTHING;

-- Create function to get email recipients for a report category
CREATE OR REPLACE FUNCTION public.get_report_email_recipients(category_name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  recipients TEXT;
  setting_key_name TEXT;
BEGIN
  -- Build setting key based on category
  setting_key_name := category_name || '_report_recipients';

  -- Try to get category-specific recipients
  SELECT setting_value INTO recipients
  FROM public.report_email_settings
  WHERE setting_key = setting_key_name
  LIMIT 1;

  -- If no category-specific recipients, use default
  IF recipients IS NULL THEN
    SELECT setting_value INTO recipients
    FROM public.report_email_settings
    WHERE setting_key = 'default_report_recipients'
    LIMIT 1;
  END IF;

  -- If still no recipients, return empty string
  RETURN COALESCE(recipients, '');
END;
$$;

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION public.update_report_email_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_report_email_settings_timestamp
  BEFORE UPDATE ON public.report_email_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_report_email_settings_updated_at();

-- Grant permissions
GRANT SELECT ON public.report_email_settings TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.report_email_settings TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_report_email_recipients(TEXT) TO authenticated;

COMMENT ON TABLE public.report_email_settings IS 'Email recipient configuration for automated reports';
COMMENT ON COLUMN public.report_email_settings.setting_key IS 'Unique identifier for the setting (e.g., "fleet_report_recipients")';
COMMENT ON COLUMN public.report_email_settings.setting_value IS 'Comma-separated list of email addresses';
COMMENT ON FUNCTION public.get_report_email_recipients(TEXT) IS 'Get email recipients for a specific report category';
