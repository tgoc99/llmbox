/**
 * Shared database operations for all LLMBox products
 * Provides common functions for user management, email logging, and token tracking
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { logError, logInfo } from './logger.ts';
import type {
  AIOperationType,
  AITokenUsage,
  Email,
  EmailType,
  User,
  UserProduct,
} from './types.ts';

/**
 * Get Supabase client
 */
const getSupabaseClient = () => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials');
  }

  return createClient(supabaseUrl, supabaseKey);
};

// ============================================================================
// User Operations
// ============================================================================

/**
 * Get or create user by email
 * Returns existing user or creates new one if not exists
 */
export const getOrCreateUser = async (email: string): Promise<User> => {
  const supabase = getSupabaseClient();

  // Try to get existing user
  const { data: existingUser, error: selectError } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (existingUser) {
    return existingUser;
  }

  // If not found (not an error), create new user
  if (selectError && selectError.code !== 'PGRST116') {
    // PGRST116 is "not found" which is expected
    logError('database_user_select_error', {
      email,
      error: selectError.message,
      code: selectError.code,
    });
    throw new Error(`Failed to query user: ${selectError.message}`);
  }

  // Create new user
  const { data: newUser, error: insertError } = await supabase
    .from('users')
    .insert({ email })
    .select()
    .single();

  if (insertError || !newUser) {
    logError('database_user_create_error', {
      email,
      error: insertError?.message,
    });
    throw new Error(`Failed to create user: ${insertError?.message}`);
  }

  logInfo('user_created', { userId: newUser.id, email });
  return newUser;
};

/**
 * Get or create user-product relationship
 */
export const getOrCreateUserProduct = async (
  userId: string,
  productId: string,
  initialSettings: Record<string, unknown> = {},
): Promise<UserProduct> => {
  const supabase = getSupabaseClient();

  // Try to get existing relationship
  const { data: existingRelation, error: selectError } = await supabase
    .from('user_products')
    .select('*')
    .eq('user_id', userId)
    .eq('product_id', productId)
    .single();

  if (existingRelation) {
    return existingRelation;
  }

  // If not found, create new relationship
  if (selectError && selectError.code !== 'PGRST116') {
    logError('database_user_product_select_error', {
      userId,
      productId,
      error: selectError.message,
      code: selectError.code,
    });
    throw new Error(`Failed to query user product: ${selectError.message}`);
  }

  // Create new relationship
  const { data: newRelation, error: insertError } = await supabase
    .from('user_products')
    .insert({
      user_id: userId,
      product_id: productId,
      status: 'active',
      settings: initialSettings,
    })
    .select()
    .single();

  if (insertError || !newRelation) {
    logError('database_user_product_create_error', {
      userId,
      productId,
      error: insertError?.message,
    });
    throw new Error(`Failed to create user product: ${insertError?.message}`);
  }

  logInfo('user_product_created', { userId, productId });
  return newRelation;
};

/**
 * Update user-product settings
 */
export const updateUserProductSettings = async (
  userId: string,
  productId: string,
  settings: Record<string, unknown>,
): Promise<UserProduct> => {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('user_products')
    .update({
      settings,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('product_id', productId)
    .select()
    .single();

  if (error || !data) {
    logError('database_user_product_update_error', {
      userId,
      productId,
      error: error?.message,
    });
    throw new Error(`Failed to update user product settings: ${error?.message}`);
  }

  logInfo('user_product_updated', { userId, productId });
  return data;
};

/**
 * Update user-product status
 */
export const updateUserProductStatus = async (
  userId: string,
  productId: string,
  status: 'active' | 'paused' | 'unsubscribed',
): Promise<UserProduct> => {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('user_products')
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('product_id', productId)
    .select()
    .single();

  if (error || !data) {
    logError('database_user_product_status_update_error', {
      userId,
      productId,
      status,
      error: error?.message,
    });
    throw new Error(`Failed to update user product status: ${error?.message}`);
  }

  logInfo('user_product_status_updated', { userId, productId, status });
  return data;
};

/**
 * Get user by ID
 */
export const getUserById = async (userId: string): Promise<User | null> => {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    logError('database_user_get_error', {
      userId,
      error: error.message,
    });
    throw new Error(`Failed to get user: ${error.message}`);
  }

  return data;
};

/**
 * Get user by email
 */
export const getUserByEmail = async (email: string): Promise<User | null> => {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    logError('database_user_get_by_email_error', {
      email,
      error: error.message,
    });
    throw new Error(`Failed to get user by email: ${error.message}`);
  }

  return data;
};

// ============================================================================
// Email Operations
// ============================================================================

export interface LogEmailOptions {
  userId: string | null;
  productId: string;
  direction: 'incoming' | 'outgoing';
  type: EmailType;
  fromEmail: string;
  toEmail: string;
  subject?: string;
  bodyText?: string;
  bodyHtml?: string;
  threadId?: string;
  inReplyTo?: string;
  references?: string[];
  externalId?: string;
  rawHeaders?: Record<string, unknown>;
  sentAt?: Date;
  deliveredAt?: Date;
  failedAt?: Date;
  errorMessage?: string;
}

