/**
 * Input validation utilities for personifeed-signup
 */

import { ValidationError } from '../_shared/errors.ts';

/**
 * Email validation regex (RFC 5322 simplified)
 */
const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$/;

/**
 * Minimum and maximum prompt length
 */
const MIN_PROMPT_LENGTH = 1;
const MAX_PROMPT_LENGTH = 2000;

/**
 * Validate email format
 */
export const validateEmail = (email: string): void => {
  if (!email || email.trim().length === 0) {
    throw new ValidationError('Email is required');
  }

  const trimmedEmail = email.trim();

  if (!EMAIL_REGEX.test(trimmedEmail)) {
    throw new ValidationError('Invalid email format');
  }

  if (trimmedEmail.length > 255) {
    throw new ValidationError('Email is too long (max 255 characters)');
  }
};

/**
 * Validate prompt content
 */
export const validatePrompt = (prompt: string): void => {
  if (!prompt || prompt.trim().length === 0) {
    throw new ValidationError('Prompt is required');
  }

  const trimmedPrompt = prompt.trim();

  if (trimmedPrompt.length < MIN_PROMPT_LENGTH) {
    throw new ValidationError(`Prompt must be at least ${MIN_PROMPT_LENGTH} character(s)`);
  }

  if (trimmedPrompt.length > MAX_PROMPT_LENGTH) {
    throw new ValidationError(
      `Prompt is too long (max ${MAX_PROMPT_LENGTH} characters, got ${trimmedPrompt.length})`,
    );
  }
};

/**
 * Sanitize prompt content (remove excessive whitespace, etc.)
 */
export const sanitizePrompt = (prompt: string): string => {
  return prompt.trim().replace(/\s+/g, ' ');
};

