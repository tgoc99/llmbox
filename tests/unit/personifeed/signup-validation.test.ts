/**
 * Unit tests for personifeed-signup validation functions
 */

import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import {
  sanitizePrompt,
  validateEmail,
  validatePrompt,
} from '../../../supabase/functions/personifeed-signup/validation.ts';

Deno.test('validateEmail - valid email passes', () => {
  // Should not throw
  validateEmail('test@example.com');
  validateEmail('user.name+tag@example.co.uk');
});

Deno.test('validateEmail - invalid email throws', () => {
  try {
    validateEmail('invalid-email');
    throw new Error('Should have thrown ValidationError');
  } catch (error) {
    assertEquals((error as Error).name, 'ValidationError');
  }
});

Deno.test('validateEmail - empty email throws', () => {
  try {
    validateEmail('');
    throw new Error('Should have thrown ValidationError');
  } catch (error) {
    assertEquals((error as Error).name, 'ValidationError');
  }
});

Deno.test('validateEmail - missing @ symbol throws', () => {
  try {
    validateEmail('userexample.com');
    throw new Error('Should have thrown ValidationError');
  } catch (error) {
    assertEquals((error as Error).name, 'ValidationError');
  }
});

Deno.test('validateEmail - missing domain throws', () => {
  try {
    validateEmail('user@');
    throw new Error('Should have thrown ValidationError');
  } catch (error) {
    assertEquals((error as Error).name, 'ValidationError');
  }
});

Deno.test('validatePrompt - valid prompt passes', () => {
  // Should not throw
  validatePrompt('Send me AI news daily');
  validatePrompt('I want tech updates and weather');
});

Deno.test('validatePrompt - empty prompt throws', () => {
  try {
    validatePrompt('');
    throw new Error('Should have thrown ValidationError');
  } catch (error) {
    assertEquals((error as Error).name, 'ValidationError');
  }
});

Deno.test('validatePrompt - whitespace-only prompt throws', () => {
  try {
    validatePrompt('   \n\t  ');
    throw new Error('Should have thrown ValidationError');
  } catch (error) {
    assertEquals((error as Error).name, 'ValidationError');
  }
});

Deno.test('validatePrompt - too long prompt throws', () => {
  const longPrompt = 'a'.repeat(2001);
  try {
    validatePrompt(longPrompt);
    throw new Error('Should have thrown ValidationError');
  } catch (error) {
    assertEquals((error as Error).name, 'ValidationError');
  }
});

Deno.test('validatePrompt - exactly 2000 chars passes', () => {
  const maxPrompt = 'a'.repeat(2000);
  // Should not throw
  validatePrompt(maxPrompt);
});

Deno.test('sanitizePrompt - removes extra whitespace', () => {
  const input = '  Send me   AI news   ';
  const expected = 'Send me AI news';
  assertEquals(sanitizePrompt(input), expected);
});

Deno.test('sanitizePrompt - handles newlines', () => {
  const input = 'Send me\n\nAI news\n\ndaily';
  const result = sanitizePrompt(input);
  // Should replace multiple spaces/newlines with single space
  assertEquals(result.includes('\n'), false);
});

Deno.test('sanitizePrompt - handles tabs', () => {
  const input = 'Send\tme\tAI\tnews';
  const result = sanitizePrompt(input);
  assertEquals(result.includes('\t'), false);
});

Deno.test('sanitizePrompt - preserves single spaces', () => {
  const input = 'Send me AI news';
  const result = sanitizePrompt(input);
  assertEquals(result, 'Send me AI news');
});

Deno.test('sanitizePrompt - trims leading and trailing whitespace', () => {
  const input = '\n\t  Send me AI news  \t\n';
  const result = sanitizePrompt(input);
  assertEquals(result, 'Send me AI news');
});
