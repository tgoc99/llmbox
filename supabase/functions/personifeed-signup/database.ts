/**
 * Database access layer for personifeed-signup function
 * Uses new multi-tenant schema with shared database helpers
 */

import {
  getPersonifeedSubscriberByUserId,
  upsertPersonifeedSubscriber,
  upsertUser,
} from '../_shared/database.ts';
import type { DatabasePersonifeedSubscriber, DatabaseUser } from '../_shared/types.ts';
import { DatabaseError } from '../_shared/errors.ts';
import { log, LogLevel } from '../_shared/logger.ts';

/**
 * Create or get user and subscriber
 * Returns both user and subscriber (creates subscriber with interests)
 */
export const createOrGetSubscriber = async (
  email: string,
  interests: string,
): Promise<{ user: DatabaseUser; subscriber: DatabasePersonifeedSubscriber }> => {
  try {
    // Upsert user (creates if doesn't exist)
    const user = await upsertUser(email);

    // Check if subscriber already exists
    const existingSubscriber = await getPersonifeedSubscriberByUserId(user.id);

    if (existingSubscriber) {
      // User already signed up
      log(LogLevel.INFO, 'User already subscribed', { userId: user.id, email });
      return { user, subscriber: existingSubscriber };
    }

    // Create new subscriber with interests
    const subscriber = await upsertPersonifeedSubscriber({
      userId: user.id,
      interests,
      isActive: true,
    });

    log(LogLevel.INFO, 'New subscriber created', {
      userId: user.id,
      subscriberId: subscriber.id,
      email,
    });

    return { user, subscriber };
  } catch (error) {
    log(LogLevel.ERROR, 'Failed to create or get subscriber', {
      email,
      error: error instanceof Error ? error.message : String(error),
    });
    throw new DatabaseError('Failed to create or get subscriber', {
      email,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

/**
 * Check if user is already subscribed
 */
export const isUserSubscribed = async (email: string): Promise<boolean> => {
  try {
    const user = await upsertUser(email);
    const subscriber = await getPersonifeedSubscriberByUserId(user.id);
    return subscriber !== null && subscriber.is_active;
  } catch (error) {
    log(LogLevel.ERROR, 'Failed to check if user is subscribed', {
      email,
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
};
