import { assertEquals, assertExists } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { corsHeaders } from '../../../supabase/functions/_shared/cors.ts';

/**
 * CORS Headers Tests
 *
 * Tests CORS header configuration
 */

Deno.test('cors - corsHeaders has required headers', () => {
  assertExists(corsHeaders['Access-Control-Allow-Origin']);
  assertExists(corsHeaders['Access-Control-Allow-Methods']);
  assertExists(corsHeaders['Access-Control-Allow-Headers']);
});

Deno.test('cors - allows all origins', () => {
  assertEquals(corsHeaders['Access-Control-Allow-Origin'], '*');
});

Deno.test('cors - allows POST and OPTIONS methods', () => {
  const allowedMethods = corsHeaders['Access-Control-Allow-Methods'];
  assertEquals(allowedMethods.includes('POST'), true);
  assertEquals(allowedMethods.includes('OPTIONS'), true);
});

Deno.test('cors - allows required headers', () => {
  const allowedHeaders = corsHeaders['Access-Control-Allow-Headers'];
  assertEquals(allowedHeaders.includes('Content-Type'), true);
  assertEquals(allowedHeaders.includes('Authorization'), true);
});

Deno.test('cors - headers are string type', () => {
  for (const [key, value] of Object.entries(corsHeaders)) {
    assertEquals(typeof key, 'string');
    assertEquals(typeof value, 'string');
  }
});

Deno.test('cors - headers can be used in Response', () => {
  // Should be able to create a Response with these headers
  const response = new Response('OK', {
    status: 200,
    headers: corsHeaders,
  });

  assertEquals(response.status, 200);
  assertEquals(response.headers.get('Access-Control-Allow-Origin'), '*');
});

Deno.test('cors - headers can be merged with custom headers', () => {
  const customHeaders = {
    'Content-Type': 'application/json',
    'X-Custom-Header': 'custom-value',
  };

  const mergedHeaders = { ...corsHeaders, ...customHeaders };

  assertExists(mergedHeaders['Access-Control-Allow-Origin']);
  assertExists(mergedHeaders['Content-Type']);
  assertExists(mergedHeaders['X-Custom-Header']);
});
