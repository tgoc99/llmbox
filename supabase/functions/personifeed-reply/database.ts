/**
 * Database access layer for personifeed-reply function
 * Uses new multi-tenant schema with shared database helpers
 */

import {
  getPersonifeedSubscriberByUserId,
  getUserByEmail,
  getUserById,
  saveIncomingEmail,
  savePersonifeedFeedback,
  upsertPersonifeedSubscriber,
  upsertUser,
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
 * Get or create subscriber for a user who replies
 * (Handles case where someone replies without signing up first)
 */
export const getOrCreateSubscriber = async (
  email: string,
  initialInterests?: string,
): Promise<{ user: DatabaseUser; subscriber: DatabasePersonifeedSubscriber }> => {
  try {
    // Upsert user
    const user = await upsertUser(email);

    // Check if subscriber exists
    let subscriber = await getPersonifeedSubscriberByUserId(user.id);

    if (!subscriber) {
      // Create new subscriber with default interests
      subscriber = await upsertPersonifeedSubscriber({
        userId: user.id,
        interests: initialInterests ||
          'General topics of interest (please provide feedback to customize)',
        isActive: true,
      });

      log(LogLevel.INFO, 'New subscriber created from reply', {
        userId: user.id,
        subscriberId: subscriber.id,
        email,
      });
    }

    return { user, subscriber };
  } catch (error) {
    log(LogLevel.ERROR, 'Failed to get or create subscriber', {
      email,
      error: error instanceof Error ? error.message : String(error),
    });
    throw new DatabaseError('Failed to get or create subscriber', {
      email,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

/**
 * Save feedback email (incoming)
 */
export const saveFeedbackEmail = async (
  userId: string,
  fromEmail: string,
  subject: string,
  body: string,
  newsletterEmailId?: string,
): Promise<DatabaseEmail> => {
  try {
    const email = await saveIncomingEmail({
      userId,
      product: 'personifeed',
      emailType: 'feedback_reply',
      fromEmail,
      toEmail: `personifeed@${config.personifeedEmailDomain}`,
      subject,
      rawContent: body,
      processedContent: body,
      parentEmailId: newsletterEmailId,
      metadata: {
        receivedAt: new Date().toISOString(),
      },
    });

    log(LogLevel.INFO, 'Feedback email saved', {
      emailId: email.id,
      userId,
      fromEmail,
    });

    return email;
  } catch (error) {
    log(LogLevel.ERROR, 'Failed to save feedback email', {
      userId,
      fromEmail,
      error: error instanceof Error ? error.message : String(error),
    });
    throw new DatabaseError('Failed to save feedback email', {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

/**
 * Save feedback to personifeed_feedback table
 */
export const saveFeedback = async (
  userId: string,
  content: string,
  feedbackType: string,
  sentiment?: string,
  newsletterEmailId?: string,
): Promise<DatabasePersonifeedFeedback> => {
  try {
    const feedback = await savePersonifeedFeedback({
      userId,
      newsletterEmailId,
      feedbackType,
      content,
      sentiment,
      metadata: {
        processedAt: new Date().toISOString(),
      },
    });

    log(LogLevel.INFO, 'Feedback saved', {
      feedbackId: feedback.id,
      userId,
      feedbackType,
    });

    return feedback;
  } catch (error) {
    log(LogLevel.ERROR, 'Failed to save feedback', {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw new DatabaseError('Failed to save feedback', {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

/**
 * Update subscriber interests
 */
export const updateSubscriberInterests = async (
  userId: string,
  newInterests: string,
): Promise<void> => {
  try {
    await upsertPersonifeedSubscriber({
      userId,
      interests: newInterests,
      isActive: true,
    });

    log(LogLevel.INFO, 'Subscriber interests updated', {
      userId,
      interestsLength: newInterests.length,
    });
  } catch (error) {
    log(LogLevel.ERROR, 'Failed to update subscriber interests', {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw new DatabaseError('Failed to update subscriber interests', {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// Export shared database functions for convenience
export { getUserByEmail, getUserById };
