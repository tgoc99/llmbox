/**
 * Supabase client for web app
 * Server-side only - uses service role key
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * Database types
 */
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

/**
 * Get user by email
 */
export const getUserByEmail = async (email: string): Promise<User | null> => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw error;
  }

  return data;
};

/**
 * Get user by Stripe customer ID
 */
export const getUserByStripeCustomerId = async (
  stripeCustomerId: string,
): Promise<User | null> => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('stripe_customer_id', stripeCustomerId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw error;
  }

  return data;
};

/**
 * Get all pricing tiers
 */
export const getPricingTiers = async (): Promise<PricingTier[]> => {
  const { data, error } = await supabase
    .from('pricing_tiers')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) {
    throw error;
  }

  return data;
};

/**
 * Get usage logs for a user
 */
export const getUserUsageLogs = async (
  userId: string,
  limit: number = 50,
): Promise<UsageLog[]> => {
  const { data, error } = await supabase
    .from('usage_logs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return data;
};

/**
 * Update user tier after successful payment
 */
export const updateUserAfterPayment = async (params: {
  email: string;
  tier: 'pro' | 'max';
  costLimitUsd: number;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  subscriptionStatus: string;
  billingPeriodStart: Date;
  billingPeriodEnd: Date;
}): Promise<User> => {
  const { data, error } = await supabase
    .from('users')
    .update({
      tier: params.tier,
      cost_limit_usd: params.costLimitUsd,
      stripe_customer_id: params.stripeCustomerId,
      stripe_subscription_id: params.stripeSubscriptionId,
      subscription_status: params.subscriptionStatus,
      billing_period_start: params.billingPeriodStart.toISOString(),
      billing_period_end: params.billingPeriodEnd.toISOString(),
      cost_used_usd: 0, // Reset usage for new billing period
    })
    .eq('email', params.email)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};

/**
 * Update subscription status
 */
export const updateSubscriptionStatus = async (
  stripeCustomerId: string,
  status: string,
): Promise<void> => {
  const { error } = await supabase
    .from('users')
    .update({ subscription_status: status })
    .eq('stripe_customer_id', stripeCustomerId);

  if (error) {
    throw error;
  }
};

/**
 * Reset user cost usage (for new billing period)
 */
export const resetUserCostUsage = async (stripeCustomerId: string): Promise<void> => {
  const { error } = await supabase
    .from('users')
    .update({ cost_used_usd: 0 })
    .eq('stripe_customer_id', stripeCustomerId);

  if (error) {
    throw error;
  }
};

