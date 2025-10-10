/**
 * Database access layer for personifeed-cron function
 * Uses new multi-tenant schema with shared database helpers
 */

import {
  getActivePersonifeedSubscribers,
  getPersonifeedFeedbackByUserId,
  getPersonifeedSubscriberByUserId,
  getUserById,
  saveOutgoingEmail,
  trackAIUsage,
  updateLastNewsletterSent,
} from '../_shared/database.ts';
import type {
  DatabaseEmail,
  DatabasePersonifeedFeedback,
  DatabasePersonifeedSubscriber,
  DatabaseUser,
} from '../_shared/types.ts';
import { DatabaseError } from '../_shared/errors.ts';
import { log, LogLevel } from '../_shared/logger.ts';
import { config } from '../_shared/config.ts';

/**
 * Subscriber with user details for newsletter generation
 */
export interface SubscriberWithUser {
  subscriber: DatabasePersonifeedSubscriber;
  user: DatabaseUser;
  feedback: DatabasePersonifeedFeedback[];
}

/**
 * Get all active subscribers with their user details and feedback
 */
export const getAllActiveSubscribers = async (): Promise<SubscriberWithUser[]> => {
  try {
    const subscribers = await getActivePersonifeedSubscribers();

    // Fetch user details and feedback for each subscriber
    const subscribersWithDetails = await Promise.all(
      subscribers.map(async (subscriber) => {
        const user = await getUserById(subscriber.user_id);
        if (!user) {
          log(LogLevel.WARN, 'Subscriber has no associated user', { subscriberId: subscriber.id });
          throw new Error(`User not found for subscriber ${subscriber.id}`);
        }

        const feedback = await getPersonifeedFeedbackByUserId(subscriber.user_id);

        return {
          subscriber,
          user,
          feedback,
        };
      }),
    );

    log(LogLevel.INFO, 'Fetched active subscribers', { count: subscribersWithDetails.length });
    return subscribersWithDetails;
  } catch (error) {
    log(LogLevel.ERROR, 'Failed to fetch active subscribers', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw new DatabaseError('Failed to fetch active subscribers', {
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

/**
 * Get subscriber interests and feedback for newsletter generation
 */
export const getSubscriberContext = async (
  userId: string,
): Promise<{ interests: string; feedback: DatabasePersonifeedFeedback[] }> => {
  try {
    const subscriber = await getPersonifeedSubscriberByUserId(userId);
    if (!subscriber) {
      throw new Error(`Subscriber not found for user ${userId}`);
    }

    const feedback = await getPersonifeedFeedbackByUserId(userId);

    return {
      interests: subscriber.interests,
      feedback,
    };
  } catch (error) {
    log(LogLevel.ERROR, 'Failed to get subscriber context', {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw new DatabaseError('Failed to get subscriber context', {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

/**
 * Save newsletter as email in database
 */
export const saveNewsletterEmail = async (
  userId: string,
  userEmail: string,
  content: string,
  htmlContent: string,
): Promise<DatabaseEmail> => {
  try {
    const email = await saveOutgoingEmail({
      userId,
      product: 'personifeed',
      emailType: 'newsletter',
      fromEmail: `personifeed@${config.personifeedEmailDomain}`,
      toEmail: userEmail,
      subject: 'Your Daily Personifeed Newsletter',
      processedContent: content,
      htmlContent,
      metadata: {
        generatedAt: new Date().toISOString(),
      },
    });

    // Update last newsletter sent timestamp
    await updateLastNewsletterSent(userId);

    log(LogLevel.INFO, 'Newsletter email saved', {
      emailId: email.id,
      userId,
      userEmail,
    });

    return email;
  } catch (error) {
    log(LogLevel.ERROR, 'Failed to save newsletter email', {
      userId,
      userEmail,
      error: error instanceof Error ? error.message : String(error),
    });
    throw new DatabaseError('Failed to save newsletter email', {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

/**
 * Track AI usage for newsletter generation
 */
export const trackNewsletterAIUsage = async (
  userId: string,
  emailId: string,
  model: string,
  promptTokens: number,
  completionTokens: number,
  totalTokens: number,
): Promise<void> => {
  try {
    await trackAIUsage({
      userId,
      product: 'personifeed',
      relatedEmailId: emailId,
      model,
      promptTokens,
      completionTokens,
      totalTokens,
      metadata: {
        type: 'newsletter_generation',
      },
    });

    log(LogLevel.DEBUG, 'Newsletter AI usage tracked', {
      userId,
      emailId,
      totalTokens,
    });
  } catch (error) {
    // Log but don't throw - tracking is nice-to-have
    log(LogLevel.WARN, 'Failed to track newsletter AI usage', {
      userId,
      emailId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
