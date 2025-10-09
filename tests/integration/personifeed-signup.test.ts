/**
 * Integration tests for personifeed signup flow
 * These tests require:
 * - Supabase project running (local or remote)
 * - Database migration applied
 * - Edge function deployed or running locally
 */

import { assertEquals, assertExists } from 'https://deno.land/std@0.168.0/testing/asserts.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || 'http://localhost:54321';
const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/personifeed-signup`;

Deno.test({
  name: 'Integration: Signup flow - new user',
  ignore: !Deno.env.get('RUN_INTEGRATION_TESTS'),
  async fn() {
    const testEmail = `test-${Date.now()}@example.com`;
    const testPrompt = 'Send me daily AI news and tech updates';

    const response = await fetch(FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testEmail,
        initialPrompt: testPrompt,
      }),
    });

    assertEquals(response.status, 200);

    const data = await response.json();
    assertExists(data.success);
    assertEquals(data.success, true);
    assertExists(data.message);
    assertExists(data.userId);

    console.log('✅ New user signup successful:', {
      email: testEmail,
      userId: data.userId,
    });
  },
});

Deno.test({
  name: 'Integration: Signup flow - existing user',
  ignore: !Deno.env.get('RUN_INTEGRATION_TESTS'),
  async fn() {
    const testEmail = `existing-${Date.now()}@example.com`;
    const firstPrompt = 'First request: AI news';
    const secondPrompt = 'Second request: Also add weather';

    // First signup
    const response1 = await fetch(FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testEmail,
        initialPrompt: firstPrompt,
      }),
    });

    assertEquals(response1.status, 200);
    const data1 = await response1.json();
    const userId = data1.userId;

    // Second signup with same email
    const response2 = await fetch(FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testEmail,
        initialPrompt: secondPrompt,
      }),
    });

    assertEquals(response2.status, 200);
    const data2 = await response2.json();

    assertEquals(data2.success, true);
    assertEquals(data2.userId, userId); // Should be same user

    console.log('✅ Existing user signup successful:', {
      email: testEmail,
      userId: data2.userId,
    });
  },
});

Deno.test({
  name: 'Integration: Signup validation - invalid email',
  ignore: !Deno.env.get('RUN_INTEGRATION_TESTS'),
  async fn() {
    const response = await fetch(FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'invalid-email',
        initialPrompt: 'Test prompt',
      }),
    });

    assertEquals(response.status, 400);

    const data = await response.json();
    assertExists(data.error);
    assertEquals(data.error.includes('email'), true);

    console.log('✅ Invalid email rejected correctly');
  },
});

Deno.test({
  name: 'Integration: Signup validation - empty prompt',
  ignore: !Deno.env.get('RUN_INTEGRATION_TESTS'),
  async fn() {
    const response = await fetch(FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        initialPrompt: '',
      }),
    });

    assertEquals(response.status, 400);

    const data = await response.json();
    assertExists(data.error);

    console.log('✅ Empty prompt rejected correctly');
  },
});

Deno.test({
  name: 'Integration: Signup validation - prompt too long',
  ignore: !Deno.env.get('RUN_INTEGRATION_TESTS'),
  async fn() {
    const longPrompt = 'a'.repeat(2001);

    const response = await fetch(FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        initialPrompt: longPrompt,
      }),
    });

    assertEquals(response.status, 400);

    const data = await response.json();
    assertExists(data.error);
    assertEquals(data.error.includes('too long'), true);

    console.log('✅ Long prompt rejected correctly');
  },
});

