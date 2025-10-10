-- Unified Multi-Product Architecture Migration
-- This migration creates a centralized, extensible database schema for all LLMBox products

-- ============================================================================
-- 1. USERS TABLE (Centralized)
-- ============================================================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Index for fast email lookups
CREATE INDEX idx_users_email ON users(email);

-- ============================================================================
-- 2. PRODUCTS TABLE (Subdomain/Service Registry)
-- ============================================================================
CREATE TYPE product_status AS ENUM ('active', 'beta', 'deprecated');

CREATE TABLE products (
  id TEXT PRIMARY KEY, -- 'llmbox', 'personifeed', etc.
  name TEXT NOT NULL,
  description TEXT,
  subdomain TEXT UNIQUE NOT NULL,
  status product_status DEFAULT 'active' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Seed with initial products
INSERT INTO products (id, name, subdomain, description, status) VALUES
  ('llmbox', 'LLMBox', 'llmbox', 'Email-to-LLM chat service', 'active'),
  ('personifeed', 'Personifeed', 'personifeed', 'Personalized daily newsletters', 'active');

-- ============================================================================
-- 3. USER_PRODUCTS TABLE (Many-to-Many with Product-Specific Settings)
-- ============================================================================
CREATE TYPE user_product_status AS ENUM ('active', 'paused', 'unsubscribed');

CREATE TABLE user_products (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  product_id TEXT REFERENCES products(id) ON DELETE CASCADE,
  status user_product_status DEFAULT 'active' NOT NULL,

  -- Product-specific settings (JSONB for flexibility)
  -- For personifeed: { topics: string[], preferred_time: string, timezone: string }
  -- For other products: custom settings as needed
  settings JSONB DEFAULT '{}' NOT NULL,

  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,

  PRIMARY KEY (user_id, product_id)
);

-- Indexes for product-specific queries
CREATE INDEX idx_user_products_product ON user_products(product_id);
CREATE INDEX idx_user_products_status ON user_products(product_id, status);

-- ============================================================================
-- 4. EMAILS TABLE (Unified Email Log)
-- ============================================================================
CREATE TYPE email_direction AS ENUM ('incoming', 'outgoing');
CREATE TYPE email_type AS ENUM (
  -- LLMBox types
  'llm_query',           -- User sends question to LLMBox
  'llm_response',        -- LLMBox responds with AI answer

  -- Personifeed types
  'newsletter_scheduled', -- Daily personifeed newsletter
  'reply_received',       -- User replies to personifeed
  'customization_update', -- Personifeed settings changed

  -- Future extensibility
  'other'
);

CREATE TABLE emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Core fields
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  product_id TEXT REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  direction email_direction NOT NULL,
  type email_type NOT NULL,

  -- Email details
  from_email TEXT NOT NULL,
  to_email TEXT NOT NULL,
  subject TEXT,
  body_text TEXT,
  body_html TEXT,

  -- Threading (for conversations)
  thread_id TEXT, -- Email thread identifier
  in_reply_to TEXT, -- Message-ID this is replying to
  "references" TEXT[], -- All parent Message-IDs (quoted because it's a reserved keyword)

  -- Metadata
  external_id TEXT, -- SendGrid message ID, etc.
  raw_headers JSONB, -- Full email headers for debugging

  -- Status tracking
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  error_message TEXT,

  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Indexes for common queries
CREATE INDEX idx_emails_user ON emails(user_id);
CREATE INDEX idx_emails_product ON emails(product_id);
CREATE INDEX idx_emails_thread ON emails(thread_id);
CREATE INDEX idx_emails_type ON emails(product_id, type);
CREATE INDEX idx_emails_direction ON emails(product_id, direction);
CREATE INDEX idx_emails_created ON emails(created_at DESC);
CREATE INDEX idx_emails_user_created ON emails(user_id, created_at DESC);

-- ============================================================================
-- 5. AI_TOKEN_USAGE TABLE (Cost Tracking)
-- ============================================================================
CREATE TYPE ai_operation_type AS ENUM (
  'llm_chat',           -- LLMBox chat completions
  'newsletter_generate', -- Personifeed newsletter generation
  'content_summarize',   -- Content summarization
  'other'
);

CREATE TABLE ai_token_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Who and what
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  product_id TEXT REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  operation_type ai_operation_type NOT NULL,

  -- Related email (optional)
  email_id UUID REFERENCES emails(id) ON DELETE SET NULL,

  -- Token details
  model TEXT NOT NULL, -- 'gpt-4o', 'gpt-4o-mini', etc.
  prompt_tokens INTEGER NOT NULL,
  completion_tokens INTEGER NOT NULL,
  total_tokens INTEGER NOT NULL,

  -- Cost calculation (in USD cents)
  -- Based on OpenAI pricing: https://openai.com/pricing
  estimated_cost_cents INTEGER NOT NULL,

  -- Metadata
  metadata JSONB DEFAULT '{}', -- Any additional context

  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Indexes for analytics
CREATE INDEX idx_token_usage_user ON ai_token_usage(user_id);
CREATE INDEX idx_token_usage_product ON ai_token_usage(product_id);
CREATE INDEX idx_token_usage_created ON ai_token_usage(created_at DESC);
CREATE INDEX idx_token_usage_user_product ON ai_token_usage(user_id, product_id);
CREATE INDEX idx_token_usage_email ON ai_token_usage(email_id);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to calculate token cost in cents
-- Prices as of Oct 2024 (update as needed)
CREATE OR REPLACE FUNCTION calculate_token_cost(
  p_model TEXT,
  p_prompt_tokens INTEGER,
  p_completion_tokens INTEGER
) RETURNS INTEGER AS $$
DECLARE
  v_prompt_cost_per_million NUMERIC;
  v_completion_cost_per_million NUMERIC;
  v_total_cost_cents INTEGER;
BEGIN
  -- Set pricing based on model
  CASE p_model
    WHEN 'gpt-4o' THEN
      v_prompt_cost_per_million := 2.50; -- $2.50 per 1M input tokens
      v_completion_cost_per_million := 10.00; -- $10.00 per 1M output tokens
    WHEN 'gpt-4o-mini' THEN
      v_prompt_cost_per_million := 0.15; -- $0.15 per 1M input tokens
      v_completion_cost_per_million := 0.60; -- $0.60 per 1M output tokens
    WHEN 'gpt-4o-2024-08-06' THEN
      v_prompt_cost_per_million := 2.50;
      v_completion_cost_per_million := 10.00;
    ELSE
      -- Default to gpt-4o-mini pricing for unknown models
      v_prompt_cost_per_million := 0.15;
      v_completion_cost_per_million := 0.60;
  END CASE;

  -- Calculate total cost in cents
  -- (tokens / 1,000,000) * cost_per_million * 100 (to convert to cents)
  v_total_cost_cents := ROUND(
    (p_prompt_tokens::NUMERIC / 1000000.0) * v_prompt_cost_per_million * 100 +
    (p_completion_tokens::NUMERIC / 1000000.0) * v_completion_cost_per_million * 100
  )::INTEGER;

  RETURN v_total_cost_cents;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger to automatically calculate cost when inserting token usage
CREATE OR REPLACE FUNCTION set_token_cost()
RETURNS TRIGGER AS $$
BEGIN
  -- Only calculate if not already set
  IF NEW.estimated_cost_cents IS NULL THEN
    NEW.estimated_cost_cents := calculate_token_cost(
      NEW.model,
      NEW.prompt_tokens,
      NEW.completion_tokens
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_token_cost
  BEFORE INSERT ON ai_token_usage
  FOR EACH ROW
  EXECUTE FUNCTION set_token_cost();

-- ============================================================================
-- VIEWS FOR ANALYTICS
-- ============================================================================

-- View: User token usage summary by product
CREATE VIEW user_token_usage_summary AS
SELECT
  u.id AS user_id,
  u.email,
  p.id AS product_id,
  p.name AS product_name,
  COUNT(t.id) AS total_requests,
  SUM(t.total_tokens) AS total_tokens,
  SUM(t.estimated_cost_cents) AS total_cost_cents,
  SUM(t.estimated_cost_cents)::NUMERIC / 100 AS total_cost_usd
FROM users u
  INNER JOIN ai_token_usage t ON u.id = t.user_id
  INNER JOIN products p ON t.product_id = p.id
GROUP BY u.id, u.email, p.id, p.name;

-- View: Daily email volume by product
CREATE VIEW daily_email_volume AS
SELECT
  DATE(created_at) AS date,
  product_id,
  direction,
  type,
  COUNT(*) AS email_count
FROM emails
GROUP BY DATE(created_at), product_id, direction, type
ORDER BY DATE(created_at) DESC;

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE users IS 'Centralized users table - one user per email across all products';
COMMENT ON TABLE products IS 'Registry of all LLMBox products/subdomains';
COMMENT ON TABLE user_products IS 'Many-to-many relationship between users and products with settings';
COMMENT ON TABLE emails IS 'Unified log of all emails sent and received across all products';
COMMENT ON TABLE ai_token_usage IS 'Track AI token usage and costs per user per product';
COMMENT ON COLUMN user_products.settings IS 'Product-specific settings stored as JSONB (e.g., personifeed topics, timezone)';
COMMENT ON COLUMN emails.thread_id IS 'Email thread identifier for conversation tracking';
COMMENT ON COLUMN ai_token_usage.estimated_cost_cents IS 'Estimated cost in USD cents (divide by 100 for dollars)';

