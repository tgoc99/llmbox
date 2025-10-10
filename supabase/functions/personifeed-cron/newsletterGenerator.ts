/**
 * Newsletter generation logic using shared LLM client
 * Uses OpenAI Responses API with web search enabled
 */

import type { LLMResponse, PersonifeedSettings, User } from '../_shared/types.ts';
import { LLMError } from '../_shared/errors.ts';
import { logError, logInfo } from '../_shared/logger.ts';
import { generateLLMResponse } from '../_shared/llmClient.ts';
import { getNewsletterSystemPrompt } from './prompts.ts';

/**
 * Format user settings and initial prompt into context for LLM
 */
const formatUserContext = (settings: PersonifeedSettings): string => {
  let context = '';

  if (settings.initialPrompt) {
    context += `User's interests and preferences:\n${settings.initialPrompt}\n\n`;
  }

  if (settings.topics && settings.topics.length > 0) {
    context += `Topics to focus on: ${settings.topics.join(', ')}\n\n`;
  }

  if (settings.feedbacks && settings.feedbacks.length > 0) {
    context += `User feedback from previous newsletters:\n`;
    settings.feedbacks.forEach((feedback, index) => {
      context += `${index + 1}. ${feedback}\n`;
    });
    context += '\n';
  }

  return context;
};

/**
 * Generate newsletter content for a user
 * Uses shared LLM client with Responses API and web search
 * Returns both content and LLM response for token tracking
 */
export const generateNewsletterContent = async (
  user: User,
  settings: PersonifeedSettings,
): Promise<LLMResponse> => {
  const startTime = Date.now();

  try {
    // Format user context from settings
    const userContext = formatUserContext(settings);

    logInfo('newsletter_generation_started', {
      userId: user.id,
      email: user.email,
      hasInitialPrompt: !!settings.initialPrompt,
      topicsCount: settings.topics?.length || 0,
      feedbacksCount: settings.feedbacks?.length || 0,
    });

    // Generate newsletter content using Responses API
    const todayDate = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // Load the comprehensive system prompt from markdown file
    const instructions = await getNewsletterSystemPrompt();

    const input = `${userContext}Generate today's personalized newsletter for ${todayDate}.`;

    const response = await generateLLMResponse({
      instructions,
      input,
      enableWebSearch: true, // Always enable web search for newsletters
      logContext: { userId: user.id, email: user.email },
    });

    const duration = Date.now() - startTime;

    logInfo('newsletter_generated', {
      userId: user.id,
      email: user.email,
      model: response.model,
      tokensUsed: response.tokenCount,
      contentLength: response.content.length,
      durationMs: duration,
    });

    return response;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logError('newsletter_generation_failed', {
      userId: user.id,
      email: user.email,
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      durationMs: Date.now() - startTime,
      hasInitialPrompt: !!settings.initialPrompt,
    });

    throw new LLMError('Failed to generate newsletter', {
      userId: user.id,
      email: user.email,
      error: errorMessage,
    });
  }
};
