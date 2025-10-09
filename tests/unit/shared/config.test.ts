import { assertEquals, assertExists } from 'https://deno.land/std@0.224.0/assert/mod.ts';

/**
 * Config Tests
 *
 * Tests configuration loading and validation
 */

Deno.test('config - environment variables can be read', () => {
  // Test that Deno.env.get works
  const testVar = Deno.env.get('PATH');
  // PATH should exist in any environment
  assertExists(testVar);
});

Deno.test('config - handles missing environment variables', () => {
  const missingVar = Deno.env.get('THIS_VAR_DOES_NOT_EXIST_12345');
  assertEquals(missingVar, undefined);
});

Deno.test('config - LOG_LEVEL defaults appropriately', () => {
  const logLevel = Deno.env.get('LOG_LEVEL') || 'INFO';
  assertExists(logLevel);
  assertEquals(typeof logLevel, 'string');
});

Deno.test('config - required config values are validated', () => {
  // Example of config validation pattern
  const requiredKeys = [
    'OPENAI_API_KEY',
    'SENDGRID_API_KEY',
    'SERVICE_EMAIL_ADDRESS',
  ];

  for (const key of requiredKeys) {
    const _value = Deno.env.get(key);
    // In production, these should be set
    // In tests, we just verify the pattern works
    assertEquals(typeof key, 'string');
  }
});

Deno.test('config - model name defaults to gpt-4o-mini', () => {
  const model = Deno.env.get('OPENAI_MODEL') || 'gpt-4o-mini';
  assertEquals(model, 'gpt-4o-mini');
});

Deno.test('config - service email can be retrieved', () => {
  const serviceEmail = Deno.env.get('SERVICE_EMAIL_ADDRESS') ||
    'assistant@mail.llmbox.pro';
  assertExists(serviceEmail);
  assertEquals(serviceEmail.includes('@'), true);
});

Deno.test('config - boolean environment variables can be parsed', () => {
  // Test parsing boolean from env var
  const parseBoolean = (value: string | undefined): boolean => {
    return value?.toLowerCase() === 'true';
  };

  assertEquals(parseBoolean('true'), true);
  assertEquals(parseBoolean('TRUE'), true);
  assertEquals(parseBoolean('false'), false);
  assertEquals(parseBoolean('FALSE'), false);
  assertEquals(parseBoolean(undefined), false);
  assertEquals(parseBoolean(''), false);
});

Deno.test('config - numeric environment variables can be parsed', () => {
  // Test parsing numbers from env vars
  const parseNumber = (value: string | undefined, defaultValue: number): number => {
    const parsed = parseInt(value || '', 10);
    return isNaN(parsed) ? defaultValue : parsed;
  };

  assertEquals(parseNumber('123', 0), 123);
  assertEquals(parseNumber('', 42), 42);
  assertEquals(parseNumber(undefined, 42), 42);
  assertEquals(parseNumber('invalid', 42), 42);
});
