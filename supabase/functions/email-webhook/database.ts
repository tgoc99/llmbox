/**
 * Database operations for email-webhook (LLMBox)
 * Handles user management, email logging, and token tracking for LLMBox product
 */

import { logInfo } from '../_shared/logger.ts';
import {
  getOrCreateUser,
  getOrCreateUserProduct,
  logEmail,
  type LogEmailOptions,
  logTokenUsage,
} from '../_shared/database.ts';
import type { IncomingEmail, LLMResponse } from '../_shared/types.ts';

const PRODUCT_ID = 'llmbox';

/**
 * Ensure user exists and is registered for LLMBox
 * Returns user ID
 */
export const ensureUserExists = async (email: string): Promise<string> => {
  const user = await getOrCreateUser(email);
  await getOrCreateUserProduct(user.id, PRODUCT_ID);
  return user.id;
};

/**
 * Log incoming email from user
 */
export const logIncomingEmail = async (
  userId: string,
  email: IncomingEmail,
): Promise<string> => {
  const emailData: LogEmailOptions = {
    userId,
    productId: PRODUCT_ID,
    direction: 'incoming',
    type: 'llm_query',
    fromEmail: email.from,
    toEmail: email.to,
    subject: email.subject,
    bodyText: email.body,
    threadId: email.inReplyTo || email.messageId, // Use inReplyTo as threadId if exists, else start new thread
    inReplyTo: email.inReplyTo || undefined,
    references: email.references,
    externalId: email.messageId,
  };

  const loggedEmail = await logEmail(emailData);

  logInfo('incoming_email_logged', {
    emailId: loggedEmail.id,
    userId,
    messageId: email.messageId,
  });

  return loggedEmail.id;
};

/**
 * Log outgoing email response to user
 */
export const logOutgoingEmail = async (
  userId: string,
  fromEmail: string,
  toEmail: string,
  subject: string,
  bodyText: string,
  bodyHtml: string | undefined,
  threadId: string,
  inReplyTo: string,
  references: string[],
  messageId?: string,
): Promise<string> => {
  const emailData: LogEmailOptions = {
    userId,
    productId: PRODUCT_ID,
    direction: 'outgoing',
    type: 'llm_response',
    fromEmail,
    toEmail,
    subject,
    bodyText,
    bodyHtml,
    threadId,
    inReplyTo,
    references,
    externalId: messageId,
    sentAt: new Date(),
  };

  const loggedEmail = await logEmail(emailData);

  logInfo('outgoing_email_logged', {
    emailId: loggedEmail.id,
    userId,
    threadId,
  });

  return loggedEmail.id;
};

/**
 * Log AI token usage for LLM response
 */
export const logLLMTokenUsage = async (
  userId: string,
  emailId: string,
  llmResponse: LLMResponse,
  messageId: string,
): Promise<void> => {
  await logTokenUsage({
    userId,
    productId: PRODUCT_ID,
    operationType: 'llm_chat',
    emailId,
    model: llmResponse.model,
    promptTokens: llmResponse.promptTokens,
    completionTokens: llmResponse.completionTokens,
    totalTokens: llmResponse.tokenCount,
    metadata: {
      messageId,
      completionTimeMs: llmResponse.completionTime,
    },
  });

  logInfo('llm_token_usage_logged', {
    userId,
    emailId,
    messageId,
    model: llmResponse.model,
    totalTokens: llmResponse.tokenCount,
  });
};
