/**
 * Email sender module using official SendGrid library
 * Handles formatting and sending outbound emails
 */

import sgMail from 'npm:@sendgrid/mail@8.1.6';
import { config } from './config.ts';
import { logCritical, logError, logInfo } from './logger.ts';
import type {
  IncomingEmail,
  LLMResponse,
  OutgoingEmail,
} from './types.ts';

// Initialize SendGrid client
sgMail.setApiKey(config.sendgridApiKey);

/**
 * Ensure message ID is properly formatted with angle brackets
 * Per RFC 5322, message IDs must be enclosed in angle brackets
 * @param messageId - Message ID to format
 * @returns Properly formatted message ID with angle brackets
 */
const ensureAngleBrackets = (messageId: string): string => {
  const trimmed = messageId.trim();
  if (!trimmed) return '';

  // If already has angle brackets, return as-is
  if (trimmed.startsWith('<') && trimmed.endsWith('>')) {
    return trimmed;
  }

  // Add angle brackets
  return `<${trimmed}>`;
};

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
  // Filter out empty values and ensure proper formatting
  const references = [...incoming.references, incoming.messageId]
    .map((ref) => ensureAngleBrackets(ref))
    .filter((ref) => ref.length > 0);

  return {
    from: incoming.to,
    to: incoming.from,
    subject,
    body: llmResponse.content,
    inReplyTo: incoming.messageId,
    references,
  };
};

/**
 * Send email via SendGrid using official library
 * @param email - Outgoing email to send
 * @throws Error if send fails
 */
export const sendEmail = async (email: OutgoingEmail): Promise<void> => {
  // Validate required configuration
  if (!config.sendgridApiKey) {
    throw new Error('SENDGRID_API_KEY is not configured');
  }
  if (!config.serviceEmailAddress) {
    throw new Error('SERVICE_EMAIL_ADDRESS is not configured');
  }

  // Ensure In-Reply-To is properly formatted with angle brackets
  const inReplyTo = ensureAngleBrackets(email.inReplyTo);

  // Build headers object for email threading
  const headers: Record<string, string> = {};

  if (inReplyTo) {
    headers['In-Reply-To'] = inReplyTo;
  }

  // Only add References header if we have valid references
  if (email.references.length > 0) {
    headers['References'] = email.references.join(' ');
  }

  // Construct message using library's simplified API
  const msg = {
    to: email.to,
    from: email.from,
    subject: email.subject,
    text: email.body,
    headers: Object.keys(headers).length > 0 ? headers : undefined,
  };

  // Log send started
  logInfo('sendgrid_send_started', {
    messageId: email.inReplyTo,
    to: email.to,
    from: email.from,
    subject: email.subject,
  });

  try {
    // Send email using SendGrid library (includes built-in retry logic)
    const response = await sgMail.send(msg);

    // Extract SendGrid message ID from response headers
    const sendgridMessageId = response[0]?.headers?.['x-message-id'];
    if (sendgridMessageId) {
      logInfo('sendgrid_message_id', {
        messageId: email.inReplyTo,
        sendgridMessageId,
      });
    }

    // Log success
    logInfo('sendgrid_send_completed', {
      messageId: email.inReplyTo,
      to: email.to,
      subject: email.subject,
    });
  } catch (error: any) {
    // Library provides structured error with response details
    if (error.response) {
      const statusCode = error.code || error.response?.statusCode;
      const errorBody = error.response?.body;

      // Auth errors (401, 403) - log as CRITICAL
      if (statusCode === 401 || statusCode === 403) {
        logCritical('sendgrid_auth_error', {
          messageId: email.inReplyTo,
          statusCode,
          error: errorBody,
        });
      }
      // Bad request (400) - log as ERROR
      else if (statusCode === 400) {
        logError('sendgrid_bad_request', {
          messageId: email.inReplyTo,
          statusCode,
          error: errorBody,
        });
      }
      // Other errors
      else {
        logError('sendgrid_send_failed', {
          messageId: email.inReplyTo,
          to: email.to,
          error: error.message,
          statusCode,
          errorBody,
        });
      }
    } else {
      // Network or other errors without response
      logError('sendgrid_send_failed', {
        messageId: email.inReplyTo,
        to: email.to,
        error: error.message || String(error),
      });
    }
    throw error;
  }
};

