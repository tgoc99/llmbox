import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { truncateBody } from '../../supabase/functions/email-webhook/logger.ts';

Deno.test('truncateBody - string shorter than 100 chars', () => {
  const body = 'This is a short email body.';
  const truncated = truncateBody(body);

  assertEquals(truncated, body);
});

Deno.test('truncateBody - string exactly 100 chars', () => {
  const body = 'a'.repeat(100);
  const truncated = truncateBody(body);

  assertEquals(truncated, body);
  assertEquals(truncated.length, 100);
});

Deno.test('truncateBody - string longer than 100 chars', () => {
  const body = 'a'.repeat(150);
  const truncated = truncateBody(body);

  assertEquals(truncated.length, 103); // 100 chars + '...'
  assertEquals(truncated.endsWith('...'), true);
  assertEquals(truncated.startsWith('aaa'), true);
});

Deno.test('truncateBody - empty string', () => {
  const body = '';
  const truncated = truncateBody(body);

  assertEquals(truncated, '');
});

Deno.test('truncateBody - long email body preview', () => {
  const body =
    'This is a very long email body that contains lots of text and should be truncated to only the first 100 characters when displayed in logs for privacy and readability reasons.';
  const truncated = truncateBody(body);

  assertEquals(truncated.length, 103); // 100 + '...'
  assertEquals(truncated.startsWith('This is a very long email body'), true);
  assertEquals(truncated.endsWith('...'), true);
  assertEquals(body.startsWith(truncated.slice(0, -3)), true); // Verify it's a prefix
});

