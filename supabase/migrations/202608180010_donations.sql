ALTER TABLE puxarota_accounts
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'free'; -- free, active, canceled, past_due
