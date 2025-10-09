import { assertEquals, assertExists } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import type { IncomingEmail } from '../../supabase/functions/_shared/types.ts';

/**
 * Email Format Contract Tests
 *
 * Validates that email objects have the correct structure:
 * - IncomingEmail type
 * - Email addresses format
 * - Required fields
 * - Optional fields
 */

Deno.test('email-format - IncomingEmail has all required fields', () => {
  const email: IncomingEmail = {
    from: 'sender@example.com',
    to: 'recipient@example.com',
    subject: 'Test Subject',
    body: 'Email body content',
    messageId: '<msg-id@example.com>',
    inReplyTo: null,
    references: [],
    timestamp: new Date(),
  };

  assertExists(email.from);
  assertExists(email.to);
  assertExists(email.subject);
  assertExists(email.body);
  assertExists(email.messageId);
  assertExists(email.timestamp);
});

Deno.test('email-format - email addresses are strings', () => {
  const email: IncomingEmail = {
    from: 'sender@example.com',
    to: 'recipient@example.com',
    subject: 'Test',
    body: 'Content',
    messageId: '<id>',
    inReplyTo: null,
    references: [],
    timestamp: new Date(),
  };

  assertEquals(typeof email.from, 'string');
  assertEquals(typeof email.to, 'string');
});

Deno.test('email-format - subject and body are strings', () => {
  const email: IncomingEmail = {
    from: 'sender@example.com',
    to: 'recipient@example.com',
    subject: 'Test Subject',
    body: 'Email body',
    messageId: '<id>',
    inReplyTo: null,
    references: [],
    timestamp: new Date(),
  };

  assertEquals(typeof email.subject, 'string');
  assertEquals(typeof email.body, 'string');
});

Deno.test('email-format - messageId is string', () => {
  const email: IncomingEmail = {
    from: 'sender@example.com',
    to: 'recipient@example.com',
    subject: 'Test',
    body: 'Content',
    messageId: '<unique-id@example.com>',
    inReplyTo: null,
    references: [],
    timestamp: new Date(),
  };

  assertEquals(typeof email.messageId, 'string');
  assertEquals(email.messageId.length > 0, true);
});

Deno.test('email-format - inReplyTo can be null or string', () => {
  const emailWithoutReply: IncomingEmail = {
    from: 'sender@example.com',
    to: 'recipient@example.com',
    subject: 'Test',
    body: 'Content',
    messageId: '<id>',
    inReplyTo: null,
    references: [],
    timestamp: new Date(),
  };

  assertEquals(emailWithoutReply.inReplyTo, null);

  const emailWithReply: IncomingEmail = {
    from: 'sender@example.com',
    to: 'recipient@example.com',
    subject: 'Re: Test',
    body: 'Reply content',
    messageId: '<id2>',
    inReplyTo: '<id>',
    references: ['<id>'],
    timestamp: new Date(),
  };

  assertEquals(typeof emailWithReply.inReplyTo, 'string');
});

Deno.test('email-format - references is array', () => {
  const email: IncomingEmail = {
    from: 'sender@example.com',
    to: 'recipient@example.com',
    subject: 'Test',
    body: 'Content',
    messageId: '<id>',
    inReplyTo: null,
    references: [],
    timestamp: new Date(),
  };

  assertEquals(Array.isArray(email.references), true);
});

Deno.test('email-format - timestamp is Date', () => {
  const email: IncomingEmail = {
    from: 'sender@example.com',
    to: 'recipient@example.com',
    subject: 'Test',
    body: 'Content',
    messageId: '<id>',
    inReplyTo: null,
    references: [],
    timestamp: new Date(),
  };

  assertEquals(email.timestamp instanceof Date, true);
});

Deno.test('email-format - valid email address format', () => {
  const validEmails = [
    'user@example.com',
    'test.user@domain.com',
    'user+tag@example.co.uk',
    'first.last@subdomain.example.com',
  ];

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  for (const emailAddr of validEmails) {
    assertEquals(
      emailPattern.test(emailAddr),
      true,
      `${emailAddr} should be valid email format`,
    );
  }
});

Deno.test('email-format - invalid email addresses should not pass', () => {
  const invalidEmails = [
    'not-an-email',
    '@example.com',
    'user@',
    'user @example.com',
    'user@domain',
  ];

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  for (const emailAddr of invalidEmails) {
    assertEquals(
      emailPattern.test(emailAddr),
      false,
      `${emailAddr} should be invalid email format`,
    );
  }
});

Deno.test('email-format - messageId should follow RFC format', () => {
  // MessageIds should be in format: <unique-id@domain>
  const validMessageIds = [
    '<msg123@example.com>',
    '<CABc123xyz@mail.gmail.com>',
    '<unique-id-456@domain.com>',
  ];

  const messageIdPattern = /^<.+@.+>$/;

  for (const msgId of validMessageIds) {
    assertEquals(
      messageIdPattern.test(msgId),
      true,
      `${msgId} should be valid Message-ID format`,
    );
  }
});

Deno.test('email-format - SendGrid webhook multipart/form-data fields', () => {
  // SendGrid sends these fields in webhook
  const webhookFields = {
    from: 'sender@example.com',
    to: 'recipient@example.com',
    subject: 'Test',
    text: 'Plain text body',
    html: '<p>HTML body</p>', // Optional
    headers: '{"Message-ID": "<id@example.com>"}',
    envelope: '{"to":["recipient@example.com"],"from":"sender@example.com"}',
  };

  assertExists(webhookFields.from);
  assertExists(webhookFields.to);
  assertExists(webhookFields.subject);
  assertExists(webhookFields.text);
  assertEquals(typeof webhookFields.headers, 'string');

  // Headers should be valid JSON
  const headers = JSON.parse(webhookFields.headers);
  assertExists(headers);
});
