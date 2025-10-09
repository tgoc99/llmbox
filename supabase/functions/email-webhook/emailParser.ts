/**
 * Email parser module for SendGrid webhook payloads
 */

import type { IncomingEmail } from './types.ts';

/**
 * Custom validation error for missing or invalid email fields
 */
export class ValidationError extends Error {
  statusCode: number;
  context: Record<string, unknown>;

  constructor(message: string, context: Record<string, unknown> = {}) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
    this.context = context;
  }
}

/**
 * Extract email address from a string that may contain display name
 * Handles formats like:
 * - "Display Name" <email@example.com>
 * - <email@example.com>
 * - email@example.com
 * @param emailString - Email string to parse
 * @returns Just the email address without display name
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
const extractMessageId = (headers: string): string => {
  const match = headers.match(/Message-ID:\s*(<[^>]+>)/i);
  if (!match) {
    // Generate a fallback Message-ID if not found
    return `<${Date.now()}@llmbox.pro>`;
  }
  return match[1];
};

/**
 * Extract In-Reply-To from email headers
 */
const extractInReplyTo = (headers: string): string | null => {
  const match = headers.match(/In-Reply-To:\s*(<[^>]+>)/i);
  return match ? match[1] : null;
};

/**
 * Extract References from email headers and split into array
 */
const extractReferences = (headers: string): string[] => {
  const match = headers.match(/References:\s*(.*?)(?:\r?\n(?!\s)|$)/i);
  if (!match) {
    return [];
  }

  // Split by whitespace and filter empty strings
  return match[1]
    .split(/\s+/)
    .filter((ref) => ref.trim().length > 0);
};

/**
 * Parse incoming email from SendGrid webhook FormData
 * Expects parsed format (send_raw=false) from SendGrid Inbound Parse
 * @throws ValidationError if required fields are missing
 */
export const parseIncomingEmail = (formData: FormData): IncomingEmail => {
  // Extract required fields
  const from = formData.get('from')?.toString();
  const to = formData.get('to')?.toString();
  const subject = formData.get('subject')?.toString();
  const text = formData.get('text')?.toString();
  const headers = formData.get('headers')?.toString();

  // Validate required fields
  const missingFields: string[] = [];
  if (!from) missingFields.push('from');
  if (!to) missingFields.push('to');
  if (!subject) missingFields.push('subject');
  if (!text) missingFields.push('text');
  if (!headers) missingFields.push('headers');

  if (missingFields.length > 0) {
    // Serialize full formData for debugging
    const fullPayload: Record<string, unknown> = {};
    for (const [key, value] of formData.entries()) {
      fullPayload[key] = value instanceof File ? `[File: ${value.name}]` : value;
    }

    throw new ValidationError('Missing required email fields', {
      missingFields,
      availableFields: Array.from(formData.keys()),
      fullPayload,
    });
  }

  // Extract threading information from headers
  const messageId = extractMessageId(headers!);
  const inReplyTo = extractInReplyTo(headers!);
  const references = extractReferences(headers!);

  // Extract clean email addresses (remove display names)
  const fromEmail = extractEmailAddress(from!);
  const toEmail = extractEmailAddress(to!);

  // Return populated IncomingEmail object
  return {
    from: fromEmail,
    to: toEmail,
    subject: subject!,
    body: text!,
    messageId,
    inReplyTo,
    references,
    timestamp: new Date(),
  };
};

