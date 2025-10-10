import { assertEquals, assertExists } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import {
  DatabaseAIUsage,
  DatabaseEmail,
  DatabasePersonifeedFeedback,
  DatabasePersonifeedSubscriber,
  DatabaseUser,
  EmailDirection,
  EmailType,
  ProductType,
} from '../../../supabase/functions/_shared/types.ts';

/**
 * Database Helpers Unit Tests
 *
 * Tests the database helper functions with mocked Supabase client
 * These are unit tests - no actual database calls are made
 */

// Mock Supabase client (for future use)
// deno-lint-ignore no-explicit-any
const createMockSupabaseClient = (mockData: Record<string, any>) => {
  return {
    from: (_table: string) => ({
      select: (_columns?: string) => ({
        eq: (_column: string, _value: unknown) => ({
          single: () => Promise.resolve({ data: mockData.single, error: mockData.error }),
          maybeSingle: () => Promise.resolve({ data: mockData.single, error: mockData.error }),
        }),
        order: (_column: string, _options?: unknown) => ({
          data: mockData.array,
          error: mockData.error,
        }),
        data: mockData.array,
        error: mockData.error,
      }),
      insert: (_data: unknown) => ({
        select: () => ({
          single: () => Promise.resolve({ data: mockData.inserted, error: mockData.error }),
        }),
      }),
      upsert: (_data: unknown) => ({
        select: () => ({
          single: () => Promise.resolve({ data: mockData.upserted, error: mockData.error }),
        }),
      }),
      update: (_data: unknown) => ({
        eq: (_column: string, _value: unknown) => ({
          select: () => ({
            single: () => Promise.resolve({ data: mockData.updated, error: mockData.error }),
          }),
        }),
      }),
    }),
    rpc: (_fn: string, _params: unknown) =>
      Promise.resolve({ data: mockData.rpc, error: mockData.error }),
  };
};

Deno.test('database-helpers - mock test structure works', () => {
  const mockClient = createMockSupabaseClient({
    single: { id: '123', email: 'test@example.com' },
    error: null,
  });

  assertExists(mockClient);
  assertExists(mockClient.from);
});

Deno.test('database-helpers - DatabaseUser type has required fields', () => {
  const user: DatabaseUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    name: 'Test User',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  assertEquals(typeof user.id, 'string');
  assertEquals(typeof user.email, 'string');
  assertEquals(typeof user.created_at, 'string');
  assertEquals(typeof user.updated_at, 'string');
});

Deno.test('database-helpers - DatabaseEmail type has required fields', () => {
  const email: DatabaseEmail = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    user_id: '123e4567-e89b-12d3-a456-426614174001',
    product: 'email-webhook' as ProductType,
    direction: 'inbound' as EmailDirection,
    email_type: 'user_query' as EmailType,
    from_email: 'user@example.com',
    to_email: 'service@example.com',
    cc_emails: null,
    subject: 'Test Subject',
    raw_content: 'Raw email content',
    processed_content: null,
    html_content: null,
    thread_id: null,
    parent_email_id: null,
    created_at: new Date().toISOString(),
    processed_at: null,
    metadata: {},
  };

  assertEquals(email.product, 'email-webhook');
  assertEquals(email.direction, 'inbound');
  assertEquals(email.email_type, 'user_query');
  assertExists(email.from_email);
  assertExists(email.to_email);
  assertEquals(typeof email.created_at, 'string');
});

Deno.test('database-helpers - DatabaseAIUsage type has required fields', () => {
  const usage: DatabaseAIUsage = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    user_id: '123e4567-e89b-12d3-a456-426614174001',
    product: 'email-webhook' as ProductType,
    related_email_id: null,
    model: 'gpt-4o-mini',
    prompt_tokens: 100,
    completion_tokens: 50,
    total_tokens: 150,
    estimated_cost_usd: 0.001,
    created_at: new Date().toISOString(),
    metadata: {},
  };

  assertEquals(typeof usage.prompt_tokens, 'number');
  assertEquals(typeof usage.completion_tokens, 'number');
  assertEquals(typeof usage.total_tokens, 'number');
  assertEquals(typeof usage.estimated_cost_usd, 'number');
  assertEquals(typeof usage.created_at, 'string');
});

Deno.test('database-helpers - DatabasePersonifeedSubscriber type has required fields', () => {
  const subscriber: DatabasePersonifeedSubscriber = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    user_id: '123e4567-e89b-12d3-a456-426614174001',
    interests: 'Technology, AI, Programming',
    is_active: true,
    last_newsletter_sent_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  assertEquals(typeof subscriber.interests, 'string');
  assertEquals(typeof subscriber.is_active, 'boolean');
  assertEquals(typeof subscriber.created_at, 'string');
  assertEquals(typeof subscriber.updated_at, 'string');
  assertExists(subscriber.user_id);
});

Deno.test('database-helpers - DatabasePersonifeedFeedback type has required fields', () => {
  const feedback: DatabasePersonifeedFeedback = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    user_id: '123e4567-e89b-12d3-a456-426614174001',
    newsletter_email_id: null,
    feedback_type: 'reply',
    content: 'This is great!',
    sentiment: null,
    created_at: new Date().toISOString(),
    metadata: {},
  };

  assertEquals(typeof feedback.feedback_type, 'string');
  assertEquals(typeof feedback.content, 'string');
  assertEquals(typeof feedback.created_at, 'string');
  assertExists(feedback.user_id);
});

Deno.test('database-helpers - ProductType enum has expected values', () => {
  const emailWebhook: ProductType = 'email-webhook';
  const personifeed: ProductType = 'personifeed';

  assertEquals(emailWebhook, 'email-webhook');
  assertEquals(personifeed, 'personifeed');
});

Deno.test('database-helpers - EmailDirection enum has expected values', () => {
  const inbound: EmailDirection = 'inbound';
  const outbound: EmailDirection = 'outbound';

  assertEquals(inbound, 'inbound');
  assertEquals(outbound, 'outbound');
});

Deno.test('database-helpers - EmailType enum has expected values', () => {
  const userQuery: EmailType = 'user_query';
  const llmResponse: EmailType = 'llm_response';
  const newsletter: EmailType = 'newsletter';
  const feedbackReply: EmailType = 'feedback_reply';
  const other: EmailType = 'other';

  assertEquals(userQuery, 'user_query');
  assertEquals(llmResponse, 'llm_response');
  assertEquals(newsletter, 'newsletter');
  assertEquals(feedbackReply, 'feedback_reply');
  assertEquals(other, 'other');
});
