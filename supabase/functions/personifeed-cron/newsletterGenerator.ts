/**
 * Newsletter generation logic using OpenAI API
 */

import OpenAI from 'npm:openai@6.2.0';
import { config } from '../_shared/config.ts';
import type { User, Customization } from '../_shared/types.ts';
import { LLMError } from '../_shared/errors.ts';
import { logInfo, logError } from '../_shared/logger.ts';
import { withRetry } from '../_shared/retryLogic.ts';

/**
 * Get OpenAI client instance
 */
let openaiClient: OpenAI | null = null;

const getOpenAIClient = (): OpenAI => {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: config.openaiApiKey,
    });
  }
  return openaiClient;
};

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
 */
export const generateNewsletterContent = async (
  user: User,
  customizations: Customization[],
): Promise<string> => {
  const startTime = Date.now();

  try {
    const openai = getOpenAIClient();

    // System prompt for newsletter generation
    const systemPrompt = `You are creating a personalized daily newsletter. Use the user's preferences and any customization feedback to generate relevant, engaging content.

Guidelines:
- Keep the newsletter concise (500-1000 words)
- Include today's date in the header
- Format content with clear sections and headings
- Be conversational and engaging
- Prioritize the user's stated interests and preferences
- If the user has provided feedback, incorporate their suggestions
- Use markdown formatting for better readability`;

    // User context from customizations
    const userContext = formatCustomizationsContext(customizations);
    const todayDate = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const userPrompt = `${userContext}Generate today's personalized newsletter for ${todayDate}.`;

    logInfo('openai_call_started', {
      userId: user.id,
      email: user.email,
      customizationsCount: customizations.length,
    });

    // Call OpenAI with retry logic
    const response = await withRetry(async () => {
      const completion = await openai.chat.completions.create({
        model: config.openaiModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: config.openaiTemperature,
        max_tokens: config.openaiMaxTokens,
      });

      return completion;
    });

    const content = response.choices[0]?.message?.content || '';

    if (!content) {
      throw new Error('OpenAI returned empty content');
    }

    const duration = Date.now() - startTime;

    logInfo('newsletter_generated', {
      userId: user.id,
      email: user.email,
      model: response.model,
      tokensUsed: response.usage?.total_tokens || 0,
      contentLength: content.length,
      durationMs: duration,
    });

    return content;
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

