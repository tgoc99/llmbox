import { assertEquals, assertExists } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

/**
 * Personifeed E2E Test: Signup to Confirmation
 *
 * Tests the complete signup workflow:
 * 1. User submits signup form (email + prompt)
 * 2. personifeed-signup function processes request
 * 3. User record created in database
 * 4. Confirmation email sent to user
 *
 * ⚠️ WARNING: This test makes real API calls and database writes!
 */

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY');
const SIGNUP_URL = Deno.env.get('SIGNUP_URL') ||
  'https://nopocimtfthppwssohty.supabase.co/functions/v1/personifeed-signup';

const shouldSkip = !SUPABASE_URL || !SUPABASE_KEY || !SENDGRID_API_KEY;

if (shouldSkip) {
  console.log('⚠️  Skipping Personifeed signup E2E test (missing credentials)');
}

// Test helper
const generateTestEmail = (): string => {
  return `e2e-test-${Date.now()}-${Math.random().toString(36).substring(7)}@test.llmbox.pro`;
};

Deno.test({
  name: 'e2e-personifeed - complete signup flow',
  ignore: shouldSkip,
  async fn() {
    console.log('🚀 Starting E2E test: Personifeed Signup');

    const testEmail = generateTestEmail();
    const testPrompt = 'Send me daily AI news and tech updates';

    console.log(`📧 Test email: ${testEmail}`);

    // Step 1: Submit signup
    console.log('📝 Step 1: Submitting signup...');
    const response = await fetch(SIGNUP_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testEmail,
        prompt: testPrompt,
      }),
    });

    console.log(`✅ Step 1: Signup responded with status ${response.status}`);

    assertEquals(response.status, 200, 'Should return 200 status');

    const data = await response.json();
    console.log('📦 Response data:', JSON.stringify(data, null, 2));

    assertExists(data, 'Should return response data');
    assertEquals(data.success, true, 'Should indicate success');
    assertExists(data.userId, 'Should return user ID');

    // Step 2: Verify user in database
    console.log('🔍 Step 2: Verifying user in database...');
    const supabase = createClient(SUPABASE_URL!, SUPABASE_KEY!);

    const { data: user, error } = await supabase
      .from('personifeed_users')
      .select('*')
      .eq('id', data.userId)
      .single();

    assertEquals(error, null, 'Should query without error');
    assertExists(user, 'User should exist in database');
    assertEquals(user.email, testEmail);
    assertEquals(user.prompt, testPrompt);
    assertEquals(user.is_active, true);

    console.log('✅ Step 2: User verified in database');

    // Cleanup
    console.log('🧹 Cleaning up test data...');
    await supabase.from('personifeed_users').delete().eq('id', data.userId);

    console.log('✅ E2E signup test completed successfully');
    console.log('📬 Check test email inbox for confirmation email');
  },
});

Deno.test({
  name: 'e2e-personifeed - rejects duplicate email signup',
  ignore: shouldSkip,
  async fn() {
    console.log('🚀 Starting E2E test: Duplicate signup rejection');

    const testEmail = generateTestEmail();
    const testPrompt = 'Daily tech news';

    // First signup
    console.log('📝 First signup...');
    const response1 = await fetch(SIGNUP_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, prompt: testPrompt }),
    });

    assertEquals(response1.status, 200);
    const data1 = await response1.json();
    const userId = data1.userId;

    // Try to signup again with same email
    console.log('📝 Attempting duplicate signup...');
    const response2 = await fetch(SIGNUP_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, prompt: 'Different prompt' }),
    });

    // Should return error
    assertEquals(
      response2.status === 400 || response2.status === 409,
      true,
      'Should reject duplicate email',
    );

    const data2 = await response2.json();
    assertEquals(data2.success, false);
    assertExists(data2.error);

    // Cleanup
    const supabase = createClient(SUPABASE_URL!, SUPABASE_KEY!);
    await supabase.from('personifeed_users').delete().eq('id', userId);

    console.log('✅ Duplicate signup correctly rejected');
  },
});

Deno.test({
  name: 'e2e-personifeed - validates email format',
  ignore: shouldSkip,
  async fn() {
    console.log('🚀 Starting E2E test: Email validation');

    const invalidEmail = 'not-a-valid-email';
    const testPrompt = 'Daily news';

    const response = await fetch(SIGNUP_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: invalidEmail, prompt: testPrompt }),
    });

    assertEquals(
      response.status === 400,
      true,
      'Should return 400 for invalid email',
    );

    const data = await response.json();
    assertEquals(data.success, false);
    assertExists(data.error);
    assertEquals(
      data.error.toLowerCase().includes('email'),
      true,
      'Error should mention email',
    );

    console.log('✅ Invalid email correctly rejected');
  },
});
