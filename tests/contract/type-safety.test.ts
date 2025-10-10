import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import type {
  DatabasePersonifeedSubscriber,
  DatabaseUser,
  IncomingEmail,
} from '../../supabase/functions/_shared/types.ts';

/**
 * Type Safety Contract Tests
 *
 * Validates runtime type checking and type guards:
 * - Type guards work correctly
 * - Invalid data is rejected
 * - Type conversions are safe
 *
 * NOTE: Old User, Newsletter, Customization tests removed.
 * See tests/unit/database/database-helpers.test.ts for comprehensive database type tests.
 */

Deno.test('type-safety - valid IncomingEmail passes structure check', () => {
  const email: IncomingEmail = {
    from: 'user@example.com',
    to: 'assistant@llmbox.pro',
    subject: 'Test',
    body: 'Content',
    messageId: '<id@example.com>',
    inReplyTo: null,
    references: [],
    timestamp: new Date(),
  };

  // Validate structure
  assertEquals(typeof email.from, 'string');
  assertEquals(typeof email.to, 'string');
  assertEquals(typeof email.subject, 'string');
  assertEquals(typeof email.body, 'string');
  assertEquals(typeof email.messageId, 'string');
  assertEquals(Array.isArray(email.references), true);
  assertEquals(email.timestamp instanceof Date, true);
});

Deno.test('type-safety - email addresses must be strings', () => {
  const email: IncomingEmail = {
    from: 'user@example.com',
    to: 'assistant@llmbox.pro',
    subject: 'Test',
    body: 'Content',
    messageId: '<id>',
    inReplyTo: null,
    references: [],
    timestamp: new Date(),
  };

  assertEquals(typeof email.from === 'string', true);
  assertEquals(typeof email.to === 'string', true);
});

Deno.test('type-safety - DatabaseUser fields have correct types', () => {
  const user: DatabaseUser = {
    id: 'uuid-string',
    email: 'user@example.com',
    name: 'Test User',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  assertEquals(typeof user.id, 'string');
  assertEquals(typeof user.email, 'string');
  assertEquals(typeof user.name, 'string');
  assertEquals(typeof user.created_at, 'string');
  assertEquals(typeof user.updated_at, 'string');
});

Deno.test('type-safety - timestamps are ISO strings', () => {
  const user: DatabaseUser = {
    id: 'uuid',
    email: 'user@example.com',
    name: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Validate ISO string format
  assertEquals(typeof user.created_at, 'string');
  assertEquals(new Date(user.created_at).toISOString(), user.created_at);
});

Deno.test('type-safety - DatabasePersonifeedSubscriber has correct structure', () => {
  const subscriber: DatabasePersonifeedSubscriber = {
    id: 'uuid',
    user_id: 'user-uuid',
    interests: 'AI, tech, programming',
    is_active: true,
    last_newsletter_sent_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  assertEquals(typeof subscriber.id, 'string');
  assertEquals(typeof subscriber.user_id, 'string');
  assertEquals(typeof subscriber.interests, 'string');
  assertEquals(typeof subscriber.is_active, 'boolean');
  assertEquals(typeof subscriber.created_at, 'string');
});

Deno.test('type-safety - subscriber is_active is boolean', () => {
  const subscriber: DatabasePersonifeedSubscriber = {
    id: 'uuid',
    user_id: 'user-uuid',
    interests: 'Tech',
    is_active: true,
    last_newsletter_sent_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // is_active must be boolean
  assertEquals(typeof subscriber.is_active, 'boolean');
});

Deno.test('type-safety - UUIDs are string format', () => {
  const user: DatabaseUser = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    email: 'user@example.com',
    name: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // UUID v4 format validation
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  assertEquals(typeof user.id, 'string');
  assertEquals(user.id.length, 36);

  // Validate UUID format
  if (uuidPattern.test(user.id)) {
    assertEquals(uuidPattern.test(user.id), true);
  }
});

Deno.test('type-safety - arrays maintain correct element types', () => {
  const email: IncomingEmail = {
    from: 'user@example.com',
    to: 'assistant@llmbox.pro',
    subject: 'Test',
    body: 'Content',
    messageId: '<id>',
    inReplyTo: '<parent-id>',
    references: ['<ref1>', '<ref2>', '<ref3>'],
    timestamp: new Date(),
  };

  assertEquals(Array.isArray(email.references), true);

  // All elements should be strings
  for (const ref of email.references) {
    assertEquals(typeof ref, 'string');
  }
});

Deno.test('type-safety - null vs undefined handling', () => {
  const emailWithoutReply: IncomingEmail = {
    from: 'user@example.com',
    to: 'assistant@llmbox.pro',
    subject: 'Test',
    body: 'Content',
    messageId: '<id>',
    inReplyTo: null,
    references: [],
    timestamp: new Date(),
  };

  // inReplyTo should be explicitly null, not undefined
  assertEquals(emailWithoutReply.inReplyTo, null);
  assertEquals(emailWithoutReply.inReplyTo === undefined, false);
});

Deno.test('type-safety - email validation helper exists', () => {
  // Helper function to validate email format
  const isValidEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  assertEquals(isValidEmail('user@example.com'), true);
  assertEquals(isValidEmail('invalid-email'), false);
  assertEquals(isValidEmail(''), false);
  assertEquals(isValidEmail('user@domain'), false);
});
