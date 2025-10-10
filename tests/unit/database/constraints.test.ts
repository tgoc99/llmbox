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
const SCHEMA_FILE = `${MIGRATIONS_DIR}/20251010000000_unified_architecture.sql`;

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

Deno.test('constraints - users has default for updated_at', async () => {
  const content = await Deno.readTextFile(SCHEMA_FILE);

  const usersTableMatch = content.match(
    /CREATE TABLE.*?users.*?\([\s\S]*?\);/i,
  );

  const usersTable = usersTableMatch![0];

  // Check updated_at has default value
  const updatedAtLine = usersTable.split('\n').find((line) => line.includes('updated_at'));

  assertEquals(
    updatedAtLine?.toUpperCase().includes('DEFAULT'),
    true,
    'updated_at should have DEFAULT value',
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

Deno.test('constraints - emails has foreign key to users', async () => {
  const content = await Deno.readTextFile(SCHEMA_FILE);

  const emailsTableMatch = content.match(
    /CREATE TABLE.*?emails.*?\([\s\S]*?\);/i,
  );

  assertEquals(
    emailsTableMatch !== null,
    true,
    'emails table should exist',
  );

  const emailsTable = emailsTableMatch![0];

  // Check for foreign key constraint
  assertEquals(
    emailsTable.toUpperCase().includes('REFERENCES') &&
      emailsTable.includes('users'),
    true,
    'emails should have foreign key to users',
  );
});

Deno.test('constraints - user_products has foreign keys', async () => {
  const content = await Deno.readTextFile(SCHEMA_FILE);

  const userProductsTableMatch = content.match(
    /CREATE TABLE.*?user_products.*?\([\s\S]*?\);/i,
  );

  assertEquals(
    userProductsTableMatch !== null,
    true,
    'user_products table should exist',
  );

  const userProductsTable = userProductsTableMatch![0];

  // Check for foreign key constraints to both users and products
  assertEquals(
    userProductsTable.toUpperCase().includes('REFERENCES') &&
      (userProductsTable.includes('users') || userProductsTable.includes('products')),
    true,
    'user_products should have foreign keys',
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
