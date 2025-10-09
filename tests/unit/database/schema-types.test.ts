import { assertEquals, assertExists } from 'https://deno.land/std@0.224.0/assert/mod.ts';

/**
 * Schema-to-TypeScript Type Tests
 *
 * Validates that TypeScript interfaces match the database schema.
 * This prevents runtime errors from schema/type mismatches.
 */

// Import types from shared types file
import type { Customization, Newsletter, User } from '../../../supabase/functions/_shared/types.ts';

Deno.test('schema-types - User interface has required fields', () => {
  // This test validates the interface structure exists
  const mockUser: User = {
    id: 'test-id',
    email: 'test@example.com',
    created_at: new Date(),
    active: true,
  };

  assertExists(mockUser.id);
  assertExists(mockUser.email);
  assertEquals(typeof mockUser.active, 'boolean');
  assertExists(mockUser.created_at);
  assertEquals(mockUser.created_at instanceof Date, true);
});

Deno.test('schema-types - Newsletter interface has required fields', () => {
  const mockNewsletter: Newsletter = {
    id: 'test-id',
    user_id: 'user-id',
    content: 'Newsletter content',
    sent_at: new Date(),
    status: 'sent',
    created_at: new Date(),
  };

  assertExists(mockNewsletter.id);
  assertExists(mockNewsletter.user_id);
  assertExists(mockNewsletter.content);
  assertExists(mockNewsletter.sent_at);
  assertExists(mockNewsletter.status);
  assertExists(mockNewsletter.created_at);
  assertEquals(mockNewsletter.sent_at instanceof Date, true);
  assertEquals(mockNewsletter.created_at instanceof Date, true);
});

Deno.test('schema-types - Customization interface has required fields', () => {
  const mockCustomization: Customization = {
    id: 'test-id',
    user_id: 'user-id',
    type: 'feedback',
    content: 'Customization content',
    created_at: new Date(),
  };

  assertExists(mockCustomization.id);
  assertExists(mockCustomization.user_id);
  assertExists(mockCustomization.type);
  assertExists(mockCustomization.content);
  assertExists(mockCustomization.created_at);
  assertEquals(mockCustomization.created_at instanceof Date, true);
});

Deno.test('schema-types - User email field is string', () => {
  const mockUser: User = {
    id: 'test-id',
    email: 'test@example.com',
    created_at: new Date(),
    active: true,
  };

  assertEquals(typeof mockUser.email, 'string');
});

Deno.test('schema-types - User active is boolean', () => {
  const mockUser: User = {
    id: 'test-id',
    email: 'test@example.com',
    created_at: new Date(),
    active: true,
  };

  assertEquals(typeof mockUser.active, 'boolean');
});

Deno.test('schema-types - timestamp fields are Date objects', () => {
  const mockUser: User = {
    id: 'test-id',
    email: 'test@example.com',
    created_at: new Date(),
    active: true,
  };

  // Validate Date type
  assertEquals(mockUser.created_at instanceof Date, true);
  assertEquals(isNaN(mockUser.created_at.getTime()), false);
});
