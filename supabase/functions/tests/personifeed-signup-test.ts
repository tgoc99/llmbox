/**
 * Unit tests for personifeed-signup function
 */

import { assertEquals, assertExists } from 'https://deno.land/std@0.168.0/testing/asserts.ts';
import { validateEmail, validatePrompt, sanitizePrompt } from '../personifeed-signup/validation.ts';

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

Deno.test('validatePrompt - too long prompt throws', () => {
  const longPrompt = 'a'.repeat(2001);
  try {
    validatePrompt(longPrompt);
    throw new Error('Should have thrown ValidationError');
  } catch (error) {
    assertEquals((error as Error).name, 'ValidationError');
  }
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

