import { logCritical, logError, logWarn } from './logger.ts';
import {
  getGenericErrorEmail,
  getOpenAIErrorEmail,
  getRateLimitErrorEmail,
  getTimeoutErrorEmail,
} from './errorTemplates.ts';
import type { ParsedEmail, OutgoingEmail } from './types.ts';

/**
 * Handles OpenAI errors and returns appropriate error email
 */
export const handleOpenAIError = (
  error: unknown,
  email: ParsedEmail,
  processingTimeMs?: number,
): OutgoingEmail => {
  const errorMessage = error instanceof Error ? error.message : String(error);

  // Detect error type and log appropriately
  if (errorMessage.includes('429') || errorMessage.toLowerCase().includes('rate limit')) {
    // Rate limit error
    logWarn('openai_rate_limit', {
      messageId: email.messageId,
      error: errorMessage,
      processingTimeMs,
    });
    return getRateLimitErrorEmail(email);
  }

  if (errorMessage.includes('timeout') || errorMessage.toLowerCase().includes('timed out')) {
    // Timeout error
    logWarn('openai_timeout', {
      messageId: email.messageId,
      error: errorMessage,
      processingTimeMs,
    });
    return getTimeoutErrorEmail(email);
  }

  if (errorMessage.includes('401') || errorMessage.includes('403')) {
    // Auth error - critical
    logCritical('openai_auth_error', {
      messageId: email.messageId,
      error: errorMessage,
    });
    return getGenericErrorEmail(email);
  }

  // Generic error
  logError('openai_error', {
    messageId: email.messageId,
    error: errorMessage,
    stack: error instanceof Error ? error.stack : undefined,
  });
  return getOpenAIErrorEmail(email, error as Error);
};

/**
 * Handles SendGrid errors and logs appropriately
 * Does not return an error email to prevent email loops
 */
export const handleSendGridError = (
  error: unknown,
  messageId: string,
): void => {
  const errorMessage = error instanceof Error ? error.message : String(error);

  // Check error type for SendGrid
  if (errorMessage.includes('429') || errorMessage.toLowerCase().includes('rate limit')) {
    logWarn('sendgrid_rate_limit', {
      messageId,
      error: errorMessage,
    });
    return;
  }

  if (errorMessage.includes('401') || errorMessage.includes('403')) {
    logCritical('sendgrid_auth_error', {
      messageId,
      error: errorMessage,
    });
    return;
  }

  if (errorMessage.includes('400')) {
    logError('sendgrid_bad_request', {
      messageId,
      error: errorMessage,
    });
    return;
  }

  if (errorMessage.match(/50[0-9]/)) {
    logError('sendgrid_server_error', {
      messageId,
      error: errorMessage,
    });
    return;
  }

  logError('sendgrid_send_failed', {
    messageId,
    error: errorMessage,
  });
};

