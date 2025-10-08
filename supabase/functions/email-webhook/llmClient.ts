/**
 * OpenAI API client for generating LLM responses
 * Uses Responses API with optional web search capability
 */

import OpenAI from 'npm:openai@6.2.0';
import type { IncomingEmail, LLMResponse } from './types.ts';
import { config } from './config.ts';
import { withRetry } from './retryLogic.ts';
import { logCritical, logError, logInfo, logWarn } from './logger.ts';

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
 * Format email content into input for the Responses API
 */
export const formatEmailInput = (email: IncomingEmail): string => {
  let input = `Respond to this email:\n\n`;
  input += `From: ${email.from}\n`;
  input += `Subject: ${email.subject}\n\n`;
  input += email.body;

  return input;
};

/**
 * Generate LLM response for incoming email using Responses API
 * @throws Error if OpenAI API fails after retries
 */
export const generateResponse = async (email: IncomingEmail): Promise<LLMResponse> => {
  const startTime = Date.now();

  try {
    const openai = getClient();
    const input = formatEmailInput(email);

    // Build tools array - add web search if enabled
    const tools: Array<{ type: 'web_search_preview' }> = [];
    if (config.enableWebSearch) {
      tools.push({ type: 'web_search_preview' as const });
      logInfo('web_search_enabled', {
        messageId: email.messageId,
      });
    }

    // Log API call start
    logInfo('openai_api_called', {
      messageId: email.messageId,
      model: config.openaiModel,
      webSearchEnabled: config.enableWebSearch,
      inputLength: input.length,
    });

    // Call OpenAI Responses API with retry logic
    const response = await withRetry(async () => {
      try {
        return await openai.responses.create({
          model: config.openaiModel,
          instructions: 'You are a helpful assistant that users access via email. Respond professionally and concisely. If you use web search, cite your sources.',
          input: input,
          ...(tools.length > 0 && { tools }), // Only add tools if array is not empty
        });
      } catch (error) {
        // Handle OpenAI SDK errors
        if (error instanceof OpenAI.APIError) {
          // For 401/403, log as CRITICAL (invalid API key)
          if (error.status === 401 || error.status === 403) {
            logCritical('openai_auth_error', {
              messageId: email.messageId,
              statusCode: error.status,
              message: error.message,
            });
          } else if (error.status === 429) {
            logWarn('openai_rate_limit', {
              messageId: email.messageId,
              statusCode: error.status,
              message: error.message,
            });
          } else {
            logError('openai_api_error', {
              messageId: email.messageId,
              statusCode: error.status,
              message: error.message,
              type: error.type,
            });
          }
        }
        throw error;
      }
    });

    // Extract response data
    const content = response.output_text;
    const model = response.model;
    const tokenCount = response.usage?.total_tokens || 0;
    const completionTime = Date.now() - startTime;

    // Check if web search was used (tools_used may not be in response type yet)
    const usedWebSearch = (response as { tools_used?: Array<{ type: string }> }).tools_used?.some((tool) =>
      tool.type === 'web_search_preview' || tool.type === 'web_search'
    ) || false;

    // Log success
    logInfo('openai_api_response_received', {
      messageId: email.messageId,
      model,
      tokenCount,
      completionTimeMs: completionTime,
      responseLength: content.length,
      usedWebSearch,
    });

    // Check for slow response (> 20 seconds)
    if (completionTime > 20000) {
      logInfo('slow_openai_response', {
        messageId: email.messageId,
        completionTimeMs: completionTime,
        threshold: 20000,
      });
    }

    return {
      content,
      model,
      tokenCount,
      completionTime,
    };
  } catch (error) {
    const completionTime = Date.now() - startTime;

    // Log final error after retries
    logError('openai_api_failed', {
      messageId: email.messageId,
      error: error instanceof Error ? error.message : String(error),
      completionTimeMs: completionTime,
    });

    throw error;
  }
};

