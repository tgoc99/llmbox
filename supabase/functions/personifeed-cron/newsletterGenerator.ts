/**
 * Newsletter generation logic using shared LLM client
 * Uses OpenAI Responses API with web search enabled
 */

import type { Customization, User } from '../_shared/types.ts';
import { LLMError } from '../_shared/errors.ts';
import { logError, logInfo } from '../_shared/logger.ts';
import { generateLLMResponse } from '../_shared/llmClient.ts';
import { getNewsletterSystemPrompt } from './prompts.ts';

/**
 * Format customizations into context for LLM
 */
const formatCustomizationsContext = (customizations: Customization[]): string => {
  const initial = customizations.find((c) => c.type === 'initial');
  const feedbacks = customizations.filter((c) => c.type === 'feedback');

  let context = '';

  if (initial) {
    context += `User's initial request:\n${initial.content}\n\n`;
  }

  if (feedbacks.length > 0) {
    context += `User feedback for customization:\n`;
    feedbacks.forEach((feedback, index) => {
      context += `${index + 1}. ${feedback.content}\n`;
    });
    context += '\n';
  }

  return context;
};

/**
 * Generate newsletter content for a user
 * Uses shared LLM client with Responses API and web search
 */
export const generateNewsletterContent = async (
  user: User,
  customizations: Customization[],
): Promise<string> => {
  const startTime = Date.now();

  try {
    // Format user context from customizations
    const userContext = formatCustomizationsContext(customizations);

    logInfo('newsletter_generation_started', {
      userId: user.id,
      email: user.email,
      customizationsCount: customizations.length,
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

    return response.content;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logError('newsletter_generation_failed', {
      userId: user.id,
      email: user.email,
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      durationMs: Date.now() - startTime,
      customizationsCount: customizations.length,
    });

    throw new LLMError('Failed to generate newsletter', {
      userId: user.id,
      email: user.email,
      error: errorMessage,
    });
  }
};
