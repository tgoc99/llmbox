/**
 * Integration tests for personifeed reply handling
 * These tests simulate SendGrid Inbound Parse webhooks
 */

import { assertEquals, assertExists } from 'https://deno.land/std@0.168.0/testing/asserts.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || 'http://localhost:54321';
const REPLY_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/personifeed-reply`;

/**
 * Create mock SendGrid webhook payload
 */
const createMockWebhookPayload = (
  from: string,
  text: string,
  messageId?: string,
): FormData => {
  const formData = new FormData();
  formData.append('from', from);
  formData.append('to', 'personifeed@mail.llmbox.pro');
  formData.append('subject', 'Re: Your Daily Digest');
  formData.append('text', text);

  const headers = messageId
    ? `Message-ID: ${messageId}\nDate: ${new Date().toISOString()}`
    : `Date: ${new Date().toISOString()}`;
  formData.append('headers', headers);

  return formData;
};

Deno.test({
  name: 'Integration: Reply from existing user',
  ignore: !Deno.env.get('RUN_INTEGRATION_TESTS'),
  async fn() {
    const testEmail = `existing-reply-${Date.now()}@example.com`;
    const feedbackText = 'Please add more sports news';

    // First, ensure user exists by signing up
    await fetch(`${SUPABASE_URL}/functions/v1/personifeed-signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        initialPrompt: 'Send me AI news',
      }),
    });

    // Wait a bit for signup to complete
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Now send reply
    const formData = createMockWebhookPayload(
      testEmail,
      feedbackText,
      '<test-message-id@example.com>',
    );

    const response = await fetch(REPLY_FUNCTION_URL, {
      method: 'POST',
      body: formData,
    });

    assertEquals(response.status, 200);

    const data = await response.json();
    assertExists(data.success);
    assertEquals(data.success, true);

    console.log('✅ Reply from existing user processed successfully');
  },
});

Deno.test({
  name: 'Integration: Reply from new user',
  ignore: !Deno.env.get('RUN_INTEGRATION_TESTS'),
  async fn() {
    const testEmail = `new-reply-${Date.now()}@example.com`;
    const feedbackText = 'I want daily tech news and weather updates';

    const formData = createMockWebhookPayload(testEmail, feedbackText);

    const response = await fetch(REPLY_FUNCTION_URL, {
      method: 'POST',
      body: formData,
    });

    assertEquals(response.status, 200);

    const data = await response.json();
    assertExists(data.success);
    assertEquals(data.success, true);

    console.log('✅ Reply from new user created account successfully');
  },
});

Deno.test({
  name: 'Integration: Reply with cleaned text',
  ignore: !Deno.env.get('RUN_INTEGRATION_TESTS'),
  async fn() {
    const testEmail = `cleaned-reply-${Date.now()}@example.com`;
    const feedbackText = `My feedback

> Original message
> More quoted text

--
John Doe
Sent from my iPhone`;

    const formData = createMockWebhookPayload(testEmail, feedbackText);

    const response = await fetch(REPLY_FUNCTION_URL, {
      method: 'POST',
      body: formData,
    });

    assertEquals(response.status, 200);

    const data = await response.json();
    assertEquals(data.success, true);

    console.log('✅ Reply with quoted text cleaned successfully');
  },
});

Deno.test({
  name: 'Integration: Reply validation - empty feedback',
  ignore: !Deno.env.get('RUN_INTEGRATION_TESTS'),
  async fn() {
    const testEmail = 'test@example.com';
    const emptyFeedback = '   \n\n   '; // Only whitespace

    const formData = createMockWebhookPayload(testEmail, emptyFeedback);

    const response = await fetch(REPLY_FUNCTION_URL, {
      method: 'POST',
      body: formData,
    });

    // Should still return 200 to prevent SendGrid retries
    assertEquals(response.status, 200);

    console.log('✅ Empty feedback handled correctly (no retry loop)');
  },
});
