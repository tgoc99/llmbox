/**
 * Error email templates for user-facing error messages
 */

import { config } from './config.ts';
import type { IncomingEmail, OutgoingEmail } from './types.ts';

/**
 * Get error email for OpenAI API failures
 * @param originalEmail - The original incoming email
 * @param error - The error that occurred
 * @returns Formatted error email
 */
export const getOpenAIErrorEmail = (
  originalEmail: IncomingEmail,
  error: Error,
): OutgoingEmail => {
  const subject = originalEmail.subject.startsWith('Re: ')
    ? originalEmail.subject
    : `Re: ${originalEmail.subject}`;

  const body = `Dear User,

Sorry, I'm having trouble responding right now. Please try again in a few minutes.

If this issue persists, please reach out to our support team.

Best regards,
Email Assistant Service`;

  const references = [...originalEmail.references, originalEmail.messageId];

  return {
    from: config.serviceEmailAddress,
    to: originalEmail.from,
    subject,
    body,
    inReplyTo: originalEmail.messageId,
    references,
  };
};

/**
 * Get error email for rate limit errors
 * @param originalEmail - The original incoming email
 * @returns Formatted error email
 */
export const getRateLimitErrorEmail = (originalEmail: IncomingEmail): OutgoingEmail => {
  const subject = originalEmail.subject.startsWith('Re: ')
    ? originalEmail.subject
    : `Re: ${originalEmail.subject}`;

  const body = `Dear User,

I'm experiencing high demand right now. Please try again in a few minutes.

Thank you for your patience!

Best regards,
Email Assistant Service`;

  const references = [...originalEmail.references, originalEmail.messageId];

  return {
    from: config.serviceEmailAddress,
    to: originalEmail.from,
    subject,
    body,
    inReplyTo: originalEmail.messageId,
    references,
  };
};

/**
 * Get generic error email
 * @param originalEmail - The original incoming email
 * @returns Formatted error email
 */
export const getGenericErrorEmail = (originalEmail: IncomingEmail): OutgoingEmail => {
  const subject = originalEmail.subject.startsWith('Re: ')
    ? originalEmail.subject
    : `Re: ${originalEmail.subject}`;

  const body = `Dear User,

Sorry, I encountered a technical issue. Please try again shortly.

If this problem continues, please contact our support team.

Best regards,
Email Assistant Service`;

  const references = [...originalEmail.references, originalEmail.messageId];

  return {
    from: config.serviceEmailAddress,
    to: originalEmail.from,
    subject,
    body,
    inReplyTo: originalEmail.messageId,
    references,
  };
};

/**
 * Get error email for timeout errors
 * @param originalEmail - The original incoming email
 * @returns Formatted error email
 */
export const getTimeoutErrorEmail = (originalEmail: IncomingEmail): OutgoingEmail => {
  const subject = originalEmail.subject.startsWith('Re: ')
    ? originalEmail.subject
    : `Re: ${originalEmail.subject}`;

  const body = `Dear User,

I'm taking longer than usual to respond. Please try again in a few minutes.

Thank you for your patience!

Best regards,
Email Assistant Service`;

  const references = [...originalEmail.references, originalEmail.messageId];

  return {
    from: config.serviceEmailAddress,
    to: originalEmail.from,
    subject,
    body,
    inReplyTo: originalEmail.messageId,
    references,
  };
};

