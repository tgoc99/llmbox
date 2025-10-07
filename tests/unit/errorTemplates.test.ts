/**
 * Unit tests for error email templates
 */

import { assertEquals } from 'jsr:@std/assert';
import {
  getGenericErrorEmail,
  getOpenAIErrorEmail,
  getRateLimitErrorEmail,
  getTimeoutErrorEmail,
} from '../../supabase/functions/email-webhook/errorTemplates.ts';
import type { IncomingEmail } from '../../supabase/functions/email-webhook/types.ts';

const mockIncomingEmail: IncomingEmail = {
  from: 'user@example.com',
  to: 'assistant@test.com',
  subject: 'Test Question',
  body: 'This is a test email.',
  messageId: '<test123@example.com>',
  inReplyTo: null,
  references: [],
  timestamp: new Date(),
};

const mockIncomingEmailWithThread: IncomingEmail = {
  from: 'user@example.com',
  to: 'assistant@test.com',
  subject: 'Re: Test Question',
  body: 'This is a follow-up.',
  messageId: '<test456@example.com>',
  inReplyTo: '<test123@example.com>',
  references: ['<test0@example.com>', '<test123@example.com>'],
  timestamp: new Date(),
};

Deno.test('getOpenAIErrorEmail - creates correct error email structure', () => {
  // Set required env var
  Deno.env.set('SERVICE_EMAIL_ADDRESS', 'assistant@test.com');

  const error = new Error('OpenAI API error');
  const errorEmail = getOpenAIErrorEmail(mockIncomingEmail, error);

  assertEquals(errorEmail.from, 'assistant@test.com');
  assertEquals(errorEmail.to, 'user@example.com');
  assertEquals(errorEmail.subject, 'Re: Test Question');
  assertEquals(errorEmail.inReplyTo, '<test123@example.com>');
  assertEquals(errorEmail.references, ['<test123@example.com>']);
  assertEquals(errorEmail.body.includes('trouble responding'), true);
});

Deno.test('getRateLimitErrorEmail - creates rate limit error email', () => {
  Deno.env.set('SERVICE_EMAIL_ADDRESS', 'assistant@test.com');

  const errorEmail = getRateLimitErrorEmail(mockIncomingEmail);

  assertEquals(errorEmail.from, 'assistant@test.com');
  assertEquals(errorEmail.to, 'user@example.com');
  assertEquals(errorEmail.subject, 'Re: Test Question');
  assertEquals(errorEmail.inReplyTo, '<test123@example.com>');
  assertEquals(errorEmail.body.includes('high demand'), true);
});

Deno.test('getGenericErrorEmail - creates generic error email', () => {
  Deno.env.set('SERVICE_EMAIL_ADDRESS', 'assistant@test.com');

  const errorEmail = getGenericErrorEmail(mockIncomingEmail);

  assertEquals(errorEmail.from, 'assistant@test.com');
  assertEquals(errorEmail.to, 'user@example.com');
  assertEquals(errorEmail.subject, 'Re: Test Question');
  assertEquals(errorEmail.inReplyTo, '<test123@example.com>');
  assertEquals(errorEmail.body.includes('technical issue'), true);
});

Deno.test('getTimeoutErrorEmail - creates timeout error email', () => {
  Deno.env.set('SERVICE_EMAIL_ADDRESS', 'assistant@test.com');

  const errorEmail = getTimeoutErrorEmail(mockIncomingEmail);

  assertEquals(errorEmail.from, 'assistant@test.com');
  assertEquals(errorEmail.to, 'user@example.com');
  assertEquals(errorEmail.subject, 'Re: Test Question');
  assertEquals(errorEmail.inReplyTo, '<test123@example.com>');
  assertEquals(errorEmail.body.includes('longer than usual'), true);
});

Deno.test('error emails - maintain threading with existing thread', () => {
  Deno.env.set('SERVICE_EMAIL_ADDRESS', 'assistant@test.com');

  const errorEmail = getGenericErrorEmail(mockIncomingEmailWithThread);

  assertEquals(errorEmail.subject, 'Re: Test Question');
  assertEquals(errorEmail.inReplyTo, '<test456@example.com>');
  assertEquals(errorEmail.references, [
    '<test0@example.com>',
    '<test123@example.com>',
    '<test456@example.com>',
  ]);
});

Deno.test('error emails - do not double Re: prefix', () => {
  Deno.env.set('SERVICE_EMAIL_ADDRESS', 'assistant@test.com');

  const errorEmail = getOpenAIErrorEmail(mockIncomingEmailWithThread, new Error('test'));

  assertEquals(errorEmail.subject, 'Re: Test Question');
});

Deno.test('error emails - are professional and clear', () => {
  Deno.env.set('SERVICE_EMAIL_ADDRESS', 'assistant@test.com');

  const errorEmail = getOpenAIErrorEmail(mockIncomingEmail, new Error('test'));

  // Check message is polite and professional
  assertEquals(errorEmail.body.includes('Dear User'), true);
  assertEquals(errorEmail.body.includes('Best regards'), true);
  assertEquals(errorEmail.body.includes('Email Assistant Service'), true);

  // Check message doesn't expose technical details
  assertEquals(errorEmail.body.includes('Error'), false);
  assertEquals(errorEmail.body.includes('500'), false);
  assertEquals(errorEmail.body.includes('API'), false);
});

Deno.test('error emails - ensure message IDs have angle brackets', () => {
  Deno.env.set('SERVICE_EMAIL_ADDRESS', 'assistant@test.com');

  // Create email with message ID without angle brackets
  const emailWithoutBrackets: IncomingEmail = {
    ...mockIncomingEmail,
    messageId: 'test123@example.com', // Missing angle brackets
    references: ['ref1@example.com', '<ref2@example.com>'], // Mixed format
  };

  const errorEmail = getOpenAIErrorEmail(emailWithoutBrackets, new Error('test'));

  // All references should have angle brackets
  assertEquals(errorEmail.references.every((ref) => ref.startsWith('<') && ref.endsWith('>')), true);
  assertEquals(errorEmail.references.includes('<ref1@example.com>'), true);
  assertEquals(errorEmail.references.includes('<ref2@example.com>'), true);
  assertEquals(errorEmail.references.includes('<test123@example.com>'), true);
});

Deno.test('error emails - filter out empty references', () => {
  Deno.env.set('SERVICE_EMAIL_ADDRESS', 'assistant@test.com');

  // Create email with empty/whitespace references
  const emailWithEmptyRefs: IncomingEmail = {
    ...mockIncomingEmail,
    messageId: '<test123@example.com>',
    references: ['', '  ', '<valid@example.com>'],
  };

  const errorEmail = getRateLimitErrorEmail(emailWithEmptyRefs);

  // Should only include valid references
  assertEquals(errorEmail.references.length, 2); // valid@example.com + test123@example.com
  assertEquals(errorEmail.references.includes('<valid@example.com>'), true);
  assertEquals(errorEmail.references.includes('<test123@example.com>'), true);
});

