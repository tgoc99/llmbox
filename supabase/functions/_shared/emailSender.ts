/**
 * Shared email sender module using official SendGrid library
 * Handles formatting and sending various types of outbound emails
 * Used by email-webhook (reply emails) and personifeed (newsletters, confirmations)
 */

import sgMail from 'npm:@sendgrid/mail@8.1.6';
import { config } from './config.ts';
import { generateNewsletterEmailHtml, generateReplyEmailHtml } from './emailTemplates.ts';
import { logCritical, logError, logInfo } from './logger.ts';
import type { IncomingEmail, LLMResponse, OutgoingEmail } from './types.ts';

// Initialize SendGrid client
let sendgridInitialized = false;

const initializeSendGrid = (): void => {
  if (!sendgridInitialized) {
    if (!config.sendgridApiKey) {
      throw new Error('SENDGRID_API_KEY is not configured');
    }
    sgMail.setApiKey(config.sendgridApiKey);
    sendgridInitialized = true;
  }
};

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
 * Used by email-webhook for reply emails
 * @param incoming - Original incoming email
 * @param llmResponse - Generated LLM response
 * @returns Formatted outgoing email ready to send
 */
export const formatReplyEmail = (
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

  // Generate HTML version from markdown content
  const htmlBody = generateReplyEmailHtml(llmResponse.content);

  return {
    from: incoming.to,
    to: incoming.from,
    subject,
    body: llmResponse.content,
    htmlBody: htmlBody,
    inReplyTo: incoming.messageId,
    references,
  };
};

/**
 * Generate dynamic reply address for a user
 * Format: reply+{userId}@{domain}
 * This allows us to identify which user is replying based on the TO address
 */
export const getReplyAddress = (userId: string): string => {
  const domain = config.personifeedEmailDomain;
  // Use + addressing to encode userId in the email address
  // SendGrid will route all reply+*@domain emails to the inbound webhook
  return `reply+${userId}@${domain}`;
};

/**
 * Options for sending an email
 */
export interface SendEmailOptions {
  /** Recipient email address */
  to: string;
  /** Sender email address */
  from: string;
  /** Email subject */
  subject: string;
  /** Email body (plain text or markdown) */
  body: string;
  /** Optional HTML version of email body */
  htmlBody?: string;
  /** Message ID this email replies to (optional) */
  inReplyTo?: string;
  /** Thread references (optional) */
  references?: string[];
  /** Context object for logging */
  logContext?: Record<string, unknown>;
}

/**
 * Send email via SendGrid using official library
 * Core function used by all email types
 * @param options - Email options
 * @throws Error if send fails
 */
export const sendEmail = async (options: SendEmailOptions): Promise<void> => {
  const {
    to,
    from,
    subject,
    body,
    htmlBody,
    inReplyTo,
    references = [],
    logContext = {},
  } = options;

  initializeSendGrid();

  // Ensure In-Reply-To is properly formatted with angle brackets
  const formattedInReplyTo = inReplyTo ? ensureAngleBrackets(inReplyTo) : undefined;

  // Build headers object for email threading
  const headers: Record<string, string> = {};

  if (formattedInReplyTo) {
    headers['In-Reply-To'] = formattedInReplyTo;
  }

  // Only add References header if we have valid references
  if (references.length > 0) {
    headers['References'] = references.join(' ');
  }

  // Construct message using library's simplified API
  const msg = {
    to,
    from,
    subject,
    text: body,
    html: htmlBody, // Include HTML version if provided
    headers: Object.keys(headers).length > 0 ? headers : undefined,
  };

  // Log send started
  logInfo('sendgrid_send_started', {
    ...logContext,
    to,
    from,
    subject,
  });

  try {
    // Send email using SendGrid library (includes built-in retry logic)
    const response = await sgMail.send(msg);

    // Extract SendGrid message ID from response headers
    const sendgridMessageId = response[0]?.headers?.['x-message-id'];
    if (sendgridMessageId) {
      logInfo('sendgrid_message_id', {
        ...logContext,
        sendgridMessageId,
      });
    }

    // Log success
    logInfo('sendgrid_send_completed', {
      ...logContext,
      to,
      subject,
    });
  } catch (error: unknown) {
    // Library provides structured error with response details
    const err = error as {
      response?: { statusCode?: number; body?: unknown };
      code?: number;
      message?: string;
      stack?: string;
    };

    if (err.response) {
      const statusCode = err.code || err.response?.statusCode;
      const errorBody = err.response?.body;

      // Auth errors (401, 403) - log as CRITICAL
      if (statusCode === 401 || statusCode === 403) {
        logCritical('sendgrid_auth_error', {
          ...logContext,
          statusCode,
          error: errorBody,
          stack: err.stack,
        });
      } // Bad request (400) - log as ERROR
      else if (statusCode === 400) {
        logError('sendgrid_bad_request', {
          ...logContext,
          statusCode,
          error: errorBody,
          stack: err.stack,
          to,
          from,
          subject,
        });
      } // Other errors
      else {
        logError('sendgrid_send_failed', {
          ...logContext,
          to,
          error: err.message,
          statusCode,
          errorBody,
          stack: err.stack,
        });
      }
    } else {
      // Network or other errors without response
      logError('sendgrid_send_failed', {
        ...logContext,
        to,
        error: err.message || String(error),
        stack: err.stack,
      });
    }
    throw error;
  }
};

