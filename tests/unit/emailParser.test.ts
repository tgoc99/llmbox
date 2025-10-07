import { assertEquals, assertExists, assertThrows } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { parseIncomingEmail, ValidationError } from '../../supabase/functions/email-webhook/emailParser.ts';

Deno.test('parseIncomingEmail - valid payload with all fields', () => {
  const formData = new FormData();
  formData.append('from', 'user@example.com');
  formData.append('to', 'assistant@yourdomain.com');
  formData.append('subject', 'Test Subject');
  formData.append('text', 'This is the email body content.');
  formData.append(
    'headers',
    'Message-ID: <CAF=abc123@mail.gmail.com>\nIn-Reply-To: <previous-msg@example.com>\nReferences: <msg1@example.com> <msg2@example.com>',
  );

  const email = parseIncomingEmail(formData);

  assertEquals(email.from, 'user@example.com');
  assertEquals(email.to, 'assistant@yourdomain.com');
  assertEquals(email.subject, 'Test Subject');
  assertEquals(email.body, 'This is the email body content.');
  assertEquals(email.messageId, '<CAF=abc123@mail.gmail.com>');
  assertEquals(email.inReplyTo, '<previous-msg@example.com>');
  assertEquals(email.references.length, 2);
  assertEquals(email.references[0], '<msg1@example.com>');
  assertEquals(email.references[1], '<msg2@example.com>');
  assertExists(email.timestamp);
});

Deno.test('parseIncomingEmail - missing Message-ID generates fallback', () => {
  const formData = new FormData();
  formData.append('from', 'user@example.com');
  formData.append('to', 'assistant@yourdomain.com');
  formData.append('subject', 'Test Subject');
  formData.append('text', 'Email body');
  formData.append('headers', 'Date: Wed, 7 Jan 2025 10:00:00 -0500');

  const email = parseIncomingEmail(formData);

  assertExists(email.messageId);
  assertEquals(email.messageId.includes('@llmbox.pro'), true);
});

Deno.test('parseIncomingEmail - no In-Reply-To header', () => {
  const formData = new FormData();
  formData.append('from', 'user@example.com');
  formData.append('to', 'assistant@yourdomain.com');
  formData.append('subject', 'Test Subject');
  formData.append('text', 'Email body');
  formData.append('headers', 'Message-ID: <msg@example.com>');

  const email = parseIncomingEmail(formData);

  assertEquals(email.inReplyTo, null);
});

Deno.test('parseIncomingEmail - no References header', () => {
  const formData = new FormData();
  formData.append('from', 'user@example.com');
  formData.append('to', 'assistant@yourdomain.com');
  formData.append('subject', 'Test Subject');
  formData.append('text', 'Email body');
  formData.append('headers', 'Message-ID: <msg@example.com>');

  const email = parseIncomingEmail(formData);

  assertEquals(email.references.length, 0);
});

Deno.test('parseIncomingEmail - missing required field: from', () => {
  const formData = new FormData();
  formData.append('to', 'assistant@yourdomain.com');
  formData.append('subject', 'Test Subject');
  formData.append('text', 'Email body');
  formData.append('headers', 'Message-ID: <msg@example.com>');

  assertThrows(
    () => parseIncomingEmail(formData),
    ValidationError,
    'Missing required email fields',
  );
});

Deno.test('parseIncomingEmail - missing required field: to', () => {
  const formData = new FormData();
  formData.append('from', 'user@example.com');
  formData.append('subject', 'Test Subject');
  formData.append('text', 'Email body');
  formData.append('headers', 'Message-ID: <msg@example.com>');

  assertThrows(
    () => parseIncomingEmail(formData),
    ValidationError,
    'Missing required email fields',
  );
});

Deno.test('parseIncomingEmail - missing required field: subject', () => {
  const formData = new FormData();
  formData.append('from', 'user@example.com');
  formData.append('to', 'assistant@yourdomain.com');
  formData.append('text', 'Email body');
  formData.append('headers', 'Message-ID: <msg@example.com>');

  assertThrows(
    () => parseIncomingEmail(formData),
    ValidationError,
    'Missing required email fields',
  );
});

Deno.test('parseIncomingEmail - missing required field: text', () => {
  const formData = new FormData();
  formData.append('from', 'user@example.com');
  formData.append('to', 'assistant@yourdomain.com');
  formData.append('subject', 'Test Subject');
  formData.append('headers', 'Message-ID: <msg@example.com>');

  assertThrows(
    () => parseIncomingEmail(formData),
    ValidationError,
    'Missing required email fields',
  );
});

Deno.test('parseIncomingEmail - missing required field: headers', () => {
  const formData = new FormData();
  formData.append('from', 'user@example.com');
  formData.append('to', 'assistant@yourdomain.com');
  formData.append('subject', 'Test Subject');
  formData.append('text', 'Email body');

  assertThrows(
    () => parseIncomingEmail(formData),
    ValidationError,
    'Missing required email fields',
  );
});

Deno.test('parseIncomingEmail - ValidationError includes context', () => {
  const formData = new FormData();
  formData.append('from', 'user@example.com');

  try {
    parseIncomingEmail(formData);
  } catch (error) {
    if (error instanceof ValidationError) {
      assertExists(error.context);
      assertExists(error.context.missingFields);
      assertEquals(error.statusCode, 400);
    }
  }
});

Deno.test('parseIncomingEmail - extracts email from display name format', () => {
  const formData = new FormData();
  formData.append('from', '"Tommy O\'Connor" <tgoc99@gmail.com>');
  formData.append('to', '"Assistant" <assistant@example.com>');
  formData.append('subject', 'Test');
  formData.append('text', 'Test body');
  formData.append('headers', 'Message-ID: <test@example.com>');

  const email = parseIncomingEmail(formData);

  // Should extract just the email addresses without display names
  assertEquals(email.from, 'tgoc99@gmail.com');
  assertEquals(email.to, 'assistant@example.com');
});

Deno.test('parseIncomingEmail - handles email without display name', () => {
  const formData = new FormData();
  formData.append('from', 'user@example.com');
  formData.append('to', 'assistant@example.com');
  formData.append('subject', 'Test');
  formData.append('text', 'Test body');
  formData.append('headers', 'Message-ID: <test@example.com>');

  const email = parseIncomingEmail(formData);

  // Should work fine with plain email addresses
  assertEquals(email.from, 'user@example.com');
  assertEquals(email.to, 'assistant@example.com');
});

Deno.test('parseIncomingEmail - handles email in angle brackets without display name', () => {
  const formData = new FormData();
  formData.append('from', '<user@example.com>');
  formData.append('to', '<assistant@example.com>');
  formData.append('subject', 'Test');
  formData.append('text', 'Test body');
  formData.append('headers', 'Message-ID: <test@example.com>');

  const email = parseIncomingEmail(formData);

  // Should extract email from angle brackets
  assertEquals(email.from, 'user@example.com');
  assertEquals(email.to, 'assistant@example.com');
});
