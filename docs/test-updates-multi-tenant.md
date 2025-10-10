# Test Updates for Multi-Tenant Database Schema

**Date:** October 10, 2025\
**Migration:** `20251010000000_multi_tenant_schema.sql`

## Overview

Updated all database-related tests to reflect the new multi-tenant architecture. The new schema
supports multiple products (email-webhook, personifeed) with shared core tables (`users`, `emails`,
`ai_usage`) and product-specific tables.

## Test Files Updated

### Contract Tests (`tests/contract/`)

#### `database-schema.test.ts`

- ✅ Updated schema file reference from `20251009000000_personifeed_schema.sql` to
  `20251010000000_multi_tenant_schema.sql`
- ✅ Updated table expectations: `emails`, `ai_usage`, `personifeed_subscribers`,
  `personifeed_feedback` (replaced old `newsletters`, `customizations`)
- ✅ Added test for multi-tenant enums (`product_type`, `email_direction`, `email_type`)
- ✅ Updated column expectations for new schema structure

**Test Results:** 16/16 passing ✅

### Unit Tests (`tests/unit/database/`)

#### `constraints.test.ts`

- ✅ Updated to reference new migration file
- ✅ Changed table tests from `newsletters`/`customizations` to
  `emails`/`ai_usage`/`personifeed_subscribers`
- ✅ Updated boolean field test from `users.active` to `personifeed_subscribers.is_active`
- ✅ Added foreign key tests for all new tables

**Test Results:** 9/9 passing ✅

#### `migrations.test.ts`

- ✅ Updated migration file reference throughout
- ✅ Changed table existence checks to match new schema
- ✅ Updated constraints test to check for enum types instead of CHECK constraints

**Test Results:** 7/7 passing ✅

#### `database-helpers.test.ts` (NEW)

- ✅ Created comprehensive type tests for all new database types
- ✅ Tests for `DatabaseUser`, `DatabaseEmail`, `DatabaseAIUsage`, `DatabasePersonifeedSubscriber`,
  `DatabasePersonifeedFeedback`
- ✅ Tests for enum types: `ProductType`, `EmailDirection`, `EmailType`
- ✅ Validates all required fields and proper typing

**Test Results:** 9/9 passing ✅

#### `schema-validation.test.ts` (NEW)

- ✅ Created validation tests for schema structure and ordering
- ✅ Tests for DROP before CREATE statements
- ✅ Tests for enum types defined before tables
- ✅ Tests for proper table dependency ordering
- ✅ Tests for enum values and JSONB usage
- ✅ Tests for foreign key references and CASCADE behavior

**Test Results:** 12/12 passing ✅

## Key Schema Changes Reflected in Tests

### Core Tables

1. **`users`** - Single source of truth for all email addresses
   - `id`, `email`, `name`, `created_at`, `updated_at`

2. **`emails`** - Tracks ALL sent/received emails across products
   - `id`, `user_id`, `product`, `direction`, `email_type`
   - Content fields: `from_email`, `to_email`, `subject`, `raw_content`, etc.
   - Threading: `thread_id`, `parent_email_id`
   - Metadata: `metadata` (JSONB)

3. **`ai_usage`** - Token tracking per user, per product
   - `id`, `user_id`, `product`, `related_email_id`
   - Token fields: `prompt_tokens`, `completion_tokens`, `total_tokens`
   - Cost tracking: `estimated_cost_usd`

### Product-Specific Tables

4. **`personifeed_subscribers`**
   - `id`, `user_id`, `interests`, `is_active`, `last_newsletter_sent_at`

5. **`personifeed_feedback`**
   - `id`, `user_id`, `newsletter_email_id`, `feedback_type`, `content`, `sentiment`

### Enums

- `product_type`: `'email-webhook'`, `'personifeed'`
- `email_direction`: `'inbound'`, `'outbound'`
- `email_type`: `'user_query'`, `'llm_response'`, `'newsletter'`, `'feedback_reply'`, `'other'`

## Test Coverage

### Unit Tests

- **Total:** 43 tests
- **Status:** All passing ✅
- **Categories:**
  - Schema constraints (9 tests)
  - Database helpers (9 tests)
  - Migration structure (7 tests)
  - Schema types (6 tests)
  - Schema validation (12 tests)

### Contract Tests

- **Total:** 16 tests
- **Status:** All passing ✅
- **Coverage:**
  - Table existence and structure
  - Column types and constraints
  - Enum definitions
  - Index creation
  - Foreign key naming conventions

### Overall Test Suite

- **Unit + Contract Tests:** 245 tests passing ✅
- **Execution Time:** ~7 seconds

## Type Safety Improvements

All new database types are properly typed in `_shared/types.ts`:

```typescript
export type ProductType = 'email-webhook' | 'personifeed';
export type EmailDirection = 'inbound' | 'outbound';
export type EmailType = 'user_query' | 'llm_response' | 'newsletter' | 'feedback_reply' | 'other';

export interface DatabaseUser {
  id: string;
  email: string;
  name: string | null;
  created_at: string;
  updated_at: string;
}

export interface DatabaseEmail {
  id: string;
  user_id: string;
  product: ProductType;
  direction: EmailDirection;
  email_type: EmailType;
  from_email: string;
  to_email: string;
  cc_emails: string[] | null;
  subject: string | null;
  raw_content: string | null;
  processed_content: string | null;
  html_content: string | null;
  thread_id: string | null;
  parent_email_id: string | null;
  created_at: string;
  processed_at: string | null;
  metadata: Record<string, unknown>;
}

// ... and more
```

## Running Tests

```bash
# Fast tests (unit + contract)
deno task test

# Database-specific tests only
deno test --allow-all tests/unit/database/

# All tests including integration
deno task test:all
```

## Next Steps

1. ✅ All fast tests passing
2. 🔜 Run integration tests with real database
3. 🔜 Test email-webhook email saving functionality
4. 🔜 Verify AI usage tracking in production
5. 🔜 Monitor database performance with new schema

## Notes

- Tests use ISO string timestamps (`new Date().toISOString()`) to match Supabase's TIMESTAMPTZ
  serialization
- Metadata fields use empty objects `{}` instead of `null` to match TypeScript types
- All database operations are wrapped in proper error handling
- Tests validate both schema structure AND business logic constraints
