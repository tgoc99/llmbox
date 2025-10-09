-- LLMBox Database Schema
-- Users table: Track each email address and their usage
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  tier TEXT NOT NULL DEFAULT 'free', -- 'free', 'basic', 'pro', 'enterprise'
  cost_used_usd NUMERIC(10, 6) DEFAULT 0, -- Track actual cost in USD
  cost_limit_usd NUMERIC(10, 6) DEFAULT 1.00, -- Free tier limit: $1
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT,
  subscription_status TEXT, -- 'active', 'canceled', 'past_due', 'trialing'
  billing_period_start TIMESTAMPTZ,
  billing_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Usage logs: Track each interaction
CREATE TABLE usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  message_id TEXT NOT NULL,
  prompt_tokens INTEGER NOT NULL,
  completion_tokens INTEGER NOT NULL,
  total_tokens INTEGER NOT NULL,
  model TEXT NOT NULL,
  cost_usd NUMERIC(10, 6) NOT NULL, -- Track actual cost
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pricing tiers configuration
CREATE TABLE pricing_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_name TEXT UNIQUE NOT NULL,
  cost_limit_usd NUMERIC(10, 6) NOT NULL,
  price_cents INTEGER NOT NULL, -- Price in cents
  stripe_price_id TEXT UNIQUE,
  features JSONB,
  sort_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_stripe_customer ON users(stripe_customer_id);
CREATE INDEX idx_usage_logs_user_id ON usage_logs(user_id);
CREATE INDEX idx_usage_logs_created_at ON usage_logs(created_at);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Seed pricing tiers data
INSERT INTO pricing_tiers (tier_name, cost_limit_usd, price_cents, stripe_price_id, features, sort_order) VALUES
  ('free', 1.00, 0, NULL, '["Limited usage", "GPT-4o-mini access", "Email support", "Try out LLMBox"]'::jsonb, 1),
  ('pro', 16.00, 2000, 'price_pro_monthly', '["More usage", "GPT-4o & GPT-4o-mini access", "Priority support", "Flexible monthly billing"]'::jsonb, 2),
  ('max', 100.00, 10000, 'price_max_monthly', '["Much more usage than Pro", "All models available", "Priority support", "Advanced features"]'::jsonb, 3);

-- Enable Row Level Security (RLS) - disabled for MVP since we're using service role
-- Enable in post-MVP when adding user authentication
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE pricing_tiers ENABLE ROW LEVEL SECURITY;

