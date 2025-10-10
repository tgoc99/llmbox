import { assertEquals, assertExists } from 'https://deno.land/std@0.224.0/assert/mod.ts';

/**
 * Schema Validation Tests
 *
 * Validates that the multi-tenant schema has proper structure:
 * - Enums defined before tables
 * - Tables defined in correct order (users first, then dependent tables)
 * - Triggers and functions defined after tables
 * - DROP statements before CREATE statements
 */

const SCHEMA_FILE = './supabase/migrations/20251010000000_multi_tenant_schema.sql';

Deno.test('schema-validation - DROP statements come before CREATE', async () => {
  const content = await Deno.readTextFile(SCHEMA_FILE);
  const lines = content.split('\n');

  let firstDropIndex = -1;
  let firstCreateIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim().toUpperCase();

    if (line.startsWith('DROP TABLE') && firstDropIndex === -1) {
      firstDropIndex = i;
    }

    if (line.startsWith('CREATE TABLE') && firstCreateIndex === -1) {
      firstCreateIndex = i;
    }
  }

  if (firstDropIndex !== -1 && firstCreateIndex !== -1) {
    assertEquals(
      firstDropIndex < firstCreateIndex,
      true,
      'DROP statements should come before CREATE TABLE statements',
    );
  }
});

Deno.test('schema-validation - enums are created before tables', async () => {
  const content = await Deno.readTextFile(SCHEMA_FILE);
  const lines = content.split('\n');

  let firstEnumIndex = -1;
  let firstTableIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim().toUpperCase();

    if (line.startsWith('CREATE TYPE') && firstEnumIndex === -1) {
      firstEnumIndex = i;
    }

    if (line.startsWith('CREATE TABLE') && firstTableIndex === -1) {
      firstTableIndex = i;
    }
  }

  assertEquals(firstEnumIndex !== -1, true, 'Should have CREATE TYPE statements');
  assertEquals(firstTableIndex !== -1, true, 'Should have CREATE TABLE statements');
  assertEquals(
    firstEnumIndex < firstTableIndex,
    true,
    'Enums should be created before tables',
  );
});

Deno.test('schema-validation - users table is created before dependent tables', async () => {
  const content = await Deno.readTextFile(SCHEMA_FILE);
  const lines = content.split('\n');

  let usersTableIndex = -1;
  let emailsTableIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.includes('CREATE TABLE') && line.includes('users')) {
      usersTableIndex = i;
    }

    if (line.includes('CREATE TABLE') && line.includes('emails')) {
      emailsTableIndex = i;
    }
  }

  assertEquals(usersTableIndex !== -1, true, 'Should have users table');
  assertEquals(emailsTableIndex !== -1, true, 'Should have emails table');
  assertEquals(
    usersTableIndex < emailsTableIndex,
    true,
    'users table should be created before emails table',
  );
});

Deno.test('schema-validation - indexes are created for core tables', async () => {
  const content = await Deno.readTextFile(SCHEMA_FILE);

  // Should have CREATE INDEX statements
  assertEquals(
    content.includes('CREATE INDEX'),
    true,
    'Should have index definitions',
  );

  // Core indexes should exist
  assertEquals(
    content.includes('idx_users_email'),
    true,
    'Should have index on users email',
  );

  assertEquals(
    content.includes('idx_emails_user_id'),
    true,
    'Should have index on emails user_id',
  );
});

Deno.test('schema-validation - triggers are created after tables', async () => {
  const content = await Deno.readTextFile(SCHEMA_FILE);
  const lines = content.split('\n');

  let lastTableIndex = -1;
  let firstTriggerIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim().toUpperCase();

    if (line.startsWith('CREATE TABLE')) {
      lastTableIndex = i;
    }

    if (line.startsWith('CREATE TRIGGER') && firstTriggerIndex === -1) {
      firstTriggerIndex = i;
    }
  }

  if (firstTriggerIndex !== -1) {
    assertEquals(
      lastTableIndex < firstTriggerIndex,
      true,
      'Triggers should be created after tables',
    );
  }
});

Deno.test('schema-validation - all product types are valid', async () => {
  const content = await Deno.readTextFile(SCHEMA_FILE);

  // Find the product_type enum definition
  const productTypeMatch = content.match(
    /CREATE TYPE product_type AS ENUM \(([\s\S]*?)\);/,
  );

  assertExists(productTypeMatch, 'Should find product_type enum');

  const enumValues = productTypeMatch[1];

  assertEquals(
    enumValues.includes("'email-webhook'"),
    true,
    'Should have email-webhook product type',
  );
  assertEquals(
    enumValues.includes("'personifeed'"),
    true,
    'Should have personifeed product type',
  );
});

