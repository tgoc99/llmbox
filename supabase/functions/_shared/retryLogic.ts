/**
 * Retry logic utility with exponential backoff
 */

import { logWarn } from './logger.ts';

/**
 * Configuration for retry behavior
 */
export interface RetryConfig {
  /** Maximum number of attempts */
  maxAttempts: number;
  /** Initial delay in milliseconds */
  delayMs: number;
  /** HTTP status codes that should trigger a retry */
  retryableStatusCodes: number[];
}

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  delayMs: 1000, // Start with 1 second
  retryableStatusCodes: [429, 500, 502, 503, 504],
};

/**
 * Sleep for specified milliseconds
 */
const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Check if an error is retryable based on status code
 */
const isRetryableError = (error: unknown, config: RetryConfig): boolean => {
  if (error instanceof Response) {
    return config.retryableStatusCodes.includes(error.status);
  }

  // Network errors and timeouts are retryable
  if (error instanceof Error) {
    const errorMessage = error.message.toLowerCase();
    return errorMessage.includes('timeout') ||
      errorMessage.includes('network') ||
      errorMessage.includes('fetch');
  }

  return false;
};

/**
 * Retry a function with exponential backoff
 * @param fn Function to retry
 * @param config Retry configuration
 * @returns Result of the function
 * @throws Last error if all retries fail
 */
export const withRetry = async <T>(
  fn: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG,
): Promise<T> => {
  let lastError: unknown;

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Check if error is retryable
      if (!isRetryableError(error, config) || attempt >= config.maxAttempts) {
        throw error;
      }

      // Calculate delay with exponential backoff: 1s, 2s, 4s
      const delay = config.delayMs * Math.pow(2, attempt - 1);

      logWarn('retry_attempt', {
        attempt,
        maxAttempts: config.maxAttempts,
        delayMs: delay,
        error: error instanceof Error ? error.message : String(error),
        statusCode: error instanceof Response ? error.status : undefined,
      });

      // Wait before retrying
      await sleep(delay);
    }
  }

  // This should never be reached due to throw in loop, but TypeScript requires it
  throw lastError;
};

