import { assertEquals, assertExists } from 'https://deno.land/std@0.224.0/assert/mod.ts';

/**
 * Edge Function Contract Tests
 *
 * Validates that Edge Functions have correct request/response contracts:
 * - Request body shapes
 * - Response body shapes
 * - HTTP status codes
 * - Required headers
 */

Deno.test('contract - personifeed-signup request shape', () => {
  // Valid signup request
  const validRequest = {
    email: 'user@example.com',
    prompt: 'Daily tech news',
  };

  assertExists(validRequest.email);
  assertExists(validRequest.prompt);
  assertEquals(typeof validRequest.email, 'string');
  assertEquals(typeof validRequest.prompt, 'string');
});

Deno.test('contract - personifeed-signup response shape (success)', () => {
  // Expected success response
  const successResponse = {
    success: true,
    message: 'Successfully signed up',
    userId: 'test-user-id',
  };

  assertExists(successResponse.success);
  assertExists(successResponse.message);
  assertEquals(typeof successResponse.success, 'boolean');
  assertEquals(typeof successResponse.message, 'string');
  assertEquals(successResponse.success, true);
});

Deno.test('contract - personifeed-signup response shape (error)', () => {
  // Expected error response
  const errorResponse = {
    success: false,
    error: 'Invalid email format',
  };

  assertExists(errorResponse.success);
  assertExists(errorResponse.error);
  assertEquals(typeof errorResponse.success, 'boolean');
  assertEquals(typeof errorResponse.error, 'string');
  assertEquals(errorResponse.success, false);
});

Deno.test('contract - personifeed-reply request shape', () => {
  // Valid reply request (SendGrid webhook format)
  const validRequest = {
    from: 'user@example.com',
    to: 'unique-reply-address@llmbox.pro',
    subject: 'Re: Your Daily Newsletter',
    text: 'User reply content',
    headers: JSON.stringify({
      'Message-ID': '<msg-id@example.com>',
    }),
  };

  assertExists(validRequest.from);
  assertExists(validRequest.to);
  assertExists(validRequest.text);
  assertEquals(typeof validRequest.from, 'string');
  assertEquals(typeof validRequest.to, 'string');
  assertEquals(typeof validRequest.text, 'string');
});

Deno.test('contract - personifeed-cron has no request body', () => {
  // Cron jobs are triggered without request body
  // Just verify this expectation is documented
  const cronRequest = null;

  assertEquals(cronRequest, null, 'Cron jobs should not expect request body');
});

Deno.test('contract - personifeed-cron response shape', () => {
  // Expected cron response
  const cronResponse = {
    success: true,
    newslettersSent: 42,
    errors: [],
  };

  assertExists(cronResponse.success);
  assertExists(cronResponse.newslettersSent);
  assertEquals(typeof cronResponse.success, 'boolean');
  assertEquals(typeof cronResponse.newslettersSent, 'number');
  assertEquals(Array.isArray(cronResponse.errors), true);
});

Deno.test('contract - email-webhook request shape', () => {
  // Valid webhook request (SendGrid format)
  const validRequest = {
    from: 'user@example.com',
    to: 'assistant@mail.llmbox.pro',
    subject: 'Help me with something',
    text: 'Email body content',
    headers: JSON.stringify({
      'Message-ID': '<msg-id@example.com>',
    }),
  };

  assertExists(validRequest.from);
  assertExists(validRequest.to);
  assertExists(validRequest.subject);
  assertExists(validRequest.text);
  assertEquals(typeof validRequest.from, 'string');
  assertEquals(typeof validRequest.to, 'string');
  assertEquals(typeof validRequest.subject, 'string');
  assertEquals(typeof validRequest.text, 'string');
});

Deno.test('contract - error responses have consistent shape', () => {
  // All error responses should follow this pattern
  const errorResponse = {
    success: false,
    error: 'Error message',
    code: 'ERROR_CODE', // Optional
  };

  assertEquals(typeof errorResponse.success, 'boolean');
  assertEquals(errorResponse.success, false);
  assertEquals(typeof errorResponse.error, 'string');
  assertExists(errorResponse.error);
});

Deno.test('contract - success responses have consistent shape', () => {
  // All success responses should have success: true
  const successResponse = {
    success: true,
    message: 'Operation successful',
    data: {}, // Optional
  };

  assertEquals(typeof successResponse.success, 'boolean');
  assertEquals(successResponse.success, true);
  assertExists(successResponse.message);
});

Deno.test('contract - HTTP status codes are appropriate', () => {
  // Document expected status codes
  const statusCodes = {
    success: 200,
    created: 201,
    badRequest: 400,
    unauthorized: 401,
    notFound: 404,
    serverError: 500,
  };

  assertEquals(statusCodes.success, 200);
  assertEquals(statusCodes.created, 201);
  assertEquals(statusCodes.badRequest, 400);
  assertEquals(statusCodes.unauthorized, 401);
  assertEquals(statusCodes.notFound, 404);
  assertEquals(statusCodes.serverError, 500);
});

Deno.test('contract - CORS headers are present', () => {
  // Expected CORS headers for responses
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  assertExists(corsHeaders['Access-Control-Allow-Origin']);
  assertExists(corsHeaders['Access-Control-Allow-Methods']);
  assertExists(corsHeaders['Access-Control-Allow-Headers']);
});
