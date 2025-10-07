# Database Schema

**N/A for MVP - Stateless Architecture**

The MVP does not use a database. All data is processed in-memory during the Edge Function execution and not persisted.

**Post-MVP Database Design (Future):**

When conversation history is added in post-MVP, the following PostgreSQL schema will be implemented on Supabase:

```sql
-- Users table (for future multi-user support)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conversations table (email threads)
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  subject VARCHAR(500) NOT NULL,
  message_id VARCHAR(500) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages table (individual emails in threads)
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id),
  message_id VARCHAR(500) UNIQUE NOT NULL,
  in_reply_to VARCHAR(500),
  direction VARCHAR(20) NOT NULL, -- 'inbound' or 'outbound'
  content TEXT NOT NULL,
  model VARCHAR(50), -- LLM model used (null for inbound)
  token_count INTEGER, -- tokens used (null for inbound)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_conversations_user ON conversations(user_id);
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_message_id ON messages(message_id);
```

---
