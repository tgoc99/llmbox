/**
 * Unit tests for email sender module
 */

import { assertEquals, assertRejects } from 'jsr:@std/assert';
import { formatOutgoingEmail, sendEmail } from '../../supabase/functions/email-webhook/emailSender.ts';
import type { IncomingEmail, LLMResponse } from '../../supabase/functions/email-webhook/types.ts';

Deno.test('formatOutgoingEmail - creates correct OutgoingEmail structure', () => {
  const incomingEmail: IncomingEmail = {
    from: 'user@example.com',
    to: 'assistant@mydomain.com',
    subject: 'Hello',
    body: 'How are you?',
    messageId: '<abc123@example.com>',
    inReplyTo: null,
    references: [],
    timestamp: new Date(),
  };

  const llmResponse: LLMResponse = {
    content: 'I am doing great, thanks for asking!',
    model: 'gpt-3.5-turbo',
    tokenCount: 50,
    completionTime: 1500,
  };

  const result = formatOutgoingEmail(incomingEmail, llmResponse);

  assertEquals(result.from, 'assistant@mydomain.com');
  assertEquals(result.to, 'user@example.com');
  assertEquals(result.subject, 'Re: Hello');
  assertEquals(result.body, 'I am doing great, thanks for asking!');
  assertEquals(result.inReplyTo, '<abc123@example.com>');
  assertEquals(result.references, ['<abc123@example.com>']);
});

Deno.test('formatOutgoingEmail - subject includes Re: prefix', () => {
  const incomingEmail: IncomingEmail = {
    from: 'user@example.com',
    to: 'assistant@mydomain.com',
    subject: 'Question about pricing',
    body: 'What are your rates?',
    messageId: '<msg1@example.com>',
    inReplyTo: null,
    references: [],
    timestamp: new Date(),
  };

  const llmResponse: LLMResponse = {
    content: 'Our pricing starts at $10/month.',
    model: 'gpt-3.5-turbo',
    tokenCount: 30,
    completionTime: 1200,
  };

  const result = formatOutgoingEmail(incomingEmail, llmResponse);

  assertEquals(result.subject, 'Re: Question about pricing');
});

Deno.test('formatOutgoingEmail - does not double Re: prefix', () => {
  const incomingEmail: IncomingEmail = {
    from: 'user@example.com',
    to: 'assistant@mydomain.com',
    subject: 'Re: Follow up question',
    body: 'Can you clarify?',
    messageId: '<msg2@example.com>',
    inReplyTo: '<msg1@example.com>',
    references: ['<msg0@example.com>', '<msg1@example.com>'],
    timestamp: new Date(),
  };

  const llmResponse: LLMResponse = {
    content: 'Sure, let me explain...',
    model: 'gpt-3.5-turbo',
    tokenCount: 40,
    completionTime: 1300,
  };

  const result = formatOutgoingEmail(incomingEmail, llmResponse);

  assertEquals(result.subject, 'Re: Follow up question');
});

Deno.test('formatOutgoingEmail - recipient is set to original sender', () => {
  const incomingEmail: IncomingEmail = {
    from: 'sender@company.com',
    to: 'assistant@mydomain.com',
    subject: 'Test',
    body: 'Testing',
    messageId: '<test@company.com>',
    inReplyTo: null,
    references: [],
    timestamp: new Date(),
  };

  const llmResponse: LLMResponse = {
    content: 'Response',
    model: 'gpt-3.5-turbo',
    tokenCount: 20,
    completionTime: 1000,
  };

  const result = formatOutgoingEmail(incomingEmail, llmResponse);

  assertEquals(result.to, 'sender@company.com');
});

Deno.test('formatOutgoingEmail - In-Reply-To header set to original message ID', () => {
  const incomingEmail: IncomingEmail = {
    from: 'user@example.com',
    to: 'assistant@mydomain.com',
    subject: 'Test',
    body: 'Test body',
    messageId: '<original-msg-id@example.com>',
    inReplyTo: null,
    references: [],
    timestamp: new Date(),
  };

  const llmResponse: LLMResponse = {
    content: 'Test response',
    model: 'gpt-3.5-turbo',
    tokenCount: 25,
    completionTime: 1100,
  };

  const result = formatOutgoingEmail(incomingEmail, llmResponse);

  assertEquals(result.inReplyTo, '<original-msg-id@example.com>');
});

Deno.test('formatOutgoingEmail - References array includes original message ID', () => {
  const incomingEmail: IncomingEmail = {
    from: 'user@example.com',
    to: 'assistant@mydomain.com',
    subject: 'Test',
    body: 'Test body',
    messageId: '<msg3@example.com>',
    inReplyTo: '<msg2@example.com>',
    references: ['<msg1@example.com>', '<msg2@example.com>'],
    timestamp: new Date(),
  };

  const llmResponse: LLMResponse = {
    content: 'Test response',
    model: 'gpt-3.5-turbo',
    tokenCount: 25,
    completionTime: 1100,
  };

  const result = formatOutgoingEmail(incomingEmail, llmResponse);

  assertEquals(result.references, ['<msg1@example.com>', '<msg2@example.com>', '<msg3@example.com>']);
});