/**
 * Log an email to the database
 */
export const logEmail = async (options: LogEmailOptions): Promise<Email> => {
  const supabase = getSupabaseClient();

  const emailData = {
    user_id: options.userId,
    product_id: options.productId,
    direction: options.direction,
    type: options.type,
    from_email: options.fromEmail,
    to_email: options.toEmail,
    subject: options.subject || null,
    body_text: options.bodyText || null,
    body_html: options.bodyHtml || null,
    thread_id: options.threadId || null,
    in_reply_to: options.inReplyTo || null,
    references: options.references || null,
    external_id: options.externalId || null,
    raw_headers: options.rawHeaders || null,
    sent_at: options.sentAt?.toISOString() || null,
    delivered_at: options.deliveredAt?.toISOString() || null,
    failed_at: options.failedAt?.toISOString() || null,
    error_message: options.errorMessage || null,
  };

  const { data, error } = await supabase
    .from('emails')
    .insert(emailData)
    .select()
    .single();

  if (error || !data) {
    logError('database_email_log_error', {
      productId: options.productId,
      type: options.type,
      direction: options.direction,
      error: error?.message,
    });
    throw new Error(`Failed to log email: ${error?.message}`);
  }

  logInfo('email_logged', {
    emailId: data.id,
    productId: options.productId,
    type: options.type,
    direction: options.direction,
  });

  return data;
};

/**
 * Update email status (sent, delivered, failed)
 */
export const updateEmailStatus = async (
  emailId: string,
  status: { sentAt?: Date; deliveredAt?: Date; failedAt?: Date; errorMessage?: string },
): Promise<Email> => {
  const supabase = getSupabaseClient();

  const updateData: Record<string, unknown> = {};
  if (status.sentAt) updateData.sent_at = status.sentAt.toISOString();
  if (status.deliveredAt) updateData.delivered_at = status.deliveredAt.toISOString();
  if (status.failedAt) updateData.failed_at = status.failedAt.toISOString();
  if (status.errorMessage) updateData.error_message = status.errorMessage;

  const { data, error } = await supabase
    .from('emails')
    .update(updateData)
    .eq('id', emailId)
    .select()
    .single();

  if (error || !data) {
    logError('database_email_status_update_error', {
      emailId,
      error: error?.message,
    });
    throw new Error(`Failed to update email status: ${error?.message}`);
  }

  return data;
};

// ============================================================================
// AI Token Usage Operations
// ============================================================================

export interface LogTokenUsageOptions {
  userId: string | null;
  productId: string;
  operationType: AIOperationType;
  emailId?: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  metadata?: Record<string, unknown>;
}

/**
 * Log AI token usage to the database
 * Cost is automatically calculated by the database trigger
 */
export const logTokenUsage = async (options: LogTokenUsageOptions): Promise<AITokenUsage> => {
  const supabase = getSupabaseClient();

  const usageData = {
    user_id: options.userId,
    product_id: options.productId,
    operation_type: options.operationType,
    email_id: options.emailId || null,
    model: options.model,
    prompt_tokens: options.promptTokens,
    completion_tokens: options.completionTokens,
    total_tokens: options.totalTokens,
    metadata: options.metadata || {},
    // estimated_cost_cents is calculated automatically by trigger
  };

  const { data, error } = await supabase
    .from('ai_token_usage')
    .insert(usageData)
    .select()
    .single();

  if (error || !data) {
    logError('database_token_usage_log_error', {
      productId: options.productId,
      operationType: options.operationType,
      error: error?.message,
    });
    throw new Error(`Failed to log token usage: ${error?.message}`);
  }

  logInfo('token_usage_logged', {
    tokenUsageId: data.id,
    productId: options.productId,
    totalTokens: options.totalTokens,
    estimatedCostCents: data.estimated_cost_cents,
  });

  return data;
};

/**
 * Get total token usage for a user
 */
export const getUserTokenUsage = async (
  userId: string,
  productId?: string,
): Promise<{ totalTokens: number; totalCostCents: number; requestCount: number }> => {
  const supabase = getSupabaseClient();

  let query = supabase
    .from('ai_token_usage')
    .select('total_tokens, estimated_cost_cents')
    .eq('user_id', userId);

  if (productId) {
    query = query.eq('product_id', productId);
  }

  const { data, error } = await query;

  if (error) {
    logError('database_token_usage_get_error', {
      userId,
      productId,
      error: error.message,
    });
    throw new Error(`Failed to get token usage: ${error.message}`);
  }

  const totalTokens = data?.reduce((sum, row) => sum + (row.total_tokens || 0), 0) || 0;
  const totalCostCents = data?.reduce((sum, row) => sum + (row.estimated_cost_cents || 0), 0) || 0;
  const requestCount = data?.length || 0;

  return { totalTokens, totalCostCents, requestCount };
};
