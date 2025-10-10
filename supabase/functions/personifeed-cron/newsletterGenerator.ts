/**
 * Newsletter generation logic using shared LLM client
 * Uses OpenAI Responses API with web search enabled
 */

import type { DatabasePersonifeedFeedback, DatabaseUser } from '../_shared/types.ts';
import { LLMError } from '../_shared/errors.ts';
import { logError, logInfo } from '../_shared/logger.ts';
import { generateLLMResponse } from '../_shared/llmClient.ts';
import { getNewsletterSystemPrompt } from './prompts.ts';

/**
 * Format subscriber interests and feedback into context for LLM
 */
const formatFeedbackContext = (
  interests: string,
  feedback: DatabasePersonifeedFeedback[],
): string => {
  let context = `User's interests: ${interests}\n\n`;

  if (feedback.length > 0) {
    context += `User feedback for customization:\n`;
    feedback.forEach((item, index) => {
      if (item.content) {
        context += `${index + 1}. ${item.content}\n`;
      }
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
  user: DatabaseUser,
  interests: string,
  feedback: DatabasePersonifeedFeedback[],
): Promise<string> => {
  const startTime = Date.now();

  try {
    // Format user context from interests and feedback
    const userContext = formatFeedbackContext(interests, feedback);

    logInfo('newsletter_generation_started', {
      userId: user.id,
      email: user.email,
      feedbackCount: feedback.length,
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
      feedbackCount: feedback.length,
    });

    throw new LLMError('Failed to generate newsletter', {
      userId: user.id,
      email: user.email,
      error: errorMessage,
    });
  }
};
