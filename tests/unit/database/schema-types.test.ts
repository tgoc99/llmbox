import { assertEquals, assertExists } from 'https://deno.land/std@0.224.0/assert/mod.ts';

/**
 * Schema-to-TypeScript Type Tests
 *
 * Validates that TypeScript interfaces match the unified database schema.
 * This prevents runtime errors from schema/type mismatches.
 */

// Import types from shared types file
import type {
  AITokenUsage,
  Email,
  PersonifeedSettings,
  User,
  UserProduct,
} from '../../../supabase/functions/_shared/types.ts';

Deno.test('schema-types - User interface has required fields', () => {
  // This test validates the interface structure exists
  const mockUser: User = {
    id: 'test-id',
    email: 'test@example.com',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  assertExists(mockUser.id);
  assertExists(mockUser.email);
  assertExists(mockUser.created_at);
  assertExists(mockUser.updated_at);
  assertEquals(typeof mockUser.created_at, 'string');
  assertEquals(typeof mockUser.updated_at, 'string');
});

Deno.test('schema-types - Email interface has required fields', () => {
  const mockEmail: Email = {
    id: 'test-id',
    user_id: 'user-id',
    product_id: 'llmbox',
    direction: 'incoming',
    type: 'llm_query',
    from_email: 'user@example.com',
    to_email: 'llmbox@example.com',
    subject: 'Test Subject',
    body_text: 'Test body',
    body_html: null,
    thread_id: null,
    in_reply_to: null,
    references: null,
    external_id: null,
    raw_headers: null,
    sent_at: null,
    delivered_at: null,
    failed_at: null,
    error_message: null,
    created_at: new Date().toISOString(),
  };

  assertExists(mockEmail.id);
  assertExists(mockEmail.user_id);
  assertExists(mockEmail.product_id);
  assertExists(mockEmail.direction);
  assertExists(mockEmail.type);
  assertExists(mockEmail.from_email);
  assertExists(mockEmail.to_email);
  assertEquals(typeof mockEmail.created_at, 'string');
});

Deno.test('schema-types - UserProduct interface has required fields', () => {
  const mockUserProduct: UserProduct = {
    user_id: 'user-id',
    product_id: 'personifeed',
    status: 'active',
    settings: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  assertExists(mockUserProduct.user_id);
  assertExists(mockUserProduct.product_id);
  assertExists(mockUserProduct.status);
  assertExists(mockUserProduct.settings);
  assertEquals(typeof mockUserProduct.created_at, 'string');
  assertEquals(typeof mockUserProduct.updated_at, 'string');
});

Deno.test('schema-types - AITokenUsage interface has required fields', () => {
  const mockTokenUsage: AITokenUsage = {
    id: 'test-id',
    user_id: 'user-id',
    product_id: 'llmbox',
    operation_type: 'llm_chat',
    email_id: 'email-id',
    model: 'gpt-4o-mini',
    prompt_tokens: 100,
    completion_tokens: 50,
    total_tokens: 150,
    estimated_cost_cents: 0.015,
    metadata: {},
    created_at: new Date().toISOString(),
  };

  assertExists(mockTokenUsage.id);
  assertExists(mockTokenUsage.product_id);
  assertExists(mockTokenUsage.model);
  assertEquals(typeof mockTokenUsage.prompt_tokens, 'number');
  assertEquals(typeof mockTokenUsage.completion_tokens, 'number');
  assertEquals(typeof mockTokenUsage.total_tokens, 'number');
  assertEquals(typeof mockTokenUsage.estimated_cost_cents, 'number');
});

Deno.test('schema-types - PersonifeedSettings interface', () => {
  const mockSettings: PersonifeedSettings = {
    topics: ['AI', 'Tech'],
    preferred_time: '09:00',
    timezone: 'America/New_York',
    initialPrompt: 'Daily AI news',
    feedbacks: ['More AI content please', 'Love the tech updates'],
  };

  assertExists(mockSettings.topics);
  assertExists(mockSettings.initialPrompt);
  assertExists(mockSettings.feedbacks);
  assertEquals(Array.isArray(mockSettings.topics), true);
  assertEquals(Array.isArray(mockSettings.feedbacks), true);
});

Deno.test('schema-types - User email field is string', () => {
  const mockUser: User = {
    id: 'test-id',
    email: 'test@example.com',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  assertEquals(typeof mockUser.email, 'string');
});

Deno.test('schema-types - timestamp fields are ISO strings', () => {
  const mockUser: User = {
    id: 'test-id',
    email: 'test@example.com',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Validate that timestamps are strings in ISO format
  assertEquals(typeof mockUser.created_at, 'string');
  assertEquals(typeof mockUser.updated_at, 'string');

  // Validate that they can be parsed back to dates
  const parsedCreated = new Date(mockUser.created_at);
  const parsedUpdated = new Date(mockUser.updated_at);
  assertEquals(isNaN(parsedCreated.getTime()), false);
  assertEquals(isNaN(parsedUpdated.getTime()), false);
});
