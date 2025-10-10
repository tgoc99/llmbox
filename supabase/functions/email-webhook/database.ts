/**
 * Database integration for email-webhook
 * Handles saving incoming/outgoing emails and tracking AI usage
 */

import type { IncomingEmail, LLMResponse, OutgoingEmail } from '../_shared/types.ts';
import {
  findParentEmail,
  saveIncomingEmail,
  saveOutgoingEmail,
  trackAIUsage,
  upsertUser,
} from '../_shared/database.ts';
import { log } from './logger.ts';
import { LogLevel } from '../_shared/logger.ts';

/**
 * Save user query (incoming email) to database
 */
export const saveUserQuery = async (email: IncomingEmail): Promise<string> => {
  try {
    // Upsert user first
    const user = await upsertUser(email.from);

    // Find parent email if this is a reply
    let parentEmailId: string | undefined;
    if (email.inReplyTo) {
      const parentEmail = await findParentEmail(email.inReplyTo, user.id);
      if (parentEmail) {
        parentEmailId = parentEmail.id;
      }
    }

    // Save incoming email
    const savedEmail = await saveIncomingEmail({
      userId: user.id,
      product: 'email-webhook',
      emailType: 'user_query',
      fromEmail: email.from,
      toEmail: email.to,
      subject: email.subject,
      rawContent: email.body,
      processedContent: email.body, // Could apply cleaning/processing here
      threadId: email.messageId,
      parentEmailId,
      metadata: {
        inReplyTo: email.inReplyTo,
        references: email.references,
        timestamp: email.timestamp.toISOString(),
      },
    });

    log(LogLevel.INFO, 'User query saved to database', {
      emailId: savedEmail.id,
      userId: user.id,
      from: email.from,
    });

    return savedEmail.id;
  } catch (error) {
    // Log error but don't fail the request - database is nice-to-have, not critical
    log(LogLevel.ERROR, 'Failed to save user query to database', {
      from: email.from,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
};

/**
 * Save LLM response (outgoing email) to database
 */
export const saveLLMResponseEmail = async (
  email: OutgoingEmail,
  userQueryEmailId: string,
): Promise<string> => {
  try {
    // Get user by email
    const user = await upsertUser(email.to);

    // Save outgoing email
    const savedEmail = await saveOutgoingEmail({
      userId: user.id,
      product: 'email-webhook',
      emailType: 'llm_response',
      fromEmail: email.from,
      toEmail: email.to,
      subject: email.subject,
      processedContent: email.body,
      htmlContent: email.htmlBody,
      threadId: email.references[email.references.length - 1] || email.inReplyTo, // Use latest reference as thread_id
      parentEmailId: userQueryEmailId, // Link to the user query
      metadata: {
        inReplyTo: email.inReplyTo,
        references: email.references,
      },
    });

    log(LogLevel.INFO, 'LLM response saved to database', {
      emailId: savedEmail.id,
      userId: user.id,
      to: email.to,
      parentEmailId: userQueryEmailId,
    });

    return savedEmail.id;
  } catch (error) {
    // Log error but don't fail the request - database is nice-to-have, not critical
    log(LogLevel.ERROR, 'Failed to save LLM response to database', {
      to: email.to,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
};

/**
 * Track AI token usage from LLM response
 */
export const trackLLMUsage = async (
  userEmail: string,
  llmResponse: LLMResponse,
  relatedEmailId?: string,
): Promise<void> => {
  try {
    // Get user by email
    const user = await upsertUser(userEmail);

    // Track AI usage
    await trackAIUsage({
      userId: user.id,
      product: 'email-webhook',
      relatedEmailId,
      model: llmResponse.model,
      promptTokens: 0, // OpenAI response doesn't separate prompt/completion in our LLMResponse type
      completionTokens: 0,
      totalTokens: llmResponse.tokenCount,
      metadata: {
        completionTimeMs: llmResponse.completionTime,
      },
    });

    log(LogLevel.INFO, 'AI usage tracked', {
      userId: user.id,
      model: llmResponse.model,
      totalTokens: llmResponse.tokenCount,
      relatedEmailId,
    });
  } catch (error) {
    // Log error but don't fail the request - tracking is nice-to-have
    log(LogLevel.ERROR, 'Failed to track AI usage', {
      userEmail,
      error: error instanceof Error ? error.message : String(error),
    });
    // Don't throw - we don't want to fail the request if tracking fails
  }
};
