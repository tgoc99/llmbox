/**
 * Shared database helper functions for multi-tenant architecture
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';
import type {
  DatabaseAIUsage,
  DatabaseEmail,
  DatabasePersonifeedFeedback,
  DatabasePersonifeedSubscriber,
  DatabaseUser,
  EmailDirection,
  EmailType,
  ProductType,
} from './types.ts';
import { getSupabaseServiceKey, getSupabaseUrl } from './config.ts';
import { log, LogLevel } from './logger.ts';

// Initialize Supabase client with service role key for full access
const getSupabaseClient = () => {
  const url = getSupabaseUrl();
  const serviceKey = getSupabaseServiceKey();
  return createClient(url, serviceKey);
};

// ============================================================================
// USER FUNCTIONS
// ============================================================================

/**
 * Upsert user by email (create if doesn't exist, return if exists)
 */
export const upsertUser = async (email: string, name?: string): Promise<DatabaseUser> => {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('users')
    .upsert(
      { email, name: name || null },
      { onConflict: 'email', ignoreDuplicates: false },
    )
    .select()
    .single();

  if (error) {
    log(LogLevel.ERROR, 'Failed to upsert user', { email, error: error.message });
    throw new Error(`Database error: ${error.message}`);
  }

  log(LogLevel.DEBUG, 'User upserted', { userId: data.id, email });
  return data;
};

/**
 * Get user by email
 */
export const getUserByEmail = async (email: string): Promise<DatabaseUser | null> => {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('users')
    .select()
    .eq('email', email)
    .maybeSingle();

  if (error) {
    log(LogLevel.ERROR, 'Failed to get user by email', { email, error: error.message });
    throw new Error(`Database error: ${error.message}`);
  }

  return data;
};

/**
 * Get user by ID
 */
export const getUserById = async (userId: string): Promise<DatabaseUser | null> => {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('users')
    .select()
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    log(LogLevel.ERROR, 'Failed to get user by ID', { userId, error: error.message });
    throw new Error(`Database error: ${error.message}`);
  }

  return data;
};

// ============================================================================
// EMAIL FUNCTIONS
// ============================================================================

export interface SaveIncomingEmailParams {
  userId: string;
  product: ProductType;
  emailType: EmailType;
  fromEmail: string;
  toEmail: string;
  subject?: string;
  rawContent?: string;
  processedContent?: string;
  threadId?: string;
  parentEmailId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Save incoming email to database
 */
export const saveIncomingEmail = async (
  params: SaveIncomingEmailParams,
): Promise<DatabaseEmail> => {
  const supabase = getSupabaseClient();

  const emailData = {
    user_id: params.userId,
    product: params.product,
    direction: 'inbound' as EmailDirection,
    email_type: params.emailType,
    from_email: params.fromEmail,
    to_email: params.toEmail,
    subject: params.subject || null,
    raw_content: params.rawContent || null,
    processed_content: params.processedContent || null,
    html_content: null,
    thread_id: params.threadId || null,
    parent_email_id: params.parentEmailId || null,
    processed_at: new Date().toISOString(),
    metadata: params.metadata || {},
  };

  const { data, error } = await supabase
    .from('emails')
    .insert(emailData)
    .select()
    .single();

  if (error) {
    log(LogLevel.ERROR, 'Failed to save incoming email', {
      userId: params.userId,
      product: params.product,
      error: error.message,
    });
    throw new Error(`Database error: ${error.message}`);
  }

  log(LogLevel.DEBUG, 'Incoming email saved', {
    emailId: data.id,
    userId: params.userId,
    product: params.product,
    emailType: params.emailType,
  });

  return data;
};

export interface SaveOutgoingEmailParams {
  userId: string;
  product: ProductType;
  emailType: EmailType;
  fromEmail: string;
  toEmail: string;
  subject?: string;
  processedContent?: string;
  htmlContent?: string;
  threadId?: string;
  parentEmailId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Save outgoing email to database
 */
export const saveOutgoingEmail = async (
  params: SaveOutgoingEmailParams,
): Promise<DatabaseEmail> => {
  const supabase = getSupabaseClient();

  const emailData = {
    user_id: params.userId,
    product: params.product,
    direction: 'outbound' as EmailDirection,
    email_type: params.emailType,
    from_email: params.fromEmail,
    to_email: params.toEmail,
    subject: params.subject || null,
    raw_content: null,
    processed_content: params.processedContent || null,
    html_content: params.htmlContent || null,
    thread_id: params.threadId || null,
    parent_email_id: params.parentEmailId || null,
    processed_at: new Date().toISOString(),
    metadata: params.metadata || {},
  };

  const { data, error } = await supabase
    .from('emails')
    .insert(emailData)
    .select()
    .single();

  if (error) {
    log(LogLevel.ERROR, 'Failed to save outgoing email', {
      userId: params.userId,
      product: params.product,
      error: error.message,
    });
    throw new Error(`Database error: ${error.message}`);
  }

  log(LogLevel.DEBUG, 'Outgoing email saved', {
    emailId: data.id,
    userId: params.userId,
    product: params.product,
    emailType: params.emailType,
  });

  return data;
};

/**
 * Get email thread by thread_id
 */
export const getEmailThread = async (threadId: string): Promise<DatabaseEmail[]> => {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('emails')
    .select()
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true });