/**
 * Send reply email (email-webhook use case)
 * @param email - Outgoing email to send
 * @throws Error if send fails
 */
export const sendReplyEmail = async (email: OutgoingEmail): Promise<void> => {
  // Validate SERVICE_EMAIL_ADDRESS for email-webhook use case
  if (!config.serviceEmailAddress) {
    throw new Error('SERVICE_EMAIL_ADDRESS is not configured');
  }

  await sendEmail({
    to: email.to,
    from: email.from,
    subject: email.subject,
    body: email.body,
    htmlBody: email.htmlBody,
    inReplyTo: email.inReplyTo,
    references: email.references,
    logContext: { messageId: email.inReplyTo },
  });
};

/**
 * Send newsletter email (personifeed use case)
 * @param userId - User ID
 * @param userEmail - User's email address
 * @param content - Newsletter content (markdown format)
 * @throws Error if send fails
 */
export const sendNewsletterEmail = async (
  userId: string,
  userEmail: string,
  content: string,
): Promise<void> => {
  const todayDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const subject = `Your Daily Digest - ${todayDate}`;

  // Plain text version (markdown with footer)
  const textBody = `${content}

---

Reply to this email to customize future newsletters.`;

  // HTML version (rendered from markdown)
  const htmlBody = generateNewsletterEmailHtml(content, {
    headerText: `Your Daily Digest - ${todayDate}`,
    footerText: 'Reply to this email to customize future newsletters.',
  });

  // Use dynamic reply address based on user ID
  const fromAddress = getReplyAddress(userId);

  await sendEmail({
    to: userEmail,
    from: fromAddress,
    subject,
    body: textBody,
    htmlBody: htmlBody,
    logContext: { userId, email: userEmail, fromAddress },
  });
};

/**
 * Send confirmation email for reply (personifeed use case)
 * @param userId - User ID
 * @param userEmail - User's email address
 * @param inReplyTo - Original message ID (optional, for threading)
 */
export const sendConfirmationEmail = async (
  userId: string,
  userEmail: string,
  inReplyTo?: string,
): Promise<void> => {
  try {
    const subject = 'Re: Your Daily Digest';

    // Plain text version
    const textBody =
      "Thanks for your feedback! Your customization will be reflected in tomorrow's newsletter at 11am ET.";

    // HTML version with proper formatting
    const htmlBody = generateReplyEmailHtml(textBody);

    // Use the same dynamic reply address for consistency
    const fromAddress = getReplyAddress(userId);

    await sendEmail({
      to: userEmail,
      from: fromAddress,
      subject,
      body: textBody,
      htmlBody,
      inReplyTo,
      references: inReplyTo ? [inReplyTo] : undefined,
      logContext: { userId, email: userEmail },
    });

    logInfo('confirmation_sent', {
      userId,
      email: userEmail,
      subject,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logError('confirmation_send_failed', {
      userId,
      email: userEmail,
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Don't throw error for confirmation emails - log and continue
    // We don't want to fail the entire operation if confirmation fails
  }
};
