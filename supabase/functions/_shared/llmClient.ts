/**
 * Shared OpenAI API client for generating LLM responses
 * Uses Responses API with optional web search capability
 * Can be used for email replies, newsletter generation, and other LLM tasks
 */

import OpenAI from 'npm:openai@6.2.0';
import { config } from './config.ts';
import { withRetry } from './retryLogic.ts';
import { logCritical, logError, logInfo, logWarn } from './logger.ts';
import type { IncomingEmail, LLMResponse } from './types.ts';

// Initialize OpenAI client
let client: OpenAI | null = null;

const getClient = (): OpenAI => {
  if (!client) {
    if (!config.openaiApiKey) {
      throw new Error('OpenAI API key is not configured');
    }
    client = new OpenAI({
      apiKey: config.openaiApiKey,
      timeout: config.openaiTimeoutMs,
    });
  }
  return client;
};

/**
 * Options for generating LLM responses
 */
export interface LLMGenerationOptions {
  /** Custom instructions/system prompt for the LLM */
  instructions: string;
  /** Input text/prompt for the LLM */
  input: string;
  /** Enable web search tool (default: from config) */
  enableWebSearch?: boolean;
  /** Context object for logging (e.g., messageId, userId, email) */
  logContext?: Record<string, unknown>;
}

/**
 * Format email content into input for the Responses API
 * Used by email-webhook for email replies
 */
export const formatEmailInput = (email: IncomingEmail): string => {
  let input = `Respond to this email:\n\n`;
  input += `From: ${email.from}\n`;
  input += `Subject: ${email.subject}\n\n`;
  input += email.body;

  return input;
};

/**
 * Generate LLM response using OpenAI Responses API
 * This is the core function used by both email-webhook and personifeed
 * @throws Error if OpenAI API fails after retries
 */
export const generateLLMResponse = async (
  options: LLMGenerationOptions,
): Promise<LLMResponse> => {
  const startTime = Date.now();
  const { instructions, input, enableWebSearch, logContext = {} } = options;
  const useWebSearch = enableWebSearch ?? config.enableWebSearch;

  try {
    const openai = getClient();

    // Build tools array - add web search if enabled
    const tools: Array<{ type: 'web_search_preview' }> = [];
    if (useWebSearch) {
      tools.push({ type: 'web_search_preview' as const });
      logInfo('web_search_enabled', {
        ...logContext,
      });
    }

    // Log API call start
    logInfo('openai_api_called', {
      ...logContext,
      model: config.openaiModel,
      webSearchEnabled: useWebSearch,
      inputLength: input.length,
    });

    // Call OpenAI Responses API with retry logic
    const response = await withRetry(async () => {
      try {
        return await openai.responses.create({
          model: config.openaiModel,
          instructions,
          input,
          ...(tools.length > 0 && { tools }), // Only add tools if array is not empty
        });
      } catch (error) {
        // Handle OpenAI SDK errors
        if (error instanceof OpenAI.APIError) {
          // For 401/403, log as CRITICAL (invalid API key)
          if (error.status === 401 || error.status === 403) {
            logCritical('openai_auth_error', {
              ...logContext,
              statusCode: error.status,
              message: error.message,
            });
          } else if (error.status === 429) {
            logWarn('openai_rate_limit', {
              ...logContext,
              statusCode: error.status,
              message: error.message,
            });
          } else {
            logError('openai_api_error', {
              ...logContext,
              statusCode: error.status,
              message: error.message,
              type: error.type,
              stack: error.stack,
            });
          }
        }
        throw error;
      }
    });

    // Extract response data
    const content = response.output_text;
    const model = response.model;
    const promptTokens = response.usage?.input_tokens || 0;
    const completionTokens = response.usage?.output_tokens || 0;
    const tokenCount = response.usage?.total_tokens || (promptTokens + completionTokens);
    const completionTime = Date.now() - startTime;

    // Check if web search was used (tools_used may not be in response type yet)
    const usedWebSearch = (response as { tools_used?: Array<{ type: string }> }).tools_used?.some(
      (tool) => tool.type === 'web_search_preview' || tool.type === 'web_search',
    ) || false;

    // Log success
    logInfo('openai_api_response_received', {
      ...logContext,
      model,
      promptTokens,
      completionTokens,
      tokenCount,
      completionTimeMs: completionTime,
      responseLength: content.length,
      usedWebSearch,
    });

    // Check for slow response (> 20 seconds)
    if (completionTime > 20000) {
      logInfo('slow_openai_response', {
        ...logContext,
        completionTimeMs: completionTime,
        threshold: 20000,
      });
    }

    return {
      content,
      model,
      tokenCount,
      promptTokens,
      completionTokens,
      completionTime,
    };
  } catch (error) {
    const completionTime = Date.now() - startTime;

    // Log final error after retries
    logError('openai_api_failed', {
      ...logContext,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      completionTimeMs: completionTime,
    });

    throw error;
  }
};

/**
 * Generate LLM response for incoming email using Responses API
 * Convenience function for email-webhook
 * @throws Error if OpenAI API fails after retries
 */
export const generateEmailResponse = async (email: IncomingEmail): Promise<LLMResponse> => {
  const input = formatEmailInput(email);
  const instructions = `You are a helpful assistant that users access via email.
    Respond professionally and concisely.
    If you use web search, cite your sources.
    If you feel the need to add a parting salutation to the text, sign off as LLMBox.
    Never add [Your Name] or [Your Company] in the signature.`;

  return await generateLLMResponse({
    instructions,
    input,
    logContext: { messageId: email.messageId },
  });
};
