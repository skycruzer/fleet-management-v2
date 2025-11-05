# Apply Email Settings Migration

**Date**: November 3, 2025
**Status**: Ready to Apply

## Quick Instructions

Since `supabase db push` has migration history issues, apply this migration manually:

### Step 1: Open Supabase SQL Editor

1. Go to: https://app.supabase.com/project/wgdmgvonqysflwdiiols/sql
2. Click "New Query"

### Step 2: Copy and Execute This SQL

```sql
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
CREATE INDEX IF NOT EXISTS idx_report_email_settings_key ON public.report_email_settings(setting_key);

-- Enable RLS
ALTER TABLE public.report_email_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Admin users can view email settings" ON public.report_email_settings;
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

DROP POLICY IF EXISTS "Admin users can insert email settings" ON public.report_email_settings;
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

DROP POLICY IF EXISTS "Admin users can update email settings" ON public.report_email_settings;
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

DROP POLICY IF EXISTS "Admin users can delete email settings" ON public.report_email_settings;
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

DROP TRIGGER IF EXISTS update_report_email_settings_timestamp ON public.report_email_settings;
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
```

### Step 3: Verify Table Created

Run this query to verify:

```sql
SELECT * FROM report_email_settings ORDER BY setting_key;
```

You should see 6 default settings.

### Step 4: Test the Function

```sql
SELECT get_report_email_recipients('fleet');
-- Should return: 'fleet@example.com,hr@example.com'

SELECT get_report_email_recipients('certification');
-- Should return: 'training@example.com,compliance@example.com'
```

### Step 5: Regenerate TypeScript Types

After applying the migration:

```bash
npm run db:types
```

## What This Creates

- **Table**: `report_email_settings` - Stores email recipient configuration
- **Function**: `get_report_email_recipients(category)` - Gets recipients with fallback
- **RLS Policies**: Admin-only access to email settings
- **Default Settings**: 6 pre-configured report categories

## Next Steps

1. ✅ Apply migration (this step)
2. ⏳ Create admin UI at `/dashboard/admin/settings/report-emails`
3. ⏳ Update 18 email endpoints to use `getEmailRecipientsForCategory()`
4. ⏳ Test email delivery to configured recipients

---

**Alternative: Use Supabase Dashboard UI**

If SQL Editor is unavailable:

1. Go to: https://app.supabase.com/project/wgdmgvonqysflwdiiols/editor
2. Click "+ New table"
3. Manually create `report_email_settings` table with columns:
   - `id` (uuid, primary key, default: gen_random_uuid())
   - `setting_key` (varchar(100), unique, not null)
   - `setting_value` (text, not null)
   - `description` (text, nullable)
   - `created_at` (timestamptz, default: now())
   - `updated_at` (timestamptz, default: now())
4. Then run the remaining SQL (policies, function, inserts) in SQL Editor
