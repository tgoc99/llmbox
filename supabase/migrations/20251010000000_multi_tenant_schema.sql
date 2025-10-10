
-- ============================================================================
-- CORE TABLES (Shared across all products)
-- ============================================================================

-- Product/subdomain enum (extensible)
CREATE TYPE product_type AS ENUM (
  'email-webhook',  -- LLMBox chat via email
  'personifeed'     -- AI-personalized newsletters
  -- Future: 'other-product'
);

-- Email direction
CREATE TYPE email_direction AS ENUM ('inbound', 'outbound');

-- Email types (extensible, product-agnostic)
CREATE TYPE email_type AS ENUM (
  -- email-webhook types
  'user_query',       -- User sends question
  'llm_response',     -- LLM replies to user

  -- personifeed types
  'newsletter',       -- Daily newsletter
  'feedback_reply',   -- User provides feedback/customization

  -- Future types
  'other'
);

-- Users table (single source of truth for all email addresses)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,  -- Optional display name
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Main emails table (tracks ALL content emails, not transactional/system emails)
CREATE TABLE emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product product_type NOT NULL,
  direction email_direction NOT NULL,
  email_type email_type NOT NULL,

  -- Email envelope
  from_email TEXT NOT NULL,
  to_email TEXT NOT NULL,
  cc_emails TEXT[],
  subject TEXT,

  -- Content (store both for inbound, mainly processed for outbound)
  raw_content TEXT,           -- Original email body (text)
  processed_content TEXT,     -- Cleaned/processed version
  html_content TEXT,          -- HTML version (for outbound)

  -- Threading support
  thread_id TEXT,                           -- Email thread identifier (Message-ID)
  parent_email_id UUID REFERENCES emails(id), -- Reply chain

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  processed_at TIMESTAMPTZ,   -- When we processed inbound or sent outbound

  -- Flexible metadata (attachments, headers, etc.)
  metadata JSONB DEFAULT '{}'::jsonb
);

-- AI token usage tracking (per user, per product)
CREATE TABLE ai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product product_type NOT NULL,
  related_email_id UUID REFERENCES emails(id) ON DELETE SET NULL,

  -- Model information
  model TEXT NOT NULL,              -- e.g., 'gpt-4o-mini', 'gpt-4o'
  prompt_tokens INTEGER NOT NULL,
  completion_tokens INTEGER NOT NULL,
  total_tokens INTEGER NOT NULL,

  -- Optional cost tracking (can calculate based on model + tokens)
  estimated_cost_usd DECIMAL(10, 6),

  created_at TIMESTAMPTZ DEFAULT now(),

  -- Flexible metadata (request type, context, etc.)
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for core tables
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_emails_user_id ON emails(user_id);
CREATE INDEX idx_emails_product ON emails(product);
CREATE INDEX idx_emails_direction ON emails(direction);
CREATE INDEX idx_emails_email_type ON emails(email_type);
CREATE INDEX idx_emails_thread_id ON emails(thread_id) WHERE thread_id IS NOT NULL;
CREATE INDEX idx_emails_created_at ON emails(created_at DESC);
CREATE INDEX idx_emails_product_user ON emails(product, user_id, created_at DESC);

CREATE INDEX idx_ai_usage_user_id ON ai_usage(user_id);
CREATE INDEX idx_ai_usage_product ON ai_usage(product);
CREATE INDEX idx_ai_usage_created_at ON ai_usage(created_at DESC);
CREATE INDEX idx_ai_usage_product_user ON ai_usage(product, user_id, created_at DESC);

-- ============================================================================
-- PRODUCT-SPECIFIC TABLES
-- ============================================================================

-- Personifeed: Subscriber details
CREATE TABLE personifeed_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,

  interests TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_newsletter_sent_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Personifeed: Feedback tracking (separate from emails for richer data)
CREATE TABLE personifeed_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Optional reference to the newsletter email this feedback is about
  newsletter_email_id UUID REFERENCES emails(id) ON DELETE SET NULL,

  -- Feedback details
  feedback_type TEXT NOT NULL,  -- 'thumbs_up', 'thumbs_down', 'customization', 'topic_request'
  content TEXT,                 -- The actual feedback text
  sentiment TEXT,               -- 'positive', 'negative', 'neutral' (can be auto-detected)

  created_at TIMESTAMPTZ DEFAULT now(),

  -- Flexible metadata (parsed intents, topics, etc.)
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for personifeed tables
CREATE INDEX idx_personifeed_subscribers_user_id ON personifeed_subscribers(user_id);
CREATE INDEX idx_personifeed_subscribers_active ON personifeed_subscribers(is_active, last_newsletter_sent_at);
CREATE INDEX idx_personifeed_feedback_user_id ON personifeed_feedback(user_id);
CREATE INDEX idx_personifeed_feedback_newsletter ON personifeed_feedback(newsletter_email_id);
CREATE INDEX idx_personifeed_feedback_created_at ON personifeed_feedback(created_at DESC);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_personifeed_subscribers_updated_at BEFORE UPDATE ON personifeed_subscribers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

