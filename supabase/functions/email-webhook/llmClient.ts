/**
 * OpenAI API client for generating LLM responses
 */

import type { IncomingEmail, LLMResponse, OpenAICompletionRequest, OpenAICompletionResponse } from './types.ts';
import { config } from './config.ts';
import { withRetry } from './retryLogic.ts';
import { logCritical, logError, logInfo } from './logger.ts';

/**
 * Format email content into a prompt for the LLM
 */
export const formatPrompt = (email: IncomingEmail): string => {
  return `Respond to this email:\n\nFrom: ${email.from}\nSubject: ${email.subject}\n\n${email.body}`;
};

/**
 * Generate LLM response for incoming email
 * @throws Error if OpenAI API fails after retries
 */
export const generateResponse = async (email: IncomingEmail): Promise<LLMResponse> => {
  const startTime = Date.now();

  // Validate API key is set
  if (!config.openaiApiKey) {
    logCritical('openai_api_key_missing', {
      messageId: email.messageId,
    });
    throw new Error('OpenAI API key is not configured');
  }

  // Format prompt
  const userMessage = formatPrompt(email);

  // Create request body
  const requestBody: OpenAICompletionRequest = {
    model: config.openaiModel,
    messages: [
      {
        role: 'system',
        content: 'You are a helpful email assistant. Respond professionally and concisely.',
      },
      {
        role: 'user',
        content: userMessage,
      },
    ],
    max_tokens: config.openaiMaxTokens,
    temperature: config.openaiTemperature,
  };

  // Log API call start
  logInfo('openai_api_called', {
    messageId: email.messageId,
    model: config.openaiModel,
    maxTokens: config.openaiMaxTokens,
    temperature: config.openaiTemperature,
  });

  try {
    // Call OpenAI API with retry logic
    const response = await withRetry(async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), config.openaiTimeoutMs);

      try {
        const apiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${config.openaiApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Check for non-200 responses
        if (!apiResponse.ok) {
          // For 401/403, log as CRITICAL (invalid API key)
          if (apiResponse.status === 401 || apiResponse.status === 403) {
            logCritical('openai_auth_error', {
              messageId: email.messageId,
              statusCode: apiResponse.status,
              statusText: apiResponse.statusText,
            });
          } else {
            logError('openai_api_error', {
              messageId: email.messageId,
              statusCode: apiResponse.status,
              statusText: apiResponse.statusText,
            });
          }

          throw apiResponse; // Throw response to trigger retry logic
        }

        return apiResponse;
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    });

    // Parse response
    const data: OpenAICompletionResponse = await response.json();

    // Validate response structure
    if (!data.choices || data.choices.length === 0) {
      logError('openai_invalid_response', {
        messageId: email.messageId,
        error: 'No choices returned in response',
      });
      throw new Error('Invalid OpenAI API response: no choices returned');
    }

    const choice = data.choices[0];
    if (!choice.message) {
      logError('openai_invalid_response', {
        messageId: email.messageId,
        error: 'No message in choice',
      });
      throw new Error('Invalid OpenAI API response: no message in choice');
    }

    // Handle refusal or missing content
    if (!choice.message.content) {
      if (choice.message.refusal) {
        logError('openai_refusal', {
          messageId: email.messageId,
          refusal: choice.message.refusal,
        });
        throw new Error(`OpenAI refused to generate response: ${choice.message.refusal}`);
      }
      logError('openai_invalid_response', {
        messageId: email.messageId,
        error: 'No content in message',
      });
      throw new Error('Invalid OpenAI API response: no content in message');
    }

    const content = choice.message.content;
    const model = data.model;
    const tokenCount = data.usage?.total_tokens || 0;
    const completionTime = Date.now() - startTime;

    // Log success
    logInfo('openai_api_response_received', {
        content,
      messageId: email.messageId,
      model,
      tokenCount,
      completionTimeMs: completionTime,
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
      statusCode: error instanceof Response ? error.status : undefined,
    });

    throw error;
  }
};

