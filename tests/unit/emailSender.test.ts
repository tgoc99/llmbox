/**
 * Unit tests for email sender module
 */

import { assertEquals, assertRejects } from 'jsr:@std/assert@1';
import { stub } from 'jsr:@std/testing@1/mock';
import sgMail from 'npm:@sendgrid/mail@8.1.6';
import {
  formatReplyEmail as formatOutgoingEmail,
  sendReplyEmail as sendEmail,
} from '../../supabase/functions/_shared/emailSender.ts';
import type { IncomingEmail, LLMResponse } from '../../supabase/functions/_shared/types.ts';

Deno.test('formatOutgoingEmail - creates correct OutgoingEmail structure', () => {
  // Set environment variable for service email
  Deno.env.set('SERVICE_EMAIL_ADDRESS', 'assistant@mydomain.com');

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

  assertEquals(result.references, [
    '<msg1@example.com>',
    '<msg2@example.com>',
    '<msg3@example.com>',
  ]);
});

Deno.test('formatOutgoingEmail - ensures message IDs have angle brackets', () => {
  const incomingEmail: IncomingEmail = {
    from: 'user@example.com',
    to: 'assistant@mydomain.com',
    subject: 'Test',
    body: 'Test body',
    messageId: 'msg-without-brackets@example.com',
    inReplyTo: null,
    references: ['ref1@example.com', '<ref2@example.com>'],
    timestamp: new Date(),
  };

  const llmResponse: LLMResponse = {
    content: 'Test response',
    model: 'gpt-3.5-turbo',
    tokenCount: 25,
    completionTime: 1100,
  };

  const result = formatOutgoingEmail(incomingEmail, llmResponse);

  // All message IDs should have angle brackets
  assertEquals(result.references, [
    '<ref1@example.com>',
    '<ref2@example.com>',
    '<msg-without-brackets@example.com>',
  ]);
});

Deno.test('formatOutgoingEmail - filters out empty references', () => {
  const incomingEmail: IncomingEmail = {
    from: 'user@example.com',
    to: 'assistant@mydomain.com',
    subject: 'Test',
    body: 'Test body',
    messageId: '<msg@example.com>',
    inReplyTo: null,
    references: ['', '  ', '<valid@example.com>', ''],
    timestamp: new Date(),
  };

  const llmResponse: LLMResponse = {
    content: 'Test response',
    model: 'gpt-3.5-turbo',
    tokenCount: 25,
    completionTime: 1100,
  };

  const result = formatOutgoingEmail(incomingEmail, llmResponse);

  // Empty strings should be filtered out
  assertEquals(result.references, ['<valid@example.com>', '<msg@example.com>']);
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

Deno.test('sendEmail - creates correct message structure', async () => {
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

  // Mock sgMail.send to capture the message
  let capturedMsg: unknown;
  const sendStub = stub(
    sgMail,
    'send',
    (msg: unknown) => {
      capturedMsg = msg;
      return Promise.resolve([
        {
          statusCode: 202,
          body: {},
          headers: { 'x-message-id': 'sg-test-message-id' },
        },
        {},
      ]);
    },
  );

  try {
    await sendEmail(outgoingEmail);

    // Verify message structure
    const msg = capturedMsg as Record<string, unknown>;
    assertEquals(msg.to, 'user@example.com');
    assertEquals(msg.from, 'assistant@mydomain.com');
    assertEquals(msg.subject, 'Re: Test');
    assertEquals(msg.text, 'Test response body');
    const headers = msg.headers as Record<string, string>;
    assertEquals(headers['In-Reply-To'], '<original@example.com>');
    assertEquals(headers['References'], '<msg1@example.com> <original@example.com>');
  } finally {
    sendStub.restore();
  }
});

Deno.test('sendEmail - handles 401 auth error', async () => {
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

  // Mock sgMail.send to throw auth error
  const sendStub = stub(
    sgMail,
    'send',
    () => {
      const error = new Error('Unauthorized') as Error & {
        code: number;
        response: { statusCode: number; body: { errors: Array<{ message: string }> } };
      };
      error.code = 401;
      error.response = {
        statusCode: 401,
        body: { errors: [{ message: 'Unauthorized' }] },
      };
      return Promise.reject(error);
    },
  );

  try {
    await assertRejects(
      async () => await sendEmail(outgoingEmail),
      Error,
      'Unauthorized',
    );
  } finally {
    sendStub.restore();
  }
});

Deno.test('sendEmail - handles 400 bad request error', async () => {
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

  // Mock sgMail.send to throw bad request error
  const sendStub = stub(
    sgMail,
    'send',
    () => {
      const error = new Error('Bad Request: Invalid email format') as Error & {
        code: number;
        response: { statusCode: number; body: { errors: Array<{ message: string }> } };
      };
      error.code = 400;
      error.response = {
        statusCode: 400,
        body: { errors: [{ message: 'Invalid email format' }] },
      };
      return Promise.reject(error);
    },
  );

  try {
    await assertRejects(
      async () => await sendEmail(outgoingEmail),
      Error,
      'Bad Request',
    );
  } finally {
    sendStub.restore();
  }
});