Deno.test('schema-validation - all email directions are valid', async () => {
  const content = await Deno.readTextFile(SCHEMA_FILE);

  // Find the email_direction enum definition
  const directionMatch = content.match(
    /CREATE TYPE email_direction AS ENUM \(([\s\S]*?)\);/,
  );

  assertExists(directionMatch, 'Should find email_direction enum');

  const enumValues = directionMatch[1];

  assertEquals(
    enumValues.includes("'inbound'"),
    true,
    'Should have inbound direction',
  );
  assertEquals(
    enumValues.includes("'outbound'"),
    true,
    'Should have outbound direction',
  );
});

Deno.test('schema-validation - all email types are valid', async () => {
  const content = await Deno.readTextFile(SCHEMA_FILE);

  // Find the email_type enum definition
  const typeMatch = content.match(
    /CREATE TYPE email_type AS ENUM \(([\s\S]*?)\);/,
  );

  assertExists(typeMatch, 'Should find email_type enum');

  const enumValues = typeMatch[1];

  assertEquals(
    enumValues.includes("'user_query'"),
    true,
    'Should have user_query type',
  );
  assertEquals(
    enumValues.includes("'llm_response'"),
    true,
    'Should have llm_response type',
  );
  assertEquals(
    enumValues.includes("'newsletter'"),
    true,
    'Should have newsletter type',
  );
  assertEquals(
    enumValues.includes("'feedback_reply'"),
    true,
    'Should have feedback_reply type',
  );
  assertEquals(
    enumValues.includes("'other'"),
    true,
    'Should have other type',
  );
});

Deno.test('schema-validation - emails table uses enum types for validation', async () => {
  const content = await Deno.readTextFile(SCHEMA_FILE);

  // Find the emails table
  const emailsTableMatch = content.match(
    /CREATE TABLE emails \(([\s\S]*?)\);/,
  );

  assertExists(emailsTableMatch, 'Should find emails table');

  const emailsTable = emailsTableMatch[0];

  // Should use enum types for type safety (instead of CHECK constraints)
  assertEquals(
    emailsTable.includes('product_type') &&
      emailsTable.includes('email_direction') &&
      emailsTable.includes('email_type'),
    true,
    'emails table should use enum types for validation',
  );
});

Deno.test('schema-validation - all foreign keys reference correct tables', async () => {
  const content = await Deno.readTextFile(SCHEMA_FILE);

  // emails.user_id should reference users(id)
  const emailsUserFK = content.match(/emails[\s\S]*?user_id[\s\S]*?REFERENCES users\(id\)/);
  assertExists(emailsUserFK, 'emails.user_id should reference users(id)');

  // ai_usage.user_id should reference users(id)
  const aiUsageUserFK = content.match(/ai_usage[\s\S]*?user_id[\s\S]*?REFERENCES users\(id\)/);
  assertExists(aiUsageUserFK, 'ai_usage.user_id should reference users(id)');

  // personifeed_subscribers.user_id should reference users(id)
  const subscribersUserFK = content.match(
    /personifeed_subscribers[\s\S]*?user_id[\s\S]*?REFERENCES users\(id\)/,
  );
  assertExists(subscribersUserFK, 'personifeed_subscribers.user_id should reference users(id)');
});

Deno.test('schema-validation - JSONB columns are used for flexible data', async () => {
  const content = await Deno.readTextFile(SCHEMA_FILE);

  // Should have JSONB for metadata (case-insensitive check)
  assertEquals(
    content.toUpperCase().includes('JSONB'),
    true,
    'Should use JSONB for flexible metadata',
  );

  // Should have metadata columns with JSONB type
  assertEquals(
    content.includes('metadata JSONB'),
    true,
    'Should have metadata JSONB columns',
  );
});

Deno.test('schema-validation - ON DELETE CASCADE is used appropriately', async () => {
  const content = await Deno.readTextFile(SCHEMA_FILE);

  // Should have ON DELETE CASCADE for cascading deletes
  assertEquals(
    content.includes('ON DELETE CASCADE'),
    true,
    'Should use ON DELETE CASCADE for dependent records',
  );

  // Should have ON DELETE SET NULL for optional references
  assertEquals(
    content.includes('ON DELETE SET NULL'),
    true,
    'Should use ON DELETE SET NULL for optional references',
  );
});
