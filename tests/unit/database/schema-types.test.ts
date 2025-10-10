import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import type {
  DatabasePersonifeedFeedback,
  DatabasePersonifeedSubscriber,
  DatabaseUser,
} from '../../../supabase/functions/_shared/types.ts';

/**
 * Database Schema Type Tests
 *
 * Tests database TypeScript interfaces match expected structure.
 * These tests validate the multi-tenant schema types.
 *
 * NOTE: Old User, Newsletter, Customization tests removed.
 * The multi-tenant schema uses DatabaseUser, emails table, and personifeed_feedback instead.
 */

Deno.test('schema-types - DatabaseUser interface has required fields', () => {
  const user: DatabaseUser = {
    id: 'uuid-string',
    email: 'user@example.com',
    name: 'Test User',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  assertEquals(typeof user.id, 'string');
  assertEquals(typeof user.email, 'string');
  assertEquals(typeof user.created_at, 'string');
});

Deno.test('schema-types - DatabasePersonifeedSubscriber interface has required fields', () => {
  const subscriber: DatabasePersonifeedSubscriber = {
    id: 'uuid-string',
    user_id: 'user-uuid',
    interests: 'Tech, AI',
    is_active: true,
    last_newsletter_sent_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  assertEquals(typeof subscriber.id, 'string');
  assertEquals(typeof subscriber.user_id, 'string');
  assertEquals(typeof subscriber.interests, 'string');
  assertEquals(typeof subscriber.is_active, 'boolean');
});

Deno.test('schema-types - DatabasePersonifeedFeedback interface has required fields', () => {
  const feedback: DatabasePersonifeedFeedback = {
    id: 'uuid-string',
    user_id: 'user-uuid',
    newsletter_email_id: 'email-uuid',
    feedback_type: 'reply',
    content: 'Great newsletter!',
    sentiment: 'positive',
    created_at: new Date().toISOString(),
    metadata: {},
  };

  assertEquals(typeof feedback.id, 'string');
  assertEquals(typeof feedback.user_id, 'string');
  assertEquals(typeof feedback.feedback_type, 'string');
});

Deno.test('schema-types - User email field is string', () => {
  const user: DatabaseUser = {
    id: 'uuid',
    email: 'test@example.com',
    name: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  assertEquals(typeof user.email, 'string');
  assertEquals(user.email.includes('@'), true);
});

Deno.test('schema-types - Subscriber is_active is boolean', () => {
  const subscriber: DatabasePersonifeedSubscriber = {
    id: 'uuid',
    user_id: 'user-uuid',
    interests: 'Tech',
    is_active: false,
    last_newsletter_sent_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  assertEquals(typeof subscriber.is_active, 'boolean');
  assertEquals(subscriber.is_active, false);
});

Deno.test('schema-types - timestamp fields are ISO strings', () => {
  const now = new Date().toISOString();
  const user: DatabaseUser = {
    id: 'uuid',
    email: 'test@example.com',
    name: null,
    created_at: now,
    updated_at: now,
  };

  assertEquals(typeof user.created_at, 'string');
  assertEquals(typeof user.updated_at, 'string');

  // Should be valid ISO strings
  assertEquals(new Date(user.created_at).toISOString(), user.created_at);
  assertEquals(new Date(user.updated_at).toISOString(), user.updated_at);
});
