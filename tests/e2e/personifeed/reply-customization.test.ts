import { assertEquals, assertExists } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

/**
 * Personifeed E2E Test: Reply Customization Flow
 *
 * Tests the reply handling workflow:
 * 1. User receives newsletter with dynamic reply address
 * 2. User replies to newsletter with feedback
 * 3. personifeed-reply function processes reply
 * 4. Customization saved to database
 * 5. Future newsletters reflect customization
 *
 * ⚠️ WARNING: This test makes real API calls!
 */

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const REPLY_URL = Deno.env.get('REPLY_URL') ||
  'https://nopocimtfthppwssohty.supabase.co/functions/v1/personifeed-reply';

const shouldSkip = !SUPABASE_URL || !SUPABASE_KEY;

if (shouldSkip) {
  console.log('⚠️  Skipping Personifeed reply E2E test (missing credentials)');
}

// Test helper
const generateTestEmail = (): string => {
  return `e2e-reply-${Date.now()}-${Math.random().toString(36).substring(7)}@test.llmbox.pro`;
};

Deno.test({
  name: 'e2e-personifeed - complete reply and customization flow',
  ignore: shouldSkip,
  async fn() {
    console.log('🚀 Starting E2E test: Reply Customization');

    const supabase = createClient(SUPABASE_URL!, SUPABASE_KEY!);
    const testEmail = generateTestEmail();

    // Step 1: Create test user
    console.log('👤 Step 1: Creating test user...');
    const { data: user, error: userError } = await supabase
      .from('personifeed_users')
      .insert({
        email: testEmail,
        prompt: 'Send me AI news',
        is_active: true,
      })
      .select()
      .single();

    assertEquals(userError, null);
    assertExists(user);
    console.log(`✅ Test user created: ${user.id}`);

    try {
      // Step 2: Simulate user reply
      console.log('📧 Step 2: Simulating user reply...');

      const replyAddress = `reply+${user.id}@mail.llmbox.pro`;
      const feedbackText = 'Please include more information about AI startups and funding news.';

      const formData = new FormData();
      formData.append('from', testEmail);
      formData.append('to', replyAddress);
      formData.append('text', feedbackText);
      formData.append(
        'headers',
        JSON.stringify({ 'Message-ID': `<reply-${Date.now()}@test.llmbox.pro>` }),
      );

      const response = await fetch(REPLY_URL, {
        method: 'POST',
        body: formData,
      });

      console.log(`✅ Reply processed with status ${response.status}`);
      assertEquals(response.status, 200);

      const data = await response.json();
      console.log('📦 Reply response:', JSON.stringify(data, null, 2));
      assertEquals(data.success, true);

      // Step 3: Verify customization in database
      console.log('🔍 Step 3: Verifying customization in database...');

      // Wait for database write
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const { data: customizations, error: customError } = await supabase
        .from('personifeed_customizations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      assertEquals(customError, null);
      assertExists(customizations);
      assertEquals(customizations.length >= 1, true, 'Should have customization record');

      const customization = customizations[0];
      assertEquals(customization.customization_type, 'reply');
      assertEquals(customization.content, feedbackText);

      console.log('✅ Customization verified in database');

      // Step 4: Verify user prompt was updated
      console.log('🔍 Step 4: Verifying user prompt updated...');

      const { data: updatedUser } = await supabase
        .from('personifeed_users')
        .select('*')
        .eq('id', user.id)
        .single();

      assertExists(updatedUser);
      assertEquals(
        updatedUser.prompt.includes('startups') || updatedUser.prompt.includes('funding'),
        true,
        'User prompt should reflect feedback',
      );

      console.log('✅ User prompt updated with feedback');
      console.log('✅ E2E reply test completed successfully');
    } finally {
      // Cleanup
      console.log('🧹 Cleaning up test data...');
      await supabase.from('personifeed_customizations').delete().eq('user_id', user.id);
      await supabase.from('personifeed_users').delete().eq('id', user.id);
    }
  },
});

Deno.test({
  name: 'e2e-personifeed - reply from unregistered email is rejected',
  ignore: shouldSkip,
  async fn() {
    console.log('🚀 Starting E2E test: Reject unregistered reply');

    const supabase = createClient(SUPABASE_URL!, SUPABASE_KEY!);
    const testEmail = generateTestEmail();

    // Create user
    const { data: user } = await supabase
      .from('personifeed_users')
      .insert({
        email: testEmail,
        prompt: 'Test prompt',
        is_active: true,
      })
      .select()
      .single();

    try {
      // Try to reply from different email
      const wrongEmail = 'different-' + testEmail;
      const replyAddress = `reply+${user!.id}@mail.llmbox.pro`;

      const formData = new FormData();
      formData.append('from', wrongEmail); // Wrong email!
      formData.append('to', replyAddress);
      formData.append('text', 'Unauthorized feedback');
      formData.append('headers', '');

      const response = await fetch(REPLY_URL, {
        method: 'POST',
        body: formData,
      });

      // Should be rejected
      assertEquals(
        response.status === 400 || response.status === 403,
        true,
        'Should reject reply from unregistered email',
      );

      console.log('✅ Unregistered reply correctly rejected');
    } finally {
      // Cleanup
      await supabase.from('personifeed_users').delete().eq('id', user!.id);
    }
  },
});

Deno.test({
  name: 'e2e-personifeed - reply with malformed user ID is rejected',
  ignore: shouldSkip,
  async fn() {
    console.log('🚀 Starting E2E test: Reject malformed reply address');

    const testEmail = generateTestEmail();
    const malformedAddress = 'reply+invalid-user-id@mail.llmbox.pro';

    const formData = new FormData();
    formData.append('from', testEmail);
    formData.append('to', malformedAddress);
    formData.append('text', 'Test feedback');
    formData.append('headers', '');

    const response = await fetch(REPLY_URL, {
      method: 'POST',
      body: formData,
    });

    // Should be rejected (user not found)
    assertEquals(
      response.status === 404 || response.status === 400,
      true,
      'Should reject reply with invalid user ID',
    );

    console.log('✅ Malformed reply address correctly rejected');
  },
});
