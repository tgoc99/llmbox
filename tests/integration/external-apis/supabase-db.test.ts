import { assertEquals, assertExists } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

/**
 * Supabase Database Integration Tests
 *
 * Tests real database operations against Supabase PostgreSQL.
 * These tests require SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.
 *
 * ⚠️ WARNING: These tests perform real database operations!
 * - Use a test/development database, not production
 * - Tests will create and delete data
 * - May incur costs
 */

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || Deno.env.get('TEST_SUPABASE_URL');
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ||
  Deno.env.get('TEST_SUPABASE_KEY');

const shouldSkip = !SUPABASE_URL || !SUPABASE_KEY;

if (shouldSkip) {
  console.log(
    '⚠️  Skipping Supabase DB integration tests (missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY)',
  );
}

// Test helper: Generate unique email for testing
const generateTestEmail = (): string => {
  return `test-${Date.now()}-${Math.random().toString(36).substring(7)}@test.llmbox.pro`;
};

Deno.test({
  name: 'supabase-db - can connect to database',
  ignore: shouldSkip,
  async fn() {
    const supabase = createClient(SUPABASE_URL!, SUPABASE_KEY!);

    // Simple query to verify connection
    const { error } = await supabase
      .from('personifeed_users')
      .select('count')
      .limit(1);

    assertEquals(error, null, 'Should connect without error');
  },
});

Deno.test({
  name: 'supabase-db - can create user',
  ignore: shouldSkip,
  async fn() {
    const supabase = createClient(SUPABASE_URL!, SUPABASE_KEY!);
    const testEmail = generateTestEmail();

    const { data, error } = await supabase
      .from('personifeed_users')
      .insert({
        email: testEmail,
        prompt: 'Test prompt for integration test',
        is_active: true,
      })
      .select()
      .single();

    try {
      assertEquals(error, null, 'Should insert without error');
      assertExists(data, 'Should return created user');
      assertEquals(data.email, testEmail);
      assertEquals(data.prompt, 'Test prompt for integration test');
      assertEquals(data.is_active, true);
      assertExists(data.id, 'Should have generated ID');
      assertExists(data.created_at, 'Should have created_at timestamp');
      assertExists(data.updated_at, 'Should have updated_at timestamp');
    } finally {
      // Cleanup: Delete test user
      if (data?.id) {
        await supabase.from('personifeed_users').delete().eq('id', data.id);
      }
    }
  },
});

Deno.test({
  name: 'supabase-db - unique email constraint works',
  ignore: shouldSkip,
  async fn() {
    const supabase = createClient(SUPABASE_URL!, SUPABASE_KEY!);
    const testEmail = generateTestEmail();

    // Create first user
    const { data: user1 } = await supabase
      .from('personifeed_users')
      .insert({
        email: testEmail,
        prompt: 'First user',
      })
      .select()
      .single();

    try {
      // Try to create second user with same email - should fail
      const { data: user2, error } = await supabase
        .from('personifeed_users')
        .insert({
          email: testEmail,
          prompt: 'Second user',
        })
        .select()
        .single();

      assertExists(error, 'Should have error for duplicate email');
      assertEquals(user2, null, 'Should not return data for duplicate');
      assertEquals(
        error.code === '23505' || error.message.toLowerCase().includes('unique'),
        true,
        'Error should indicate unique constraint violation',
      );
    } finally {
      // Cleanup
      if (user1?.id) {
        await supabase.from('personifeed_users').delete().eq('id', user1.id);
      }
    }
  },
});

Deno.test({
  name: 'supabase-db - can update user',
  ignore: shouldSkip,
  async fn() {
    const supabase = createClient(SUPABASE_URL!, SUPABASE_KEY!);
    const testEmail = generateTestEmail();

    // Create user
    const { data: user } = await supabase
      .from('personifeed_users')
      .insert({
        email: testEmail,
        prompt: 'Original prompt',
      })
      .select()
      .single();

    try {
      // Update prompt
      const { data: updated, error } = await supabase
        .from('personifeed_users')
        .update({
          prompt: 'Updated prompt',
        })
        .eq('id', user!.id)
        .select()
        .single();

      assertEquals(error, null, 'Should update without error');
      assertExists(updated, 'Should return updated user');
      assertEquals(updated.prompt, 'Updated prompt');
      assertEquals(updated.email, testEmail, 'Email should remain unchanged');
    } finally {
      // Cleanup
      if (user?.id) {
        await supabase.from('personifeed_users').delete().eq('id', user.id);
      }
    }
  },
});

