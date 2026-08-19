-- Add notification preferences column to puxarota_profiles
ALTER TABLE puxarota_profiles
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{}'::jsonb;