  if (error) {
    log(LogLevel.ERROR, 'Failed to get email thread', { threadId, error: error.message });
    throw new Error(`Database error: ${error.message}`);
  }

  return data || [];
};

/**
 * Find parent email by thread_id to establish parent-child relationship
 */
export const findParentEmail = async (
  threadId: string,
  userId: string,
): Promise<DatabaseEmail | null> => {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('emails')
    .select()
    .eq('thread_id', threadId)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    log(LogLevel.ERROR, 'Failed to find parent email', { threadId, userId, error: error.message });
    throw new Error(`Database error: ${error.message}`);
  }

  return data;
};

// ============================================================================
// AI USAGE TRACKING FUNCTIONS
// ============================================================================

export interface TrackAIUsageParams {
  userId: string;
  product: ProductType;
  relatedEmailId?: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  metadata?: Record<string, unknown>;
}

/**
 * Track AI token usage
 */
export const trackAIUsage = async (params: TrackAIUsageParams): Promise<DatabaseAIUsage> => {
  const supabase = getSupabaseClient();

  const usageData = {
    user_id: params.userId,
    product: params.product,
    related_email_id: params.relatedEmailId || null,
    model: params.model,
    prompt_tokens: params.promptTokens,
    completion_tokens: params.completionTokens,
    total_tokens: params.totalTokens,
    estimated_cost_usd: null, // Can be calculated post-process
    metadata: params.metadata || {},
  };

  const { data, error } = await supabase
    .from('ai_usage')
    .insert(usageData)
    .select()
    .single();

  if (error) {
    log(LogLevel.ERROR, 'Failed to track AI usage', {
      userId: params.userId,
      product: params.product,
      error: error.message,
    });
    throw new Error(`Database error: ${error.message}`);
  }

  log(LogLevel.DEBUG, 'AI usage tracked', {
    usageId: data.id,
    userId: params.userId,
    product: params.product,
    totalTokens: params.totalTokens,
  });

  return data;
};

/**
 * Get AI usage for a user (optionally filtered by product)
 */
export const getUserAIUsage = async (
  userId: string,
  product?: ProductType,
): Promise<DatabaseAIUsage[]> => {
  const supabase = getSupabaseClient();

  let query = supabase
    .from('ai_usage')
    .select()
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (product) {
    query = query.eq('product', product);
  }

  const { data, error } = await query;

  if (error) {
    log(LogLevel.ERROR, 'Failed to get user AI usage', { userId, product, error: error.message });
    throw new Error(`Database error: ${error.message}`);
  }

  return data || [];
};

/**
 * Get total tokens used by a user (optionally filtered by product)
 */
export const getUserTotalTokens = async (
  userId: string,
  product?: ProductType,
): Promise<number> => {
  const supabase = getSupabaseClient();

  let query = supabase
    .from('ai_usage')
    .select('total_tokens')
    .eq('user_id', userId);

  if (product) {
    query = query.eq('product', product);
  }

  const { data, error } = await query;

  if (error) {
    log(LogLevel.ERROR, 'Failed to get user total tokens', {
      userId,
      product,
      error: error.message,
    });
    throw new Error(`Database error: ${error.message}`);
  }

  const totalTokens = data?.reduce((sum, row) => sum + (row.total_tokens || 0), 0) || 0;
  return totalTokens;
};

// ============================================================================
// PERSONIFEED SUBSCRIBER FUNCTIONS
// ============================================================================

export interface UpsertPersonifeedSubscriberParams {
  userId: string;
  interests: string;
  isActive?: boolean;
}

/**
 * Upsert personifeed subscriber
 */
export const upsertPersonifeedSubscriber = async (
  params: UpsertPersonifeedSubscriberParams,
): Promise<DatabasePersonifeedSubscriber> => {
  const supabase = getSupabaseClient();

  const subscriberData = {
    user_id: params.userId,
    interests: params.interests,
    is_active: params.isActive ?? true,
  };

  const { data, error } = await supabase
    .from('personifeed_subscribers')
    .upsert(subscriberData, { onConflict: 'user_id' })
    .select()
    .single();

  if (error) {
    log(LogLevel.ERROR, 'Failed to upsert personifeed subscriber', {
      userId: params.userId,
      error: error.message,
    });
    throw new Error(`Database error: ${error.message}`);
  }

  log(LogLevel.DEBUG, 'Personifeed subscriber upserted', {
    subscriberId: data.id,
    userId: params.userId,
  });
  return data;
};

