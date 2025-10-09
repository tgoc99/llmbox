/**
 * Database operations module
 * Handles all interactions with Supabase PostgreSQL database
 */

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { logError, logInfo } from './logger.ts';

// Database types
export interface User {
  id: string;
  email: string;
  tier: 'free' | 'pro' | 'max';
  cost_used_usd: number;
  cost_limit_usd: number;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_status: string | null;
  billing_period_start: string | null;
  billing_period_end: string | null;
  created_at: string;
  updated_at: string;
}

export interface UsageLog {
  id: string;
  user_id: string;
  email: string;
  message_id: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  model: string;
  cost_usd: number;
  created_at: string;
}

export interface PricingTier {
  id: string;
  tier_name: string;
  cost_limit_usd: number;
  price_cents: number;
  stripe_price_id: string | null;
  features: string[];
  sort_order: number;
  created_at: string;
}

/**
 * Initialize Supabase client with service role key
 */
const getSupabaseClient = (): SupabaseClient => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing required Supabase environment variables');
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

/**
 * Get user by email, or create if doesn't exist
 */
export const getOrCreateUser = async (email: string): Promise<User> => {
  const supabase = getSupabaseClient();

  // Try to get existing user
  const { data: existingUser, error: fetchError } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows returned
    logError('Failed to fetch user', { email, error: fetchError.message });
    throw new Error(`Database error: ${fetchError.message}`);
  }

  if (existingUser) {
    logInfo('User found', { userId: existingUser.id, email, tier: existingUser.tier });
    return existingUser as User;
  }

  // Create new user with free tier
  const { data: newUser, error: createError } = await supabase
    .from('users')
    .insert({
      email,
      tier: 'free',
      cost_used_usd: 0,
      cost_limit_usd: 1.00,
    })
    .select()
    .single();

  if (createError) {
    logError('Failed to create user', { email, error: createError.message });
    throw new Error(`Failed to create user: ${createError.message}`);
  }

  logInfo('New user created', { userId: newUser.id, email, tier: newUser.tier });
  return newUser as User;
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
      return null;
    }
    logError('Failed to fetch user by ID', { userId, error: error.message });
    throw new Error(`Database error: ${error.message}`);
  }

  return data as User;
};

/**
 * Get user by Stripe customer ID
 */
export const getUserByStripeCustomerId = async (stripeCustomerId: string): Promise<User | null> => {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('stripe_customer_id', stripeCustomerId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    logError('Failed to fetch user by Stripe customer ID', {
      stripeCustomerId,
      error: error.message,
    });
    throw new Error(`Database error: ${error.message}`);
  }

  return data as User;
};

/**
 * Log usage for a user
 */
export const logUsage = async (params: {
  userId: string;
  email: string;
  messageId: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  model: string;
  costUsd: number;
}): Promise<UsageLog> => {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('usage_logs')
    .insert({
      user_id: params.userId,
      email: params.email,
      message_id: params.messageId,
      prompt_tokens: params.promptTokens,
      completion_tokens: params.completionTokens,
      total_tokens: params.totalTokens,
      model: params.model,
      cost_usd: params.costUsd,
    })
    .select()
    .single();

  if (error) {
    logError('Failed to log usage', { userId: params.userId, error: error.message });
    throw new Error(`Failed to log usage: ${error.message}`);
  }

  logInfo('Usage logged', {
    userId: params.userId,
    model: params.model,
    totalTokens: params.totalTokens,
    costUsd: params.costUsd,
  });

  return data as UsageLog;
};

/**
 * Update user's cost usage
 */
export const updateUserCostUsage = async (
  userId: string,
  additionalCostUsd: number,
): Promise<User> => {
  const supabase = getSupabaseClient();

  // Increment the cost_used_usd atomically
  const { data, error } = await supabase.rpc('increment_user_cost', {
    p_user_id: userId,
    p_cost_increment: additionalCostUsd,
  });

  if (error) {
    // If the function doesn't exist, fall back to manual update
    const user = await getUserById(userId);
    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }

    const newCostUsed = user.cost_used_usd + additionalCostUsd;

    const { data: updatedData, error: updateError } = await supabase
      .from('users')
      .update({ cost_used_usd: newCostUsed })
      .eq('id', userId)
      .select()
      .single();

    if (updateError) {
      logError('Failed to update user cost usage', { userId, error: updateError.message });
      throw new Error(`Failed to update user cost: ${updateError.message}`);
    }

    return updatedData as User;
  }

  return data as User;
};

/**
 * Update user tier and limits after subscription
 */
export const updateUserTier = async (params: {
  userId: string;
  tier: 'free' | 'pro' | 'max';
  costLimitUsd: number;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  subscriptionStatus?: string;
  billingPeriodStart?: Date;
  billingPeriodEnd?: Date;
}): Promise<User> => {
  const supabase = getSupabaseClient();

  const updateData: Record<string, unknown> = {
    tier: params.tier,
    cost_limit_usd: params.costLimitUsd,
  };

  if (params.stripeCustomerId) updateData.stripe_customer_id = params.stripeCustomerId;
  if (params.stripeSubscriptionId) updateData.stripe_subscription_id = params.stripeSubscriptionId;
  if (params.subscriptionStatus) updateData.subscription_status = params.subscriptionStatus;
  if (params.billingPeriodStart) {
    updateData.billing_period_start = params.billingPeriodStart.toISOString();
  }
  if (params.billingPeriodEnd) {
    updateData.billing_period_end = params.billingPeriodEnd.toISOString();
  }

  const { data, error } = await supabase
    .from('users')
    .update(updateData)
    .eq('id', params.userId)
    .select()
    .single();

  if (error) {
    logError('Failed to update user tier', { userId: params.userId, error: error.message });
    throw new Error(`Failed to update user tier: ${error.message}`);
  }

  logInfo('User tier updated', {
    userId: params.userId,
    tier: params.tier,
    costLimitUsd: params.costLimitUsd,
  });

  return data as User;
};

/**
 * Reset user's cost usage (for new billing period)
 */
export const resetUserCostUsage = async (userId: string): Promise<User> => {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('users')
    .update({ cost_used_usd: 0 })
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    logError('Failed to reset user cost usage', { userId, error: error.message });
    throw new Error(`Failed to reset user cost: ${error.message}`);
  }

  logInfo('User cost usage reset', { userId });
  return data as User;
};

/**
 * Get all pricing tiers
 */
export const getPricingTiers = async (): Promise<PricingTier[]> => {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('pricing_tiers')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) {
    logError('Failed to fetch pricing tiers', { error: error.message });
    throw new Error(`Failed to fetch pricing tiers: ${error.message}`);
  }

  return data as PricingTier[];
};

/**
 * Get pricing tier by name
 */
export const getPricingTierByName = async (tierName: string): Promise<PricingTier | null> => {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('pricing_tiers')
    .select('*')
    .eq('tier_name', tierName)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    logError('Failed to fetch pricing tier', { tierName, error: error.message });
    throw new Error(`Database error: ${error.message}`);
  }

  return data as PricingTier;
};

