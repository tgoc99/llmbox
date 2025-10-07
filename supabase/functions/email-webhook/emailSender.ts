/**
 * Email sender module for SendGrid Send API
 * Handles formatting and sending outbound emails
 */

import { config } from './config.ts';
import { logCritical, logError, logInfo, logWarn } from './logger.ts';
import { withRetry } from './retryLogic.ts';
import type {
  IncomingEmail,
  LLMResponse,
  OutgoingEmail,
  SendGridEmailRequest,
} from './types.ts';

/**
 * Format outgoing email from incoming email and LLM response
 * @param incoming - Original incoming email
 * @param llmResponse - Generated LLM response
 * @returns Formatted outgoing email ready to send
 */
export const formatOutgoingEmail = (
  incoming: IncomingEmail,
  llmResponse: LLMResponse,
): OutgoingEmail => {
  // Format subject with "Re: " prefix if not already present
  const subject = incoming.subject.startsWith('Re: ')
    ? incoming.subject
    : `Re: ${incoming.subject}`;

  // Build references array by appending original message ID to existing references
  const references = [...incoming.references, incoming.messageId];

  return {
    from: config.serviceEmailAddress,
    to: incoming.from,
    subject,
    body: llmResponse.content,
    inReplyTo: incoming.messageId,
    references,
  };
};

/**
 * Send email via SendGrid Send API
 * @param email - Outgoing email to send
 * @throws Error if send fails after retries
 */
export const sendEmail = async (email: OutgoingEmail): Promise<void> => {
  // Validate required configuration
  if (!config.sendgridApiKey) {
    throw new Error('SENDGRID_API_KEY is not configured');
  }
  if (!config.serviceEmailAddress) {
    throw new Error('SERVICE_EMAIL_ADDRESS is not configured');
  }

  // Build SendGrid API request body
  const requestBody: SendGridEmailRequest = {
    personalizations: [
      {
        to: [{ email: email.to }],
        subject: email.subject,
        headers: {
          'In-Reply-To': email.inReplyTo,
          References: email.references.join(' '),
        },
      },
    ],
    from: { email: email.from },
    content: [
      {
        type: 'text/plain',
        value: email.body,
      },
    ],
  };

  // Log send started
  logInfo('sendgrid_send_started', {
    messageId: email.inReplyTo,
    to: email.to,
    subject: email.subject,
  });

  try {
    // Make API call with retry logic
    await withRetry(
      async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(
          () => controller.abort(),
          config.sendgridTimeoutMs,
        );

        try {
          const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${config.sendgridApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          // Check if response is 202 Accepted
          if (res.status === 202) {
            // Log SendGrid message ID if available
            const messageId = res.headers.get('X-Message-Id');
            if (messageId) {
              logInfo('sendgrid_message_id', {
                messageId: email.inReplyTo,
                sendgridMessageId: messageId,
              });
            }
            return res;
          }

          // Handle different error status codes
          const errorBody = await res.text();

          if (res.status === 401 || res.status === 403) {
            // Auth error - log as CRITICAL (don't retry)
            logCritical('sendgrid_auth_error', {
              messageId: email.inReplyTo,
              statusCode: res.status,
              error: errorBody,
            });
            throw new Error(`SendGrid auth error: ${res.status} - ${errorBody}`);
          }

          if (res.status === 400) {
            // Bad request - log as ERROR (don't retry)
            logError('sendgrid_bad_request', {
              messageId: email.inReplyTo,
              statusCode: res.status,
              error: errorBody,
              requestBody: JSON.stringify(requestBody),
            });
            throw new Error(`SendGrid bad request: ${errorBody}`);
          }

          if (res.status === 429) {
            // Rate limit - log as WARN and retry
            logWarn('sendgrid_rate_limit', {
              messageId: email.inReplyTo,
              statusCode: res.status,
              error: errorBody,
            });
            throw new Error(`SendGrid rate limit: ${errorBody}`);
          }

          // Server errors (500, 502, 503) - retry
          if (res.status >= 500) {
            logError('sendgrid_server_error', {
              messageId: email.inReplyTo,
              statusCode: res.status,
              error: errorBody,
            });
            throw new Error(`SendGrid server error: ${res.status} - ${errorBody}`);
          }

          // Other errors
          throw new Error(`SendGrid API error: ${res.status} - ${errorBody}`);
        } finally {
          clearTimeout(timeoutId);
        }
      },
      {
        maxAttempts: 3,
        delayMs: 1000,
        retryableStatusCodes: [429, 500, 502, 503, 504],
      },
    );

    // Log success
    logInfo('sendgrid_send_completed', {
      messageId: email.inReplyTo,
      to: email.to,
      subject: email.subject,
    });
  } catch (error) {
    // Log error with correlation ID and rethrow
    logError('sendgrid_send_failed', {
      messageId: email.inReplyTo,
      to: email.to,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
};