/**
 * Get personifeed subscriber by user ID
 */
export const getPersonifeedSubscriberByUserId = async (
  userId: string,
): Promise<DatabasePersonifeedSubscriber | null> => {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('personifeed_subscribers')
    .select()
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    log(LogLevel.ERROR, 'Failed to get personifeed subscriber', { userId, error: error.message });
    throw new Error(`Database error: ${error.message}`);
  }

  return data;
};

/**
 * Get all active personifeed subscribers
 */
export const getActivePersonifeedSubscribers = async (): Promise<
  DatabasePersonifeedSubscriber[]
> => {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('personifeed_subscribers')
    .select()
    .eq('is_active', true)
    .order('created_at', { ascending: true });

  if (error) {
    log(LogLevel.ERROR, 'Failed to get active personifeed subscribers', { error: error.message });
    throw new Error(`Database error: ${error.message}`);
  }

  return data || [];
};

/**
 * Update last newsletter sent timestamp
 */
export const updateLastNewsletterSent = async (userId: string): Promise<void> => {
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from('personifeed_subscribers')
    .update({ last_newsletter_sent_at: new Date().toISOString() })
    .eq('user_id', userId);

  if (error) {
    log(LogLevel.ERROR, 'Failed to update last newsletter sent', { userId, error: error.message });
    throw new Error(`Database error: ${error.message}`);
  }

  log(LogLevel.DEBUG, 'Last newsletter sent updated', { userId });
};

/**
 * Deactivate personifeed subscriber
 */
export const deactivatePersonifeedSubscriber = async (userId: string): Promise<void> => {
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from('personifeed_subscribers')
    .update({ is_active: false })
    .eq('user_id', userId);

  if (error) {
    log(LogLevel.ERROR, 'Failed to deactivate personifeed subscriber', {
      userId,
      error: error.message,
    });
    throw new Error(`Database error: ${error.message}`);
  }

  log(LogLevel.INFO, 'Personifeed subscriber deactivated', { userId });
};

// ============================================================================
// PERSONIFEED FEEDBACK FUNCTIONS
// ============================================================================

export interface SavePersonifeedFeedbackParams {
  userId: string;
  newsletterEmailId?: string;
  feedbackType: string;
  content?: string;
  sentiment?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Save personifeed feedback
 */
export const savePersonifeedFeedback = async (
  params: SavePersonifeedFeedbackParams,
): Promise<DatabasePersonifeedFeedback> => {
  const supabase = getSupabaseClient();

  const feedbackData = {
    user_id: params.userId,
    newsletter_email_id: params.newsletterEmailId || null,
    feedback_type: params.feedbackType,
    content: params.content || null,
    sentiment: params.sentiment || null,
    metadata: params.metadata || {},
  };

  const { data, error } = await supabase
    .from('personifeed_feedback')
    .insert(feedbackData)
    .select()
    .single();

  if (error) {
    log(LogLevel.ERROR, 'Failed to save personifeed feedback', {
      userId: params.userId,
      error: error.message,
    });
    throw new Error(`Database error: ${error.message}`);
  }

  log(LogLevel.DEBUG, 'Personifeed feedback saved', {
    feedbackId: data.id,
    userId: params.userId,
    feedbackType: params.feedbackType,
  });

  return data;
};

/**
 * Get personifeed feedback for a user
 */
export const getPersonifeedFeedbackByUserId = async (
  userId: string,
): Promise<DatabasePersonifeedFeedback[]> => {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('personifeed_feedback')
    .select()
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    log(LogLevel.ERROR, 'Failed to get personifeed feedback', { userId, error: error.message });
    throw new Error(`Database error: ${error.message}`);
  }

  return data || [];
};

/**
 * Get all personifeed feedback for a newsletter email
 */
export const getPersonifeedFeedbackByNewsletterId = async (
  newsletterEmailId: string,
): Promise<DatabasePersonifeedFeedback[]> => {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('personifeed_feedback')
    .select()
    .eq('newsletter_email_id', newsletterEmailId)
    .order('created_at', { ascending: false });

  if (error) {
    log(LogLevel.ERROR, 'Failed to get personifeed feedback by newsletter', {
      newsletterEmailId,
      error: error.message,
    });
    throw new Error(`Database error: ${error.message}`);
  }

  return data || [];
};
