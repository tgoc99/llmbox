/**
 * Database access layer for personifeed-reply function
 * Uses new unified multi-product architecture
 */

import { getSupabaseClient } from '../_shared/supabaseClient.ts';
import { DatabaseError } from '../_shared/errors.ts';
import { logError, logInfo } from '../_shared/logger.ts';
import {
  getOrCreateUser,
  getOrCreateUserProduct,
  getUserByEmail,
  getUserById,
  logEmail,
} from '../_shared/database.ts';
import type { PersonifeedSettings, User, UserProduct } from '../_shared/types.ts';

const PRODUCT_ID = 'personifeed';

export { getUserByEmail, getUserById };

/**
 * Ensure user is signed up for Personifeed
 * For new users created from reply emails
 */
export const ensurePersonifeedUser = async (
  email: string,
  initialContent: string,
): Promise<{ user: User; userProduct: UserProduct }> => {
  try {
    const user = await getOrCreateUser(email);

    // Get or create user-product relationship with initial settings
    const userProduct = await getOrCreateUserProduct(user.id, PRODUCT_ID, {
      initialPrompt: initialContent,
      topics: [],
    });

    logInfo('personifeed_user_ensured', {
      userId: user.id,
      email: user.email,
      isNewUser: new Date(user.created_at).getTime() > Date.now() - 5000,
    });

    return { user, userProduct };
  } catch (error) {
    logError('personifeed_user_ensure_failed', {
      email,
      error: error instanceof Error ? error.message : String(error),
    });
    throw new DatabaseError('Failed to ensure Personifeed user', {
      email,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

/**
 * Update user settings with feedback
 * Appends feedback to existing settings
 */
export const addFeedbackToSettings = async (
  userId: string,
  feedbackContent: string,
): Promise<void> => {
  try {
    const supabase = getSupabaseClient();

    // Get current settings
    const { data: userProduct, error: selectError } = await supabase
      .from('user_products')
      .select('settings')
      .eq('user_id', userId)
      .eq('product_id', PRODUCT_ID)
      .single();

    if (selectError) {
      throw new Error(`Failed to get user settings: ${selectError.message}`);
    }

    const currentSettings = (userProduct?.settings || {}) as PersonifeedSettings;

    // Add feedback to settings
    const feedbacks = currentSettings.feedbacks || [];
    feedbacks.push(feedbackContent);

    const updatedSettings = {
      ...currentSettings,
      feedbacks,
    };

    // Update settings
    const { error: updateError } = await supabase
      .from('user_products')
      .update({
        settings: updatedSettings,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('product_id', PRODUCT_ID);

    if (updateError) {
      throw new Error(`Failed to update settings: ${updateError.message}`);
    }

    logInfo('feedback_added_to_settings', {
      userId,
      feedbackLength: feedbackContent.length,
      totalFeedbacks: feedbacks.length,
    });
  } catch (error) {
    logError('add_feedback_failed', {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw new DatabaseError('Failed to add feedback', {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

/**
 * Log incoming reply email from user
 */
export const logReplyEmail = async (
  userId: string,
  fromEmail: string,
  toEmail: string,
  subject: string,
  bodyText: string,
  messageId: string,
  inReplyTo: string | null,
  references: string[],
): Promise<string> => {
  try {
    const email = await logEmail({
      userId,
      productId: PRODUCT_ID,
      direction: 'incoming',
      type: 'reply_received',
      fromEmail,
      toEmail,
      subject,
      bodyText,
      threadId: inReplyTo || messageId,
      inReplyTo: inReplyTo || undefined,
      references,
      externalId: messageId,
    });

    logInfo('reply_email_logged', {
      emailId: email.id,
      userId,
      messageId,
    });

    return email.id;
  } catch (error) {
    logError('reply_email_log_failed', {
      userId,
      messageId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw new DatabaseError('Failed to log reply email', {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
