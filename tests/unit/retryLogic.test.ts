import { assert, assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { DEFAULT_RETRY_CONFIG, withRetry } from '../../supabase/functions/_shared/retryLogic.ts';

Deno.test('withRetry - succeeds on first attempt', async () => {
  let attempts = 0;
  const fn = () => {
    attempts++;
    return Promise.resolve('success');
  };

  const result = await withRetry(fn);

  assertEquals(result, 'success');
  assertEquals(attempts, 1);
});

Deno.test('withRetry - succeeds on second attempt after retryable error', async () => {
  let attempts = 0;
  const fn = () => {
    attempts++;
    if (attempts === 1) {
      throw new Response('Server Error', { status: 500 });
    }
    return Promise.resolve('success');
  };

  const result = await withRetry(fn);

  assertEquals(result, 'success');
  assertEquals(attempts, 2);
});

Deno.test('withRetry - retries on 429 rate limit', async () => {
  let attempts = 0;
  const fn = () => {
    attempts++;
    if (attempts < 3) {
      throw new Response('Rate Limited', { status: 429 });
    }
    return Promise.resolve('success');
  };

  const result = await withRetry(fn);

  assertEquals(result, 'success');
  assertEquals(attempts, 3);
});

Deno.test('withRetry - does not retry on 401 auth error', async () => {
  let attempts = 0;
  const fn = () => {
    attempts++;
    throw new Response('Unauthorized', { status: 401 });
  };

  try {
    await withRetry(fn);
    throw new Error('Should have thrown');
  } catch (error) {
    assert(error instanceof Response);
    assertEquals((error as Response).status, 401);
  }

  assertEquals(attempts, 1); // Should not retry
});

Deno.test('withRetry - does not retry on 400 bad request', async () => {
  let attempts = 0;
  const fn = () => {
    attempts++;
    throw new Response('Bad Request', { status: 400 });
  };

  try {
    await withRetry(fn);
    throw new Error('Should have thrown');
  } catch (error) {
    assert(error instanceof Response);
    assertEquals((error as Response).status, 400);
  }

  assertEquals(attempts, 1); // Should not retry
});

Deno.test('withRetry - exhausts all retries and throws last error', async () => {
  let attempts = 0;
  const fn = () => {
    attempts++;
    throw new Response('Server Error', { status: 500 });
  };

  try {
    await withRetry(fn);
    throw new Error('Should have thrown');
  } catch (error) {
    assert(error instanceof Response);
    assertEquals((error as Response).status, 500);
  }

  assertEquals(attempts, DEFAULT_RETRY_CONFIG.maxAttempts);
});
