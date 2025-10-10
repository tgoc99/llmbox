/**
 * Database access layer for personifeed-signup function
 * Uses new unified multi-product architecture
 */

import { DatabaseError } from '../_shared/errors.ts';
import { logInfo } from '../_shared/logger.ts';
import {
  getOrCreateUser,
  getOrCreateUserProduct,
  updateUserProductSettings,
} from '../_shared/database.ts';
import type { PersonifeedSettings, User, UserProduct } from '../_shared/types.ts';

const PRODUCT_ID = 'personifeed';

/**
 * Create or get existing user and sign them up for Personifeed
 * Stores initial customization in user_products.settings
 */
export const signupUser = async (
  email: string,
  initialPrompt: string,
): Promise<{ user: User; userProduct: UserProduct }> => {
  try {
    // Get or create user
    const user = await getOrCreateUser(email);

    // Initial settings with customization
    const initialSettings: PersonifeedSettings = {
      topics: [],
      // Store the initial prompt in settings for newsletter generation
      // We'll parse topics from it or use it directly
    };

    // Get or create user-product relationship
    const userProduct = await getOrCreateUserProduct(user.id, PRODUCT_ID, {
      ...initialSettings,
      initialPrompt, // Store initial prompt for first newsletter
    });

    logInfo('personifeed_signup_completed', {
      userId: user.id,
      email: user.email,
      initialPromptLength: initialPrompt.length,
    });

    return { user, userProduct };
  } catch (error) {
    throw new DatabaseError('Failed to sign up user for Personifeed', {
      email,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

/**
 * Update user's Personifeed settings (topics, time, timezone)
 */
export const updatePersonifeedSettings = async (
  userId: string,
  settings: Partial<PersonifeedSettings>,
): Promise<UserProduct> => {
  try {
    // Merge with existing settings
    const updatedSettings = {
      ...settings,
    };

    const userProduct = await updateUserProductSettings(userId, PRODUCT_ID, updatedSettings);

    logInfo('personifeed_settings_updated', {
      userId,
      settingsKeys: Object.keys(settings),
    });

    return userProduct;
  } catch (error) {
    throw new DatabaseError('Failed to update Personifeed settings', {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
