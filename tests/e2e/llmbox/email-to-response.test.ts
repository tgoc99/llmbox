import { assertEquals, assertExists } from 'https://deno.land/std@0.224.0/assert/mod.ts';

/**
 * LLMBox E2E Test: Email-to-Response Flow
 *
 * Tests the complete email processing workflow:
 * 1. User sends email to assistant@mail.llmbox.pro
 * 2. SendGrid webhook delivers to email-webhook function
 * 3. Function parses email
 * 4. LLM generates response
 * 5. Response email sent back to user
 *
 * ⚠️ WARNING: This test makes real API calls and sends real emails!
 * - Costs money (OpenAI + SendGrid)
 * - Requires all API keys
 * - Takes 20-60 seconds to complete
 */

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY');
const WEBHOOK_URL = Deno.env.get('WEBHOOK_URL') ||
  'https://nopocimtfthppwssohty.supabase.co/functions/v1/email-webhook';
const TEST_EMAIL = Deno.env.get('TEST_RECIPIENT_EMAIL') || 'test@llmbox.pro';

const shouldSkip = !OPENAI_API_KEY || !SENDGRID_API_KEY;

if (shouldSkip) {
  console.log(
    '⚠️  Skipping LLMBox E2E test (missing API keys)',
  );
}

Deno.test({
  name: 'e2e-llmbox - complete email to response flow',
  ignore: shouldSkip,
  async fn() {
    console.log('🚀 Starting E2E test: Email to Response');

    // Step 1: Simulate SendGrid webhook with email data
    const formData = new FormData();
    formData.append('from', TEST_EMAIL);
    formData.append('to', 'assistant@mail.llmbox.pro');
    formData.append('subject', 'E2E Test Email');
    formData.append('text', 'What is 2+2? Please respond with just the number.');
    formData.append(
      'headers',
      JSON.stringify({ 'Message-ID': `<e2e-test-${Date.now()}@test.llmbox.pro>` }),
    );

    console.log('📧 Step 1: Sending webhook request...');

    // Step 2: Send to webhook
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      body: formData,
    });

    console.log(`✅ Step 2: Webhook responded with status ${response.status}`);

    // Step 3: Verify response
    assertEquals(
      response.status,
      200,
      'Webhook should return 200 status',
    );

    const data = await response.json();
    console.log('📦 Response data:', JSON.stringify(data, null, 2));

    assertExists(data, 'Should return response data');
    assertEquals(data.success, true, 'Response should indicate success');

    console.log('✅ E2E test completed successfully');
    console.log('📬 Check the test email inbox for the AI response');
  },
});

Deno.test({
  name: 'e2e-llmbox - handles email with thread context',
  ignore: shouldSkip,
  async fn() {
    console.log('🚀 Starting E2E test: Email with threading');

    const messageId = `<parent-${Date.now()}@test.llmbox.pro>`;

    // First email
    const formData1 = new FormData();
    formData1.append('from', TEST_EMAIL);
    formData1.append('to', 'assistant@mail.llmbox.pro');
    formData1.append('subject', 'Tell me about TypeScript');
    formData1.append('text', 'What is TypeScript?');
    formData1.append(
      'headers',
      JSON.stringify({ 'Message-ID': messageId }),
    );

    console.log('📧 Sending first email...');
    const response1 = await fetch(WEBHOOK_URL, {
      method: 'POST',
      body: formData1,
    });

    assertEquals(response1.status, 200);
    console.log('✅ First email processed');

    // Reply email (simulates thread)
    const formData2 = new FormData();
    formData2.append('from', TEST_EMAIL);
    formData2.append('to', 'assistant@mail.llmbox.pro');
    formData2.append('subject', 'Re: Tell me about TypeScript');
    formData2.append('text', 'Can you give me an example?');
    formData2.append(
      'headers',
      JSON.stringify({
        'Message-ID': `<reply-${Date.now()}@test.llmbox.pro>`,
        'In-Reply-To': messageId,
        'References': messageId,
      }),
    );

    console.log('📧 Sending reply email...');
    const response2 = await fetch(WEBHOOK_URL, {
      method: 'POST',
      body: formData2,
    });

    assertEquals(response2.status, 200);
    const data = await response2.json();
    assertEquals(data.success, true);

    console.log('✅ E2E threading test completed');
  },
});

Deno.test({
  name: 'e2e-llmbox - handles malformed email gracefully',
  ignore: shouldSkip,
  async fn() {
    console.log('🚀 Starting E2E test: Malformed email handling');

    // Missing required fields
    const formData = new FormData();
    formData.append('from', 'invalid-email-format');
    formData.append('text', 'Test message');

    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      body: formData,
    });

    // Should return error response
    assertEquals(
      response.status === 400 || response.status === 500,
      true,
      'Should return error status for malformed email',
    );

    console.log('✅ Malformed email handled correctly');
  },
});
