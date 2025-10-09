import { assertEquals, assertExists } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

/**
 * Personifeed E2E Test: Daily Newsletter Generation
 *
 * Tests the complete cron job workflow:
 * 1. Cron job triggers personifeed-cron function
 * 2. Function fetches all active users
 * 3. For each user, generates personalized newsletter
 * 4. Newsletter content saved to database
 * 5. Email sent to user
 *
 * ⚠️ WARNING: This test makes real API calls!
 * - Costs money (OpenAI + SendGrid)
 * - Takes 30-120 seconds depending on user count
 */

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY');
const CRON_URL = Deno.env.get('CRON_URL') ||
  'https://nopocimtfthppwssohty.supabase.co/functions/v1/personifeed-cron';

const shouldSkip = !SUPABASE_URL || !SUPABASE_KEY || !OPENAI_API_KEY || !SENDGRID_API_KEY;

if (shouldSkip) {
  console.log('⚠️  Skipping Personifeed cron E2E test (missing credentials)');
}

// Test helper
const generateTestEmail = (): string => {
  return `e2e-cron-${Date.now()}-${Math.random().toString(36).substring(7)}@test.llmbox.pro`;
};

Deno.test({
  name: 'e2e-personifeed - cron generates and sends newsletter',
  ignore: shouldSkip,
  async fn() {
    console.log('🚀 Starting E2E test: Newsletter Generation');

    const supabase = createClient(SUPABASE_URL!, SUPABASE_KEY!);
    const testEmail = generateTestEmail();

    // Step 1: Create test user
    console.log('👤 Step 1: Creating test user...');
    const { data: user, error: userError } = await supabase
      .from('personifeed_users')
      .insert({
        email: testEmail,
        prompt: 'Send me AI news and tech updates',
        is_active: true,
      })
      .select()
      .single();

    assertEquals(userError, null);
    assertExists(user);
    console.log(`✅ Test user created: ${user.id}`);

    try {
      // Step 2: Trigger cron job
      console.log('⏰ Step 2: Triggering cron job...');
      const response = await fetch(CRON_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      console.log(`✅ Cron responded with status ${response.status}`);
      assertEquals(response.status, 200);

      const data = await response.json();
      console.log('📦 Cron response:', JSON.stringify(data, null, 2));

      assertExists(data);
      assertEquals(data.success, true);
      assertEquals(typeof data.newslettersSent, 'number');
      assertEquals(data.newslettersSent >= 1, true, 'Should send at least one newsletter');

      // Step 3: Verify newsletter in database
      console.log('🔍 Step 3: Verifying newsletter in database...');

      // Wait a moment for database write to complete
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const { data: newsletters, error: newsletterError } = await supabase
        .from('personifeed_newsletters')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      assertEquals(newsletterError, null);
      assertExists(newsletters);
      assertEquals(newsletters.length >= 1, true, 'Should have newsletter record');

      const newsletter = newsletters[0];
      assertExists(newsletter.content);
      assertExists(newsletter.sent_at);
      assertEquals(
        newsletter.content.length > 100,
        true,
        'Newsletter should have substantial content',
      );

      console.log('✅ Newsletter verified in database');
      console.log(`📬 Newsletter length: ${newsletter.content.length} characters`);

      console.log('✅ E2E cron test completed successfully');
    } finally {
      // Cleanup
      console.log('🧹 Cleaning up test data...');
      await supabase.from('personifeed_newsletters').delete().eq('user_id', user.id);
      await supabase.from('personifeed_users').delete().eq('id', user.id);
    }
  },
});

Deno.test({
  name: 'e2e-personifeed - cron skips inactive users',
  ignore: shouldSkip,
  async fn() {
    console.log('🚀 Starting E2E test: Skip inactive users');

    const supabase = createClient(SUPABASE_URL!, SUPABASE_KEY!);
    const testEmail = generateTestEmail();

    // Create inactive user
    const { data: user } = await supabase
      .from('personifeed_users')
      .insert({
        email: testEmail,
        prompt: 'Test prompt',
        is_active: false, // Inactive
      })
      .select()
      .single();

    try {
      // Trigger cron
      const response = await fetch(CRON_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      assertEquals(response.status, 200);

      // Verify no newsletter created for inactive user
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const { data: newsletters } = await supabase
        .from('personifeed_newsletters')
        .select('*')
        .eq('user_id', user!.id);

      assertEquals(newsletters?.length || 0, 0, 'Should not create newsletter for inactive user');

      console.log('✅ Inactive user correctly skipped');
    } finally {
      // Cleanup
      await supabase.from('personifeed_users').delete().eq('id', user!.id);
    }
  },
});
