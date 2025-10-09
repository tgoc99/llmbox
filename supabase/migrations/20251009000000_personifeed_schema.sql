-- personi[feed] Database Schema
-- Creates tables for users, customizations, and newsletters

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table: Stores newsletter subscribers
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  active BOOLEAN DEFAULT TRUE,

  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
);

-- Customizations table: Stores initial preferences and user feedback
CREATE TABLE IF NOT EXISTS customizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('initial', 'feedback')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT content_length CHECK (char_length(content) BETWEEN 1 AND 2000)
);

-- Newsletters table: Tracks generated newsletters and delivery status
CREATE TABLE IF NOT EXISTS newsletters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(active) WHERE active = TRUE;
CREATE INDEX IF NOT EXISTS idx_customizations_user_id ON customizations(user_id);
CREATE INDEX IF NOT EXISTS idx_customizations_created_at ON customizations(created_at);
CREATE INDEX IF NOT EXISTS idx_newsletters_user_id ON newsletters(user_id);
CREATE INDEX IF NOT EXISTS idx_newsletters_status ON newsletters(status);
CREATE INDEX IF NOT EXISTS idx_newsletters_sent_at ON newsletters(sent_at);

-- Composite index for cron query optimization (fetch all active users)
CREATE INDEX IF NOT EXISTS idx_users_active_created_at ON users(active, created_at) WHERE active = TRUE;

-- Comments for documentation
COMMENT ON TABLE users IS 'Newsletter subscribers with email and active status';
COMMENT ON TABLE customizations IS 'User preferences: initial prompts and feedback for customization';
COMMENT ON TABLE newsletters IS 'Generated newsletters with delivery status tracking';

COMMENT ON COLUMN users.active IS 'Whether user should receive newsletters (default: true, set false to unsubscribe)';
COMMENT ON COLUMN customizations.type IS 'Either initial (signup prompt) or feedback (reply customization)';
COMMENT ON COLUMN newsletters.status IS 'pending (queued), sent (delivered), or failed (delivery error)';

