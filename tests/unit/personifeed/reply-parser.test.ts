/**
 * Unit tests for personifeed-reply email parsing
 */

import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { parseReplyEmail } from '../../../supabase/functions/personifeed-reply/emailParser.ts';

Deno.test('parseReplyEmail - extracts email from display name format', () => {
  const formData = new FormData();
  formData.append('from', '"John Doe" <john@example.com>');
  formData.append('to', 'reply+550e8400-e29b-41d4-a716-446655440000@mail.llmbox.pro');
  formData.append('text', 'This is my feedback');
  formData.append('headers', 'Message-ID: <abc123@example.com>');

  const result = parseReplyEmail(formData);

  assertEquals(result.from, 'john@example.com');
  assertEquals(result.to, 'reply+550e8400-e29b-41d4-a716-446655440000@mail.llmbox.pro');
  assertEquals(result.userId, '550e8400-e29b-41d4-a716-446655440000');
  assertEquals(result.body, 'This is my feedback');
  assertEquals(result.messageId, '<abc123@example.com>');
});

Deno.test('parseReplyEmail - extracts email from angle brackets only', () => {
  const formData = new FormData();
  formData.append('from', '<jane@example.com>');
  formData.append('to', 'reply+abc-123-def@mail.llmbox.pro');
  formData.append('text', 'More AI news please');
  formData.append('headers', '');

  const result = parseReplyEmail(formData);

  assertEquals(result.from, 'jane@example.com');
  assertEquals(result.to, 'reply+abc-123-def@mail.llmbox.pro');
  assertEquals(result.userId, 'abc-123-def');
  assertEquals(result.body, 'More AI news please');
});

Deno.test('parseReplyEmail - handles plain email address', () => {
  const formData = new FormData();
  formData.append('from', 'simple@example.com');
  formData.append('to', 'reply+abcd-1234-ef56@mail.llmbox.pro');
  formData.append('text', 'Update my preferences');
  formData.append('headers', '');

  const result = parseReplyEmail(formData);

  assertEquals(result.from, 'simple@example.com');
  assertEquals(result.to, 'reply+abcd-1234-ef56@mail.llmbox.pro');
  assertEquals(result.userId, 'abcd-1234-ef56');
  assertEquals(result.body, 'Update my preferences');
});

Deno.test('parseReplyEmail - cleans quoted text', () => {
  const formData = new FormData();
  formData.append('from', 'user@example.com');
  formData.append('to', 'reply+cafe-123@mail.llmbox.pro');
  formData.append('text', 'My feedback\n\n> Original message\n> More quoted text');
  formData.append('headers', '');

  const result = parseReplyEmail(formData);

  assertEquals(result.from, 'user@example.com');
  assertEquals(result.userId, 'cafe-123');
  assertEquals(result.body, 'My feedback');
  assertEquals(result.body.includes('>'), false);
});

Deno.test('parseReplyEmail - removes signature', () => {
  const formData = new FormData();
  formData.append('from', 'user@example.com');
  formData.append('to', 'reply+abc123@mail.llmbox.pro');
  formData.append('text', 'My feedback\n\n--\nJohn Doe\nCEO');
  formData.append('headers', '');

  const result = parseReplyEmail(formData);

  assertEquals(result.from, 'user@example.com');
  assertEquals(result.userId, 'abc123');
  assertEquals(result.body, 'My feedback');
  assertEquals(result.body.includes('CEO'), false);
});

Deno.test('parseReplyEmail - removes "Sent from" signatures', () => {
  const formData = new FormData();
  formData.append('from', 'user@example.com');
  formData.append('to', 'reply+test123@mail.llmbox.pro');
  formData.append('text', 'My feedback\n\nSent from my iPhone');
  formData.append('headers', '');

  const result = parseReplyEmail(formData);

  assertEquals(result.body, 'My feedback');
  assertEquals(result.body.includes('iPhone'), false);
});

Deno.test('parseReplyEmail - throws on missing from field', () => {
  const formData = new FormData();
  formData.append('text', 'My feedback');

  try {
    parseReplyEmail(formData);
    throw new Error('Should have thrown ValidationError');
  } catch (error) {
    assertEquals((error as Error).name, 'ValidationError');
  }
});

Deno.test('parseReplyEmail - throws on missing text field', () => {
  const formData = new FormData();
  formData.append('from', 'user@example.com');
  formData.append('to', 'reply+test@mail.llmbox.pro');

  try {
    parseReplyEmail(formData);
    throw new Error('Should have thrown ValidationError');
  } catch (error) {
    assertEquals((error as Error).name, 'ValidationError');
  }
});

Deno.test('parseReplyEmail - handles whitespace-only text field', () => {
  const formData = new FormData();
  formData.append('from', 'user@example.com');
  formData.append('to', 'reply+test@mail.llmbox.pro');
  formData.append('text', '   \n\n  ');

  // The parser accepts whitespace-only text, but cleans it to empty string
  const result = parseReplyEmail(formData);
  assertEquals(result.body, ''); // Cleaned body is empty
});

Deno.test('parseReplyEmail - handles non-dynamic reply address', () => {
  const formData = new FormData();
  formData.append('from', 'user@example.com');
  formData.append('to', 'support@mail.llmbox.pro');
  formData.append('text', 'My feedback');
  formData.append('headers', '');

  const result = parseReplyEmail(formData);

  assertEquals(result.from, 'user@example.com');
  assertEquals(result.to, 'support@mail.llmbox.pro');
  assertEquals(result.userId, null); // No userId extracted
  assertEquals(result.body, 'My feedback');
});

Deno.test('parseReplyEmail - extracts userId from various formats', () => {
  const testCases = [
    {
      to: 'reply+550e8400-e29b-41d4-a716-446655440000@mail.llmbox.pro',
      expectedUserId: '550e8400-e29b-41d4-a716-446655440000',
      description: 'UUID format',
    },
    {
      to: 'reply+abc-123-def@mail.llmbox.pro',
      expectedUserId: 'abc-123-def',
      description: 'hex with hyphens',
    },
    {
      to: 'reply+deadbeef@mail.llmbox.pro',
      expectedUserId: 'deadbeef',
      description: 'hex only',
    },
  ];

  for (const testCase of testCases) {
    const formData = new FormData();
    formData.append('from', 'user@example.com');
    formData.append('to', testCase.to);
    formData.append('text', 'Test feedback');
    formData.append('headers', '');

    const result = parseReplyEmail(formData);
    assertEquals(
      result.userId,
      testCase.expectedUserId,
      `Failed for ${testCase.description}: ${testCase.to}`,
    );
  }
});
