/**
 * Usage tracking module
 * Calculates costs and tracks token usage for LLM API calls
 */

import { logInfo, logWarn } from './logger.ts';
import { getOrCreateUser, logUsage as dbLogUsage, updateUserCostUsage, User } from './database.ts';

// OpenAI pricing per 1K tokens (as of Oct 2024)
// Source: https://openai.com/pricing
export const MODEL_PRICING = {
  'gpt-4o-mini': {
    input: 0.000150, // $0.15 per 1M tokens
    output: 0.000600, // $0.60 per 1M tokens
  },
  'gpt-4o': {
    input: 0.0025, // $2.50 per 1M tokens
    output: 0.0100, // $10.00 per 1M tokens
  },
  'gpt-4o-2024-08-06': {
    input: 0.0025,
    output: 0.0100,
  },
  'gpt-4-turbo': {
    input: 0.0100, // $10.00 per 1M tokens
    output: 0.0300, // $30.00 per 1M tokens
  },
  'gpt-4': {
    input: 0.0300, // $30.00 per 1M tokens
    output: 0.0600, // $60.00 per 1M tokens
  },
} as const;

export type ModelName = keyof typeof MODEL_PRICING;

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface CostCalculation {
  inputCost: number;
  outputCost: number;
  totalCost: number;
}

/**
 * Calculate cost in USD for a given token usage
 */
export const calculateCost = (
  model: string,
  usage: TokenUsage,
): CostCalculation => {
  // Normalize model name (remove version suffixes for lookup)
  const normalizedModel = model.toLowerCase();

  // Find matching pricing
  let pricing = MODEL_PRICING['gpt-4o-mini']; // Default fallback

  for (const [key, value] of Object.entries(MODEL_PRICING)) {
    if (normalizedModel.includes(key.toLowerCase())) {
      pricing = value;
      break;
    }
  }

  // Calculate costs (pricing is per 1K tokens, convert to per 1M then to actual)
  const inputCostPer1M = pricing.input * 1000;
  const outputCostPer1M = pricing.output * 1000;

  const inputCost = (usage.promptTokens / 1_000_000) * inputCostPer1M;
  const outputCost = (usage.completionTokens / 1_000_000) * outputCostPer1M;
  const totalCost = inputCost + outputCost;

  logInfo('Cost calculated', {
    model,
    promptTokens: usage.promptTokens,
    completionTokens: usage.completionTokens,
    totalCost: totalCost.toFixed(6),
  });

  return {
    inputCost: Number(inputCost.toFixed(6)),
    outputCost: Number(outputCost.toFixed(6)),
    totalCost: Number(totalCost.toFixed(6)),
  };
};

/**
 * Check if user has remaining budget
 */
export const checkUserLimit = async (email: string): Promise<{
  allowed: boolean;
  user: User;
  remainingBudget: number;
  percentUsed: number;
}> => {
  const user = await getOrCreateUser(email);

  const remainingBudget = user.cost_limit_usd - user.cost_used_usd;
  const percentUsed = (user.cost_used_usd / user.cost_limit_usd) * 100;

  const allowed = remainingBudget > 0;

  if (!allowed) {
    logWarn('User has exceeded cost limit', {
      userId: user.id,
      email: user.email,
      tier: user.tier,
      costUsed: user.cost_used_usd,
      costLimit: user.cost_limit_usd,
    });
  } else if (percentUsed >= 80) {
    logWarn('User approaching cost limit', {
      userId: user.id,
      email: user.email,
      tier: user.tier,
      costUsed: user.cost_used_usd,
      costLimit: user.cost_limit_usd,
      percentUsed: percentUsed.toFixed(1),
    });
  }

  return {
    allowed,
    user,
    remainingBudget: Number(remainingBudget.toFixed(6)),
    percentUsed: Number(percentUsed.toFixed(1)),
  };
};

/**
 * Track usage after LLM call
 */
export const trackUsage = async (params: {
  email: string;
  messageId: string;
  model: string;
  usage: TokenUsage;
}): Promise<{
  user: User;
  cost: CostCalculation;
  newTotalCost: number;
  remainingBudget: number;
}> => {
  // Get user
  const user = await getOrCreateUser(params.email);

  // Calculate cost
  const cost = calculateCost(params.model, params.usage);

  // Log usage to database
  await dbLogUsage({
    userId: user.id,
    email: params.email,
    messageId: params.messageId,
    promptTokens: params.usage.promptTokens,
    completionTokens: params.usage.completionTokens,
    totalTokens: params.usage.totalTokens,
    model: params.model,
    costUsd: cost.totalCost,
  });

  // Update user's total cost
  const updatedUser = await updateUserCostUsage(user.id, cost.totalCost);

  const remainingBudget = updatedUser.cost_limit_usd - updatedUser.cost_used_usd;

  logInfo('Usage tracked', {
    userId: user.id,
    email: params.email,
    model: params.model,
    costUsd: cost.totalCost,
    newTotalCost: updatedUser.cost_used_usd,
    remainingBudget: remainingBudget.toFixed(6),
  });

  return {
    user: updatedUser,
    cost,
    newTotalCost: updatedUser.cost_used_usd,
    remainingBudget: Number(remainingBudget.toFixed(6)),
  };
};

/**
 * Check if paid user subscription is active
 */
export const isSubscriptionActive = (user: User): boolean => {
  if (user.tier === 'free') {
    return true; // Free users don't need subscription
  }

  return user.subscription_status === 'active' || user.subscription_status === 'trialing';
};

/**
 * Format cost as currency string
 */
export const formatCost = (costUsd: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  }).format(costUsd);
};

/**
 * Format usage percentage
 */
export const formatUsagePercentage = (used: number, limit: number): string => {
  const percentage = (used / limit) * 100;
  return `${percentage.toFixed(1)}%`;
};

