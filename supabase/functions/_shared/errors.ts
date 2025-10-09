/**
 * Custom error classes for better error handling
 */

import { logError } from './logger.ts';

/**
 * Base custom error class
 */
export class CustomError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public context?: Record<string, unknown>,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

/**
 * Validation error (400)
 */
export class ValidationError extends CustomError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 400, context);
  }
}

/**
 * Database error (500)
 */
export class DatabaseError extends CustomError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 500, context);
  }
}

/**
 * LLM/OpenAI error (502)
 */
export class LLMError extends CustomError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 502, context);
  }
}

/**
 * Email sending error (502)
 */
export class EmailError extends CustomError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 502, context);
  }
}

/**
 * Handle error and return JSON response
 */
export const handleError = (
  error: unknown,
  event: string = 'unknown_error',
  payload?: unknown,
): Response => {
  if (error instanceof CustomError) {
    logError(event, {
      error: error.message,
      statusCode: error.statusCode,
      context: error.context,
      fullPayload: payload,
    });

    return new Response(
      JSON.stringify({
        error: error.message,
        statusCode: error.statusCode,
      }),
      {
        status: error.statusCode,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }

  // Unknown error
  const errorMessage = error instanceof Error ? error.message : String(error);
  logError(event, {
    error: errorMessage,
    stack: error instanceof Error ? error.stack : undefined,
    fullPayload: payload,
  });

  return new Response(
    JSON.stringify({
      error: 'Internal server error',
      statusCode: 500,
    }),
    {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    },
  );
};

