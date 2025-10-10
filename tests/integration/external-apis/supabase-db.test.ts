import { assertEquals, assertExists } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

/**
 * Supabase Database Integration Tests - Unified Architecture
 *
 * Tests real database operations against the unified multi-product schema.
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
      .from('users')
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
      .from('users')
      .insert({
        email: testEmail,
      })
      .select()
      .single();

    try {
      assertEquals(error, null, 'Should insert without error');
      assertExists(data, 'Should return created user');
      assertEquals(data.email, testEmail);
      assertExists(data.id, 'Should have generated ID');
      assertExists(data.created_at, 'Should have created_at timestamp');
      assertExists(data.updated_at, 'Should have updated_at timestamp');
    } finally {
      // Cleanup: Delete test user
      if (data?.id) {
        await supabase.from('users').delete().eq('id', data.id);
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
      .from('users')
      .insert({
        email: testEmail,
      })
      .select()
      .single();

    try {
      // Try to create second user with same email - should fail
      const { data: user2, error } = await supabase
        .from('users')
        .insert({
          email: testEmail,
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
        await supabase.from('users').delete().eq('id', user1.id);
      }
    }
  },
});

Deno.test({
  name: 'supabase-db - products table has expected entries',
  ignore: shouldSkip,
  async fn() {
    const supabase = createClient(SUPABASE_URL!, SUPABASE_KEY!);

    const { data, error } = await supabase
      .from('products')
      .select('*');

    assertEquals(error, null, 'Should query products without error');
    assertExists(data, 'Should return products data');
    assertEquals(Array.isArray(data), true, 'Data should be an array');

    // Check for expected products
    const productIds = data.map((p: { id: string }) => p.id);
    assertEquals(productIds.includes('llmbox'), true, 'Should have llmbox product');
    assertEquals(productIds.includes('personifeed'), true, 'Should have personifeed product');
  },
});

Deno.test({
  name: 'supabase-db - can create user_product entry',
  ignore: shouldSkip,
  async fn() {
    const supabase = createClient(SUPABASE_URL!, SUPABASE_KEY!);
    const testEmail = generateTestEmail();

    // Create user
    const { data: user } = await supabase
      .from('users')
      .insert({ email: testEmail })
      .select()
      .single();

    try {
      // Create user_product entry
      const { data: userProduct, error } = await supabase
        .from('user_products')
        .insert({
          user_id: user!.id,
          product_id: 'personifeed',
          settings: {
            topics: ['AI', 'Tech'],
            preferred_time: '09:00',
            timezone: 'America/New_York',
          },
          status: 'active',
        })
        .select()
        .single();

      assertEquals(error, null, 'Should create user_product without error');
      assertExists(userProduct, 'Should return created user_product');
      assertEquals(userProduct.user_id, user!.id);
      assertEquals(userProduct.product_id, 'personifeed');
      assertEquals(userProduct.status, 'active');
      assertExists(userProduct.settings, 'Should have settings JSONB');
      assertEquals(userProduct.settings.topics[0], 'AI');
      assertEquals(userProduct.settings.timezone, 'America/New_York');

      // Cleanup user_product
      if (userProduct?.id) {
        await supabase.from('user_products').delete().eq('id', userProduct.id);
      }
    } finally {
      // Cleanup user
      if (user?.id) {
        await supabase.from('users').delete().eq('id', user.id);
      }
    }
  },
});

Deno.test({
  name: 'supabase-db - can log incoming email',
  ignore: shouldSkip,
  async fn() {
    const supabase = createClient(SUPABASE_URL!, SUPABASE_KEY!);
    const testEmail = generateTestEmail();

    // Create user
    const { data: user } = await supabase
      .from('users')
      .insert({ email: testEmail })
      .select()
      .single();

    try {
      // Log incoming email
      const { data: email, error } = await supabase
        .from('emails')
        .insert({
          user_id: user!.id,
          product_id: 'llmbox',
          direction: 'incoming',
          type: 'llm_query',
          from_email: testEmail,
          to_email: 'llmbox@example.com',
          subject: 'Test Query',
          body_text: 'What is AI?',
          thread_id: 'thread-123',
        })
        .select()
        .single();

      assertEquals(error, null, 'Should log email without error');
      assertExists(email, 'Should return logged email');
      assertEquals(email.user_id, user!.id);
      assertEquals(email.product_id, 'llmbox');
      assertEquals(email.direction, 'incoming');
      assertEquals(email.type, 'llm_query');
      assertEquals(email.from_email, testEmail);
      assertEquals(email.subject, 'Test Query');
      assertExists(email.created_at, 'Should have created_at timestamp');

      // Cleanup email
      if (email?.id) {
        await supabase.from('emails').delete().eq('id', email.id);
      }
    } finally {
      // Cleanup user
      if (user?.id) {
        await supabase.from('users').delete().eq('id', user.id);
      }
    }
  },
});

Deno.test({
  name: 'supabase-db - can log outgoing email',
  ignore: shouldSkip,
  async fn() {
    const supabase = createClient(SUPABASE_URL!, SUPABASE_KEY!);
    const testEmail = generateTestEmail();

    // Create user
    const { data: user } = await supabase
      .from('users')
      .insert({ email: testEmail })
      .select()
      .single();

    try {
      // Log outgoing email
      const { data: email, error } = await supabase
        .from('emails')
        .insert({
          user_id: user!.id,
          product_id: 'personifeed',
          direction: 'outgoing',
          type: 'newsletter_scheduled',
          from_email: 'personifeed@example.com',
          to_email: testEmail,
          subject: 'Daily Newsletter',
          body_html: '<p>Test content</p>',
          sent_at: new Date().toISOString(),
        })
        .select()
        .single();

      assertEquals(error, null, 'Should log email without error');
      assertExists(email, 'Should return logged email');
      assertEquals(email.direction, 'outgoing');
      assertEquals(email.type, 'newsletter_scheduled');
      assertExists(email.sent_at, 'Should have sent_at timestamp');

      // Cleanup email
      if (email?.id) {
        await supabase.from('emails').delete().eq('id', email.id);
      }
    } finally {
      // Cleanup user
      if (user?.id) {
        await supabase.from('users').delete().eq('id', user.id);
      }
    }
  },
});

Deno.test({
  name: 'supabase-db - can log AI token usage',
  ignore: shouldSkip,
  async fn() {
    const supabase = createClient(SUPABASE_URL!, SUPABASE_KEY!);
    const testEmail = generateTestEmail();

    // Create user
    const { data: user } = await supabase
      .from('users')
      .insert({ email: testEmail })
      .select()
      .single();

    try {
      // Log token usage
      const { data: tokenUsage, error } = await supabase
        .from('ai_token_usage')
        .insert({
          user_id: user!.id,
          product_id: 'llmbox',
          operation_type: 'chat_completion',
          model: 'gpt-4o-mini',
          prompt_tokens: 150,
          completion_tokens: 75,
          total_tokens: 225,
          estimated_cost_cents: 0.0225,
          metadata: {
            temperature: 0.7,
            max_tokens: 500,
          },
        })
        .select()
        .single();

      assertEquals(error, null, 'Should log token usage without error');
      assertExists(tokenUsage, 'Should return logged token usage');
      assertEquals(tokenUsage.user_id, user!.id);
      assertEquals(tokenUsage.model, 'gpt-4o-mini');
      assertEquals(tokenUsage.prompt_tokens, 150);
      assertEquals(tokenUsage.completion_tokens, 75);
      assertEquals(tokenUsage.total_tokens, 225);
      assertEquals(tokenUsage.estimated_cost_cents, 0.0225);
      assertExists(tokenUsage.metadata, 'Should have metadata JSONB');

      // Cleanup token usage
      if (tokenUsage?.id) {
        await supabase.from('ai_token_usage').delete().eq('id', tokenUsage.id);
      }
    } finally {
      // Cleanup user
      if (user?.id) {
        await supabase.from('users').delete().eq('id', user.id);
      }
    }
  },
});

Deno.test({
  name: 'supabase-db - email foreign key constraint works',
  ignore: shouldSkip,
  async fn() {
    const supabase = createClient(SUPABASE_URL!, SUPABASE_KEY!);

    // Try to create email with non-existent user_id (NULL should work, but invalid product_id should fail)
    const { data, error } = await supabase
      .from('emails')
      .insert({
        user_id: null,
        product_id: 'non_existent_product',
        direction: 'incoming',
        type: 'llm_query',
        from_email: 'test@example.com',
        to_email: 'test@llmbox.com',
      })
      .select()
      .single();

    assertExists(error, 'Should have error for invalid product_id');
    assertEquals(data, null, 'Should not return data');
    assertEquals(
      error.code === '23503' || error.message.toLowerCase().includes('foreign'),
      true,
      'Error should indicate foreign key violation',
    );
  },
});

Deno.test({
  name: 'supabase-db - user_products unique constraint works',
  ignore: shouldSkip,
  async fn() {
    const supabase = createClient(SUPABASE_URL!, SUPABASE_KEY!);
    const testEmail = generateTestEmail();

    // Create user
    const { data: user } = await supabase
      .from('users')
      .insert({ email: testEmail })
      .select()
      .single();

    // Create first user_product entry
    const { data: up1 } = await supabase
      .from('user_products')
      .insert({
        user_id: user!.id,
        product_id: 'llmbox',
        status: 'active',
      })
      .select()
      .single();

    try {
      // Try to create duplicate user_product entry - should fail
      const { data: up2, error } = await supabase
        .from('user_products')
        .insert({
          user_id: user!.id,
          product_id: 'llmbox',
          status: 'active',
        })
        .select()
        .single();

      assertExists(error, 'Should have error for duplicate user_product');
      assertEquals(up2, null, 'Should not return data for duplicate');
      assertEquals(
        error.code === '23505' || error.message.toLowerCase().includes('unique'),
        true,
        'Error should indicate unique constraint violation',
      );
    } finally {
      // Cleanup
      if (up1?.id) {
        await supabase.from('user_products').delete().eq('id', up1.id);
      }
      if (user?.id) {
        await supabase.from('users').delete().eq('id', user.id);
      }
    }
  },
});

Deno.test({
  name: 'supabase-db - can query user with emails and token usage',
  ignore: shouldSkip,
  async fn() {
    const supabase = createClient(SUPABASE_URL!, SUPABASE_KEY!);
    const testEmail = generateTestEmail();

    // Create user
    const { data: user } = await supabase
      .from('users')
      .insert({ email: testEmail })
      .select()
      .single();

    // Create email
    const { data: email } = await supabase
      .from('emails')
      .insert({
        user_id: user!.id,
        product_id: 'llmbox',
        direction: 'incoming',
        type: 'llm_query',
        from_email: testEmail,
        to_email: 'llmbox@example.com',
      })
      .select()
      .single();

    // Create token usage
    const { data: tokenUsage } = await supabase
      .from('ai_token_usage')
      .insert({
        user_id: user!.id,
        product_id: 'llmbox',
        operation_type: 'chat_completion',
        model: 'gpt-4o-mini',
        prompt_tokens: 100,
        completion_tokens: 50,
        total_tokens: 150,
        estimated_cost_cents: 0.015,
      })
      .select()
      .single();

    try {
      // Query user with related data
      const { data, error } = await supabase
        .from('users')
        .select('*, emails(*), ai_token_usage(*)')
        .eq('id', user!.id)
        .single();

      assertEquals(error, null, 'Should query without error');
      assertExists(data, 'Should return user data');
      assertExists(data.emails, 'Should include emails');
      assertExists(data.ai_token_usage, 'Should include token usage');
      assertEquals(Array.isArray(data.emails), true);
      assertEquals(Array.isArray(data.ai_token_usage), true);
      assertEquals(data.emails.length >= 1, true);
      assertEquals(data.ai_token_usage.length >= 1, true);
    } finally {
      // Cleanup
      if (tokenUsage?.id) {
        await supabase.from('ai_token_usage').delete().eq('id', tokenUsage.id);
      }
      if (email?.id) {
        await supabase.from('emails').delete().eq('id', email.id);
      }
      if (user?.id) {
        await supabase.from('users').delete().eq('id', user.id);
      }
    }
  },
});

Deno.test({
  name: 'supabase-db - can aggregate token costs per user',
  ignore: shouldSkip,
  async fn() {
    const supabase = createClient(SUPABASE_URL!, SUPABASE_KEY!);
    const testEmail = generateTestEmail();

    // Create user
    const { data: user } = await supabase
      .from('users')
      .insert({ email: testEmail })
      .select()
      .single();

    // Create multiple token usage entries
    const usageIds: string[] = [];
    for (let i = 0; i < 3; i++) {
      const { data } = await supabase
        .from('ai_token_usage')
        .insert({
          user_id: user!.id,
          product_id: 'llmbox',
          operation_type: 'chat_completion',
          model: 'gpt-4o-mini',
          prompt_tokens: 100,
          completion_tokens: 50,
          total_tokens: 150,
          estimated_cost_cents: 0.01,
        })
        .select()
        .single();

      if (data?.id) usageIds.push(data.id);
    }

    try {
      // Query aggregated costs
      const { data, error } = await supabase
        .from('ai_token_usage')
        .select('estimated_cost_cents')
        .eq('user_id', user!.id);

      assertEquals(error, null, 'Should query without error');
      assertExists(data, 'Should return data');
      assertEquals(data.length, 3);

      // Calculate total cost
      const totalCost = data.reduce((sum: number, entry: { estimated_cost_cents: number }) => {
        return sum + entry.estimated_cost_cents;
      }, 0);

      assertEquals(totalCost, 0.03, 'Total cost should be sum of all entries');
    } finally {
      // Cleanup
      for (const id of usageIds) {
        await supabase.from('ai_token_usage').delete().eq('id', id);
      }
      if (user?.id) {
        await supabase.from('users').delete().eq('id', user.id);
      }
    }
  },
});

Deno.test({
  name: 'supabase-db - can update user_product settings',
  ignore: shouldSkip,
  async fn() {
    const supabase = createClient(SUPABASE_URL!, SUPABASE_KEY!);
    const testEmail = generateTestEmail();

    // Create user
    const { data: user } = await supabase
      .from('users')
      .insert({ email: testEmail })
      .select()
      .single();

    // Create user_product
    const { data: userProduct } = await supabase
      .from('user_products')
      .insert({
        user_id: user!.id,
        product_id: 'personifeed',
        settings: { topics: ['AI'] },
        status: 'active',
      })
      .select()
      .single();

    try {
      // Update settings
      const { data: updated, error } = await supabase
        .from('user_products')
        .update({
          settings: { topics: ['AI', 'Tech', 'Science'], timezone: 'UTC' },
        })
        .eq('id', userProduct!.id)
        .select()
        .single();

      assertEquals(error, null, 'Should update without error');
      assertExists(updated, 'Should return updated user_product');
      assertEquals(updated.settings.topics.length, 3);
      assertEquals(updated.settings.timezone, 'UTC');
    } finally {
      // Cleanup
      if (userProduct?.id) {
        await supabase.from('user_products').delete().eq('id', userProduct.id);
      }
      if (user?.id) {
        await supabase.from('users').delete().eq('id', user.id);
      }
    }
  },
});
