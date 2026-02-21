-- Add configurable certification notification intervals setting
-- Allows admins to configure when pilots receive expiry notifications
-- Default: 30, 14, 7 days before expiry (expired certs always notified)
INSERT INTO settings (key, value, description)
VALUES (
  'certification_notification_intervals',
  '[30, 14, 7]'::jsonb,
  'Days before certification expiry to send notifications (expired certs always notified)'
)
ON CONFLICT (key) DO NOTHING;
