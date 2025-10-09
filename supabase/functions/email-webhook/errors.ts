import { logCritical, logError, logWarn } from './logger.ts';
import {
  getGenericErrorEmail,
  getOpenAIErrorEmail,
  getRateLimitErrorEmail,
  getTimeoutErrorEmail,
} from './errorTemplates.ts';
import type { IncomingEmail as ParsedEmail, OutgoingEmail } from '../_shared/types.ts';

/**
 * Serialize FormData to object for logging
 */
const serializeFormData = (formData: FormData | null): Record<string, unknown> => {
  const payload: Record<string, unknown> = {};
  if (formData) {
    for (const [key, value] of formData.entries()) {
      payload[key] = value instanceof File ? `[File: ${value.name}]` : value;
    }
  }
  return payload;
};

/**
 * Handles OpenAI errors and returns appropriate error email
 */
export const handleOpenAIError = (
  error: unknown,
  email: ParsedEmail,
  processingTimeMs?: number,
  formData?: FormData | null,
): OutgoingEmail => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const fullPayload = serializeFormData(formData || null);

  // Detect error type and log appropriately
  if (errorMessage.includes('429') || errorMessage.toLowerCase().includes('rate limit')) {
    // Rate limit error
    logWarn('openai_rate_limit', {
      messageId: email.messageId,
      error: errorMessage,
      processingTimeMs,
      fullPayload,
    });
    return getRateLimitErrorEmail(email);
  }

  if (errorMessage.includes('timeout') || errorMessage.toLowerCase().includes('timed out')) {
    // Timeout error
    logWarn('openai_timeout', {
      messageId: email.messageId,
      error: errorMessage,
      processingTimeMs,
      fullPayload,
    });
    return getTimeoutErrorEmail(email);
  }

  if (errorMessage.includes('401') || errorMessage.includes('403')) {
    // Auth error - critical
    logCritical('openai_auth_error', {
      messageId: email.messageId,
      error: errorMessage,
      fullPayload,
    });
    return getGenericErrorEmail(email);
  }

  // Generic error
  logError('openai_error', {
    messageId: email.messageId,
    error: errorMessage,
    stack: error instanceof Error ? error.stack : undefined,
    fullPayload,
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
  formData?: FormData | null,
): void => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const fullPayload = serializeFormData(formData || null);

  // Check error type for SendGrid
  if (errorMessage.includes('429') || errorMessage.toLowerCase().includes('rate limit')) {
    logWarn('sendgrid_rate_limit', {
      messageId,
      error: errorMessage,
      fullPayload,
    });
    return;
  }

  if (errorMessage.includes('401') || errorMessage.includes('403')) {
    logCritical('sendgrid_auth_error', {
      messageId,
      error: errorMessage,
      fullPayload,
    });
    return;
  }

  if (errorMessage.includes('400')) {
    logError('sendgrid_bad_request', {
      messageId,
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      fullPayload,
    });
    return;
  }

  if (errorMessage.match(/50[0-9]/)) {
    logError('sendgrid_server_error', {
      messageId,
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      fullPayload,
    });
    return;
  }

  logError('sendgrid_send_failed', {
    messageId,
    error: errorMessage,
    stack: error instanceof Error ? error.stack : undefined,
    fullPayload,
  });
};

