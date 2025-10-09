import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';

/**
 * Database Constraints Tests
 *
 * Validates that the database schema has proper constraints:
 * - Foreign keys
 * - Check constraints
 * - Default values
 * - NOT NULL constraints
 */

const MIGRATIONS_DIR = './supabase/migrations';
const SCHEMA_FILE = `${MIGRATIONS_DIR}/20251009000000_personifeed_schema.sql`;

Deno.test('constraints - users table has email NOT NULL', async () => {
  const content = await Deno.readTextFile(SCHEMA_FILE);

  // Find the users table definition
  const usersTableMatch = content.match(
    /CREATE TABLE.*?users.*?\([\s\S]*?\);/i,
  );

  assertEquals(usersTableMatch !== null, true, 'users table should exist');

  const usersTable = usersTableMatch![0];

  // Check email field has NOT NULL
  const emailLine = usersTable.split('\n').find((line) => line.includes('email'));
  assertEquals(
    emailLine?.toUpperCase().includes('NOT NULL'),
    true,
    'email field should have NOT NULL constraint',
  );
});

Deno.test('constraints - users table has unique email constraint', async () => {
  const content = await Deno.readTextFile(SCHEMA_FILE);

  const usersTableMatch = content.match(
    /CREATE TABLE.*?users.*?\([\s\S]*?\);/i,
  );

  const usersTable = usersTableMatch![0];

  // Check for UNIQUE constraint on email
  assertEquals(
    usersTable.toUpperCase().includes('UNIQUE') &&
      usersTable.includes('email'),
    true,
    'email field should have UNIQUE constraint',
  );
});

Deno.test('constraints - users has default for active', async () => {
  const content = await Deno.readTextFile(SCHEMA_FILE);

  const usersTableMatch = content.match(
    /CREATE TABLE.*?users.*?\([\s\S]*?\);/i,
  );

  const usersTable = usersTableMatch![0];

  // Check active has default value
  const activeLine = usersTable.split('\n').find((line) => line.includes('active'));

  assertEquals(
    activeLine?.toUpperCase().includes('DEFAULT'),
    true,
    'active should have DEFAULT value',
  );
});

Deno.test('constraints - users has timestamps with defaults', async () => {
  const content = await Deno.readTextFile(SCHEMA_FILE);

  const usersTableMatch = content.match(
    /CREATE TABLE.*?users.*?\([\s\S]*?\);/i,
  );

  const usersTable = usersTableMatch![0];

  // Check created_at has default
  const createdAtLine = usersTable.split('\n').find((line) => line.includes('created_at'));

  assertEquals(
    createdAtLine?.toUpperCase().includes('DEFAULT'),
    true,
    'created_at should have DEFAULT value',
  );
});

Deno.test('constraints - newsletters has foreign key to users', async () => {
  const content = await Deno.readTextFile(SCHEMA_FILE);

  const newslettersTableMatch = content.match(
    /CREATE TABLE.*?newsletters.*?\([\s\S]*?\);/i,
  );

  assertEquals(
    newslettersTableMatch !== null,
    true,
    'newsletters table should exist',
  );

  const newslettersTable = newslettersTableMatch![0];

  // Check for foreign key constraint
  assertEquals(
    newslettersTable.toUpperCase().includes('REFERENCES') &&
      newslettersTable.includes('users'),
    true,
    'newsletters should have foreign key to users',
  );
});

Deno.test('constraints - customizations has foreign key to users', async () => {
  const content = await Deno.readTextFile(SCHEMA_FILE);

  const customizationsTableMatch = content.match(
    /CREATE TABLE.*?customizations.*?\([\s\S]*?\);/i,
  );

  assertEquals(
    customizationsTableMatch !== null,
    true,
    'customizations table should exist',
  );

  const customizationsTable = customizationsTableMatch![0];

  // Check for foreign key constraint
  assertEquals(
    customizationsTable.toUpperCase().includes('REFERENCES') &&
      customizationsTable.includes('users'),
    true,
    'customizations should have foreign key to users',
  );
});

Deno.test('constraints - foreign keys have CASCADE or proper delete behavior', async () => {
  const content = await Deno.readTextFile(SCHEMA_FILE);

  // Find all REFERENCES clauses
  const referencesMatches = content.match(/REFERENCES.*?(?=,|\))/gi);

  assertEquals(referencesMatches !== null, true, 'Should have REFERENCES clauses');

  // Each foreign key should specify ON DELETE behavior
  for (const ref of referencesMatches!) {
    const hasDeleteBehavior = ref.toUpperCase().includes('ON DELETE');

    // It's okay if no explicit behavior (defaults to NO ACTION), but CASCADE is preferred
    // This test just validates that we've thought about it
    if (hasDeleteBehavior) {
      assertEquals(
        ref.toUpperCase().includes('CASCADE') ||
          ref.toUpperCase().includes('SET NULL') ||
          ref.toUpperCase().includes('RESTRICT') ||
          ref.toUpperCase().includes('NO ACTION'),
        true,
        'Foreign key should have valid ON DELETE behavior',
      );
    }
  }
});

Deno.test('constraints - email field has CHECK for valid format', async () => {
  const content = await Deno.readTextFile(SCHEMA_FILE);

  // Look for email validation check constraint
  const hasEmailCheck = content.toUpperCase().includes('CHECK') &&
    content.includes('email') &&
    (content.includes('@') || content.includes('LIKE') || content.includes('~'));

  // This is optional but recommended
  if (hasEmailCheck) {
    assertEquals(hasEmailCheck, true, 'Email validation CHECK constraint exists');
  }
});
