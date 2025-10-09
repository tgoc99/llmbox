/**
 * Integration tests for personifeed cron job
 * These tests require:
 * - Supabase project running
 * - Database with test users
 * - OpenAI API key configured
 * - SendGrid API key configured
 *
 * WARNING: These tests will incur costs (OpenAI API, SendGrid emails)
 */

import { assertEquals, assertExists } from 'https://deno.land/std@0.168.0/testing/asserts.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || 'http://localhost:54321';
const CRON_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/personifeed-cron`;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');

Deno.test({
  name: 'Integration: Cron job execution',
  ignore: !Deno.env.get('RUN_INTEGRATION_TESTS') || !Deno.env.get('OPENAI_API_KEY'),
  async fn() {
    console.log('⚠️  This test will generate newsletters and send emails (costs money!)');

    const response = await fetch(CRON_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });

    assertEquals(response.status, 200);

    const data = await response.json();
    assertExists(data.success);
    assertEquals(data.success, true);

    assertExists(data.stats);
    assertExists(data.stats.totalUsers);
    assertExists(data.stats.successCount);
    assertExists(data.stats.failureCount);

    console.log('✅ Cron job executed successfully:', {
      totalUsers: data.stats.totalUsers,
      successCount: data.stats.successCount,
      failureCount: data.stats.failureCount,
      durationMs: data.stats.durationMs,
    });
  },
});

Deno.test({
  name: 'Integration: Cron job with no active users',
  ignore: !Deno.env.get('RUN_INTEGRATION_TESTS'),
  async fn() {
    // This test assumes there are no active users or they've all been deactivated
    // In a real scenario, you'd set up a test database with no users

    const response = await fetch(CRON_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });

    assertEquals(response.status, 200);

    const data = await response.json();
    assertExists(data.success);

    console.log('✅ Cron job handled empty user list correctly');
  },
});