Deno.test({
  name: 'supabase-db - can create newsletter for user',
  ignore: shouldSkip,
  async fn() {
    const supabase = createClient(SUPABASE_URL!, SUPABASE_KEY!);
    const testEmail = generateTestEmail();

    // Create user
    const { data: user } = await supabase
      .from('personifeed_users')
      .insert({
        email: testEmail,
        prompt: 'Test prompt',
      })
      .select()
      .single();

    try {
      // Create newsletter
      const { data: newsletter, error } = await supabase
        .from('personifeed_newsletters')
        .insert({
          user_id: user!.id,
          content: 'Test newsletter content',
          sent_at: new Date().toISOString(),
        })
        .select()
        .single();

      assertEquals(error, null, 'Should create newsletter without error');
      assertExists(newsletter, 'Should return created newsletter');
      assertEquals(newsletter.user_id, user!.id);
      assertEquals(newsletter.content, 'Test newsletter content');
      assertExists(newsletter.id, 'Should have generated ID');
      assertExists(newsletter.sent_at, 'Should have sent_at timestamp');

      // Cleanup newsletter
      if (newsletter?.id) {
        await supabase.from('personifeed_newsletters').delete().eq('id', newsletter.id);
      }
    } finally {
      // Cleanup user
      if (user?.id) {
        await supabase.from('personifeed_users').delete().eq('id', user.id);
      }
    }
  },
});

Deno.test({
  name: 'supabase-db - foreign key constraint works',
  ignore: shouldSkip,
  async fn() {
    const supabase = createClient(SUPABASE_URL!, SUPABASE_KEY!);

    // Try to create newsletter with non-existent user_id
    const { error } = await supabase
      .from('personifeed_newsletters')
      .insert({
        user_id: '00000000-0000-0000-0000-000000000000', // Non-existent ID
        content: 'Test content',
        sent_at: new Date().toISOString(),
      })
      .select()
      .single();

    assertExists(error, 'Should have error for invalid foreign key');
    assertEquals(
      error.code === '23503' || error.message.toLowerCase().includes('foreign'),
      true,
      'Error should indicate foreign key violation',
    );
  },
});

Deno.test({
  name: 'supabase-db - can create customization for user',
  ignore: shouldSkip,
  async fn() {
    const supabase = createClient(SUPABASE_URL!, SUPABASE_KEY!);
    const testEmail = generateTestEmail();

    // Create user
    const { data: user } = await supabase
      .from('personifeed_users')
      .insert({
        email: testEmail,
        prompt: 'Test prompt',
      })
      .select()
      .single();

    try {
      // Create customization
      const { data: customization, error } = await supabase
        .from('personifeed_customizations')
        .insert({
          user_id: user!.id,
          customization_type: 'reply',
          content: 'User reply content',
        })
        .select()
        .single();

      assertEquals(error, null, 'Should create customization without error');
      assertExists(customization, 'Should return created customization');
      assertEquals(customization.user_id, user!.id);
      assertEquals(customization.customization_type, 'reply');
      assertEquals(customization.content, 'User reply content');

      // Cleanup customization
      if (customization?.id) {
        await supabase.from('personifeed_customizations').delete().eq('id', customization.id);
      }
    } finally {
      // Cleanup user
      if (user?.id) {
        await supabase.from('personifeed_users').delete().eq('id', user.id);
      }
    }
  },
});

Deno.test({
  name: 'supabase-db - can query user with newsletters',
  ignore: shouldSkip,
  async fn() {
    const supabase = createClient(SUPABASE_URL!, SUPABASE_KEY!);
    const testEmail = generateTestEmail();

    // Create user
    const { data: user } = await supabase
      .from('personifeed_users')
      .insert({
        email: testEmail,
        prompt: 'Test prompt',
      })
      .select()
      .single();

    // Create newsletter
    const { data: newsletter } = await supabase
      .from('personifeed_newsletters')
      .insert({
        user_id: user!.id,
        content: 'Newsletter content',
        sent_at: new Date().toISOString(),
      })
      .select()
      .single();

    try {
      // Query user with related newsletters
      const { data, error } = await supabase
        .from('personifeed_users')
        .select('*, personifeed_newsletters(*)')
        .eq('id', user!.id)
        .single();

      assertEquals(error, null, 'Should query without error');
      assertExists(data, 'Should return user data');
      assertExists(data.personifeed_newsletters, 'Should include newsletters');
      assertEquals(Array.isArray(data.personifeed_newsletters), true);
      assertEquals(data.personifeed_newsletters.length, 1);
    } finally {
      // Cleanup
      if (newsletter?.id) {
        await supabase.from('personifeed_newsletters').delete().eq('id', newsletter.id);
      }
      if (user?.id) {
        await supabase.from('personifeed_users').delete().eq('id', user.id);
      }
    }
  },
});
