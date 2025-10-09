/**
 * Email parser module for SendGrid webhook payloads
 * Adapted from llmbox email-webhook/emailParser.ts
 */

import { ValidationError } from '../_shared/errors.ts';

/**
 * Extract email address from a string that may contain display name
 * Handles formats like:
 * - "Display Name" <email@example.com>
 * - <email@example.com>
 * - email@example.com
 */
const extractEmailAddress = (emailString: string): string => {
  // Match email in angle brackets: "Name" <email@example.com> or <email@example.com>
  const bracketMatch = emailString.match(/<([^>]+)>/);
  if (bracketMatch) {
    return bracketMatch[1].trim();
  }

  // If no angle brackets, return the whole string trimmed (already just an email)
  return emailString.trim();
};

/**
 * Extract Message-ID from email headers
 */
const extractMessageId = (headers: string): string | null => {
  const match = headers.match(/Message-ID:\s*(<[^>]+>)/i);
  return match ? match[1] : null;
};

/**
 * Clean email body text (remove quotes, signatures, etc.)
 */
const cleanEmailBody = (body: string): string => {
  // Remove quoted text (lines starting with >)
  const lines = body.split('\n');
  const cleanedLines: string[] = [];

  for (const line of lines) {
    const trimmedLine = line.trim();

    // Stop at common signature markers
    if (
      trimmedLine.startsWith('--') ||
      trimmedLine.startsWith('___') ||
      trimmedLine === 'Sent from my iPhone' ||
      trimmedLine === 'Sent from my Android device'
    ) {
      break;
    }

    // Skip quoted lines
    if (trimmedLine.startsWith('>')) {
      continue;
    }

    cleanedLines.push(line);
  }

  return cleanedLines.join('\n').trim();
};

/**
 * Extract userId from reply address
 * Format: reply+{userId}@domain
 * Returns null if format doesn't match
 */
const extractUserIdFromReplyAddress = (to: string): string | null => {
  const email = extractEmailAddress(to);

  // Match pattern: reply+{userId}@domain
  const match = email.match(/^reply\+([a-f0-9-]+)@/i);

  return match ? match[1] : null;
};

/**
 * Parse reply email from SendGrid webhook FormData
 */
export const parseReplyEmail = (
  formData: FormData,
): { from: string; to: string; userId: string | null; body: string; messageId: string | null } => {
  // Extract required fields
  const from = formData.get('from')?.toString();
  const to = formData.get('to')?.toString();
  const text = formData.get('text')?.toString();
  const headers = formData.get('headers')?.toString() || '';

  // Validate required fields
  if (!from || !to || !text) {
    // Serialize full formData for debugging
    const fullPayload: Record<string, unknown> = {};
    for (const [key, value] of formData.entries()) {
      fullPayload[key] = value instanceof File ? `[File: ${value.name}]` : value;
    }

    const missingFields: string[] = [];
    if (!from) missingFields.push('from');
    if (!to) missingFields.push('to');
    if (!text) missingFields.push('text');

    throw new ValidationError(
      `Missing required email fields (${missingFields.join(', ')})`,
      { missingFields, availableFields: Array.from(formData.keys()), fullPayload },
    );
  }

  // Extract clean email addresses
  const fromEmail = extractEmailAddress(from);
  const toEmail = extractEmailAddress(to);

  // Extract userId from TO address
  const userId = extractUserIdFromReplyAddress(to);

  // Extract message ID if available
  const messageId = extractMessageId(headers);

  // Clean email body
  const cleanedBody = cleanEmailBody(text);

  return {
    from: fromEmail,
    to: toEmail,
    userId,
    body: cleanedBody,
    messageId,
  };
};
