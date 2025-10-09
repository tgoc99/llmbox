import { assertEquals, assertExists } from 'https://deno.land/std@0.224.0/assert/mod.ts';

/**
 * Database Schema Contract Tests
 *
 * Validates that the database schema matches expectations:
 * - Table names
 * - Column names
 * - Column types
 * - Relationships
 */

const SCHEMA_FILE = './supabase/migrations/20251009000000_personifeed_schema.sql';

Deno.test('schema-contract - users table exists', async () => {
  const content = await Deno.readTextFile(SCHEMA_FILE);

  assertEquals(
    content.toUpperCase().includes('CREATE TABLE') &&
      content.includes('users'),
    true,
    'users table should be defined',
  );
});

Deno.test('schema-contract - users has expected columns', async () => {
  const content = await Deno.readTextFile(SCHEMA_FILE);

  const expectedColumns = [
    'id',
    'email',
    'active',
    'created_at',
  ];

  for (const column of expectedColumns) {
    assertEquals(
      content.includes(column),
      true,
      `users should have ${column} column`,
    );
  }
});

Deno.test('schema-contract - newsletters table exists', async () => {
  const content = await Deno.readTextFile(SCHEMA_FILE);

  assertEquals(
    content.includes('newsletters'),
    true,
    'newsletters table should be defined',
  );
});

Deno.test('schema-contract - newsletters has expected columns', async () => {
  const content = await Deno.readTextFile(SCHEMA_FILE);

  const expectedColumns = [
    'id',
    'user_id',
    'content',
    'sent_at',
    'status',
    'created_at',
  ];

  for (const column of expectedColumns) {
    assertEquals(
      content.includes(column),
      true,
      `newsletters should have ${column} column`,
    );
  }
});

Deno.test('schema-contract - customizations table exists', async () => {
  const content = await Deno.readTextFile(SCHEMA_FILE);

  assertEquals(
    content.includes('customizations'),
    true,
    'customizations table should be defined',
  );
});

Deno.test('schema-contract - customizations has expected columns', async () => {
  const content = await Deno.readTextFile(SCHEMA_FILE);

  const expectedColumns = [
    'id',
    'user_id',
    'type',
    'content',
    'created_at',
  ];

  for (const column of expectedColumns) {
    assertEquals(
      content.includes(column),
      true,
      `customizations should have ${column} column`,
    );
  }
});

Deno.test('schema-contract - UUID columns use uuid type', async () => {
  const content = await Deno.readTextFile(SCHEMA_FILE);

  // ID columns should be UUID type
  const hasUuidType = content.toUpperCase().includes('UUID') ||
    content.includes('gen_random_uuid()');

  assertEquals(hasUuidType, true, 'Should use UUID type for ID columns');
});

Deno.test('schema-contract - timestamp columns use appropriate type', async () => {
  const content = await Deno.readTextFile(SCHEMA_FILE);

  // Timestamp columns should use TIMESTAMP or TIMESTAMPTZ
  const hasTimestampType = content.toUpperCase().includes('TIMESTAMP');

  assertEquals(hasTimestampType, true, 'Should use TIMESTAMP type for date columns');
});

Deno.test('schema-contract - email column has proper type', async () => {
  const content = await Deno.readTextFile(SCHEMA_FILE);

  // Find the users table
  const usersTableMatch = content.match(
    /CREATE TABLE.*?users.*?\([\s\S]*?\);/i,
  );

  assertExists(usersTableMatch, 'Should find users table');

  const usersTable = usersTableMatch[0];

  // Email should be text or varchar
  const emailLine = usersTable.split('\n').find((line) => line.includes('email'));

  assertExists(emailLine, 'Should have email column');
  assertEquals(
    emailLine.toUpperCase().includes('TEXT') ||
      emailLine.toUpperCase().includes('VARCHAR'),
    true,
    'Email should be TEXT or VARCHAR type',
  );
});

Deno.test('schema-contract - boolean columns use BOOLEAN type', async () => {
  const content = await Deno.readTextFile(SCHEMA_FILE);

  // Find active column
  const usersTableMatch = content.match(
    /CREATE TABLE.*?users.*?\([\s\S]*?\);/i,
  );

  const usersTable = usersTableMatch![0];
  const activeLine = usersTable.split('\n').find((line) => line.includes('active'));

  assertExists(activeLine, 'Should have active column');
  assertEquals(
    activeLine.toUpperCase().includes('BOOLEAN') ||
      activeLine.toUpperCase().includes('BOOL'),
    true,
    'active should be BOOLEAN type',
  );
});

Deno.test('schema-contract - indexes are created for performance', async () => {
  const content = await Deno.readTextFile(SCHEMA_FILE);

  // Should have indexes for frequently queried columns
  assertEquals(
    content.toUpperCase().includes('CREATE INDEX'),
    true,
    'Should have CREATE INDEX statements',
  );

  // Email should be indexed for lookups
  assertEquals(
    content.includes('idx_users_email') ||
      content.includes('email') && content.includes('INDEX'),
    true,
    'Should have index on email column',
  );
});

Deno.test('schema-contract - table names follow naming convention', async () => {
  const content = await Deno.readTextFile(SCHEMA_FILE);

  // Check that expected tables exist
  const expectedTables = ['users', 'customizations', 'newsletters'];
  const tableMatches = content.matchAll(/CREATE TABLE(?:\s+IF NOT EXISTS)?\s+(\w+)/gi);

  const foundTables = [];
  for (const match of tableMatches) {
    foundTables.push(match[1].toLowerCase());
  }

  for (const expectedTable of expectedTables) {
    assertEquals(
      foundTables.includes(expectedTable),
      true,
      `Should find ${expectedTable} table`,
    );
  }
});

Deno.test('schema-contract - foreign key columns end with _id', async () => {
  const content = await Deno.readTextFile(SCHEMA_FILE);

  // Find all REFERENCES clauses - match the column name that comes before REFERENCES
  // Pattern: "  user_id UUID NOT NULL REFERENCES users(id)"
  const referencesMatches = content.matchAll(/^\s+(\w+)\s+UUID.*?REFERENCES/gim);

  for (const match of referencesMatches) {
    const columnName = match[1];
    assertEquals(
      columnName.endsWith('_id'),
      true,
      `Foreign key column ${columnName} should end with _id`,
    );
  }
});
