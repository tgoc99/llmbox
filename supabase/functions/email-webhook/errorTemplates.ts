/**
 * Error email templates for user-facing error messages
 */

import { config } from '../_shared/config.ts';
import type { IncomingEmail, OutgoingEmail } from '../_shared/types.ts';

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
 * Get error email for OpenAI API failures
 * @param originalEmail - The original incoming email
 * @returns Formatted error email
 */
export const getOpenAIErrorEmail = (
  originalEmail: IncomingEmail,
): OutgoingEmail => {
  const subject = originalEmail.subject.startsWith('Re: ')
    ? originalEmail.subject
    : `Re: ${originalEmail.subject}`;

  const body = `Dear User,

Sorry, I'm having trouble responding right now. Please try again in a few minutes.

If this issue persists, please reach out to our support team.

Best regards,
Email Assistant Service`;

  // Build references array with proper formatting
  const references = [...originalEmail.references, originalEmail.messageId]
    .map((ref) => ensureAngleBrackets(ref))
    .filter((ref) => ref.length > 0);

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

  // Build references array with proper formatting
  const references = [...originalEmail.references, originalEmail.messageId]
    .map((ref) => ensureAngleBrackets(ref))
    .filter((ref) => ref.length > 0);

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

  // Build references array with proper formatting
  const references = [...originalEmail.references, originalEmail.messageId]
    .map((ref) => ensureAngleBrackets(ref))
    .filter((ref) => ref.length > 0);

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

  // Build references array with proper formatting
  const references = [...originalEmail.references, originalEmail.messageId]
    .map((ref) => ensureAngleBrackets(ref))
    .filter((ref) => ref.length > 0);

  return {
    from: config.serviceEmailAddress,
    to: originalEmail.from,
    subject,
    body,
    inReplyTo: originalEmail.messageId,
    references,
  };
};