Deno.test('sendEmail - throws error if SENDGRID_API_KEY not configured', async () => {
  // Save original value
  const originalKey = Deno.env.get('SENDGRID_API_KEY');
  const originalAddress = Deno.env.get('SERVICE_EMAIL_ADDRESS');

  // Clear env vars
  Deno.env.delete('SENDGRID_API_KEY');
  Deno.env.set('SERVICE_EMAIL_ADDRESS', 'test@example.com');

  const outgoingEmail = {
    from: 'assistant@mydomain.com',
    to: 'user@example.com',
    subject: 'Re: Test',
    body: 'Test body',
    inReplyTo: '<msg@example.com>',
    references: ['<msg@example.com>'],
  };

  await assertRejects(
    async () => await sendEmail(outgoingEmail),
    Error,
    'SENDGRID_API_KEY is not configured',
  );

  // Restore original values
  if (originalKey) Deno.env.set('SENDGRID_API_KEY', originalKey);
  if (originalAddress) Deno.env.set('SERVICE_EMAIL_ADDRESS', originalAddress);
});

Deno.test('sendEmail - throws error if SERVICE_EMAIL_ADDRESS not configured', async () => {
  // Save original value
  const originalKey = Deno.env.get('SENDGRID_API_KEY');
  const originalAddress = Deno.env.get('SERVICE_EMAIL_ADDRESS');

  // Set API key but clear service address
  Deno.env.set('SENDGRID_API_KEY', 'SG.test-key');
  Deno.env.delete('SERVICE_EMAIL_ADDRESS');

  const outgoingEmail = {
    from: 'assistant@mydomain.com',
    to: 'user@example.com',
    subject: 'Re: Test',
    body: 'Test body',
    inReplyTo: '<msg@example.com>',
    references: ['<msg@example.com>'],
  };

  await assertRejects(
    async () => await sendEmail(outgoingEmail),
    Error,
    'SERVICE_EMAIL_ADDRESS is not configured',
  );

  // Restore original values
  if (originalKey) Deno.env.set('SENDGRID_API_KEY', originalKey);
  if (originalAddress) Deno.env.set('SERVICE_EMAIL_ADDRESS', originalAddress);
});

Deno.test('sendEmail - creates correct SendGrid API payload structure', async () => {
  // Mock fetch
  const originalFetch = globalThis.fetch;
  let capturedRequest: Request | null = null;

  globalThis.fetch = async (input: string | URL | Request) => {
    if (input instanceof Request) {
      capturedRequest = input;
    }
    return new Response(null, { status: 202 });
  };

  // Set required env vars
  Deno.env.set('SENDGRID_API_KEY', 'SG.test-key');
  Deno.env.set('SERVICE_EMAIL_ADDRESS', 'assistant@mydomain.com');

  const outgoingEmail = {
    from: 'assistant@mydomain.com',
    to: 'user@example.com',
    subject: 'Re: Test',
    body: 'Test response body',
    inReplyTo: '<original@example.com>',
    references: ['<msg1@example.com>', '<original@example.com>'],
  };

  try {
    await sendEmail(outgoingEmail);

    // Verify request was captured
    assertEquals(capturedRequest !== null, true);

    if (capturedRequest) {
      // Verify headers
      assertEquals(capturedRequest.headers.get('Authorization'), 'Bearer SG.test-key');
      assertEquals(capturedRequest.headers.get('Content-Type'), 'application/json');

      // Verify body structure
      const body = await capturedRequest.text();
      const payload = JSON.parse(body);

      assertEquals(payload.from.email, 'assistant@mydomain.com');
      assertEquals(payload.personalizations[0].to[0].email, 'user@example.com');
      assertEquals(payload.personalizations[0].subject, 'Re: Test');
      assertEquals(payload.personalizations[0].headers['In-Reply-To'], '<original@example.com>');
      assertEquals(
        payload.personalizations[0].headers.References,
        '<msg1@example.com> <original@example.com>',
      );
      assertEquals(payload.content[0].type, 'text/plain');
      assertEquals(payload.content[0].value, 'Test response body');
    }
  } finally {
    // Restore original fetch
    globalThis.fetch = originalFetch;
  }
});

Deno.test('sendEmail - handles 401 auth error', async () => {
  // Mock fetch to return 401
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    return new Response('Unauthorized', { status: 401 });
  };

  // Set required env vars
  Deno.env.set('SENDGRID_API_KEY', 'SG.invalid-key');
  Deno.env.set('SERVICE_EMAIL_ADDRESS', 'assistant@mydomain.com');

  const outgoingEmail = {
    from: 'assistant@mydomain.com',
    to: 'user@example.com',
    subject: 'Re: Test',
    body: 'Test body',
    inReplyTo: '<msg@example.com>',
    references: ['<msg@example.com>'],
  };

  try {
    await assertRejects(
      async () => await sendEmail(outgoingEmail),
      Error,
      'SendGrid auth error',
    );
  } finally {
    // Restore original fetch
    globalThis.fetch = originalFetch;
  }
});

Deno.test('sendEmail - handles 400 bad request error', async () => {
  // Mock fetch to return 400
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    return new Response('Bad Request: Invalid email format', { status: 400 });
  };

  // Set required env vars
  Deno.env.set('SENDGRID_API_KEY', 'SG.test-key');
  Deno.env.set('SERVICE_EMAIL_ADDRESS', 'assistant@mydomain.com');

  const outgoingEmail = {
    from: 'assistant@mydomain.com',
    to: 'invalid-email',
    subject: 'Re: Test',
    body: 'Test body',
    inReplyTo: '<msg@example.com>',
    references: ['<msg@example.com>'],
  };

  try {
    await assertRejects(
      async () => await sendEmail(outgoingEmail),
      Error,
      'SendGrid bad request',
    );
  } finally {
    // Restore original fetch
    globalThis.fetch = originalFetch;
  }
});

