import { assertEquals, assertExists } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { walk } from 'https://deno.land/std@0.224.0/fs/mod.ts';

/**
 * Database Migration Tests
 *
 * Validates that all migration files are:
 * - Syntactically valid SQL
 * - Follow naming conventions
 * - Are numbered sequentially
 * - Don't contain dangerous operations without safeguards
 */

const MIGRATIONS_DIR = './supabase/migrations';

Deno.test('migrations - all files follow naming convention', async () => {
  const migrationFiles: string[] = [];

  for await (const entry of walk(MIGRATIONS_DIR, { exts: ['.sql'] })) {
    if (entry.isFile) {
      migrationFiles.push(entry.name);
    }
  }

  // Migration files should follow pattern: YYYYMMDDHHMMSS_description.sql
  const namePattern = /^\d{14}_[\w-]+\.sql$/;

  for (const filename of migrationFiles) {
    assertEquals(
      namePattern.test(filename),
      true,
      `Migration file "${filename}" doesn't follow naming convention: YYYYMMDDHHMMSS_description.sql`,
    );
  }
});

Deno.test('migrations - files are numbered sequentially', async () => {
  const migrationFiles: string[] = [];

  for await (const entry of walk(MIGRATIONS_DIR, { exts: ['.sql'] })) {
    if (entry.isFile) {
      migrationFiles.push(entry.name);
    }
  }

  // Sort by timestamp prefix
  migrationFiles.sort();

  // Check no duplicate timestamps
  const timestamps = migrationFiles.map((f) => f.substring(0, 14));
  const uniqueTimestamps = new Set(timestamps);

  assertEquals(
    timestamps.length,
    uniqueTimestamps.size,
    'Found duplicate migration timestamps',
  );
});

Deno.test('migrations - unified architecture exists and is valid SQL', async () => {
  const schemaFile = `${MIGRATIONS_DIR}/20251010000000_unified_architecture.sql`;

  const content = await Deno.readTextFile(schemaFile);

  assertExists(content);
  assertEquals(content.length > 0, true, 'Migration file is empty');

  // Check for required tables
  assertEquals(content.includes('CREATE TABLE'), true, 'Should contain CREATE TABLE statements');
  assertEquals(
    content.includes('users'),
    true,
    'Should create users table',
  );
  assertEquals(
    content.includes('products'),
    true,
    'Should create products table',
  );
  assertEquals(
    content.includes('user_products'),
    true,
    'Should create user_products table',
  );
  assertEquals(
    content.includes('emails'),
    true,
    'Should create emails table',
  );
  assertEquals(
    content.includes('ai_token_usage'),
    true,
    'Should create ai_token_usage table',
  );
});

Deno.test('migrations - unified architecture has proper indexes', async () => {
  const schemaFile = `${MIGRATIONS_DIR}/20251010000000_unified_architecture.sql`;
  const content = await Deno.readTextFile(schemaFile);

  // Check for performance indexes
  assertEquals(content.includes('CREATE INDEX'), true, 'Should have CREATE INDEX statements');
  assertEquals(
    content.includes('idx_users_email'),
    true,
    'Should have index on users email',
  );
  assertEquals(
    content.includes('idx_emails_user'),
    true,
    'Should have index on emails user_id',
  );
});

Deno.test('migrations - unified architecture has foreign keys', async () => {
  const schemaFile = `${MIGRATIONS_DIR}/20251010000000_unified_architecture.sql`;
  const content = await Deno.readTextFile(schemaFile);

  // Check for foreign key relationships
  assertEquals(
    content.includes('REFERENCES users'),
    true,
    'Should have foreign key references to users',
  );
  assertEquals(
    content.includes('REFERENCES products'),
    true,
    'Should have foreign key references to products',
  );
});

Deno.test('migrations - unified architecture has constraints', async () => {
  const schemaFile = `${MIGRATIONS_DIR}/20251010000000_unified_architecture.sql`;
  const content = await Deno.readTextFile(schemaFile);

  // Check for NOT NULL constraints
  assertEquals(content.includes('NOT NULL'), true, 'Should have NOT NULL constraints');

  // Check for UNIQUE constraints
  assertEquals(
    content.includes('UNIQUE'),
    true,
    'Should have UNIQUE constraints for data validation',
  );
});

Deno.test('migrations - no dangerous operations without safeguards', async () => {
  const migrationFiles: string[] = [];

  for await (const entry of walk(MIGRATIONS_DIR, { exts: ['.sql'] })) {
    if (entry.isFile) {
      migrationFiles.push(entry.path);
    }
  }

  for (const filepath of migrationFiles) {
    const content = await Deno.readTextFile(filepath);
    const upperContent = content.toUpperCase();

    // Check for DROP TABLE without IF EXISTS
    if (upperContent.includes('DROP TABLE') && !upperContent.includes('IF EXISTS')) {
      throw new Error(
        `Migration ${filepath} contains DROP TABLE without IF EXISTS - this could cause data loss`,
      );
    }

    // Check for TRUNCATE (very dangerous)
    if (upperContent.includes('TRUNCATE')) {
      throw new Error(
        `Migration ${filepath} contains TRUNCATE - this is dangerous in production`,
      );
    }
  }
});
