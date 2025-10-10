/**
 * Database access layer for personifeed-cron function
 * Uses new unified multi-product architecture
 */

import { getSupabaseClient } from '../_shared/supabaseClient.ts';
import { logEmail, logTokenUsage } from '../_shared/database.ts';
import type { LLMResponse, PersonifeedSettings, User, UserProduct } from '../_shared/types.ts';
import { DatabaseError } from '../_shared/errors.ts';
import { logError, logInfo } from '../_shared/logger.ts';

const PRODUCT_ID = 'personifeed';

/**
 * Interface for active Personifeed subscriber
 */
export interface PersonifeedSubscriber {
  user: User;
  userProduct: UserProduct;
  settings: PersonifeedSettings;
}

/**
 * Get all active Personifeed subscribers
 */
export const getAllActiveSubscribers = async (): Promise<PersonifeedSubscriber[]> => {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('user_products')
    .select(`
      *,
      users:user_id (*)
    `)
    .eq('product_id', PRODUCT_ID)
    .eq('status', 'active')
    .order('created_at', { ascending: true });

  if (error) {
    logError('database_query_failed', {
      operation: 'getAllActiveSubscribers',
      error: error.message,
    });
    throw new DatabaseError('Failed to fetch active subscribers', { error: error.message });
  }

  // Transform data into PersonifeedSubscriber format
  const subscribers: PersonifeedSubscriber[] = (data || []).map((row: {
    user_id: string;
    product_id: string;
    status: 'active' | 'paused' | 'unsubscribed';
    settings: Record<string, unknown>;
    created_at: string;
    updated_at: string;
    users: User;
  }) => ({
    user: row.users as User,
    userProduct: {
      user_id: row.user_id,
      product_id: row.product_id,
      status: row.status,
      settings: row.settings,
      created_at: row.created_at,
      updated_at: row.updated_at,
    } as UserProduct,
    settings: row.settings as PersonifeedSettings,
  }));

  return subscribers;
};

/**
 * Log newsletter email sent to user
 */
export const logNewsletterEmail = async (
  userId: string,
  userEmail: string,
  fromEmail: string,
  subject: string,
  bodyText: string,
  bodyHtml: string,
  messageId?: string,
): Promise<string> => {
  try {
    const email = await logEmail({
      userId,
      productId: PRODUCT_ID,
      direction: 'outgoing',
      type: 'newsletter_scheduled',
      fromEmail,
      toEmail: userEmail,
      subject,
      bodyText,
      bodyHtml,
      externalId: messageId,
      sentAt: new Date(),
    });

    logInfo('newsletter_email_logged', {
      emailId: email.id,
      userId,
      userEmail,
    });

    return email.id;
  } catch (error) {
    logError('newsletter_email_log_failed', {
      userId,
      userEmail,
      error: error instanceof Error ? error.message : String(error),
    });
    throw new DatabaseError('Failed to log newsletter email', {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

/**
 * Log AI token usage for newsletter generation
 */
export const logNewsletterTokenUsage = async (
  userId: string,
  emailId: string,
  llmResponse: LLMResponse,
): Promise<void> => {
  try {
    await logTokenUsage({
      userId,
      productId: PRODUCT_ID,
      operationType: 'newsletter_generate',
      emailId,
      model: llmResponse.model,
      promptTokens: llmResponse.promptTokens,
      completionTokens: llmResponse.completionTokens,
      totalTokens: llmResponse.tokenCount,
      metadata: {
        completionTimeMs: llmResponse.completionTime,
      },
    });

    logInfo('newsletter_token_usage_logged', {
      userId,
      emailId,
      model: llmResponse.model,
      totalTokens: llmResponse.tokenCount,
    });
  } catch (error) {
    logError('newsletter_token_usage_log_failed', {
      userId,
      emailId,
      error: error instanceof Error ? error.message : String(error),
    });
    // Don't throw - just log the error
  }
};
