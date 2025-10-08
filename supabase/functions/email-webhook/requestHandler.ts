import { logWarn } from './logger.ts';

/**
 * Validates HTTP request method
 */
export const validateRequestMethod = (req: Request): Response | null => {
  if (req.method !== 'POST') {
    logWarn('invalid_method', {
      method: req.method,
      path: new URL(req.url).pathname,
    });
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return null;
};

/**
 * Creates a success response for SendGrid webhook
 */
export const createSuccessResponse = (messageId: string): Response => {
  return new Response(
    JSON.stringify({
      status: 'success',
      messageId,
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    },
  );
};

/**
 * Creates an error response (400 for validation errors)
 */
export const createValidationErrorResponse = (
  message: string,
  context?: Record<string, unknown>,
): Response => {
  return new Response(
    JSON.stringify({
      error: message,
      details: context,
    }),
    {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    },
  );
};

/**
 * Creates a generic error response (200 to prevent retry loops)
 */
export const createGenericErrorResponse = (): Response => {
  return new Response(
    JSON.stringify({
      status: 'error',
      message: 'Internal error occurred',
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    },
  );
};

