import { assertEquals, assertExists } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { formatPrompt } from '../../supabase/functions/email-webhook/llmClient.ts';
import type { IncomingEmail } from '../../supabase/functions/email-webhook/types.ts';

Deno.test('formatPrompt - creates correct format with email data', () => {
  const email: IncomingEmail = {
    from: 'user@example.com',
    to: 'assistant@yourdomain.com',
    subject: 'Test Subject',
    body: 'This is the email body.',
    messageId: '<msg@example.com>',
    inReplyTo: null,
    references: [],
    timestamp: new Date(),
  };

  const prompt = formatPrompt(email);

  assertEquals(prompt.includes('Respond to this email:'), true);
  assertEquals(prompt.includes('From: user@example.com'), true);
  assertEquals(prompt.includes('Subject: Test Subject'), true);
  assertEquals(prompt.includes('This is the email body.'), true);
});

Deno.test('formatPrompt - includes all email fields', () => {
  const email: IncomingEmail = {
    from: 'sender@example.com',
    to: 'receiver@example.com',
    subject: 'Important Question',
    body: 'Hello, I have a question about your service.',
    messageId: '<abc@example.com>',
    inReplyTo: '<prev@example.com>',
    references: ['<ref1@example.com>'],
    timestamp: new Date(),
  };

  const prompt = formatPrompt(email);

  assertExists(prompt);
  assertEquals(prompt.includes('sender@example.com'), true);
  assertEquals(prompt.includes('Important Question'), true);
  assertEquals(prompt.includes('Hello, I have a question'), true);
});

Deno.test('formatPrompt - handles empty body', () => {
  const email: IncomingEmail = {
    from: 'user@example.com',
    to: 'assistant@yourdomain.com',
    subject: 'Empty Email',
    body: '',
    messageId: '<msg@example.com>',
    inReplyTo: null,
    references: [],
    timestamp: new Date(),
  };

  const prompt = formatPrompt(email);

  assertExists(prompt);
  assertEquals(prompt.includes('From: user@example.com'), true);
  assertEquals(prompt.includes('Subject: Empty Email'), true);
});

